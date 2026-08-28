import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("business_accounts")
    .select("*, business_notes(id, body, created_at)")
    .order("updated_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ businesses: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  if (!name) return jsonError("Business name is required.");
  const row = {
    name,
    status: body?.status ?? "lead",
    city: emptyToNull(body?.city),
    neighborhood: emptyToNull(body?.neighborhood),
    cuisine: emptyToNull(body?.cuisine),
    contact_name: emptyToNull(body?.contact_name),
    contact_email: emptyToNull(body?.contact_email),
    contact_phone: emptyToNull(body?.contact_phone),
    website: emptyToNull(body?.website),
    address: emptyToNull(body?.address),
    source: emptyToNull(body?.source),
    next_follow_up: emptyToNull(body?.next_follow_up),
    notes: emptyToNull(body?.notes),
  };
  const { data, error } = await gate.supabase
    .from("business_accounts")
    .insert(row)
    .select("*, business_notes(id, body, created_at)")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ business: data });
}

function emptyToNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}
