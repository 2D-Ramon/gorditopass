import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { sanitizeImageUrls } from "@/lib/media";
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
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const sb = createOpsClient();
  const id = `event-${profile.restaurant_id}-${Date.now()}`;
  const { data: listing } = await sb
    .from("listings")
    .select("name")
    .eq("id", profile.restaurant_id)
    .maybeSingle();
  const row = {
    id,
    restaurant_id: profile.restaurant_id,
    restaurant_name: listing?.name ?? "",
    title,
    description: String(body?.description ?? "").trim(),
    event_date: body?.date || null,
    event_time: body?.time || null,
    city: String(body?.city ?? "") || profile.city || "dallas",
    emoji: String(body?.emoji ?? "") || "🎉",
    address: body?.address || null,
    ticket_url: body?.ticketUrl || null,
    ticket_price_usd: body?.ticketPriceUsd ? Number(body.ticketPriceUsd) : null,
    image_urls: sanitizeImageUrls(body?.imageUrls ?? body?.imageDataUrls),
    status: "pending",
    hidden: false,
  };
  let { error } = await sb.from("listing_events").insert(row);
  if (error && /image_urls/i.test(error.message)) {
    const { image_urls: _urls, ...without } = row;
    void _urls;
    ({ error } = await sb.from("listing_events").insert(without));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, status: "pending" });
}
