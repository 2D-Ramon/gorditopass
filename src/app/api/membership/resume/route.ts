import { NextResponse } from "next/server";
import Stripe from "stripe";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";
import { clientIp, periodEnd, sameOriginJson, subAmountCents } from "@/lib/legal";
import { parseConsent } from "@/lib/consent";

export const dynamic = "force-dynamic";

/**
 * POST /api/membership/resume  (spec §5: "re-captures consent")
 * Body: { consent: ConsentInput }  (same shape as checkout; checkbox_checked must be true)
 * 200 -> { resumed: true, renews_at, consent_id }
 */
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "Bad request origin." }, { status: 403 });
  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const subId = profile.stripe_subscription_id;
  if (!subId) return NextResponse.json({ error: "No membership to resume.", code: "no_subscription" }, { status: 404 });
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) return NextResponse.json({ error: "Billing is not connected." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { consent?: unknown } | null;
  const consent = parseConsent(body?.consent);
  if (!consent.ok) return NextResponse.json({ error: consent.error, code: "consent_required" }, { status: 422 });

  const stripe = new Stripe(key);
  let sub = await stripe.subscriptions.retrieve(subId).catch(() => null);
  if (!sub || sub.status === "canceled") {
    return NextResponse.json({ error: "This membership already ended. Join again.", code: "ended" }, { status: 409 });
  }
  const sb = createOpsClient();
  const { data: ev, error: cErr } = await sb
    .from("consent_events")
    .insert({
      ...consent.value,
      kind: "resume",
      user_id: profile.id,
      email: profile.email,
      ip: clientIp(req),
      user_agent: req.headers.get("user-agent"),
      price_cents: subAmountCents(sub) ?? 0,
      currency: sub.currency ?? "usd",
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
    })
    .select("id")
    .single();
  if (cErr || !ev) return NextResponse.json({ error: "Could not record consent." }, { status: 500 });
  sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
  const now = new Date().toISOString();
  await sb
    .from("cancellations")
    .update({ superseded_at: now })
    .eq("user_id", profile.id)
    .eq("subscription_id", subId)
    .is("superseded_at", null);
  await sb
    .from("profiles")
    .update({ membership_cancel_at_period_end: false, membership_canceled_at: null, membership_access_ends_at: null })
    .eq("id", profile.id);
  const end = periodEnd(sub);
  return NextResponse.json({ resumed: true, renews_at: end ? new Date(end * 1000).toISOString() : null, consent_id: ev.id });
}
