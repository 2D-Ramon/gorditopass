import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_events")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot manage events." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const sb = createOpsClient();
  const id = `event-${profile.restaurant_id}-${Date.now()}`;
  const { data: listing } = await sb
    .from("listings")
    .select("name")
    .eq("id", profile.restaurant_id)
    .maybeSingle();
  const { error } = await sb.from("listing_events").insert({
    id,
    restaurant_id: profile.restaurant_id,
    restaurant_name: listing?.name ?? "",
    title,
    description: String(body?.description ?? "").trim(),
    event_date: body?.date || null,
    event_time: body?.time || null,
    city: body?.city || profile.city || "dallas",
    emoji: body?.emoji || "🎉",
    address: body?.address || null,
    ticket_url: body?.ticketUrl || null,
    ticket_price_usd: body?.ticketPriceUsd ? Number(body.ticketPriceUsd) : null,
    status: "pending",
    hidden: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, status: "pending" });
}
