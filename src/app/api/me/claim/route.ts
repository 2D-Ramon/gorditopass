import { NextResponse } from "next/server";
import { REWARDS } from "@/lib/pricing";
import { loadProfile, userFromRequest } from "@/lib/market";
import { recomputeMember, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (profile.role !== "diner") {
    return NextResponse.json({ error: "Diner account required." }, { status: 403 });
  }
  const fresh = await loadProfile(profile.id);
  if (!fresh) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  const pts = fresh.reward_points ?? 0;
  if (pts < REWARDS.pointsPerReward) {
    return NextResponse.json(
      {
        error: `Need ${REWARDS.pointsPerReward - pts} more pts.`,
        ok: false,
      },
      { status: 400 },
    );
  }
  const sb = createOpsClient();
  await sb
    .from("profiles")
    .update({
      reward_points: pts - REWARDS.pointsPerReward,
      rewards_claimed: (fresh.rewards_claimed ?? 0) + 1,
    })
    .eq("id", profile.id);
  await sb.from("reward_ledger").insert({
    member_id: profile.id,
    points: -REWARDS.pointsPerReward,
    note: `Claimed ${REWARDS.rewardLabel}`,
  });
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json({ ok: true, ...bundle });
}
