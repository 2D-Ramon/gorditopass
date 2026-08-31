import { NextResponse } from "next/server";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ events: [] });
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_events")
    .select("*")
    .eq("hidden", false)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return NextResponse.json({
    events: (data ?? []).map((e) => ({
      id: e.id,
      restaurantId: e.restaurant_id,
      restaurantName: e.restaurant_name ?? "",
      title: e.title,
      description: e.description ?? "",
      date: e.event_date ?? "",
      time: e.event_time ?? "",
      city: e.city ?? "dallas",
      emoji: e.emoji ?? "🎉",
      address: e.address ?? "",
      ticketUrl: e.ticket_url ?? "",
      ticketPriceUsd: Number(e.ticket_price_usd ?? 0),
      status: e.status,
      createdAt: e.created_at,
    })),
  });
}
