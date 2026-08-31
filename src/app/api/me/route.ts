import { NextResponse } from "next/server";
import { ensureProfileReferralCode, userFromRequest } from "@/lib/market";
import { memberSnapshot } from "@/lib/member-state";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const withCode = await ensureProfileReferralCode(profile);
  const bundle = await memberSnapshot(withCode);
  return NextResponse.json(bundle);
}
