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
  supportEmail: "hello@gorditopass.local",
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

/** Menu item categories for partner dashboard */
export const MENU_CATEGORIES = [
  "Apps",
  "Mains",
  "Sides",
  "Pizza",
  "Wings",
  "Bowls",
  "Pasta",
  "Drinks",
  "Dessert",
  "Kids",
  "Specials",
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
    | { type: "favorites"; min: number };
}

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
];
