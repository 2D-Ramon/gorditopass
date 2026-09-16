import { NextResponse } from "next/server";
import { asCity, CITY_CENTERS } from "@/lib/listing-map";
import { jsonError, withOps } from "../../../_util";

type Ctx = { params: Promise<{ id: string }> };

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_applications");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const { data: app, error } = await gate.supabase
    .from("partner_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !app) return jsonError("Application not found.", 404);
  const listingId = slugify(app.name) || `biz-${id.slice(0, 8)}`;
  const payload = (app.payload ?? {}) as Record<string, unknown>;
  const cuisine = String(
    payload.cuisine ||
      payload.primaryCuisine ||
      (Array.isArray(payload.concepts) &&
        (payload.concepts[0] as { cuisineOrTheme?: string } | undefined)
          ?.cuisineOrTheme) ||
      "other",
  );
  const city = asCity(String(app.city || payload.city || "dallas"));
  const center = CITY_CENTERS[city];
  const { error: listingErr } = await gate.supabase.from("listings").upsert({
    id: listingId,
    name: app.name,
    slug: listingId,
    city,
    address: app.address,
    cuisine,
    approved: true,
    banned: false,
    owner_email: app.email,
    tagline: app.promo || "Local partner",
    story: "",
    emoji: "🍽️",
    accent: "#f97316",
    lat: center.lat,
    lng: center.lng,
  });
  if (listingErr) return jsonError(listingErr.message, 500);
  const { error: appErr } = await gate.supabase
    .from("partner_applications")
    .update({ status: "approved", listing_id: listingId })
    .eq("id", id);
  if (appErr) return jsonError(appErr.message, 500);
  await gate.supabase
    .from("business_accounts")
    .update({ status: "live" })
    .eq("contact_email", app.email);
  await gate.supabase
    .from("profiles")
    .update({ restaurant_id: listingId, role: "restaurant", staff_role: "owner" })
    .eq("email", String(app.email).toLowerCase());
  await gate.supabase.from("listing_staff").upsert(
    {
      restaurant_id: listingId,
      email: String(app.email).toLowerCase(),
      name: app.contact_name || app.name,
      staff_role: "owner",
      active: true,
    },
    { onConflict: "restaurant_id,email" },
  );
  return NextResponse.json({ ok: true, listingId });
}
