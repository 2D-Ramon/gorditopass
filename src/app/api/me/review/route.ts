import { NextResponse } from "next/server";
import { POINT_ACTIONS } from "@/lib/pricing";
import { addPoints, userFromRequest } from "@/lib/market";
import { recomputeMember, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (profile.role === "restaurant") {
    return NextResponse.json(
      { error: "Restaurants cannot submit plate ratings." },
      { status: 403 },
    );
  }
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: string;
    plates?: number;
    text?: string;
    fromFeed?: boolean;
    menuItemId?: string;
    menuItemName?: string;
    dealId?: string;
    dealTitle?: string;
    cuisine?: string;
  } | null;
  const restaurantId = String(body?.restaurantId ?? "").trim();
  const plates = Math.min(5, Math.max(1, Math.round(Number(body?.plates) || 5)));
  if (!restaurantId) {
    return NextResponse.json({ error: "Pick a restaurant." }, { status: 400 });
  }
  const sb = createOpsClient();
  const author =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email;
  const { error } = await sb.from("plate_reviews").insert({
    member_id: profile.id,
    restaurant_id: restaurantId,
    author,
    plates,
    body: String(body?.text ?? "").trim() || "Rated the plate.",
    from_feed: Boolean(body?.fromFeed),
    menu_item_id: body?.menuItemId || null,
    menu_item_name: body?.menuItemName || null,
    deal_id: body?.dealId || null,
    deal_title: body?.dealTitle || null,
    cuisine: body?.cuisine || null,
  });
  if (error) {
    return NextResponse.json(
      { error: "Could not save review. Run member_activity.sql in Supabase." },
      { status: 500 },
    );
  }
  if (body?.fromFeed) {
    await sb.from("city_posts").insert({
      member_id: profile.id,
      city: profile.city || "dallas",
      title: `Rated ${restaurantId}`,
      body: String(body?.text ?? "").trim() || "Rated the plate.",
      restaurant_id: restaurantId,
      plates,
    });
  }
  const pts = body?.fromFeed
    ? POINT_ACTIONS.feed_post.points
    : POINT_ACTIONS.review.points;
  const note = body?.fromFeed
    ? POINT_ACTIONS.feed_post.label
    : POINT_ACTIONS.review.label;
  await addPoints(profile.id, pts, note);
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json(bundle);
}
