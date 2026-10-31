import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEMBERSHIP_PLANS, PLATFORM } from "@/lib/pricing";
import { appUrl, day, esc, money, periodEnd, sendEmail, subAmountCents, subIntervalMonths, TEMPLATE_VERSIONS } from "@/lib/legal";
import {
  WINDOWS,
  decideAnnualReminder,
  decideDecemberSweep,
  decideRenewalReminder,
  decideTrialConversion,
  isLate,
  type Decision,
  type SubFacts,
  type Window,
} from "@/lib/legal-notice-rules";

export type NoticeType = "renewal_reminder" | "annual_reminder" | "trial_conversion";
export type SendResult = "sent" | "already" | "queued" | "failed";

/** Cancel link: login (if needed) then the account membership page (Cancel membership -> Click to cancel). Online only. */
export function cancelUrl() {
  return `${appUrl()}/login?next=${encodeURIComponent("/account/membership")}`;
}

const FOOTER = () =>
  `<p style="color:#666;font-size:12px">[COMPANY LEGAL NAME] | [MAILING ADDRESS] | Help (not for cancellations): ${esc(PLATFORM.supportEmail)}</p>`;
const CANCEL_P = (before?: string) =>
  `<p><strong>Don't want to continue?</strong> Cancel online anytime at Account &gt; Membership &gt; Cancel membership: <a href="${cancelUrl()}">${appUrl()}/account/membership</a>.${
    before ? ` Cancel before ${esc(day(before))} to avoid the charge.` : ""
  }</p>`;
const termWords = (m: number | null) => (m === 1 ? "month" : m === 12 ? "year" : m ? `${m} months` : "term");
const planName = (id: string | null) => MEMBERSHIP_PLANS.find((p) => p.id === id)?.name ?? "Membership";

/* Placeholder copy (DRAFT; final text from legal.en.json, versions in TEMPLATE_VERSIONS). */
export const TEMPLATES = {
  renewal_reminder: (o: { planId: string | null; intervalMonths: number | null; renewalDate: string; amountCents: number | null; currency: string }) => ({
    subject: `Your ${PLATFORM.name} membership renews on ${day(o.renewalDate)} for ${money(o.amountCents, o.currency)}`,
    html: `<p>Your <strong>${esc(PLATFORM.name)} ${esc(planName(o.planId))} membership</strong> will <strong>automatically renew on ${esc(day(o.renewalDate))}</strong> for another ${esc(termWords(o.intervalMonths))}, and we will charge <strong>${esc(money(o.amountCents, o.currency))} (plus applicable tax)</strong>. It renews every ${esc(termWords(o.intervalMonths))} until you cancel.</p>${CANCEL_P(o.renewalDate)}${FOOTER()}`,
  }),
  annual_reminder: (o: { planId: string | null; intervalMonths: number | null; nextCharge: string | null; amountCents: number | null; currency: string }) => ({
    subject: `Your ${PLATFORM.name} membership: a yearly reminder of your terms`,
    html: `<p>This is your yearly reminder that your <strong>${esc(PLATFORM.name)} ${esc(planName(o.planId))} membership</strong> renews automatically every ${esc(termWords(o.intervalMonths))} at <strong>${esc(money(o.amountCents, o.currency))} (plus applicable tax)</strong> until you cancel.${
      o.nextCharge ? ` Your next charge is on ${esc(day(o.nextCharge))}.` : ""
    }</p><p>Terms: <a href="${appUrl()}/legal/terms">${appUrl()}/legal/terms</a>. Refunds: <a href="${appUrl()}/legal/refunds">${appUrl()}/legal/refunds</a>.</p>${CANCEL_P()}${FOOTER()}`,
  }),
  trial_conversion: (o: { planId: string | null; intervalMonths: number | null; convertsAt: string; amountCents: number | null; currency: string }) => ({
    subject: `Your ${PLATFORM.name} free period ends on ${day(o.convertsAt)}`,
    html: `<p>Your free/promotional ${esc(PLATFORM.name)} period ends on <strong>${esc(day(o.convertsAt))}</strong>. After that your <strong>${esc(planName(o.planId))} membership</strong> starts automatically and we will charge <strong>${esc(money(o.amountCents, o.currency))} (plus tax)</strong> every ${esc(termWords(o.intervalMonths))} until you cancel.</p>${CANCEL_P(o.convertsAt)}${FOOTER()}`,
  }),
} as const;

