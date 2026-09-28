import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asCity, CITY_CENTERS } from "@/lib/listing-map";
import { DELETED_LISTING_TAGLINE } from "@/lib/listing-status";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};
  if (typeof body?.approved === "boolean") patch.approved = body.approved;
  if (typeof body?.banned === "boolean") patch.banned = body.banned;
  if (typeof body?.hidden === "boolean") patch.hidden = body.hidden;
  if (typeof body?.city === "string" && body.city.trim()) {
    const city = asCity(body.city);
    patch.city = city;
    if (body.lat == null && body.lng == null) {
      patch.lat = CITY_CENTERS[city].lat;
      patch.lng = CITY_CENTERS[city].lng;
    }
  }
  if (typeof body?.lat === "number") patch.lat = body.lat;
  if (typeof body?.lng === "number") patch.lng = body.lng;
  if (Object.keys(patch).length === 0) {
    return jsonError("Nothing to update.");
  }
  const { error } = await gate.supabase.from("listings").update(patch).eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

async function wipe(
  sb: SupabaseClient,
  table: string,
  column: string,
  value: string,
) {
  await sb.from(table).delete().eq(column, value);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const sb = gate.supabase;
  const { data: listing, error: readErr } = await sb
    .from("listings")
    .select("id, name, owner_email, tagline")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return jsonError(readErr.message, 500);
  if (!listing || listing.tagline === DELETED_LISTING_TAGLINE) {
    return jsonError("Restaurant not found.", 404);
  }

  const owner = String(listing.owner_email ?? "").trim().toLowerCase();
  const { data: reviews } = await sb
    .from("plate_reviews")
    .select("id")
    .eq("restaurant_id", id);
  const reviewIds = (reviews ?? []).map((r) => r.id).filter(Boolean);
  if (reviewIds.length) {
    await sb.from("plate_review_replies").delete().in("review_id", reviewIds);
  }
  await wipe(sb, "plate_review_replies", "restaurant_id", id);
  await wipe(sb, "plate_reviews", "restaurant_id", id);
  await wipe(sb, "redeem_codes", "restaurant_id", id);
  await wipe(sb, "city_posts", "restaurant_id", id);
  await wipe(sb, "partner_applications", "listing_id", id);
  if (owner) {
    await sb.from("partner_applications").delete().eq("email", owner);
    await sb.from("business_accounts").delete().eq("contact_email", owner);
  }
  const unbound = await sb
    .from("profiles")
    .update({ restaurant_id: null, staff_role: null, role: "diner" })
    .eq("restaurant_id", id)
    .eq("role", "restaurant");
  if (unbound.error) {
    await sb
      .from("profiles")
      .update({ restaurant_id: null, staff_role: null })
      .eq("restaurant_id", id);
  }

  for (const table of [
    "listing_deals",
    "listing_menu",
    "listing_events",
    "listing_jobs",
    "listing_staff",
    "listing_messages",
    "redeem_reports",
    "partner_digests",
    "member_favorites",
  ]) {
    await wipe(sb, table, "restaurant_id", id);
  }

  const tombstone = {
    name: "Removed",
    slug: "deleted",
    tagline: DELETED_LISTING_TAGLINE,
    story: "",
    hours: "",
    address: "",
    neighborhood: "",
    cuisine: "",
    emoji: "",
    owner_email: null,
    approved: false,
    banned: true,
    open_status: "closed",
    google_maps_url: null,
    typical_weekly_tickets: null,
  };
  let { error } = await sb.from("listings").update(tombstone).eq("id", id);
  if (error) {
    const { open_status, google_maps_url, typical_weekly_tickets, ...base } = tombstone;
    void open_status;
    void google_maps_url;
    void typical_weekly_tickets;
    ({ error } = await sb.from("listings").update(base).eq("id", id));
  }
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
