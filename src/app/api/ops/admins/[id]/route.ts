import { NextResponse } from "next/server";
import { hashPassword, toPublicAdmin } from "@/lib/ops-admins";
import type { OpsPermission } from "@/lib/ops-types";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

const FLAGS: OpsPermission[] = [
  "can_crm",
  "can_members",
  "can_campaigns",
  "can_applications",
  "can_content",
  "can_restaurants",
  "can_feed",
  "can_manage_admins",
];

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_manage_admins");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const { data: existing, error: loadErr } = await gate.supabase
    .from("ops_admins")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !existing) return jsonError("Admin not found.", 404);
  if (existing.is_owner && gate.admin && gate.admin.id !== id) {
    return jsonError("You cannot change the owner account.");
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Nothing to update.");
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email.includes("@")) return jsonError("A valid email is required.");
    patch.email = email;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 8) {
      return jsonError("Password must be at least 8 characters.");
    }
    patch.password_hash = hashPassword(body.password);
  }
  if (typeof body.active === "boolean") {
    if (existing.is_owner && body.active === false) {
      return jsonError("The owner account cannot be deactivated.");
    }
    patch.active = body.active;
  }
  if (!existing.is_owner) {
    for (const key of FLAGS) {
      if (key in body) patch[key] = Boolean(body[key]);
    }
  }
  const { data, error } = await gate.supabase
    .from("ops_admins")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("That email is already an admin.");
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ admin: toPublicAdmin(data) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_manage_admins");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  if (gate.admin?.id === id) {
    return jsonError("You cannot remove your own login.");
  }
  const { data: existing, error: loadErr } = await gate.supabase
    .from("ops_admins")
    .select("id, is_owner")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !existing) return jsonError("Admin not found.", 404);
  if (existing.is_owner) {
    return jsonError("The owner account cannot be removed.");
  }
  const { error } = await gate.supabase.from("ops_admins").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