/**
 * Queue-then-send, idempotent per (user_id, type, period_key) via notices_sent_one_per_period.
 * Re-runs retry rows still 'queued'/'failed'; a 'sent' row is never sent again.
 */
export async function sendNotice(
  sb: SupabaseClient,
  o: {
    userId: string;
    email: string;
    type: NoticeType;
    periodKey: string;
    subscriptionId: string | null;
    renewalDate?: string | null;
    amountCents?: number | null;
    mail: { subject: string; html: string };
  },
): Promise<SendResult> {
  const { data: existing } = await sb
    .from("notices_sent")
    .select("id, status")
    .eq("user_id", o.userId)
    .eq("type", o.type)
    .eq("period_key", o.periodKey)
    .maybeSingle();
  if (existing?.status === "sent") return "already";
  let id = existing?.id as string | undefined;
  if (!id) {
    const { data: row, error } = await sb
      .from("notices_sent")
      .insert({
        user_id: o.userId,
        recipient_email: o.email,
        subscription_id: o.subscriptionId ?? "",
        type: o.type,
        period_key: o.periodKey,
        template_version: TEMPLATE_VERSIONS[o.type],
        renewal_date: o.renewalDate ? o.renewalDate.slice(0, 10) : null,
        amount_cents: o.amountCents ?? null,
        status: "queued",
      })
      .select("id")
      .single();
    if (error) return error.code === "23505" ? "already" : "failed"; // raced another run
    id = row.id;
  }
  const r = await sendEmail(o.email, o.mail.subject, o.mail.html);
  const attempt = new Date().toISOString();
  if (r.ok) {
    await sb.from("notices_sent").update({ status: "sent", sent_at: attempt, provider_message_id: r.id, error: null, last_attempt_at: attempt }).eq("id", id);
    return "sent";
  }
  await sb.from("notices_sent").update({ status: r.queued ? "queued" : "failed", error: r.error, last_attempt_at: attempt }).eq("id", id);
  return r.queued ? "queued" : "failed";
}

export function subFacts(sub: Stripe.Subscription): SubFacts {
  const pm = sub.default_payment_method ?? null;
  const endBehavior = sub.trial_settings?.end_behavior?.missing_payment_method;
  return {
    subscriptionId: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    intervalMonths: subIntervalMonths(sub),
    periodEndMs: sub.status === "trialing" && sub.trial_end ? sub.trial_end * 1000 : (periodEnd(sub) ?? 0) * 1000 || null,
    trialStartMs: sub.trial_start ? sub.trial_start * 1000 : null,
    trialEndMs: sub.trial_end ? sub.trial_end * 1000 : null,
    convertsToPaid: Boolean(pm) || endBehavior === "create_invoice",
    amountCents: subAmountCents(sub),
  };
}

export type MemberOutcome = { type: NoticeType; result: SendResult | "late_unsent"; days?: number };

