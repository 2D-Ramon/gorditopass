import { NextResponse } from "next/server";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Nothing to update.");
  const patch: Record<string, unknown> = {};
  for (const key of [
    "email",
    "first_name",
    "last_name",
    "phone",
    "city",
    "plan_id",
    "is_member",
    "status",
    "email_opt_in",
    "sms_opt_in",
    "birthday",
    "home_address",
    "notes",
  ]) {
    if (key in body) {
      const v = body[key];
      if (key === "email" && typeof v === "string") {
        patch.email = v.trim().toLowerCase();
      } else if (typeof v === "string" && v.trim() === "") {
        patch[key] = null;
      } else {
        patch[key] = v;
      }
    }
  }
  if (typeof patch.email === "string" && !patch.email.includes("@")) {
    return jsonError("A valid email is required.");
  }
  const { data, error } = await gate.supabase
    .from("members")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("That email is already on file.");
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ member: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const { error } = await gate.supabase.from("members").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
