import {
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  monthlyRate,
  PLATFORM,
} from "@/lib/pricing";
import type { Cuisine, DealType, MembershipPlan, Restaurant } from "@/lib/types";

/**
 * Copy and illustrative content for the home page (Concept 1b).
 * Prices always come from MEMBERSHIP_PLANS; only the wording lives here.
 */

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Lowest monthly rate across plans, derived from MEMBERSHIP_PLANS. */
export const FROM_PRICE_CTA = `${money(
  Math.min(...MEMBERSHIP_PLANS.map((p) => monthlyRate(p))),
)}/mo`;
export const JOIN_CTA = `Join ${PLATFORM.name}, from ${FROM_PRICE_CTA}`;
export const MAX_SEATS = MAX_FAMILY_SEATS;

type PlanCopy = {
  /** Short line under the plan price. */
  sub: (plan: MembershipPlan) => string;
  drawer: (plan: MembershipPlan) => string;
  bullets: (plan: MembershipPlan) => string[];
};

/** Home plans: lowest monthly cost first. */
const PLAN_ORDER: MembershipPlan["id"][] = ["annual", "six_month", "monthly"];

const PLAN_COPY: Record<string, PlanCopy> = {
  monthly: {
    sub: () => "Billed monthly",
    drawer: () => "Billed monthly, cancel anytime",
    bullets: () => ["Lowest commitment", "All cities included", "Cancel anytime"],
  },
  six_month: {
    sub: (p) => `Billed as ${money(p.priceUsd)} every 6 months`,
    drawer: (p) => `${money(p.priceUsd)}, billed every six months`,
    bullets: () => ["All cities included", "Cancel anytime"],
  },
  annual: {
    sub: (p) => `Billed as ${money(p.priceUsd)} a year`,
    drawer: (p) => `${money(p.priceUsd)}, billed yearly`,
    bullets: (p) => [
      `Most Foodies can save ${money(p.priceUsd)} in the first month alone!`,
      "Lowest price per month",
      "All cities included",
      "Cancel anytime",
    ],
  },
};

export type HomePlan = {
  id: MembershipPlan["id"];
  label: string;
  price: string;
  unit: string;
  perMonth: string;
  best: boolean;
  sub: string;
  drawer: string;
  bullets: string[];
};

export const HOME_PLANS: HomePlan[] = [...MEMBERSHIP_PLANS]
  .sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id))
  .map((p) => {
    const copy = PLAN_COPY[p.id] ?? {
      sub: () => "",
      drawer: () => "",
      bullets: (plan: MembershipPlan) => plan.bullets ?? [],
    };
    const perMonth = `${money(monthlyRate(p))}/mo`;
    return {
      id: p.id,
      label: p.name,
      price: money(monthlyRate(p)),
      unit: "/mo",
      perMonth,
      best: p.id === "annual",
      sub: copy.sub(p),
      drawer: copy.drawer(p),
      bullets: copy.bullets(p),
    };
  });

export const DEFAULT_PLAN_ID: HomePlan["id"] =
  HOME_PLANS.find((p) => p.best)?.id ?? HOME_PLANS[0].id;

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


/** Map home sample ticket kinds to catalog deal types. */
const SAMPLE_DEAL_TYPE: Record<SampleDeal["type"], DealType> = {
  free: "free_item",
  off: "percent_off",
  bogo: "bogo",
};

const SAMPLE_CUISINE: Record<FoodKey, Cuisine> = {
  burger: "american",
  tacos: "mexican",
  pizza: "pizza",
  bbq: "bbq",
  icecream: "american",
  wings: "wings",
  ramen: "japanese",
};

const SAMPLE_ACCENT: Record<FoodKey, string> = {
  burger: "#f97316",
  tacos: "#ea580c",
  pizza: "#dc2626",
  bbq: "#b45309",
  icecream: "#db2777",
  wings: "#c2410c",
  ramen: "#0d9488",
};

/** Illustrative plate rates for sample cards (not live reviews). */
const SAMPLE_PLATES: Record<string, number> = {
  "Corner Burger Co.": 4.6,
  "Casa Lupita": 4.8,
  "Slice Alley": 4.3,
  "Pit Row Smokehouse": 4.9,
  "Scoop Lane": 4.5,
  "Wing Basket": 4.4,
  "Noodle Hall": 4.7,
};

/** Turn a home sample deal into a Restaurant so the shared profile card can render it. */
export function sampleDealAsRestaurant(d: SampleDeal): Restaurant {
  const img = FOOD_IMAGES[d.food].src;
  const id = `sample-${d.restaurant.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return {
    id,
    name: d.restaurant,
    slug: id.replace(/^sample-/, ""),
    city: "dallas",
    neighborhood: d.hood,
    cuisine: SAMPLE_CUISINE[d.food],
    tagline: "",
    story: "",
    hours: "",
    address: d.hood,
    lat: 0,
    lng: 0,
    emoji: "",
    accent: SAMPLE_ACCENT[d.food],
    plateRating: SAMPLE_PLATES[d.restaurant] ?? 4.5,
    reviewCount: 0,
    deals: [
      {
        id: `${id}-deal`,
        restaurantId: id,
        title: d.deal,
        description: "",
        type: SAMPLE_DEAL_TYPE[d.type],
        value: d.type === "off" ? 25 : null,
        memberOnly: true,
        excludesAlcohol: true,
        active: true,
      },
    ],
    menu: [
      {
        id: `${id}-menu`,
        name: FOOD_IMAGES[d.food].alt,
        description: "",
        priceUsd: 0,
        category: "Sample",
        imageUrl: img,
      },
    ],
    acceptsReservations: false,
    acceptsOnlineOrders: false,
    approved: true,
  };
}
