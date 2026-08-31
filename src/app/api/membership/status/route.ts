import { NextResponse } from "next/server";

export async function GET() {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  return NextResponse.json({
    stripe: key.length > 0,
    stripeLooksTest: key.startsWith("sk_test_"),
    stripeLooksLive: key.startsWith("sk_live_"),
    webhook: Boolean((process.env.STRIPE_WEBHOOK_SECRET ?? "").trim()),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
