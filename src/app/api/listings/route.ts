import { blockAutomatedCatalogRead, catalogJson } from "@/lib/bot-guard";
import { stripPrivateListingFields } from "@/lib/public-listing";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const blocked = await blockAutomatedCatalogRead();
  if (blocked) return blocked;
  if (!isSupabaseConfigured()) {
    return catalogJson({ restaurants: [], hidden: [] });
  }
  const sb = createOpsClient();
  const { data: listings, error } = await sb.from("listings").select("*");
  if (error || !listings) {
    return catalogJson({ restaurants: [], hidden: [] });
  }
  const ids = listings.map((l) => l.id);
  const [{ data: deals }, { data: menu }] = await Promise.all([
    sb.from("listing_deals").select("*").in("restaurant_id", ids.length ? ids : ["_"]),
    sb.from("listing_menu").select("*").in("restaurant_id", ids.length ? ids : ["_"]),
  ]);
  const dealMap = new Map<string, typeof deals>();
  for (const d of deals ?? []) {
    const list = dealMap.get(d.restaurant_id) ?? [];
    list.push(d);
    dealMap.set(d.restaurant_id, list);
  }
  const menuMap = new Map<string, typeof menu>();
  for (const m of menu ?? []) {
    const list = menuMap.get(m.restaurant_id) ?? [];
    list.push(m);
    menuMap.set(m.restaurant_id, list);
  }
  const hidden = listings
    .filter((l) => l.banned || l.approved === false)
    .map((l) => l.id as string);
  const restaurants = listings.map((l) => ({
    ...stripPrivateListingFields(l),
    deals: dealMap.get(l.id) ?? [],
    menu: menuMap.get(l.id) ?? [],
  }));
  return catalogJson({ restaurants, hidden });
}
