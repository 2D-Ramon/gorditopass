import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";
import { cronAuthorized } from "@/lib/legal";
import { processMember } from "@/lib/legal-notices";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/legal-notices  (Vercel cron, daily 14:00 UTC = 09:00 America/Chicago CDT / 08:00 CST;
 * Bearer CRON_SECRET required, fails closed). Old path /api/cron/renewal-reminders re-exports this.
 *
 * For every profile with a Stripe subscription: renewal reminder (6-mo/annual), yearly reminder
 * (monthly), trial/promo conversion notices.
 * Idempotent per (user, type, period_key). Returns counts and `late` (still unsent at the alert day)
 * for ops paging. Profiles without a Stripe subscription (free access codes) never auto-charge,
 * so they get no notice.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, skipped: "supabase" });
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) return NextResponse.json({ ok: true, skipped: "stripe" });
  const stripe = new Stripe(key);
  const sb = createOpsClient();
  const now = Date.now();

  const counts: Record<string, number> = { checked: 0, no_sub: 0, sent: 0, already: 0, queued: 0, failed: 0 };
  const late: { user_id: string; type: string; days: number | undefined }[] = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await sb
      .from("profiles")
      .select("id, email, plan_id, membership_activated_at, stripe_subscription_id")
      .not("stripe_subscription_id", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: "Could not load members." }, { status: 500 });
    for (const p of rows ?? []) {
      counts.checked += 1;
      const sub = await stripe.subscriptions.retrieve(String(p.stripe_subscription_id)).catch(() => null);
      if (!sub) { counts.no_sub += 1; continue; }
      for (const o of await processMember(sb, p, sub, now)) {
        if (o.result === "late_unsent") late.push({ user_id: p.id, type: o.type, days: o.days });
        else {
          counts[`${o.type}.${o.result}`] = (counts[`${o.type}.${o.result}`] ?? 0) + 1;
          counts[o.result] = (counts[o.result] ?? 0) + 1;
        }
      }
    }
    if (!rows || rows.length < PAGE) break;
  }
  if (late.length) console.error(`[legal-notices] ${late.length} notice(s) at/after alert day without a sent notice`, late);
  return NextResponse.json({ ok: true, ...counts, late });
}
