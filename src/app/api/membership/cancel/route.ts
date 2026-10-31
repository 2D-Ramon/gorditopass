import { NextResponse } from "next/server";
import Stripe from "stripe";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";
import {
  TEMPLATE_VERSIONS,
  cancelConfirmEmail,
  confirmationNumber,
  periodEnd,
  sameOriginJson,
  sendEmail,
} from "@/lib/legal";

export const dynamic = "force-dynamic";

/**
 * POST /api/membership/cancel  (spec §5)
 * Auth: Authorization: Bearer <Supabase JWT>. Body (JSON, all optional):
 *   { retention_offer_shown?: boolean, retention_offer_accepted?: boolean }
 * 200 -> { confirmation_number, access_ends_at, already_canceled }
 * Cancels at period end (no refund). Idempotent per user_id + subscription_id.
 */
export async function POST(req: Request) {
  if (!sameOriginJson(req)) {
    return NextResponse.json({ error: "Bad request origin." }, { status: 403 });
  }
  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const subId = profile.stripe_subscription_id;
  if (!subId) {
    return NextResponse.json(
      { error: "No auto-renewing membership to cancel.", code: "no_subscription" },
      { status: 404 },
    );
  }
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) return NextResponse.json({ error: "Billing is not connected." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as {
    retention_offer_shown?: boolean;
    retention_offer_accepted?: boolean;
  } | null;
  const sb = createOpsClient();

  const { data: open } = await sb
    .from("cancellations")
    .select("confirmation_number, effective_at")
    .eq("user_id", profile.id)
    .eq("subscription_id", subId)
    .is("superseded_at", null)
    .maybeSingle();
  if (open) {
    return NextResponse.json({
      confirmation_number: open.confirmation_number,
      access_ends_at: open.effective_at,
      already_canceled: true,
    });
  }

  const stripe = new Stripe(key);
  let sub: Stripe.Subscription;
  try {
    // Naturally idempotent; the DB unique index enforces one open cancellation.
    sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    if (/No such subscription|canceled subscription/i.test(msg)) {
      return NextResponse.json({ error: "This membership is already ended.", code: "no_subscription" }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not cancel right now. Try again." }, { status: 502 });
  }
  const end = periodEnd(sub);
  const accessEndsAt = end ? new Date(end * 1000).toISOString() : profile.membership_renews_at;
  const now = new Date().toISOString();
  const confirmation = confirmationNumber();
  const { error: insErr } = await sb.from("cancellations").insert({
    user_id: profile.id,
    subscription_id: subId,
    requested_at: now,
    channel: "web",
    retention_offer_shown: Boolean(body?.retention_offer_shown),
    retention_offer_accepted: Boolean(body?.retention_offer_accepted),
    processed_at: now,
    effective_at: accessEndsAt,
    stripe_response_id: sub.id,
    confirmation_number: confirmation,
  });
  if (insErr?.code === "23505") {
    const { data: again } = await sb
      .from("cancellations")
      .select("confirmation_number, effective_at")
      .eq("user_id", profile.id)
      .eq("subscription_id", subId)
      .is("superseded_at", null)
      .maybeSingle();
    return NextResponse.json({
      confirmation_number: again?.confirmation_number ?? null,
      access_ends_at: again?.effective_at ?? accessEndsAt,
      already_canceled: true,
    });
  }
  await sb
    .from("profiles")
    .update({
      membership_cancel_at_period_end: true,
      membership_canceled_at: now,
      membership_access_ends_at: accessEndsAt,
    })
    .eq("id", profile.id);

  const mail = cancelConfirmEmail({ confirmationNumber: confirmation, accessEndsAt });
  const sent = await sendEmail(profile.email, mail.subject, mail.html);
  await sb.from("notices_sent").insert({
    user_id: profile.id,
    subscription_id: subId,
    type: "cancel_confirm",
    template_version: TEMPLATE_VERSIONS.cancel_confirm,
    status: sent.ok ? "sent" : sent.queued ? "queued" : "failed",
    sent_at: sent.ok ? now : null,
    provider_message_id: sent.ok ? sent.id : null,
    error: sent.ok ? null : sent.error,
  });

  return NextResponse.json({
    confirmation_number: confirmation,
    access_ends_at: accessEndsAt,
    already_canceled: false,
  });
}
