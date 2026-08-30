import { NextResponse } from "next/server";
import { hashPassword, toPublicAdmin } from "@/lib/ops-admins";
import type { OpsPermission } from "@/lib/ops-types";
import { jsonError, withOps } from "../_util";

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

export async function GET() {
  const gate = await withOps("can_manage_admins");
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("ops_admins")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({
    admins: (data ?? []).map((row) => toPublicAdmin(row)),
  });
}

export async function POST(req: Request) {
  const gate = await withOps("can_manage_admins");
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!name) return jsonError("Name is required.");
  if (!email.includes("@")) return jsonError("A valid email is required.");
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters.");
  }
  const flags: Record<string, boolean> = {};
  for (const key of FLAGS) flags[key] = Boolean(body?.[key]);
  const { data, error } = await gate.supabase
    .from("ops_admins")
    .insert({
      name,
      email,
      password_hash: hashPassword(password),
      is_owner: false,
      active: true,
      ...flags,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("That email is already an admin.");
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ admin: toPublicAdmin(data) });
}
