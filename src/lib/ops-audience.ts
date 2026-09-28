import type { SupabaseClient } from "@supabase/supabase-js";
import { RESTAURANTS } from "./data";
import { DELETED_LISTING_TAGLINE } from "./listing-status";
import { isAccessCodeStore } from "./access-codes";
import { isRemovedFeedTombstone } from "./moderation";
import type { CampaignAudience, CampaignChannel } from "./ops-types";

export type CampaignTarget =
  | "all_members"
  | "city"
  | "restaurant"
  | "zip"
  | "cuisine"
  | "paused";

export type CampaignSpec = {
  target: CampaignTarget;
  city: string;
  restaurantId: string;
  zip: string;
  cuisine: string;
  sendOn: string;
  subject: string;
};

type Person = {
  member_id: string | null;
  business_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
};

const zipCache = new Map<string, { lat: number; lng: number } | null>();

export function packCampaign(spec: CampaignSpec, channel: CampaignChannel) {
  return {
    audience: spec.target === "paused" ? "businesses" : "all_members",
    subject: JSON.stringify({
      gp: 1,
      subject: channel === "email" ? spec.subject : "",
      target: spec.target,
      city: spec.city,
      restaurantId: spec.restaurantId,
      zip: spec.zip,
      cuisine: spec.cuisine,
      sendOn: spec.sendOn,
    }),
  };
}

export function unpackCampaign(row: {
  audience?: string | null;
  subject?: string | null;
}): CampaignSpec {
  const raw = String(row.subject ?? "");
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Partial<CampaignSpec> & { gp?: number };
      if (parsed.gp === 1 && parsed.target) {
        return {
          target: parsed.target,
          city: parsed.city ?? "",
          restaurantId: parsed.restaurantId ?? "",
          zip: parsed.zip ?? "",
          cuisine: parsed.cuisine ?? "",
          sendOn: parsed.sendOn ?? "",
          subject: parsed.subject ?? "",
        };
      }
    } catch {
      // Older campaigns stored a plain subject line.
    }
  }
  const audience = String(row.audience ?? "all_members");
  const target: CampaignTarget =
    audience === "businesses" ? "paused" : "all_members";
  return {
    target,
    city: "",
    restaurantId: "",
    zip: "",
    cuisine: "",
    sendOn: "",
    subject: raw,
  };
}

export function campaignTargetLabel(spec: CampaignSpec) {
  if (spec.target === "city") return `City · ${spec.city || "not set"}`;
  if (spec.target === "restaurant") return `Restaurant · ${spec.restaurantId || "not set"}`;
  if (spec.target === "zip") return `Within 10 miles of ${spec.zip || "ZIP"}`;
  if (spec.target === "cuisine") return `Restaurant type · ${spec.cuisine || "not set"}`;
  if (spec.target === "paused") return "Paused businesses";
  return "All members";
}

function optedIn(channel: CampaignChannel) {
  return channel === "email" ? "email_opt_in" : "sms_opt_in";
}

function skipEmail(email: string | null | undefined) {
  return isAccessCodeStore(email) || isRemovedFeedTombstone(email);
}

function miles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function zipPoint(zip: string) {
  const key = zip.slice(0, 5);
  if (zipCache.has(key)) return zipCache.get(key) ?? null;
  const res = await fetch(`https://api.zippopotam.us/us/${key}`);
  if (!res.ok) {
    zipCache.set(key, null);
    return null;
  }
  const data = (await res.json()) as {
    places?: { latitude: string; longitude: string }[];
  };
  const place = data.places?.[0];
  const point = place
    ? { lat: Number(place.latitude), lng: Number(place.longitude) }
    : null;
  zipCache.set(key, point);
  return point;
}

function zipInAddress(address: string | null | undefined) {
  const match = String(address ?? "").match(/\b(\d{5})(?:-\d{4})?\b/);
  return match?.[1] ?? "";
}

async function optedMembers(sb: SupabaseClient, channel: CampaignChannel) {
  const { data, error } = await sb
    .from("members")
    .select(
      "id, first_name, last_name, email, phone, city, home_address, email_opt_in, sms_opt_in",
    )
    .eq(optedIn(channel), true);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((m) => !skipEmail(m.email));
}

function toPerson(m: {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}): Person {
  return {
    member_id: m.id,
    business_id: null,
    name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "Member",
    email: m.email,
    phone: m.phone,
  };
}

function withChannel(rows: Person[], channel: CampaignChannel) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = channel === "email" ? row.email : row.phone;
    if (!key || seen.has(key.toLowerCase())) return false;
    seen.add(key.toLowerCase());
    return true;
  });
}

