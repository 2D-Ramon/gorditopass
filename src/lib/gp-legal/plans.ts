import { MEMBERSHIP_PLANS } from "@/lib/pricing";
import type { MembershipPlan, MembershipPlanId } from "@/lib/types";

/** Read-only view over pricing.ts for disclosure copy. No prices are hardcoded here. */
export type PlanDisclosure = {
  plan: MembershipPlan;
  price: string; // "$7"
  every: string; // "month" | "6 months" | "year"
  adverb: string; // "every month" ...
  renewalDate: Date;
  renewalDateText: string;
  /** Pre-renewal reminder 15-45 days out: spec 04 requires it for initial terms >= 1 year (§17602(b)(2)). */
  sendsReminder: boolean;
};

export function usd(n: number) {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function everyLabel(months: number) {
  if (months === 1) return "month";
  if (months === 12) return "year";
  return `${months} months`;
}

export function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export function planDisclosure(id: MembershipPlanId, now = new Date()): PlanDisclosure {
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === id) ?? MEMBERSHIP_PLANS[0];
  const every = everyLabel(plan.months);
  const renewalDate = addMonths(now, plan.months);
  return {
    plan,
    price: usd(plan.priceUsd),
    every,
    adverb: plan.months === 1 ? "every month" : plan.months === 12 ? "every year" : `every ${every}`,
    renewalDate,
    renewalDateText: renewalDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    sendsReminder: plan.months >= 12,
  };
}

export const SELLABLE_PLANS = MEMBERSHIP_PLANS;
