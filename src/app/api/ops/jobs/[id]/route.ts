import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_content");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};
  if (typeof body?.status === "string") patch.status = body.status;
  if (typeof body?.hidden === "boolean") patch.hidden = body.hidden;
  const { error } = await gate.supabase.from("listing_jobs").update(patch).eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
