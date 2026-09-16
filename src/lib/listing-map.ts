import { RESTAURANTS } from "./data";
import type { CityId, Cuisine, Deal, MenuItem, Restaurant } from "./types";

export type LiveListingRow = {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  cuisine?: string | null;
  tagline?: string | null;
  story?: string | null;
  hours?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  emoji?: string | null;
  accent?: string | null;
  approved?: boolean;
  banned?: boolean;
  open_status?: string | null;
  deals?: {
    id: string;
    restaurant_id: string;
    title: string;
    description?: string | null;
    type?: string | null;
    value?: number | null;
    member_only?: boolean;
    excludes_alcohol?: boolean;
    active?: boolean;
    hidden?: boolean;
    status?: string | null;
    image_urls?: string[] | null;
    sold_out?: boolean | null;
  }[];
  menu?: {
    id: string;
    name: string;
    description?: string | null;
    price_usd?: number | null;
    category?: string | null;
    active?: boolean;
    hidden?: boolean;
    status?: string | null;
    image_urls?: string[] | null;
    sold_out?: boolean | null;
  }[];
};

export const CITY_CENTERS: Record<CityId, { lat: number; lng: number }> = {
  dallas: { lat: 32.7767, lng: -96.797 },
  tulsa: { lat: 36.154, lng: -95.9928 },
  "kansas-city": { lat: 39.0997, lng: -94.5786 },
  okc: { lat: 35.4676, lng: -97.5164 },
};

/** Map free-text city (apply form, CRM, listings) onto a CityId. */
export function asCity(v: string | null | undefined): CityId {
  const s = (v ?? "").toLowerCase().trim();
  if (!s) return "dallas";
  // Tulsa before Oklahoma so "Tulsa, Oklahoma" does not become OKC.
  if (s === "tulsa" || s.includes("tulsa")) return "tulsa";
  if (s === "kansas-city" || s.includes("kansas")) return "kansas-city";
  if (
    s === "okc" ||
    s.includes("oklahoma city") ||
    s === "oklahoma" ||
    (s.includes("oklahoma") && !s.includes("tulsa"))
  ) {
    return "okc";
  }
  if (
    s === "dallas" ||
    s.includes("dallas") ||
    s.includes("fort worth") ||
    s.includes("dfw")
  ) {
    return "dallas";
  }
  return "dallas";
}

export function mapListing(row: LiveListingRow, seed?: Restaurant): Restaurant {
  const deals: Deal[] = (row.deals ?? [])
    .filter(
      (d) =>
        d.hidden !== true &&
        d.active !== false &&
        (d.status == null || d.status === "approved"),
    )
    .map((d) => ({
      id: d.id,
      restaurantId: d.restaurant_id || row.id,
      title: d.title,
      description: d.description ?? "",
      type: (d.type as Deal["type"]) || "free_item",
      value: d.value == null ? null : Number(d.value),
      memberOnly: d.member_only !== false,
      excludesAlcohol: d.excludes_alcohol !== false,
      active: true,
      imageUrl: d.image_urls?.[0],
      soldOut: d.sold_out === true,
    }));
  const menu: MenuItem[] = (row.menu ?? [])
    .filter(
      (m) =>
        m.hidden !== true &&
        m.active !== false &&
        (m.status == null || m.status === "approved"),
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      priceUsd: Number(m.price_usd ?? 0),
      category: m.category ?? "Mains",
      imageUrl: m.image_urls?.[0],
      soldOut: m.sold_out === true,
    }));
  const city = asCity(row.city);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.id,
    city,
    neighborhood: row.neighborhood || seed?.neighborhood || "",
    cuisine: (row.cuisine as Cuisine) || seed?.cuisine || "other",
    tagline: row.tagline || seed?.tagline || "",
    story: (row.story && row.story.trim()) || seed?.story || "",
    hours: row.hours || seed?.hours || "",
    address: row.address || seed?.address || "",
    lat: row.lat ?? seed?.lat ?? CITY_CENTERS[city].lat,
    lng: row.lng ?? seed?.lng ?? CITY_CENTERS[city].lng,
    emoji: row.emoji || seed?.emoji || "🍽️",
    accent: row.accent || seed?.accent || "#f97316",
    plateRating: seed?.plateRating ?? 0,
    reviewCount: seed?.reviewCount ?? 0,
    deals: deals.length ? deals : seed?.deals ?? [],
    menu: menu.length ? menu : seed?.menu ?? [],
    acceptsReservations: seed?.acceptsReservations ?? false,
    acceptsOnlineOrders: seed?.acceptsOnlineOrders ?? true,
    approved: row.approved !== false && row.banned !== true,
    openStatus:
      row.open_status === "open" || row.open_status === "closed"
        ? row.open_status
        : "hours",
  };
}

export function mergeCatalog(
  live: LiveListingRow[] | null,
  hiddenIds: string[] = [],
): Restaurant[] {
  const hidden = new Set(hiddenIds);
  const byId = new Map<string, Restaurant>();
  for (const r of RESTAURANTS) {
    if (hidden.has(r.id) || !r.approved) continue;
    byId.set(r.id, r);
  }
  if (!live) return [...byId.values()];
  for (const row of live) {
    if (row.banned || row.approved === false) {
      byId.delete(row.id);
      continue;
    }
    const seed = RESTAURANTS.find((r) => r.id === row.id);
    byId.set(row.id, mapListing(row, seed));
  }
  return [...byId.values()];
}
