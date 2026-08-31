import { NextResponse } from "next/server";
import Stripe from "stripe";
import { POINT_ACTIONS } from "@/lib/pricing";
import {
  addPoints,
  planRenewsAt,
  upsertDirectoryMember,
} from "@/lib/market";
import { recomputeMember } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }
  const stripe = new Stripe(key);
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid webhook." },
      { status: 400 },
    );
  }

  const sb = createOpsClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pendingId = session.metadata?.pending_id;
    if (pendingId) {
      const { data: pending } = await sb
        .from("pending_memberships")
        .select("*")
        .eq("id", pendingId)
        .maybeSingle();
      if (pending && pending.status !== "paid") {
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const now = new Date().toISOString();
        await sb
          .from("profiles")
          .update({
            is_member: true,
            plan_id: pending.plan_id,
            family_seats: pending.seats,
            membership_activated_at: now,
            membership_renews_at: planRenewsAt(pending.plan_id),
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subId ?? null,
            email_opt_in: pending.email_opt_in,
            sms_opt_in: pending.sms_opt_in,
          })
          .eq("id", pending.profile_id);
        const seats = (pending.members as {
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
          birthday?: string;
          homeAddress?: string;
        }[]) || [];
        const { data: billed } = await sb
          .from("profiles")
          .select("email")
          .eq("id", pending.profile_id)
          .maybeSingle();
        const billedEmail = String(billed?.email ?? "").toLowerCase();
        for (const seat of seats) {
          if (!seat.email) continue;
          const seatEmail = String(seat.email).trim().toLowerCase();
          await upsertDirectoryMember({
            email: seat.email,
            first_name: seat.firstName,
            last_name: seat.lastName,
            phone: seat.phone,
            plan_id: pending.plan_id,
            is_member: true,
            status: "active",
            email_opt_in: pending.email_opt_in,
            sms_opt_in: pending.sms_opt_in,
            birthday: seat.birthday,
            home_address: seat.homeAddress,
          });
          await sb.from("household_seats").upsert(
            {
              primary_member_id: pending.profile_id,
              email: seatEmail,
              first_name: seat.firstName ?? null,
              last_name: seat.lastName ?? null,
              phone: seat.phone ?? null,
              birthday: seat.birthday || null,
              home_address: seat.homeAddress ?? null,
              is_primary: seatEmail === billedEmail,
            },
            { onConflict: "primary_member_id,email" },
          );
        }
        await addPoints(
          pending.profile_id,
          POINT_ACTIONS.join_member.points,
          POINT_ACTIONS.join_member.label,
        );
        const refCode = String(pending.referral_code ?? "")
          .trim()
          .toUpperCase();
        if (refCode) {
          const { data: referrer } = await sb
            .from("profiles")
            .select("id, referral_count")
            .ilike("referral_code", refCode)
            .maybeSingle();
          if (referrer?.id && referrer.id !== pending.profile_id) {
            await addPoints(
              pending.profile_id,
              POINT_ACTIONS.referral_friend.points,
              POINT_ACTIONS.referral_friend.label,
            );
            await addPoints(
              referrer.id,
              POINT_ACTIONS.referral_referrer.points,
              POINT_ACTIONS.referral_referrer.label,
            );
            await sb
              .from("profiles")
              .update({
                referral_count: (referrer.referral_count ?? 0) + 1,
              })
              .eq("id", referrer.id);
            await sb
              .from("profiles")
              .update({ referred_by_code: refCode })
              .eq("id", pending.profile_id);
            await recomputeMember(referrer.id);
          }
        }
        await recomputeMember(pending.profile_id);
        await sb
          .from("pending_memberships")
          .update({ status: "paid" })
          .eq("id", pending.id);
      }
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const active = sub.status === "active" || sub.status === "trialing";
    await sb
      .from("profiles")
      .update({
        is_member: active,
        stripe_subscription_id: sub.id,
      })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
