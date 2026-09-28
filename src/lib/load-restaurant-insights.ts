import type { SupabaseClient } from "@supabase/supabase-js";
import {
  startOfWeek,
  buildInsights,
  type InsightsPayload,
  type ScanEvent,
} from "@/lib/partner-insights";

function firstName(row: { first_name?: string | null; email?: string | null }) {
  return (row.first_name || "").trim() || (row.email || "Member").split("@")[0];
}

export type RestaurantInsightsBody = InsightsPayload & {
  openStatus: string;
  hours: string;
  typicalWeeklyTickets: number | null;
  googleMapsUrl: string;
  dealsLive: { id: string; title: string; soldOut: boolean; active: boolean }[];
  menuLive: { id: string; name: string; soldOut: boolean }[];
};

/** Same numbers the partner desk loads for one restaurant. */
export async function loadRestaurantInsights(
  sb: SupabaseClient,
  rid: string,
): Promise<{
  insights: RestaurantInsightsBody;
  listing: Record<string, unknown> | null;
  deals: Record<string, unknown>[];
  menu: Record<string, unknown>[];
}> {
  const { data: listing } = await sb.from("listings").select("*").eq("id", rid).maybeSingle();
  const [{ data: deals }, { data: menu }, { data: codes }] = await Promise.all([
    sb.from("listing_deals").select("*").eq("restaurant_id", rid),
    sb.from("listing_menu").select("*").eq("restaurant_id", rid),
    sb
      .from("redeem_codes")
      .select("id, deal_id, deal_title, member_id, status, used_at, used_by, revenue_usd, created_at")
      .eq("restaurant_id", rid)
      .eq("status", "used")
      .order("used_at", { ascending: false })
      .limit(2000),
  ]);

  const memberIds = [...new Set((codes ?? []).map((c) => c.member_id).filter(Boolean))];
  const staffIds = [...new Set((codes ?? []).map((c) => c.used_by).filter(Boolean))];
  const [{ data: members }, { data: staff }] = await Promise.all([
    memberIds.length
      ? sb.from("profiles").select("id, first_name, last_name, email").in("id", memberIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string;
          }[],
        }),
    staffIds.length
      ? sb.from("profiles").select("id, first_name, last_name, email").in("id", staffIds as string[])
      : Promise.resolve({
          data: [] as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string;
          }[],
        }),
  ]);
  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  const staffMap = new Map((staff ?? []).map((m) => [m.id, m]));

  const scans: ScanEvent[] = (codes ?? []).map((c) => {
    const m = memberMap.get(c.member_id);
    const st = c.used_by ? staffMap.get(c.used_by) : null;
    const last = (m?.last_name || "").trim();
    return {
      at: String(c.used_at || c.created_at),
      dealId: c.deal_id,
      dealTitle: c.deal_title || c.deal_id,
      memberId: c.member_id,
      firstName: m ? firstName(m) : "Member",
      lastInitial: last ? last[0]!.toUpperCase() : "",
      staffName: st
        ? [st.first_name, st.last_name].filter(Boolean).join(" ") || st.email
        : "Staff PIN",
      revenueUsd: Number(c.revenue_usd ?? 0),
    };
  });

  const week0 = startOfWeek(Date.now());
  const city = listing?.city || "dallas";
  const { data: cityListings } = await sb
    .from("listings")
    .select("id")
    .eq("city", city)
    .eq("approved", true)
    .eq("banned", false);
  const cityIds = (cityListings ?? []).map((l) => l.id);
  const { data: cityCodes } = await sb
    .from("redeem_codes")
    .select("restaurant_id, deal_id, deal_title, used_at")
    .eq("status", "used")
    .gte("used_at", new Date(week0).toISOString())
    .in("restaurant_id", cityIds.length ? cityIds : ["_"]);
  const cityScansThisWeek = cityCodes?.length ?? 0;
  const cityRestaurantsWithScans = new Set((cityCodes ?? []).map((c) => c.restaurant_id)).size;
  const cityDealCount = new Map<string, number>();
  for (const c of cityCodes ?? []) {
    const key = c.deal_title || c.deal_id;
    cityDealCount.set(key, (cityDealCount.get(key) ?? 0) + 1);
  }
  const cityTopDeal = [...cityDealCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const dealRows = (deals ?? []) as Record<string, unknown>[];
  const menuRows = (menu ?? []) as Record<string, unknown>[];
  const liveDeals = dealRows.filter(
    (d) => d.hidden !== true && d.active !== false && d.sold_out !== true,
  );
  const photos =
    dealRows.reduce((n, d) => n + ((d.image_urls as string[] | null)?.length ?? 0), 0) +
    menuRows.reduce((n, m) => n + ((m.image_urls as string[] | null)?.length ?? 0), 0);

  const insights = buildInsights({
    scans,
    deals: dealRows.map((d) => ({ id: String(d.id), title: String(d.title ?? "") })),
    listing: {
      hours: String(listing?.hours ?? ""),
      address: String(listing?.address ?? ""),
      story: String(listing?.story ?? ""),
      liveDeals: liveDeals.length,
      menuItems: menuRows.filter((m) => m.hidden !== true).length,
      photos,
      openStatus: String(listing?.open_status ?? "hours"),
      cuisine: String(listing?.cuisine ?? ""),
      typicalWeeklyTickets:
        listing?.typical_weekly_tickets == null
          ? null
          : Number(listing.typical_weekly_tickets),
    },
    cityScansThisWeek,
    cityRestaurantsWithScans,
    cityTopDeal,
  });

  return {
    listing: (listing as Record<string, unknown> | null) ?? null,
    deals: dealRows,
    menu: menuRows,
    insights: {
      ...insights,
      openStatus: String(listing?.open_status ?? "hours"),
      hours: String(listing?.hours ?? ""),
      typicalWeeklyTickets:
        listing?.typical_weekly_tickets == null
          ? null
          : Number(listing.typical_weekly_tickets),
      googleMapsUrl: String(listing?.google_maps_url ?? ""),
      dealsLive: dealRows.map((d) => ({
        id: String(d.id),
        title: String(d.title ?? ""),
        soldOut: Boolean(d.sold_out),
        active: d.active !== false,
      })),
      menuLive: menuRows.map((m) => ({
        id: String(m.id),
        name: String(m.name ?? ""),
        soldOut: Boolean(m.sold_out),
      })),
    },
  };
}
