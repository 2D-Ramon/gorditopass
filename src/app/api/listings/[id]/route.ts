import { blockAutomatedCatalogRead, catalogJson } from "@/lib/bot-guard";
import { isLiveListing } from "@/lib/listing-status";
import { stripPrivateListingFields } from "@/lib/public-listing";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";
import { redactDisplayName } from "@/lib/partner-privacy";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const blocked = await blockAutomatedCatalogRead();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return catalogJson({ restaurant: null, reviews: [] });
  }
  const sb = createOpsClient();
  const { data: listing } = await sb.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing || !isLiveListing(listing)) {
    return catalogJson({ restaurant: null, reviews: [] });
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
  const reviewIds = (reviews ?? []).map((r) => r.id);
  const { data: replies } = reviewIds.length
    ? await sb.from("plate_review_replies").select("*").in("review_id", reviewIds)
    : { data: [] as { review_id: string; body: string }[] };
  const replyMap = new Map((replies ?? []).map((r) => [r.review_id, r.body]));
  return catalogJson({
    restaurant: { ...stripPrivateListingFields(listing), deals: deals ?? [], menu: menu ?? [] },
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      author: redactDisplayName(r.author),
      plates: r.plates,
      text: r.body ?? "",
      createdAt: String(r.created_at).slice(0, 10),
      fromFeed: r.from_feed,
      menuItemId: r.menu_item_id,
      menuItemName: r.menu_item_name,
      dealId: r.deal_id,
      dealTitle: r.deal_title,
      cuisine: r.cuisine,
      ownerReply: replyMap.get(r.id) ?? "",
    })),
  });
}
