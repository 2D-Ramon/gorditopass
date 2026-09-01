import type { MembershipPlan } from "./types";

export const MAX_FAMILY_SEATS = 6;

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    priceUsd: 7,
    months: 1,
    cityScope: "all",
    blurb: "",
    bullets: ["Cancel anytime."],
  },
  {
    id: "six_month",
    name: "6 months",
    priceUsd: 36,
    months: 6,
    cityScope: "all",
    blurb: "",
    bullets: ["Cancel anytime."],
  },
  {
    id: "annual",
    name: "Annual",
    priceUsd: 60,
    months: 12,
    cityScope: "all",
    blurb: "",
    bullets: ["Cancel anytime.", "Best value."],
  },
];

/** Effective monthly rate for display (e.g. $6/mo on 6-month plan). */
export function monthlyRate(plan: MembershipPlan): number {
  return plan.priceUsd / plan.months;
}

export function pricePerPerson(planId: string, seats: number): number {
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  if (!plan) return 0;
  return plan.priceUsd * Math.min(Math.max(seats, 1), MAX_FAMILY_SEATS);
}

export const PLATFORM = {
  name: "GorditoPass",
  tagline: "Local plates. Member deals. More flavor for less.",
  mission:
    "Exclusive member savings at local spots you love—browse free, redeem deals, track what you save, and discover what’s cooking in your city.",
  supportEmail: "tudyvaldez@gmail.com",
  firstCity: "Dallas",
  earlyCapDiners: 50,
  earlyCapBusinesses: 50,
} as const;

/**
 * Custom point values per member action.
 * Change any number here to rebalance the rewards economy.
 */
export const POINT_ACTIONS = {
  redeem: { points: 10, label: "Redeem a deal" },
  first_redeem: { points: 25, label: "First redeem bonus" },
  review: { points: 15, label: "Rate the plate / review" },
  feed_post: { points: 10, label: "Post in city feed" },
  favorite: { points: 5, label: "Favorite a restaurant" },
  order: { points: 10, label: "Place an online order" },
  profile_complete: { points: 20, label: "Complete your profile" },
  join_member: { points: 50, label: "Activate membership" },
  passport_complete: { points: 40, label: "Complete a cuisine passport" },
  referral_referrer: { points: 40, label: "Referral reward (you referred)" },
  referral_friend: { points: 40, label: "Referral welcome bonus" },
} as const;

/** Referral program defaults (member → member) */
export const REFERRAL = {
  /** Points to referrer when friend activates membership */
  referrerPoints: 40,
  /** Points to referred friend on first membership */
  friendPoints: 40,
} as const;

/** Partner staff cash bonus when they enroll a new customer membership */
export const STAFF_MEMBERSHIP_REFERRAL = {
  amountUsd: 5,
  label: "Staff membership referral",
  /** Demo: checks cut once per calendar month */
  checkCadence: "monthly" as const,
} as const;

export type PointActionId = keyof typeof POINT_ACTIONS;

/** Member rewards (points) */
export const REWARDS = {
  /** @deprecated use POINT_ACTIONS.redeem.points */
  pointsPerRedeem: POINT_ACTIONS.redeem.points,
  /** Points needed for one free-item reward */
  pointsPerReward: 100,
  rewardLabel: "Free item reward",
  actions: POINT_ACTIONS,
} as const;

/** Sort labels A–Z; keep "Other" last when present */
function alphaOptions<T extends { id: string; label: string }>(items: T[]): T[] {
  const other = items.filter((i) => i.id === "other" || i.label === "Other");
  const rest = items
    .filter((i) => i.id !== "other" && i.label !== "Other")
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return [...rest, ...other];
}

/** Menu item categories for partner dashboard (alpha, Other last) */
export const MENU_CATEGORIES = [
  "Apps",
  "Bowls",
  "Dessert",
  "Drinks",
  "Kids",
  "Mains",
  "Pasta",
  "Pizza",
  "Sides",
  "Specials",
  "Wings",
  "Other",
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

/** Achievement badges (gamification) */
export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Lifetime points threshold, or custom rule key handled in store */
  rule:
    | { type: "redemptions"; min: number }
    | { type: "reviews"; min: number }
    | { type: "feed_posts"; min: number }
    | { type: "lifetime_points"; min: number }
    | { type: "savings_ytd"; min: number }
    | { type: "rewards_claimed"; min: number }
    | { type: "household"; min: number }
    | { type: "favorites"; min: number }
    | { type: "referrals"; min: number };
}

