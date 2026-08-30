import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_crm");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Nothing to update.");
  const patch: Record<string, unknown> = {};
  for (const key of [
    "name",
    "status",
    "city",
    "neighborhood",
    "cuisine",
    "contact_name",
    "contact_email",
    "contact_phone",
    "website",
    "address",
    "source",
    "next_follow_up",
    "notes",
  ]) {
    if (key in body) {
      const v = body[key];
      patch[key] =
        typeof v === "string" && v.trim() === "" ? null : v;
    }
  }
  if (typeof patch.name === "string" && !patch.name.trim()) {
    return jsonError("Business name is required.");
  }
  const { data, error } = await gate.supabase
    .from("business_accounts")
    .update(patch)
    .eq("id", id)
    .select("*, business_notes(id, body, created_at)")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ business: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_crm");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const { error } = await gate.supabase
    .from("business_accounts")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
