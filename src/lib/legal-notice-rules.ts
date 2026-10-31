/**
 * Pure timing / selection rules for legal notices (DRAFT, pending counsel).
 * No I/O here so it can be unit-tested (scripts/test-legal-notice-rules.mjs).
 *
 *  renewal_reminder  6-month + annual terms: allowed 25-40 days before renewal, send at <=30 (target 30).
 *  annual_reminder   monthly terms: one per calendar year (Chicago), no fixed window: on/after the join
 *                    month-day each year after the join year; key = cal-YYYY. Plus a Dec 1 sweep (Dec 1-31
 *                    catch-up) for ANY live member with no renewal/annual reminder sent this calendar
 *                    year; same key cal-YYYY, so at most one per (user, year).
 *  trial_conversion  trial/promo > 30 days that converts to paid: send at <=10 days (floor 3).
 * The daily cron sends from the target day down to the minimum (catch-up). The invoice.upcoming
 * backup ("backup" mode) may send anywhere inside the full legal window.
 */

export const DAY_MS = 86_400_000;

export const WINDOWS = {
  renewal_reminder: { min: 25, max: 40, target: 30, alertAt: 26 },
  trial_conversion: { min: 3, max: 10, target: 10, alertAt: 4 },
} as const;
export const PROMO_NOTICE_MIN_LENGTH_DAYS = 30; // "> 30 days"
export const SWEEP_TZ = "America/Chicago";
export const RENEWAL_REMINDER_MIN_MONTHS = 6;

export type Window = { min: number; max: number; target: number; alertAt: number };
export type Decision =
  | { due: true; periodKey: string; days: number }
  | { due: false; reason: string; late?: boolean; days?: number };

export const daysUntil = (atMs: number, nowMs: number) => (atMs - nowMs) / DAY_MS;
export const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Inside [min, target] (cron) or [min, max] (backup). `late` = at/below alertAt and still unsent. */
export function windowDecision(days: number, w: Window, backup: boolean, periodKey: string): Decision {
  if (days < w.min) return { due: false, reason: "past_window", late: true, days };
  if (days > (backup ? w.max : w.target)) return { due: false, reason: "not_yet", days };
  return { due: true, periodKey, days };
}

export function isLate(days: number, w: Window) {
  return days <= w.alertAt;
}

export type SubFacts = {
  subscriptionId: string;
  status: string; // Stripe status
  cancelAtPeriodEnd: boolean;
  intervalMonths: number | null; // from the recurring price
  periodEndMs: number | null; // next charge (trial end while trialing)
  trialStartMs?: number | null;
  trialEndMs?: number | null;
  convertsToPaid?: boolean; // trial will auto-charge
  amountCents?: number | null;
};

const LIVE = new Set(["active", "past_due", "trialing"]);

export function decideRenewalReminder(s: SubFacts, nowMs: number, backup = false): Decision {
  if (!LIVE.has(s.status) || s.status === "trialing") return { due: false, reason: "not_renewing" };
  if (s.cancelAtPeriodEnd) return { due: false, reason: "canceling" };
  if ((s.intervalMonths ?? 0) < RENEWAL_REMINDER_MIN_MONTHS) return { due: false, reason: "short_term" };
  if (!s.periodEndMs) return { due: false, reason: "no_period_end" };
  const days = daysUntil(s.periodEndMs, nowMs);
  return windowDecision(days, WINDOWS.renewal_reminder, backup, `${s.subscriptionId}:${ymd(s.periodEndMs)}`);
}

/** Anniversary k (k >= 1) of the anchor, by calendar (UTC) year arithmetic. */
export function anniversaryMs(anchorMs: number, k: number) {
  const d = new Date(anchorMs);
  d.setUTCFullYear(d.getUTCFullYear() + k);
  return d.getTime();
}

/**
 * Monthly (sub-6-month) terms: ONE reminder per calendar year (Chicago), no fixed window.
 * Sent on/after the member's join month-day each year after the join year; key "cal-YYYY"
 * (shared with the Dec 1 sweep, so the unique (user, type, period_key) index allows one per year).
 */
export function decideAnnualReminder(s: SubFacts, anchorMs: number | null, nowMs: number): Decision {
  if (!LIVE.has(s.status)) return { due: false, reason: "not_renewing" };
  if (s.cancelAtPeriodEnd) return { due: false, reason: "canceling" };
  if ((s.intervalMonths ?? 0) >= RENEWAL_REMINDER_MIN_MONTHS) return { due: false, reason: "has_renewal_reminder" };
  if (!anchorMs) return { due: false, reason: "no_anchor" };
  const now = chicagoParts(nowMs);
  const a = chicagoParts(anchorMs);
  if (a.year >= now.year) return { due: false, reason: "join_year" };
  if (now.month * 100 + now.day < a.month * 100 + a.day) return { due: false, reason: "before_join_day" };
  return { due: true, periodKey: `cal-${now.year}`, days: 0 };
}

/** Calendar date parts in America/Chicago. */
export function chicagoParts(ms: number) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: SWEEP_TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(ms));
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Dec 1 sweep: on/after Dec 1 (Chicago), any live, non-canceling member with no renewal_reminder
 * or annual_reminder SENT in this calendar year (Chicago) gets an annual_reminder (key cal-YYYY).
 */
export function decideDecemberSweep(s: SubFacts, lastReminderSentMs: number | null, nowMs: number): Decision {
  const now = chicagoParts(nowMs);
  if (now.month !== 12) return { due: false, reason: "not_december" };
  if (!LIVE.has(s.status) || s.cancelAtPeriodEnd) return { due: false, reason: "not_renewing" };
  if (lastReminderSentMs && chicagoParts(lastReminderSentMs).year === now.year) return { due: false, reason: "had_one_this_year" };
  return { due: true, periodKey: `cal-${now.year}`, days: 0 };
}

export function decideTrialConversion(s: SubFacts, nowMs: number, backup = false): Decision {
  if (s.status !== "trialing") return { due: false, reason: "not_trialing" };
  if (s.cancelAtPeriodEnd || !s.convertsToPaid || !(s.amountCents && s.amountCents > 0)) {
    return { due: false, reason: "no_paid_conversion" };
  }
  if (!s.trialStartMs || !s.trialEndMs) return { due: false, reason: "no_trial_dates" };
  if ((s.trialEndMs - s.trialStartMs) / DAY_MS <= PROMO_NOTICE_MIN_LENGTH_DAYS) return { due: false, reason: "short_trial" };
  const days = daysUntil(s.trialEndMs, nowMs);
  return windowDecision(days, WINDOWS.trial_conversion, backup, `${s.subscriptionId}:trial:${ymd(s.trialEndMs)}`);
}