async function restaurantProfileEmails(sb: SupabaseClient, restaurantIds: Set<string>) {
  if (!restaurantIds.size) return new Set<string>();
  const [{ data: favs }, { data: redeems }, { data: profiles }] = await Promise.all([
    sb.from("member_favorites").select("member_id, restaurant_id"),
    sb.from("redeem_codes").select("member_id, restaurant_id").eq("status", "used"),
    sb.from("profiles").select("id, email").eq("role", "diner"),
  ]);
  const ids = new Set<string>();
  for (const row of [...(favs ?? []), ...(redeems ?? [])]) {
    if (restaurantIds.has(String(row.restaurant_id))) ids.add(String(row.member_id));
  }
  const emails = new Set<string>();
  for (const profile of profiles ?? []) {
    if (ids.has(profile.id) && profile.email) emails.add(String(profile.email).toLowerCase());
  }
  return emails;
}

export async function loadAudience(
  supabase: SupabaseClient,
  channel: CampaignChannel,
  audience: CampaignAudience,
  spec?: CampaignSpec,
): Promise<Person[]> {
  if (!spec) return loadLegacy(supabase, channel, audience);
  if (spec.target === "paused") return pausedBusinesses(supabase, channel);
  if (spec.target === "city" && !spec.city) return [];
  if (spec.target === "restaurant" && !spec.restaurantId) return [];
  if (spec.target === "cuisine" && !spec.cuisine) return [];
  if (spec.target === "zip" && !/^\d{5}$/.test(spec.zip)) return [];

  let members = await optedMembers(supabase, channel);
  if (spec.target === "city" && spec.city) {
    members = members.filter((m) => String(m.city ?? "") === spec.city);
  }
  if (spec.target === "restaurant" && spec.restaurantId) {
    const emails = await restaurantProfileEmails(supabase, new Set([spec.restaurantId]));
    members = members.filter((m) => emails.has(String(m.email ?? "").toLowerCase()));
  }
  if (spec.target === "cuisine" && spec.cuisine) {
    const ids = new Set(
      RESTAURANTS.filter((r) => r.cuisine === spec.cuisine).map((r) => r.id),
    );
    const { data: listings } = await supabase.from("listings").select("id, cuisine, tagline");
    for (const row of listings ?? []) {
      if (row.tagline === DELETED_LISTING_TAGLINE) continue;
      if (String(row.cuisine ?? "") === spec.cuisine) ids.add(String(row.id));
    }
    const emails = await restaurantProfileEmails(supabase, ids);
    members = members.filter((m) => emails.has(String(m.email ?? "").toLowerCase()));
  }
  if (spec.target === "zip" && spec.zip) {
    const origin = await zipPoint(spec.zip);
    if (!origin) throw new Error("That ZIP code could not be found.");
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, home_address")
      .eq("role", "diner");
    const addressByEmail = new Map<string, string>();
    for (const profile of profiles ?? []) {
      if (profile.email) addressByEmail.set(String(profile.email).toLowerCase(), String(profile.home_address ?? ""));
    }
    const kept: typeof members = [];
    for (const member of members) {
      const address =
        String(member.home_address ?? "") ||
        addressByEmail.get(String(member.email ?? "").toLowerCase()) ||
        "";
      const zip = zipInAddress(address);
      if (!zip) continue;
      const point = await zipPoint(zip);
      if (point && miles(origin, point) <= 10) kept.push(member);
    }
    members = kept;
  }
  return withChannel(members.map(toPerson), channel);
}

async function pausedBusinesses(sb: SupabaseClient, channel: CampaignChannel) {
  const [{ data: businesses }, { data: listings }] = await Promise.all([
    sb
      .from("business_accounts")
      .select("id, name, contact_email, contact_phone, status")
      .eq("status", "paused"),
    sb.from("listings").select("id, name, owner_email, approved, banned, tagline"),
  ]);
  const rows: Person[] = [];
  for (const business of businesses ?? []) {
    rows.push({
      member_id: null,
      business_id: business.id,
      name: business.name,
      email: business.contact_email,
      phone: business.contact_phone,
    });
  }
  for (const listing of listings ?? []) {
    if (listing.tagline === DELETED_LISTING_TAGLINE) continue;
    const paused = listing.approved === false || listing.banned === true;
    if (!paused || !listing.owner_email) continue;
    rows.push({
      member_id: null,
      business_id: null,
      name: listing.name,
      email: listing.owner_email,
      phone: null,
    });
  }
  return withChannel(rows, channel);
}

async function loadLegacy(
  supabase: SupabaseClient,
  channel: CampaignChannel,
  audience: CampaignAudience,
): Promise<Person[]> {
  if (audience === "businesses") return pausedBusinesses(supabase, channel);
  if (audience === "waitlist") {
    return loadAudience(supabase, channel, "all_members", {
      target: "all_members",
      city: "",
      restaurantId: "",
      zip: "",
      cuisine: "",
      sendOn: "",
      subject: "",
    });
  }
  return loadAudience(supabase, channel, audience, {
    target: "all_members",
    city: "",
    restaurantId: "",
    zip: "",
    cuisine: "",
    sendOn: "",
    subject: "",
  });
}
