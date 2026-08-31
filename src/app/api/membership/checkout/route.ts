import { NextResponse } from "next/server";
import Stripe from "stripe";
import { MEMBERSHIP_PLANS, PLATFORM } from "@/lib/pricing";
import {
  countActiveMembers,
  dinerCapReached,
  userFromRequest,
} from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (profile.banned) {
    return NextResponse.json({ error: "This account is closed." }, { status: 403 });
  }
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Stripe is not connected yet. Add STRIPE_SECRET_KEY in Vercel, then try again.",
      },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => null)) as {
    planId?: string;
    seats?: number;
    members?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      birthday?: string;
      homeAddress?: string;
    }[];
    email_opt_in?: boolean;
    sms_opt_in?: boolean;
    referral_code?: string;
  } | null;
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === body?.planId);
  if (!plan) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  const seats = Math.min(Math.max(Number(body?.seats) || 1, 1), 6);
  const n = await countActiveMembers();
  if (!profile.is_member && dinerCapReached(n + seats - 1)) {
    return NextResponse.json(
      { error: `Early access is capped at ${PLATFORM.earlyCapDiners} diners.` },
      { status: 403 },
    );
  }

  const sb = createOpsClient();
  const { data: pending, error: pendErr } = await sb
    .from("pending_memberships")
    .insert({
      profile_id: profile.id,
      plan_id: plan.id,
      seats,
      members: body?.members ?? [],
      email_opt_in: Boolean(body?.email_opt_in),
      sms_opt_in: Boolean(body?.sms_opt_in),
      referral_code: body?.referral_code || null,
      status: "pending",
    })
    .select("id")
    .single();
  if (pendErr || !pending) {
    return NextResponse.json(
      { error: pendErr?.message ?? "Could not start checkout." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(key);
  const interval =
    plan.months === 12 ? { interval: "year" as const, interval_count: 1 } : { interval: "month" as const, interval_count: plan.months };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gorditopass.vercel.app";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: profile.email,
    client_reference_id: profile.id,
    metadata: { pending_id: pending.id, plan_id: plan.id },
    line_items: [
      {
        quantity: seats,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceUsd * 100,
          recurring: interval,
          product_data: {
            name: `GorditoPass ${plan.name}`,
            description: `${seats} seat${seats === 1 ? "" : "s"}`,
          },
        },
      },
    ],
    success_url: `${appUrl}/membership?paid=1`,
    cancel_url: `${appUrl}/membership?canceled=1`,
  });
  await sb
    .from("pending_memberships")
    .update({ stripe_session_id: session.id })
    .eq("id", pending.id);
  return NextResponse.json({ url: session.url });
}
