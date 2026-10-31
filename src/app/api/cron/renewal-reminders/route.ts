import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  REMINDER_MAX_DAYS,
  REMINDER_MIN_DAYS,
  REMINDER_TARGET_DAYS,
  cronAuthorized,
  periodEnd,
  sendRenewalReminder,
  subAmountCents,
} from "@/lib/legal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86_400_000;

/**
 * GET /api/cron/renewal-reminders  (Vercel cron, daily; Bearer CRON_SECRET required)
 * Sends one reminder per subscription per renewal period, targeting day 30 and catching up
 * anything in the 15-45 day hard window that was missed. Renewal date/amount come from Stripe.
 * Returns counts plus `late` (<= 16 days out, still unsent) for ops paging (spec §6 guardrail).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, skipped: "supabase" });
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) return NextResponse.json({ ok: true, skipped: "stripe" });
  const stripe = new Stripe(key);
  const sb = createOpsClient();
  const now = Date.now();

  // Prefilter on our own renewal date (set at checkout); Stripe is the source of truth below.
  const { data: rows, error } = await sb
    .from("profiles")
    .select("id, email, stripe_subscription_id, membership_renews_at, membership_cancel_at_period_end")
    .not("stripe_subscription_id", "is", null)
    .eq("membership_cancel_at_period_end", false)
    .gte("membership_renews_at", new Date(now + (REMINDER_MIN_DAYS - 2) * DAY).toISOString())
    .lte("membership_renews_at", new Date(now + (REMINDER_MAX_DAYS + 2) * DAY).toISOString());
  if (error) return NextResponse.json({ error: "Could not load members." }, { status: 500 });

  const counts = { checked: 0, sent: 0, already: 0, queued: 0, failed: 0, not_due: 0 };
  const late: string[] = [];
  for (const p of rows ?? []) {
    counts.checked += 1;
    const sub = await stripe.subscriptions.retrieve(String(p.stripe_subscription_id)).catch(() => null);
    if (!sub || sub.cancel_at_period_end || !["active", "trialing", "past_due"].includes(sub.status)) {
      counts.not_due += 1;
      continue;
    }
    const end = periodEnd(sub);
    if (!end) { counts.not_due += 1; continue; }
    const days = (end * 1000 - now) / DAY;
    if (days < REMINDER_MIN_DAYS || days > REMINDER_MAX_DAYS || days > REMINDER_TARGET_DAYS) {
      counts.not_due += 1; // wait for day 30 (or catch up later if inside the window)
      continue;
    }
    const r = await sendRenewalReminder(sb, {
      userId: p.id,
      email: p.email,
      subscriptionId: sub.id,
      renewalDate: new Date(end * 1000).toISOString(),
      amountCents: subAmountCents(sub),
      currency: sub.currency,
    });
    counts[r] += 1;
    if (r !== "sent" && r !== "already" && days <= 16) late.push(p.id);
  }
  if (late.length) console.error(`[renewal-reminders] ${late.length} member(s) <=16 days out without a sent reminder`, late);
  return NextResponse.json({ ok: true, ...counts, late });
}
