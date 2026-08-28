import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  const text = body?.body?.trim() ?? "";
  if (!text) return jsonError("Note cannot be empty.");
  const { data, error } = await gate.supabase
    .from("business_notes")
    .insert({ business_id: id, body: text })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ note: data });
}
