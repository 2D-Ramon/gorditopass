import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { MEMBERSHIP_PLANS } from "@/lib/pricing";
import { createOpsClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/membership/status            -> billing config flags (public, unchanged)
 * GET /api/membership/status?me=1       -> + `membership` for the signed-in user (Bearer JWT; 401 otherwise)
 *   membership: { status: "active"|"canceling"|"none", plan_id, plan_name, price_usd, interval_months,
 *                 seats, renews_at, cancel_at_period_end, access_ends_at, has_subscription }
 * price_usd is the pricing.ts display value; the Stripe Price charged at checkout is the source of truth.
 */
export async function GET(req: Request) {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  const base = {
    stripe: key.length > 0,
    stripeLooksTest: key.startsWith("sk_test_"),
    stripeLooksLive: key.startsWith("sk_live_"),
    webhook: Boolean((process.env.STRIPE_WEBHOOK_SECRET ?? "").trim()),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  };
  if (new URL(req.url).searchParams.get("me") !== "1") return NextResponse.json(base);

  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: extra } = await createOpsClient()
    .from("profiles")
    .select("membership_cancel_at_period_end, membership_access_ends_at")
    .eq("id", profile.id)
    .maybeSingle();
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === profile.plan_id) ?? null;
  const canceling = Boolean(extra?.membership_cancel_at_period_end);
  return NextResponse.json({
    ...base,
    membership: {
      status: !profile.is_member ? "none" : canceling ? "canceling" : "active",
      plan_id: profile.plan_id,
      plan_name: plan?.name ?? null,
      price_usd: plan?.priceUsd ?? null,
      interval_months: plan?.months ?? null,
      seats: profile.family_seats ?? 1,
      renews_at: canceling ? null : profile.membership_renews_at,
      cancel_at_period_end: canceling,
      access_ends_at: extra?.membership_access_ends_at ?? (canceling ? profile.membership_renews_at : null),
      has_subscription: Boolean(profile.stripe_subscription_id),
    },
  });
}
