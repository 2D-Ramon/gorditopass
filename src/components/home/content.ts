import {
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  monthlyRate,
  PLATFORM,
} from "@/lib/pricing";
import type { MembershipPlan } from "@/lib/types";

/**
 * Copy and illustrative content for the home page (Concept 1b).
 * Prices always come from MEMBERSHIP_PLANS; only the wording lives here.
 */

/** CTA wording, kept separate from plan data on purpose. */
export const FROM_PRICE_CTA = "$5/mo";
export const JOIN_CTA = `Join ${PLATFORM.name}, from ${FROM_PRICE_CTA}`;
export const MAX_SEATS = MAX_FAMILY_SEATS;

type PlanCopy = {
  /** Where the plan works, as shown on the home page. */
  anyCity: boolean;
  sub: (plan: MembershipPlan) => string;
  drawer: (plan: MembershipPlan) => string;
  bullets: string[];
};

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

const PLAN_COPY: Record<string, PlanCopy> = {
  monthly: {
    anyCity: false,
    sub: () => "Billed monthly",
    drawer: () => "Home city only",
    bullets: ["Lowest commitment, cancel anytime", "Works in your home city"],
  },
  six_month: {
    anyCity: false,
    sub: (p) => `That's ${money(monthlyRate(p))}/mo`,
    drawer: (p) => `${money(monthlyRate(p))}/mo, home city only`,
    bullets: ["Pay once for six months", "Works in your home city"],
  },
  annual: {
    anyCity: true,
    sub: (p) => `That's ${money(monthlyRate(p))}/mo. Best for travelers.`,
    drawer: (p) => `${money(monthlyRate(p))}/mo, works in any city`,
    bullets: ["Works in any city", "Lowest price per month"],
  },
};

export type HomePlan = {
  id: MembershipPlan["id"];
  label: string;
  price: string;
  unit: string;
  perMonth: string;
  anyCity: boolean;
  best: boolean;
  sub: string;
  drawer: string;
  bullets: string[];
};

function unitFor(months: number) {
  if (months === 1) return "/mo";
  if (months === 12) return " / year";
  return ` / ${months} mo`;
}

export const HOME_PLANS: HomePlan[] = MEMBERSHIP_PLANS.map((p) => {
  const copy = PLAN_COPY[p.id] ?? {
    anyCity: p.cityScope === "all",
    sub: () => "",
    drawer: () => "",
    bullets: p.bullets ?? [],
  };
  return {
    id: p.id,
    label: p.name,
    price: money(p.priceUsd),
    unit: unitFor(p.months),
    perMonth: `${money(monthlyRate(p))}/mo`,
    anyCity: copy.anyCity,
    best: p.id === "annual",
    sub: copy.sub(p),
    drawer: copy.drawer(p),
    bullets: copy.bullets,
  };
});

export const DEFAULT_PLAN_ID: HomePlan["id"] =
  HOME_PLANS.find((p) => p.best)?.id ?? HOME_PLANS[0].id;

const plan = (id: string) => HOME_PLANS.find((p) => p.id === id);

/** FAQ answer built from plan data so it never drifts from pricing. */
export function planWhereAnswer() {
  const m = plan("monthly");
  const s = plan("six_month");
  const a = plan("annual");
  if (!m || !s || !a) return "";
  return `Monthly (${m.perMonth}) and 6-month (${s.price}, or ${s.perMonth}) plans work in your home city. The annual plan (${a.price}, or ${a.perMonth}) works in any city.`;
}

export const MONTHLY_PER_MONTH = plan("monthly")?.perMonth ?? "";

export type FoodKey =
  | "burger"
  | "tacos"
  | "pizza"
  | "bbq"
  | "icecream"
  | "wings"
  | "ramen";

export const FOOD_IMAGES: Record<FoodKey, { src: string; alt: string }> = {
  burger: { src: "/home/food-burger.jpg", alt: "Illustration of a burger and fries" },
  tacos: { src: "/home/food-tacos.jpg", alt: "Illustration of tacos on a plate" },
  pizza: { src: "/home/food-pizza.jpg", alt: "Illustration of a pizza slice" },
  bbq: { src: "/home/food-bbq.jpg", alt: "Illustration of barbecue ribs" },
  icecream: { src: "/home/food-icecream.jpg", alt: "Illustration of ice cream cones" },
  wings: { src: "/home/food-wings.jpg", alt: "Illustration of a basket of wings" },
  ramen: { src: "/home/food-ramen.jpg", alt: "Illustration of a ramen bowl" },
};

export type SampleDeal = {
  food: FoodKey;
  type: "free" | "off" | "bogo";
  typeLabel: string;
  deal: string;
  restaurant: string;
  hood: string;
};

/** Illustrative deals. Each one carries a visible "Sample" pill. */
export const SAMPLE_DEALS: SampleDeal[] = [
  { food: "burger", type: "free", typeLabel: "Free item", deal: "Free fries with any entrée", restaurant: "Corner Burger Co.", hood: "Deep Ellum" },
  { food: "tacos", type: "off", typeLabel: "% off", deal: "25% off your plate", restaurant: "Casa Lupita", hood: "Bishop Arts" },
  { food: "pizza", type: "bogo", typeLabel: "Buy one, get one", deal: "Buy one slice, get one", restaurant: "Slice Alley", hood: "Oak Cliff" },
  { food: "bbq", type: "off", typeLabel: "% off", deal: "50% off a brisket sandwich", restaurant: "Pit Row Smokehouse", hood: "Lower Greenville" },
  { food: "icecream", type: "free", typeLabel: "Free item", deal: "Free scoop with any sundae", restaurant: "Scoop Lane", hood: "Uptown" },
  { food: "wings", type: "off", typeLabel: "% off", deal: "20% off a wing basket", restaurant: "Wing Basket", hood: "Lakewood" },
  { food: "ramen", type: "free", typeLabel: "Free item", deal: "Free appetizer with any ramen", restaurant: "Noodle Hall", hood: "Richardson" },
];

/** Sample "want to try" cards in the hero phone (plate ratings, never stars). */
export const SAMPLE_DISCOVER = [
  { food: "ramen" as const, cuisine: "Japanese · Ramen", name: "Noodle Hall", plates: 4 },
  { food: "bbq" as const, cuisine: "Texas · BBQ", name: "Pit Row Smokehouse", plates: 5 },
  { food: "pizza" as const, cuisine: "Italian · Pizza", name: "Slice Alley", plates: 3 },
];
