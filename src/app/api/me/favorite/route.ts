import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/data";
import { isLiveListing } from "@/lib/listing-status";
import { POINT_ACTIONS } from "@/lib/pricing";
import { addPoints, userFromRequest } from "@/lib/market";
import { recomputeMember, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: string;
  } | null;
  const restaurantId = String(body?.restaurantId ?? "").trim();
  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurant." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { data: existing } = await sb
    .from("member_favorites")
    .select("restaurant_id")
    .eq("member_id", profile.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (existing) {
    await sb
      .from("member_favorites")
      .delete()
      .eq("member_id", profile.id)
      .eq("restaurant_id", restaurantId);
  } else {
    const { data: existing } = await sb
      .from("listings")
      .select("approved, banned, tagline")
      .eq("id", restaurantId)
      .maybeSingle();
    if (existing && !isLiveListing(existing)) {
      return NextResponse.json(
        { error: "This restaurant is not available." },
        { status: 404 },
      );
    }
    const seed = getRestaurant(restaurantId);
    if (seed && !existing) {
      await sb.from("listings").upsert(
        {
          id: seed.id,
          name: seed.name,
          slug: seed.slug,
          city: seed.city,
          neighborhood: seed.neighborhood,
          cuisine: seed.cuisine,
          tagline: seed.tagline,
          story: seed.story,
          hours: seed.hours,
          address: seed.address,
          lat: seed.lat,
          lng: seed.lng,
          emoji: seed.emoji,
          accent: seed.accent,
          approved: true,
          banned: false,
        },
        { onConflict: "id" },
      );
    }
    const { error } = await sb.from("member_favorites").insert({
      member_id: profile.id,
      restaurant_id: restaurantId,
    });
    if (error) {
      return NextResponse.json(
        { error: "Could not save favorite. Run member_activity.sql in Supabase." },
        { status: 500 },
      );
    }
    await addPoints(profile.id, POINT_ACTIONS.favorite.points, POINT_ACTIONS.favorite.label);
  }
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json(bundle);
}
