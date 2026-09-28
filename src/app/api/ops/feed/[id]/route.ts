import { NextResponse } from "next/server";
import { WARNING_NOTE, rememberRemovedFeedId, warningCounts } from "@/lib/moderation";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_feed");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { hidden?: boolean } | null;
  const { error } = await gate.supabase
    .from("city_posts")
    .update({ hidden: Boolean(body?.hidden) })
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_feed");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const sb = gate.supabase;
  const { data: post } = await sb.from("city_posts").select("*").eq("id", id).maybeSingle();
  if (post) {
    await sb.from("city_posts").delete().eq("id", id);
    if (post.body && post.member_id) {
      let q = sb
        .from("plate_reviews")
        .delete()
        .eq("member_id", post.member_id)
        .eq("body", post.body);
      if (post.restaurant_id) q = q.eq("restaurant_id", post.restaurant_id);
      await q;
    }
  }
  await rememberRemovedFeedId(sb, id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, ctx: Ctx) {
  const gate = await withOps("can_feed");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  const sb = gate.supabase;
  const { data: post } = await sb
    .from("city_posts")
    .select("member_id")
    .eq("id", id)
    .maybeSingle();
  const memberId = String(post?.member_id ?? "");
  if (!memberId) {
    return jsonError("This comment is not tied to a member account.");
  }

  if (body?.action === "warn") {
    const { error } = await sb.from("reward_ledger").insert({
      member_id: memberId,
      points: 0,
      note: WARNING_NOTE,
    });
    if (error) return jsonError(error.message, 500);
    const counts = await warningCounts(sb, [memberId]);
    return NextResponse.json({ ok: true, warningCount: counts.get(memberId) ?? 0 });
  }

  if (body?.action === "ban") {
    const counts = await warningCounts(sb, [memberId]);
    const warningCount = counts.get(memberId) ?? 0;
    if (warningCount < 3) {
      return jsonError("Ban is available after 3 warnings.");
    }
    const { error } = await sb
      .from("profiles")
      .update({ banned: true, is_member: false })
      .eq("id", memberId);
    if (error) return jsonError(error.message, 500);
    const { data: person } = await sb
      .from("profiles")
      .select("email")
      .eq("id", memberId)
      .maybeSingle();
    if (person?.email) {
      await sb.from("members").update({ status: "cancelled" }).eq("email", person.email);
    }
    return NextResponse.json({ ok: true, banned: true, warningCount });
  }

  return jsonError("Unknown action.");
}
