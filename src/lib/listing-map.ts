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
  }[];
};

function asCity(v: string | null | undefined): CityId {
  if (
    v === "dallas" ||
    v === "kansas-city" ||
    v === "tulsa" ||
    v === "okc"
  ) {
    return v;
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
    }));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.id,
    city: asCity(row.city),
    neighborhood: row.neighborhood || seed?.neighborhood || "",
    cuisine: (row.cuisine as Cuisine) || seed?.cuisine || "other",
    tagline: row.tagline || seed?.tagline || "",
    story: (row.story && row.story.trim()) || seed?.story || "",
    hours: row.hours || seed?.hours || "",
    address: row.address || seed?.address || "",
    lat: row.lat ?? seed?.lat ?? 32.78,
    lng: row.lng ?? seed?.lng ?? -96.8,
    emoji: row.emoji || seed?.emoji || "🍽️",
    accent: row.accent || seed?.accent || "#f97316",
    plateRating: seed?.plateRating ?? 0,
    reviewCount: seed?.reviewCount ?? 0,
    deals: deals.length ? deals : seed?.deals ?? [],
    menu: menu.length ? menu : seed?.menu ?? [],
    acceptsReservations: seed?.acceptsReservations ?? false,
    acceptsOnlineOrders: seed?.acceptsOnlineOrders ?? true,
    approved: row.approved !== false && row.banned !== true,
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
