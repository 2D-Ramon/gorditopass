import { NextResponse } from "next/server";
import Stripe from "stripe";
import { userFromRequest } from "@/lib/market";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!profile?.stripe_customer_id || !key) {
    return NextResponse.json(
      { error: "No billing account yet." },
      { status: 400 },
    );
  }
  const stripe = new Stripe(key);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gorditopass.vercel.app";
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/account`,
  });
  return NextResponse.json({ url: portal.url });
}
