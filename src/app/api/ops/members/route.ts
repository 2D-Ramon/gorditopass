import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ members: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return jsonError("A valid email is required.");
  const row = {
    email,
    first_name: emptyToNull(body?.first_name),
    last_name: emptyToNull(body?.last_name),
    phone: emptyToNull(body?.phone),
    city: emptyToNull(body?.city) ?? "dallas",
    plan_id: emptyToNull(body?.plan_id),
    is_member: Boolean(body?.is_member),
    status: body?.status ?? (body?.is_member ? "active" : "waitlist"),
    email_opt_in: Boolean(body?.email_opt_in),
    sms_opt_in: Boolean(body?.sms_opt_in),
    birthday: emptyToNull(body?.birthday),
    home_address: emptyToNull(body?.home_address),
    notes: emptyToNull(body?.notes),
  };
  const { data, error } = await gate.supabase
    .from("members")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return jsonError("That email is already on file.");
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ member: data });
}

function emptyToNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}
