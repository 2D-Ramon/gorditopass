import { NextResponse } from "next/server";
import { setAccessCodeActive } from "@/lib/access-codes";
import { jsonError, withOps } from "../../_util";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { active?: boolean } | null;
  if (typeof body?.active !== "boolean") return jsonError("Nothing to update.");
  try {
    const code = await setAccessCodeActive(gate.supabase, id, body.active);
    if (!code) return jsonError("Code not found.", 404);
    return NextResponse.json({ code });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not update the code.", 500);
  }
}
