import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/market";
import { memberSnapshot } from "@/lib/member-state";
import { jsonError, withOps } from "../../_util";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const profile = await loadProfile(id);
  if (!profile || profile.role === "restaurant") {
    return jsonError("Member not found.", 404);
  }
  const bundle = await memberSnapshot(profile);
  const { data: posts } = await gate.supabase
    .from("city_posts")
    .select("id, title, body, city, created_at, restaurant_name")
    .eq("member_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({
    ...bundle,
    banned: profile.banned,
    posts: posts ?? [],
  });
}
