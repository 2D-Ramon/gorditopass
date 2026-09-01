import { NextResponse } from "next/server";
import { ensureProfileReferralCode, userFromRequest } from "@/lib/market";
import { memberSnapshot, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const withCode = await ensureProfileReferralCode(profile);
  const bundle = await memberSnapshot(withCode);
  return NextResponse.json(bundle);
}

export async function PATCH(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    avatarUrl?: string;
  } | null;
  const avatarUrl = String(body?.avatarUrl ?? "").trim();
  if (!avatarUrl) {
    return NextResponse.json({ error: "avatarUrl required." }, { status: 400 });
  }
  if (
    !avatarUrl.startsWith("https://") &&
    !avatarUrl.startsWith("data:image/")
  ) {
    return NextResponse.json({ error: "Invalid avatar URL." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { error } = await sb
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const bundle = await snapshotAfter(profile.id);
  return NextResponse.json(bundle);
}
