import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};
  if (typeof body?.approved === "boolean") patch.approved = body.approved;
  if (typeof body?.banned === "boolean") patch.banned = body.banned;
  if (typeof body?.hidden === "boolean") patch.hidden = body.hidden;
  const { error } = await gate.supabase.from("listings").update(patch).eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