/** Evaluate and send every due notice for one member. Used by the daily cron and invoice.upcoming. */
export async function processMember(
  sb: SupabaseClient,
  p: { id: string; email: string; plan_id: string | null; membership_activated_at: string | null },
  sub: Stripe.Subscription,
  nowMs: number,
  backup = false,
): Promise<MemberOutcome[]> {
  const f = subFacts(sub);
  const out: MemberOutcome[] = [];
  const cur = sub.currency || "usd";
  /** Ops guardrail: still unsent at/after the alert day (e.g. day 16 for renewals). */
  const late = async (type: NoticeType, d: Decision, periodKey: string | null, w: Window) => {
    if (d.due || !d.late || d.days == null || d.days < 0 || !isLate(d.days, w) || !periodKey) return;
    const { data } = await sb.from("notices_sent").select("status").eq("user_id", p.id).eq("type", type).eq("period_key", periodKey).maybeSingle();
    if (data?.status !== "sent") out.push({ type, result: "late_unsent", days: d.days });
  };

  // 1) renewal reminder (6-month + annual)
  const r = decideRenewalReminder(f, nowMs, backup);
  if (r.due && f.periodEndMs) {
    const renewalDate = new Date(f.periodEndMs).toISOString();
    out.push({
      type: "renewal_reminder",
      days: r.days,
      result: await sendNotice(sb, {
        userId: p.id, email: p.email, type: "renewal_reminder", periodKey: r.periodKey, subscriptionId: sub.id,
        renewalDate, amountCents: f.amountCents,
        mail: TEMPLATES.renewal_reminder({ planId: p.plan_id, intervalMonths: f.intervalMonths, renewalDate, amountCents: f.amountCents ?? null, currency: cur }),
      }),
    });
  } else if (f.periodEndMs) {
    await late("renewal_reminder", r, `${sub.id}:${new Date(f.periodEndMs).toISOString().slice(0, 10)}`, WINDOWS.renewal_reminder);
  }

  // 2) monthly terms: one yearly reminder per calendar year (on/after join month-day)
  const nextCharge = f.periodEndMs ? new Date(f.periodEndMs).toISOString() : null;
  const annualMail = () =>
    TEMPLATES.annual_reminder({ planId: p.plan_id, intervalMonths: f.intervalMonths, nextCharge, amountCents: f.amountCents ?? null, currency: cur });
  const anchor = p.membership_activated_at ? Date.parse(p.membership_activated_at) : sub.start_date ? sub.start_date * 1000 : null;
  const a = decideAnnualReminder(f, anchor, nowMs);
  if (a.due) {
    out.push({
      type: "annual_reminder",
      days: a.days,
      result: await sendNotice(sb, {
        userId: p.id, email: p.email, type: "annual_reminder", periodKey: a.periodKey, subscriptionId: sub.id,
        renewalDate: nextCharge, amountCents: f.amountCents, mail: annualMail(),
      }),
    });
  }

  // 2b) Dec 1 sweep: nobody goes a calendar year without a renewal/yearly reminder
  if (!backup) {
    const { data: last } = await sb
      .from("notices_sent")
      .select("sent_at")
      .eq("user_id", p.id)
      .in("type", ["renewal_reminder", "annual_reminder"])
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sw = decideDecemberSweep(f, last?.sent_at ? Date.parse(last.sent_at as string) : null, nowMs, anchor);
    if (sw.due) {
      out.push({
        type: "annual_reminder",
        result: await sendNotice(sb, {
          userId: p.id, email: p.email, type: "annual_reminder", periodKey: sw.periodKey, subscriptionId: sub.id,
          renewalDate: nextCharge, amountCents: f.amountCents, mail: annualMail(),
        }),
      });
    }
  }

  // 3) trial / promo > 31 days converting to paid
  const t = decideTrialConversion(f, nowMs, backup);
  if (t.due && f.trialEndMs) {
    const convertsAt = new Date(f.trialEndMs).toISOString();
    out.push({
      type: "trial_conversion",
      days: t.days,
      result: await sendNotice(sb, {
        userId: p.id, email: p.email, type: "trial_conversion", periodKey: t.periodKey, subscriptionId: sub.id,
        renewalDate: convertsAt, amountCents: f.amountCents,
        mail: TEMPLATES.trial_conversion({ planId: p.plan_id, intervalMonths: f.intervalMonths, convertsAt, amountCents: f.amountCents ?? null, currency: cur }),
      }),
    });
  } else if (f.trialEndMs) {
    await late("trial_conversion", t, `${sub.id}:trial:${new Date(f.trialEndMs).toISOString().slice(0, 10)}`, WINDOWS.trial_conversion);
  }
  for (const o of [...out]) {
    const w = o.type === "annual_reminder" ? null : WINDOWS[o.type];
    if (w && o.days != null && (o.result === "failed" || o.result === "queued") && isLate(o.days, w)) {
      out.push({ type: o.type, result: "late_unsent", days: o.days });
    }
  }
  return out;
}
