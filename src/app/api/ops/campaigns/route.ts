import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const text = String(body?.body ?? "").trim();
  const channel = body?.channel === "sms" ? "sms" : "email";
  if (!name) return jsonError("Campaign name is required.");
  if (!text) return jsonError("Message body is required.");
  const row = {
    name,
    channel,
    audience: body?.audience ?? "members_opted_in",
    subject: channel === "email" ? String(body?.subject ?? "").trim() || null : null,
    body: text,
    status: "draft",
  };
  const { data, error } = await gate.supabase
    .from("campaigns")
    .insert(row)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ campaign: data });
}
