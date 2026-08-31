import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { banned?: boolean } | null;
  const banned = Boolean(body?.banned);
  await gate.supabase.from("profiles").update({ banned, is_member: banned ? false : undefined }).eq("id", id);
  const { data: p } = await gate.supabase.from("profiles").select("email").eq("id", id).maybeSingle();
  if (p?.email) {
    await gate.supabase
      .from("members")
      .update({ status: banned ? "cancelled" : "active" })
      .eq("email", p.email);
  }
  return NextResponse.json({ ok: true });
}
