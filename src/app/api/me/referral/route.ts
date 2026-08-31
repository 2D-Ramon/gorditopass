import { NextResponse } from "next/server";
import {
  ensureProfileReferralCode,
  userFromRequest,
} from "@/lib/market";
import { memberSnapshot } from "@/lib/member-state";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const next = await ensureProfileReferralCode(profile);
  const bundle = await memberSnapshot(next);
  return NextResponse.json({
    ...bundle,
    referralCode: next.referral_code,
  });
}
