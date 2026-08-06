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

/** Member rewards (points) */
export const REWARDS = {
  pointsPerRedeem: 10,
  /** Points needed for one free-item reward */
  pointsPerReward: 100,
  rewardLabel: "Free item reward",
} as const;
