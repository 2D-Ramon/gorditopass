import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/data";
import { isLiveListing } from "@/lib/listing-status";
import { userFromRequest } from "@/lib/market";
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
    // Only real listings (incl. seeded test listings); never write listings here.
    const { data: listing } = await sb
      .from("listings")
      .select("approved, banned, tagline")
      .eq("id", restaurantId)
      .maybeSingle();
    if (!listing) {
      return getRestaurant(restaurantId)
        ? NextResponse.json(
            { error: "This restaurant can't be saved yet.", code: "not_listed" },
            { status: 422 },
          )
        : NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }
    if (!isLiveListing(listing)) {
      return NextResponse.json(
        { error: "This restaurant is not available.", code: "not_live" },
        { status: 422 },
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
  }
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json(bundle);
}
