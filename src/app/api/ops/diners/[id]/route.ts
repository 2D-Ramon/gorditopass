import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/market";
import { memberSnapshot } from "@/lib/member-state";
import {
  DELETED_NOTE,
  SUSPEND_CLEARED,
  SUSPEND_DAYS,
  suspensionNote,
  type SuspendScope,
} from "@/lib/moderation";
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

export async function POST(req: Request, ctx: Ctx) {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const profile = await loadProfile(id);
  if (!profile || profile.role === "restaurant") {
    return jsonError("Member not found.", 404);
  }
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    days?: number;
    scope?: string;
  } | null;
  const sb = gate.supabase;

  if (body?.action === "clear") {
    const { error } = await sb.from("reward_ledger").insert({
      member_id: id,
      points: 0,
      note: SUSPEND_CLEARED,
    });
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "suspend") {
    const days = Number(body.days);
    const scope = body.scope as SuspendScope;
    if (!SUSPEND_DAYS.includes(days as (typeof SUSPEND_DAYS)[number])) {
      return jsonError("Choose 1, 3, 7, 14, or 30 days.");
    }
    if (scope !== "redeem" && scope !== "social" && scope !== "all") {
      return jsonError("Choose redeeming, messaging, or all.");
    }
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await sb.from("reward_ledger").insert({
      member_id: id,
      points: 0,
      note: suspensionNote(until, scope),
    });
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true, until, scope });
  }

  if (body?.action === "delete") {
    const { error: noteErr } = await sb.from("reward_ledger").insert({
      member_id: id,
      points: 0,
      note: DELETED_NOTE,
    });
    if (noteErr) return jsonError(noteErr.message, 500);
    const { error } = await sb
      .from("profiles")
      .update({ banned: true, is_member: false })
      .eq("id", id);
    if (error) return jsonError(error.message, 500);
    await sb.from("members").update({ status: "cancelled" }).eq("email", profile.email);
    return NextResponse.json({ ok: true });
  }

  return jsonError("Unknown action.");
}
