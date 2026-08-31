import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_applications");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return jsonError("Invalid status.", 400);
  }
  const { error } = await gate.supabase
    .from("partner_applications")
    .update({ status })
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
