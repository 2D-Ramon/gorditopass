import { BADGES, POINT_ACTIONS, REWARDS } from "./pricing";
import { PASSPORTS } from "./passports";
import {
  loadProfile,
  profileToUser,
  type ProfileRow,
} from "./market";
import { createOpsClient } from "./supabase";
import type {
  LiveMemberBundle,
  MemberSeatProfile,
  Redemption,
  Review,
  RewardEvent,
} from "./types";

export type { LiveMemberBundle };

async function rows<T>(
  q: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export type MemberStats = {
  redemptions: number;
  reviews: number;
  feed_posts: number;
  lifetime_points: number;
  savings_ytd: number;
  rewards_claimed: number;
  household: number;
  favorites: number;
};

function ytdStartIso() {
  return `${new Date().getFullYear()}-01-01T00:00:00.000Z`;
}

export async function loadMemberStats(memberId: string): Promise<MemberStats> {
  const sb = createOpsClient();
  const p = await loadProfile(memberId);
  const [reds, reviews, posts, favs, seats] = await Promise.all([
    rows<{ savings_usd: number | null; used_at: string | null }>(
      sb
        .from("redeem_codes")
        .select("savings_usd, used_at")
        .eq("member_id", memberId)
        .eq("status", "used"),
    ),
    rows<{ id: string }>(
      sb.from("plate_reviews").select("id").eq("member_id", memberId),
    ),
    rows<{ id: string }>(
      sb.from("city_posts").select("id").eq("member_id", memberId),
    ),
    rows<{ restaurant_id: string }>(
      sb.from("member_favorites").select("restaurant_id").eq("member_id", memberId),
    ),
    rows<{ id: string }>(
      sb.from("household_seats").select("id").eq("primary_member_id", memberId),
    ),
  ]);
  const ytd = ytdStartIso();
  const savingsYtd = reds
    .filter((r) => !r.used_at || r.used_at >= ytd)
    .reduce((s, r) => s + Number(r.savings_usd ?? 0), 0);
  return {
    redemptions: reds.length,
    reviews: reviews.length,
    feed_posts: posts.length,
    lifetime_points: p?.reward_points_lifetime ?? 0,
    savings_ytd: savingsYtd,
    rewards_claimed: p?.rewards_claimed ?? 0,
    household: Math.max(p?.family_seats ?? 1, seats.length || 1),
    favorites: favs.length,
  };
}

export async function recomputeMember(memberId: string): Promise<string[]> {
  const sb = createOpsClient();
  const p = await loadProfile(memberId);
  if (!p) return [];
  const stats = await loadMemberStats(memberId);
  const have = new Set(p.badges ?? []);
  const newly: string[] = [];
  for (const b of BADGES) {
    if (have.has(b.id)) continue;
    const r = b.rule;
    let ok = false;
    if (r.type === "redemptions") ok = stats.redemptions >= r.min;
    else if (r.type === "reviews") ok = stats.reviews >= r.min;
    else if (r.type === "feed_posts") ok = stats.feed_posts >= r.min;
    else if (r.type === "lifetime_points") ok = stats.lifetime_points >= r.min;
    else if (r.type === "savings_ytd") ok = stats.savings_ytd >= r.min;
    else if (r.type === "rewards_claimed") ok = stats.rewards_claimed >= r.min;
    else if (r.type === "household") ok = stats.household >= r.min;
    else if (r.type === "favorites") ok = stats.favorites >= r.min;
    if (ok) {
      have.add(b.id);
      newly.push(b.id);
    }
  }

  const used = await rows<{ restaurant_id: string }>(
    sb
      .from("redeem_codes")
      .select("restaurant_id")
      .eq("member_id", memberId)
      .eq("status", "used"),
  );
  const visited = new Set(used.map((r) => r.restaurant_id));
  const listings = await rows<{ id: string; cuisine: string | null }>(
    sb
      .from("listings")
      .select("id, cuisine")
      .eq("approved", true)
      .eq("banned", false),
  );
  const completed = new Set(p.completed_passports ?? []);
  const claimed = new Set(p.passport_points_claimed ?? []);
  let passportPts = 0;
  for (const pass of PASSPORTS) {
    const ids = listings
      .filter((l) => pass.cuisineTags.includes((l.cuisine || "other") as never))
      .map((l) => l.id);
    if (ids.length === 0) continue;
    const allVisited = ids.every((id) => visited.has(id));
    const badgeId = `passport_${pass.id}`;
    if (allVisited) {
      completed.add(pass.id);
      if (!have.has(badgeId)) {
        have.add(badgeId);
        newly.push(badgeId);
      }
      if (!claimed.has(pass.id)) {
        claimed.add(pass.id);
        passportPts += pass.completePoints;
      }
    } else if (completed.has(pass.id)) {
      completed.delete(pass.id);
      have.delete(badgeId);
    }
  }

  const patch: Record<string, unknown> = { badges: Array.from(have) };
  patch.completed_passports = Array.from(completed);
  patch.passport_points_claimed = Array.from(claimed);
  if (passportPts > 0) {
    patch.reward_points = (p.reward_points ?? 0) + passportPts;
    patch.reward_points_lifetime = (p.reward_points_lifetime ?? 0) + passportPts;
    await sb.from("reward_ledger").insert({
      member_id: memberId,
      points: passportPts,
      note: POINT_ACTIONS.passport_complete.label,
    });
  }
  const { error } = await sb.from("profiles").update(patch).eq("id", memberId);
  if (error) return newly;
  return newly;
}

export async function memberSnapshot(
  profile: ProfileRow,
): Promise<LiveMemberBundle> {
  const sb = createOpsClient();
  const id = profile.id;
  const [favs, reds, revs, posts, seats, ledger] = await Promise.all([
    rows<{ restaurant_id: string }>(
      sb.from("member_favorites").select("restaurant_id").eq("member_id", id),
    ),
    rows<{
      deal_id: string;
      code: string;
      used_at: string | null;
      created_at: string;
      savings_usd: number | null;
      revenue_usd: number | null;
      restaurant_id: string;
      deal_title: string | null;
    }>(
      sb
        .from("redeem_codes")
        .select(
          "deal_id, code, used_at, created_at, savings_usd, revenue_usd, restaurant_id, deal_title",
        )
        .eq("member_id", id)
        .eq("status", "used")
        .order("used_at", { ascending: false }),
    ),
    rows<{
      id: string;
      restaurant_id: string;
      author: string | null;
      plates: number;
      body: string | null;
      created_at: string;
      from_feed: boolean;
      menu_item_id: string | null;
      menu_item_name: string | null;
      deal_id: string | null;
      deal_title: string | null;
      cuisine: string | null;
    }>(
      sb
        .from("plate_reviews")
        .select("*")
        .eq("member_id", id)
        .order("created_at", { ascending: false }),
    ),
    rows<{ id: string }>(
      sb.from("city_posts").select("id").eq("member_id", id),
    ),
    rows<{
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      birthday: string | null;
      home_address: string | null;
      is_primary: boolean;
    }>(
      sb
        .from("household_seats")
        .select("*")
        .eq("primary_member_id", id)
        .order("created_at", { ascending: true }),
    ),
    rows<{
      id: string;
      points: number;
      note: string | null;
      created_at: string;
    }>(
      sb
        .from("reward_ledger")
        .select("id, points, note, created_at")
        .eq("member_id", id)
        .order("created_at", { ascending: false })
        .limit(80),
    ),
  ]);

  const household: MemberSeatProfile[] = seats.map((s) => ({
    id: s.id,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    email: s.email,
    phone: s.phone ?? "",
    birthday: s.birthday ?? "",
    homeAddress: s.home_address ?? "",
    isPrimary: s.is_primary,
  }));

  const fresh = await loadProfile(id);
  const user = profileToUser(fresh ?? profile);
  user.feedPostCount = posts.length;
  user.householdMembers = household;
  user.completedPassports = (fresh ?? profile).completed_passports ?? [];
  user.passportPointsClaimed = (fresh ?? profile).passport_points_claimed ?? [];

  const ytd = ytdStartIso();
  const savingsYtd = reds
    .filter((r) => (r.used_at ?? r.created_at) >= ytd)
    .reduce((s, r) => s + Number(r.savings_usd ?? 0), 0);

  return {
    user,
    favorites: favs.map((f) => f.restaurant_id),
    redemptions: reds.map((r) => ({
      dealId: r.deal_id,
      code: r.code,
      at: r.used_at ?? r.created_at,
      savingsUsd: Number(r.savings_usd ?? 0),
      revenueUsd: Number(r.revenue_usd ?? 0),
      restaurantId: r.restaurant_id,
      restaurantName: r.deal_title ?? undefined,
    })),
    reviews: revs.map((r) => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      author: r.author ?? user.name,
      plates: r.plates,
      text: r.body ?? "",
      createdAt: r.created_at.slice(0, 10),
      fromFeed: r.from_feed,
      menuItemId: r.menu_item_id ?? undefined,
      menuItemName: r.menu_item_name ?? undefined,
      dealId: r.deal_id ?? undefined,
      dealTitle: r.deal_title ?? undefined,
      cuisine: r.cuisine ?? undefined,
    })),
    household,
    rewardHistory: ledger.map((l) => ({
      id: l.id,
      at: l.created_at,
      type: l.points < 0 ? "claim" : "earn",
      points: l.points,
      note: l.note ?? "",
    })),
    feedPostCount: posts.length,
    savingsYtd,
  };
}

export async function snapshotAfter(
  memberId: string,
  extra?: { newBadges?: string[] },
): Promise<LiveMemberBundle | null> {
  const p = await loadProfile(memberId);
  if (!p) return null;
  const bundle = await memberSnapshot(p);
  return { ...bundle, newBadges: extra?.newBadges };
}

export { REWARDS };
