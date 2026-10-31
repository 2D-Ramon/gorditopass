import type Stripe from "stripe";
import { PLATFORM } from "@/lib/pricing";

/** Template versions logged in notices_sent.template_version. Bump with legal.en.json. */
export const TEMPLATE_VERSIONS = {
  renewal_reminder: "email.renewal_reminder@2",
  annual_reminder: "email.annual_reminder@1",
  trial_conversion: "email.trial_conversion@1",
  cancel_confirm: "email.cancel_confirm@1",
} as const;


/** Cron auth. Fails closed: no CRON_SECRET configured => 401. */
export function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

/**
 * CSRF guard for cookie-less JSON endpoints: the Bearer JWT is already not ambient,
 * but also require JSON and, when an Origin header is present, a same-site origin.
 */
export function sameOriginJson(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const o = new URL(origin).host;
    const allowed = new Set<string>([new URL(req.url).host]);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) allowed.add(host);
    for (const v of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
      if (v) try { allowed.add(new URL(v).host); } catch { /* ignore */ }
    }
    return allowed.has(o);
  } catch {
    return false;
  }
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://gorditopass.vercel.app"
  ).replace(/\/$/, "");
}

/** Current period end (unix seconds) across Stripe API versions (item-level since 2025). */
export function periodEnd(sub: Stripe.Subscription): number | null {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  return item?.current_period_end ?? legacy ?? null;
}

export function subAmountCents(sub: Stripe.Subscription): number | null {
  let total = 0;
  for (const it of sub.items?.data ?? []) {
    total += (it.price?.unit_amount ?? 0) * (it.quantity ?? 1);
  }
  return total || null;
}

/** Billing term in months from the subscription's recurring price (e.g. year -> 12, month x6 -> 6). */
export function subIntervalMonths(sub: Stripe.Subscription): number | null {
  const r = sub.items?.data?.[0]?.price?.recurring;
  if (!r) return null;
  const n = r.interval_count ?? 1;
  if (r.interval === "year") return 12 * n;
  if (r.interval === "month") return n;
  return null; // week/day: not a membership term
}


export function confirmationNumber() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "GP-" + Array.from(bytes, (b) => a[b % a.length]).join("");
}

/** Send through Resend (the repo's existing provider). Returns provider id or an error. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false as const, error: "RESEND_API_KEY not set", queued: true };
  const from =
    process.env.RESEND_FROM?.trim() || "GorditoPass <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return { ok: false as const, error: json.message || `HTTP ${res.status}`, queued: false };
  return { ok: true as const, id: json.id ?? null };
}

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const money = (cents: number | null, cur = "usd") =>
  cents == null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);
export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export function cancelConfirmEmail(o: { confirmationNumber: string; accessEndsAt: string | null }) {
  return {
    subject: `GorditoPass cancellation confirmed (${o.confirmationNumber})`,
    html: `<p>Your GorditoPass membership has been canceled. Confirmation number: <strong>${esc(o.confirmationNumber)}</strong>.</p>${
      o.accessEndsAt ? `<p>You keep access until <strong>${esc(day(o.accessEndsAt))}</strong>. You will not be charged again.</p>` : ""
    }<p>Changed your mind? Resume at <a href="${appUrl()}/account/membership">${appUrl()}/account/membership</a>. Other questions: ${esc(PLATFORM.supportEmail)}.</p>`,
  };
}
