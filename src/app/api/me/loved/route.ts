import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/data";
import { isLiveListing } from "@/lib/listing-status";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

/**
 * Heart Favorites ("♡ Favorite"), stored in member_loved_restaurants.
 * Separate from Will try (/api/me/favorite, member_favorites): no points, no badges.
 * Never writes to listings: only ids that already exist as live listings are accepted.
 */
const TABLE = "member_loved_restaurants";

type DbError = { code?: string; message?: string } | null;

/** Table not created yet (migration not applied). */
function isMissingTable(error: DbError) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /member_loved_restaurants/i.test(error.message ?? "") &&
      /does not exist|could not find/i.test(error.message ?? "")
  );
}

function dbError(error: DbError) {
  if (isMissingTable(error)) {
    return NextResponse.json(
      {
        error: "Favorites are not available yet.",
        code: "favorites_unavailable",
        detail: "member_loved_restaurants is missing; apply supabase/migrations/20261026000000_member_loved_restaurants.sql.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Could not update favorites." }, { status: 500 });
}

const unauthorized = () =>
  NextResponse.json({ error: "Sign in required." }, { status: 401 });

async function list(memberId: string) {
  const { data, error } = await createOpsClient()
    .from(TABLE)
    .select("restaurant_id")
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });
  return { loved: (data ?? []).map((r) => String(r.restaurant_id)), error: error as DbError };
}

function ids(body: unknown): string[] {
  const b = body as { restaurantId?: unknown; restaurantIds?: unknown } | null;
  const raw = Array.isArray(b?.restaurantIds) ? b.restaurantIds : [b?.restaurantId];
  return [...new Set(raw.map((x) => String(x ?? "").trim()).filter(Boolean))].slice(0, 200);
}

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return unauthorized();
  const { loved, error } = await list(profile.id);
  if (error) return dbError(error);
  return NextResponse.json({ loved });
}

/**
 * Add one ({restaurantId}) or many ({restaurantIds}, merge of local hearts on login).
 * Single add: 404 if unknown, 422 if it is a seed-catalog restaurant not yet in the DB
 * or not live. Bulk: unusable ids are skipped and returned in `skipped`.
 */
export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return unauthorized();
  const wanted = ids(await req.json().catch(() => null));
  if (!wanted.length) return NextResponse.json({ error: "Missing restaurant." }, { status: 400 });

  const sb = createOpsClient();
  const { data: rows, error: lErr } = await sb
    .from("listings")
    .select("id, approved, banned, tagline")
    .in("id", wanted);
  if (lErr) return NextResponse.json({ error: "Could not check restaurants." }, { status: 500 });
  const found = new Map((rows ?? []).map((r) => [String(r.id), r]));

  const ok: string[] = [];
  const skipped: { id: string; reason: "unknown" | "not_listed" | "not_live" }[] = [];
  for (const id of wanted) {
    const row = found.get(id);
    if (row) {
      if (isLiveListing(row)) ok.push(id);
      else skipped.push({ id, reason: "not_live" });
    } else {
      skipped.push({ id, reason: getRestaurant(id) ? "not_listed" : "unknown" });
    }
  }

  if (wanted.length === 1 && !ok.length) {
    const reason = skipped[0]?.reason;
    return reason === "unknown"
      ? NextResponse.json({ error: "Restaurant not found." }, { status: 404 })
      : NextResponse.json(
          { error: "This restaurant can't be favorited yet.", code: reason },
          { status: 422 },
        );
  }

  if (ok.length) {
    const { error } = await sb.from(TABLE).upsert(
      ok.map((restaurant_id) => ({ member_id: profile.id, restaurant_id })),
      { onConflict: "member_id,restaurant_id", ignoreDuplicates: true },
    );
    if (error) return dbError(error as DbError);
  }
  const { loved, error } = await list(profile.id);
  if (error) return dbError(error);
  return NextResponse.json({ loved, skipped });
}

/** Remove: DELETE /api/me/loved?restaurantId=… */
export async function DELETE(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) return unauthorized();
  const restaurantId = (new URL(req.url).searchParams.get("restaurantId") ?? "").trim();
  if (!restaurantId) return NextResponse.json({ error: "Missing restaurant." }, { status: 400 });
  const { error: dErr } = await createOpsClient()
    .from(TABLE)
    .delete()
    .eq("member_id", profile.id)
    .eq("restaurant_id", restaurantId);
  if (dErr) return dbError(dErr as DbError);
  const { loved, error } = await list(profile.id);
  if (error) return dbError(error);
  return NextResponse.json({ loved });
}
