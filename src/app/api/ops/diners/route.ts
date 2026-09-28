import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, phone, city, is_member, plan_id, banned, created_at",
    )
    .eq("role", "diner")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ diners: data ?? [] });
}
