import { NextResponse } from "next/server";
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
