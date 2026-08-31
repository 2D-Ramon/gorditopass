import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  const { data: apps } = await gate.supabase
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json({ listings: data ?? [], applications: apps ?? [] });
}
