import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { data: row } = await sb
    .from("redeem_codes")
    .select("*")
    .eq("code", code)
    .eq("member_id", profile.id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ status: "unknown" });
  }
  const { count } = await sb
    .from("redeem_codes")
    .select("id", { count: "exact", head: true })
    .eq("member_id", profile.id)
    .eq("status", "used");
  const badges = [...(profile.badges ?? [])];
  if ((count ?? 0) >= 1 && !badges.includes("first_bite")) {
    badges.push("first_bite");
  }
  return NextResponse.json({
    status: row.status,
    dealId: row.deal_id,
    points: profile.reward_points,
    badges,
  });
}
