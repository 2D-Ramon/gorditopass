import { NextResponse } from "next/server";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ restaurant: null, reviews: [] });
  }
  const sb = createOpsClient();
  const { data: listing } = await sb.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) {
    return NextResponse.json({ restaurant: null, reviews: [] });
  }
  const [{ data: deals }, { data: menu }, { data: reviews }] = await Promise.all([
    sb.from("listing_deals").select("*").eq("restaurant_id", id),
    sb.from("listing_menu").select("*").eq("restaurant_id", id),
    sb
      .from("plate_reviews")
      .select("*")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return NextResponse.json({
    restaurant: { ...listing, deals: deals ?? [], menu: menu ?? [] },
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      author: r.author ?? "Member",
      plates: r.plates,
      text: r.body ?? "",
      createdAt: String(r.created_at).slice(0, 10),
      fromFeed: r.from_feed,
      menuItemId: r.menu_item_id,
      menuItemName: r.menu_item_name,
      dealId: r.deal_id,
      dealTitle: r.deal_title,
      cuisine: r.cuisine,
    })),
  });
}
