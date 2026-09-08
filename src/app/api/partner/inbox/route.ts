import { NextResponse } from "next/server";
import { requireManagers, requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_messages")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(100);
  const unread = (data ?? []).filter((m) => m.from_role === "diner" && !m.read_at).length;
  return NextResponse.json({ messages: data ?? [], unread });
}

export async function POST(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const body = (await req.json().catch(() => null)) as {
    body?: string;
    memberId?: string;
  } | null;
  const text = String(body?.body ?? "").trim();
  if (text.length < 1) {
    return NextResponse.json({ error: "Write a message." }, { status: 400 });
  }
  const sb = createOpsClient();
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Staff";
  const { error: err } = await sb.from("listing_messages").insert({
    restaurant_id: profile.restaurant_id,
    member_id: body?.memberId || null,
    from_role: "staff",
    from_name: name,
    body: text.slice(0, 1000),
  });
  if (err) {
    return NextResponse.json(
      { error: "Could not send. Run partner_ops.sql in Supabase." },
      { status: 500 },
    );
  }
  await sb
    .from("listing_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("restaurant_id", profile.restaurant_id)
    .eq("from_role", "diner")
    .is("read_at", null);
  return NextResponse.json({ ok: true });
}
