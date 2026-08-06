import type { Cuisine, Restaurant } from "./types";
import { RESTAURANTS } from "./data";

/**
 * Cuisine passports — visit every live restaurant in a category to earn
 * (and keep) that passport badge. When a new spot joins the category,
 * the passport is revoked until the member visits the new place too.
 */
export interface PassportDef {
  id: string;
  name: string;
  emoji: string;
  /** World region label */
  region: string;
  description: string;
  /** Restaurants whose cuisine is in this list count toward the passport */
  cuisineTags: Cuisine[];
  /** Points when first earned (or re-earned after revoke) */
  completePoints: number;
}

export const PASSPORTS: PassportDef[] = [
  {
    id: "latin",
    name: "Latin & Hispanic Passport",
    emoji: "🌮",
    region: "Latin America",
    description:
      "Tacos, pupusas, arepas, and abuela’s kitchen — visit every Latin & Hispanic partner.",
    cuisineTags: ["mexican", "latin", "texmex"],
    completePoints: 40,
  },
  {
    id: "italian",
    name: "Italian Passport",
    emoji: "🍝",
    region: "Southern Europe",
    description: "Pasta, pizza, and trattoria nights across partner Italian tables.",
    cuisineTags: ["italian", "pizza"],
    completePoints: 40,
  },
  {
    id: "american",
    name: "All-American Passport",
    emoji: "🍔",
    region: "North America",
    description: "Burgers, diners, and classic American comfort plates.",
    cuisineTags: ["american", "wings"],
    completePoints: 35,
  },
  {
    id: "bbq",
    name: "Smoke & Fire Passport",
    emoji: "🔥",
    region: "North America",
    description: "BBQ, pit smoke, and low-and-slow legends.",
    cuisineTags: ["bbq"],
    completePoints: 30,
  },
  {
    id: "east_asia",
    name: "East Asia Passport",
    emoji: "🍜",
    region: "East Asia",
    description: "Japanese, Chinese, Korean — noodles, rice, and umami.",
    cuisineTags: ["japanese", "chinese", "korean"],
    completePoints: 45,
  },
  {
    id: "southeast_asia",
    name: "Southeast Asia Passport",
    emoji: "🍛",
    region: "Southeast Asia",
    description: "Thai, Vietnamese, and bright Southeast Asian flavors.",
    cuisineTags: ["thai", "vietnamese"],
    completePoints: 40,
  },
  {
    id: "south_asia",
    name: "South Asia Passport",
    emoji: "🫓",
    region: "South Asia",
    description: "Indian, Pakistani, and spice-forward South Asian kitchens.",
    cuisineTags: ["indian"],
    completePoints: 35,
  },
  {
    id: "mediterranean",
    name: "Mediterranean Passport",
    emoji: "🫒",
    region: "Mediterranean",
    description: "Greek, Levantine, and olive-oil sunshine on a plate.",
    cuisineTags: ["mediterranean", "greek", "middle_eastern"],
    completePoints: 40,
  },
  {
    id: "french",
    name: "French Passport",
    emoji: "🥐",
    region: "Western Europe",
    description: "Bistros, croissants, and classic French comfort.",
    cuisineTags: ["french"],
    completePoints: 35,
  },
  {
    id: "caribbean",
    name: "Caribbean Passport",
    emoji: "🏝️",
    region: "Caribbean",
    description: "Jerk, plantains, and island heat.",
    cuisineTags: ["caribbean"],
    completePoints: 35,
  },
  {
    id: "african",
    name: "African Passport",
    emoji: "🌍",
    region: "Africa",
    description: "North, West, and East African partner kitchens.",
    cuisineTags: ["african", "ethiopian", "moroccan"],
    completePoints: 40,
  },
  {
    id: "germanic",
    name: "Central Europe Passport",
    emoji: "🥨",
    region: "Central Europe",
    description: "German, Austrian, and hearty Central European tables.",
    cuisineTags: ["german"],
    completePoints: 30,
  },
];

export function getPassportById(id: string): PassportDef | undefined {
  return PASSPORTS.find((p) => p.id === id);
}

/** Live restaurants currently counting toward a passport. */
export function getPassportRestaurants(
  passport: PassportDef,
  isApproved: (id: string) => boolean,
  all: Restaurant[] = RESTAURANTS,
): Restaurant[] {
  return all.filter(
    (r) =>
      isApproved(r.id) &&
      passport.cuisineTags.includes(r.cuisine),
  );
}

export function passportProgress(
  passport: PassportDef,
  visitedRestaurantIds: Set<string>,
  isApproved: (id: string) => boolean,
  all?: Restaurant[],
): {
  restaurants: Restaurant[];
  visited: Restaurant[];
  missing: Restaurant[];
  complete: boolean;
  percent: number;
} {
  const restaurants = getPassportRestaurants(passport, isApproved, all);
  const visited = restaurants.filter((r) => visitedRestaurantIds.has(r.id));
  const missing = restaurants.filter((r) => !visitedRestaurantIds.has(r.id));
  const complete =
    restaurants.length > 0 && missing.length === 0;
  const percent =
    restaurants.length === 0
      ? 0
      : Math.round((visited.length / restaurants.length) * 100);
  return { restaurants, visited, missing, complete, percent };
}
