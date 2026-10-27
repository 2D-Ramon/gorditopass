import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/data";
import { isLiveListing } from "@/lib/listing-status";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

/**
 * Heart Favorites ("♡ Favorite"), stored in member_loved_restaurants.
 * Separate from Will try (/api/me/favorite, member_favorites): no points, no badges.
 */
const TABLE = "member_loved_restaurants";
const MISSING =
  "Could not save favorite. Run supabase/migrations/20261026000000_member_loved_restaurants.sql in Supabase.";

async function list(memberId: string) {
  const { data, error } = await createOpsClient()
    .from(TABLE)
    .select("restaurant_id")
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });
  if (error) return null;
  return (data ?? []).map((r) => String(r.restaurant_id));
}

function ids(body: unknown): string[] {
  const b = body as { restaurantId?: unknown; restaurantIds?: unknown } | null;
  const raw = Array.isArray(b?.restaurantIds) ? b.restaurantIds : [b?.restaurantId];
  return [...new Set(raw.map((x) => String(x ?? "").trim()).filter(Boolean))].slice(0, 200);
}

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const loved = await list(profile.id);
  if (!loved) return NextResponse.json({ error: MISSING }, { status: 500 });
  return NextResponse.json({ loved });
}

/** Add one ({restaurantId}) or many ({restaurantIds}, used to merge local hearts on login). */
export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const wanted = ids(await req.json().catch(() => null));
  if (!wanted.length) return NextResponse.json({ error: "Missing restaurant." }, { status: 400 });
  const sb = createOpsClient();
  const { data: rows } = await sb
    .from("listings")
    .select("id, approved, banned, tagline")
    .in("id", wanted);
  const found = new Map((rows ?? []).map((r) => [String(r.id), r]));
  const ok: string[] = [];
  for (const id of wanted) {
    const row = found.get(id);
    if (row) {
      if (isLiveListing(row)) ok.push(id);
      continue;
    }
    const seed = getRestaurant(id);
    if (!seed) continue;
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
    ok.push(id);
  }
  if (!ok.length && wanted.length === 1) {
    return NextResponse.json({ error: "This restaurant is not available." }, { status: 404 });
  }
  if (ok.length) {
    const { error } = await sb.from(TABLE).upsert(
      ok.map((restaurant_id) => ({ member_id: profile.id, restaurant_id })),
      { onConflict: "member_id,restaurant_id", ignoreDuplicates: true },
    );
    if (error) return NextResponse.json({ error: MISSING }, { status: 500 });
  }
  return NextResponse.json({ loved: (await list(profile.id)) ?? [] });
}

/** Remove: DELETE /api/me/loved?restaurantId=… */
export async function DELETE(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const restaurantId = (new URL(req.url).searchParams.get("restaurantId") ?? "").trim();
  if (!restaurantId) return NextResponse.json({ error: "Missing restaurant." }, { status: 400 });
  const { error } = await createOpsClient()
    .from(TABLE)
    .delete()
    .eq("member_id", profile.id)
    .eq("restaurant_id", restaurantId);
  if (error) return NextResponse.json({ error: MISSING }, { status: 500 });
  return NextResponse.json({ loved: (await list(profile.id)) ?? [] });
}