/** Business type options on partner apply (alphabetical, Other last) */
export const BUSINESS_TYPES: { id: string; label: string }[] = alphaOptions([
  { id: "bakery", label: "Bakery" },
  { id: "bar", label: "Bar" },
  { id: "brewery", label: "Brewery" },
  { id: "candy_store", label: "Candy store" },
  { id: "catering", label: "Catering" },
  { id: "coffee_shop", label: "Coffee shop" },
  { id: "event_center", label: "Event center" },
  { id: "fast_food", label: "Fast food" },
  { id: "food_truck", label: "Food truck" },
  { id: "grocery", label: "Grocery store" },
  { id: "home_plates", label: "Home plates / home kitchen" },
  { id: "ice_cream", label: "Ice cream shop" },
  { id: "movie_theater", label: "Movie theater" },
  { id: "restaurant", label: "Restaurant" },
  { id: "snow_cone", label: "Snow cone stand" },
  { id: "tea_shop", label: "Tea shop" },
  { id: "zoo", label: "Zoo" },
  { id: "other", label: "Other" },
]);

export const OWNERSHIP_TYPES: { id: string; label: string }[] = alphaOptions([
  { id: "chain", label: "Chain" },
  { id: "co_op", label: "Co-op / collective" },
  { id: "family_owned", label: "Family owned" },
  { id: "franchise", label: "Franchise" },
  { id: "independently_owned", label: "Independently owned" },
  { id: "other", label: "Other" },
]);

/** Shared reaction emoji set (feed + chat) */
export const REACTION_EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "👏"] as const;

/** Placeholder claimable rewards (claim flow later) */
export const REWARD_CATALOG = [
  {
    id: "rw-free-fries",
    name: "Free fries voucher",
    description: "Redeem at participating partners (placeholder).",
    pointsCost: 100,
    emoji: "🍟",
    placeholder: true,
  },
  {
    id: "rw-drink",
    name: "Free soft drink",
    description: "One complimentary fountain drink (placeholder).",
    pointsCost: 80,
    emoji: "🥤",
    placeholder: true,
  },
  {
    id: "rw-dessert",
    name: "Free dessert bite",
    description: "Sweet treat on us (placeholder).",
    pointsCost: 120,
    emoji: "🍰",
    placeholder: true,
  },
  {
    id: "rw-app",
    name: "Free appetizer credit",
    description: "Toward a partner app plate (placeholder).",
    pointsCost: 150,
    emoji: "🥗",
    placeholder: true,
  },
  {
    id: "rw-swag",
    name: "GorditoPass sticker pack",
    description: "Merch drop placeholder.",
    pointsCost: 60,
    emoji: "✨",
    placeholder: true,
  },
  {
    id: "rw-entry",
    name: "Member raffle entry",
    description: "Monthly prize drawing entry (placeholder).",
    pointsCost: 50,
    emoji: "🎟️",
    placeholder: true,
  },
] as const;

export const BADGES: BadgeDef[] = [
  {
    id: "first_bite",
    name: "First Bite",
    description: "Redeem your first deal",
    emoji: "🌮",
    rule: { type: "redemptions", min: 1 },
  },
  {
    id: "regular",
    name: "Regular",
    description: "Redeem 5 deals",
    emoji: "🔥",
    rule: { type: "redemptions", min: 5 },
  },
  {
    id: "super_regular",
    name: "Super Regular",
    description: "Redeem 15 deals",
    emoji: "🏆",
    rule: { type: "redemptions", min: 15 },
  },
  {
    id: "critic",
    name: "Plate Critic",
    description: "Leave 3 plate reviews",
    emoji: "⭐",
    rule: { type: "reviews", min: 3 },
  },
  {
    id: "social",
    name: "City Voice",
    description: "Post in the city feed",
    emoji: "💬",
    rule: { type: "feed_posts", min: 1 },
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Earn 100 lifetime points",
    emoji: "💯",
    rule: { type: "lifetime_points", min: 100 },
  },
  {
    id: "big_saver",
    name: "Big Saver",
    description: "Save $50 YTD with deals",
    emoji: "💰",
    rule: { type: "savings_ytd", min: 50 },
  },
  {
    id: "collector",
    name: "Reward Collector",
    description: "Claim a free-item reward",
    emoji: "🎁",
    rule: { type: "rewards_claimed", min: 1 },
  },
  {
    id: "host",
    name: "Table Host",
    description: "Add family / friends seats",
    emoji: "👨‍👩‍👧‍👦",
    rule: { type: "household", min: 2 },
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Favorite 3 restaurants",
    emoji: "🗺️",
    rule: { type: "favorites", min: 3 },
  },
  {
    id: "plus_one",
    name: "Plus One",
    description: "A friend joins with your referral code",
    emoji: "🤝",
    rule: { type: "referrals", min: 1 },
  },
];

export function makeReferralCode(name: string): string {
  const slug = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase();
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GP-${slug || "FOOD"}${tail}`;
}
