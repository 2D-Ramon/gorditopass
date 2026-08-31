import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { recomputeMember } from "@/lib/member-state";
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
  if (row.status === "used") {
    const newBadges = await recomputeMember(profile.id);
    const { data: fresh } = await sb
      .from("profiles")
      .select("reward_points, badges")
      .eq("id", profile.id)
      .maybeSingle();
    return NextResponse.json({
      status: "used",
      dealId: row.deal_id,
      points: fresh?.reward_points ?? profile.reward_points,
      badges: fresh?.badges ?? profile.badges ?? [],
      newBadges,
      savingsUsd: row.savings_usd ?? 0,
    });
  }
  return NextResponse.json({
    status: row.status,
    dealId: row.deal_id,
    points: profile.reward_points,
    badges: profile.badges ?? [],
  });
}
