export type CityId = "dallas" | "kansas-city" | "tulsa" | "okc";

export type Cuisine =
  | "mexican"
  | "italian"
  | "bbq"
  | "american"
  | "wings"
  | "pizza"
  | "other";

export type DealType =
  | "free_item"
  | "percent_off"
  | "bogo"
  | "fixed_price"
  | "happy_hour";

export type MembershipPlanId = "monthly" | "six_month" | "annual";

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  priceUsd: number;
  months: number;
  cityScope: "home" | "all";
  blurb: string;
  /** Short bullets under the price (e.g. Best value) */
  bullets?: string[];
}

export interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: DealType;
  /** e.g. 20 for 20% off; null for free/BOGO */
  value: number | null;
  memberOnly: boolean;
  excludesAlcohol: boolean;
  active: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  category: string;
  imageEmoji?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: CityId;
  neighborhood: string;
  cuisine: Cuisine;
  tagline: string;
  story: string;
  hours: string;
  address: string;
  lat: number;
  lng: number;
  emoji: string;
  accent: string;
  plateRating: number;
  reviewCount: number;
  deals: Deal[];
  menu: MenuItem[];
  acceptsReservations: boolean;
  acceptsOnlineOrders: boolean;
  approved: boolean;
}

export interface Review {
  id: string;
  restaurantId: string;
  author: string;
  plates: number;
  text: string;
  createdAt: string;
  menuItemId?: string;
  menuItemName?: string;
  dealId?: string;
  dealTitle?: string;
  cuisine?: string;
  fromFeed?: boolean;
}

export type FeedMediaKind = "photo" | "video" | "gif" | "emoji";

export interface FeedMedia {
  kind: FeedMediaKind;
  /** data URL, remote URL, or emoji character */
  value: string;
  name?: string;
}

export interface FeedPost {
  id: string;
  city: CityId;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  media?: FeedMedia[];
  /** Posts are reviews; freeform may omit restaurant */
  isReview?: boolean;
  restaurantId?: string;
  restaurantName?: string;
  cuisine?: string;
  menuItemId?: string;
  menuItemName?: string;
  dealId?: string;
  dealTitle?: string;
  plates?: number;
  replies: {
    id: string;
    author: string;
    body: string;
    createdAt: string;
    media?: FeedMedia[];
  }[];
}

export interface CartLine {
  menuItemId: string;
  restaurantId: string;
  name: string;
  priceUsd: number;
  qty: number;
}

/** Restaurant staff permission level (partner accounts) */
export type StaffRole = "owner" | "manager" | "marketing" | "employee";

/** One person on a multi-seat membership (intake form) */
export interface MemberSeatProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  homeAddress: string;
  /** Primary seat is the signed-in account holder */
  isPrimary?: boolean;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "diner" | "restaurant" | "admin";
  city: CityId;
  isMember: boolean;
  planId: MembershipPlanId | null;
  familySeats: number;
  maxFamilySeats: number;
  /** Profile fields (diners) */
  firstName?: string;
  lastName?: string;
  birthday?: string;
  phone?: string;
  homeAddress?: string;
  favoriteRestaurant?: string;
  favoriteFoodType?: string;
  avatarDataUrl?: string;
  /** Partner staff role — controls dashboard tabs */
  staffRole?: StaffRole;
  /** Member rewards points balance */
  rewardPoints?: number;
  /** Lifetime points earned */
  rewardPointsLifetime?: number;
  /** Free-item rewards claimed */
  rewardsClaimed?: number;
  /** Badge ids unlocked */
  badges?: string[];
  /** Household seats created at membership signup */
  householdMembers?: MemberSeatProfile[];
  /** One-time bonuses already awarded (action ids) */
  awardedBonuses?: string[];
  /** Count of city feed posts by this user (demo) */
  feedPostCount?: number;
}

export interface Redemption {
  dealId: string;
  at: string;
  code: string;
  savingsUsd: number;
  restaurantId?: string;
  restaurantName?: string;
  /** Full regular price of item at redeem (for partner revenue) */
  revenueUsd?: number;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface RestaurantApplication {
  id?: string;
  name: string;
  email: string;
  at: string;
  contactName?: string;
  position?: string;
  hasAuthority?: boolean;
  address?: string;
  plannedStartDate?: string;
  city?: string;
  promo?: string;
  uploads?: { label: string; fileName: string }[];
  status?: ApplicationStatus;
}

export type ContentStatus = "pending" | "approved" | "rejected";

export interface PartnerEvent {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  date: string;
  time: string;
  city: CityId;
  emoji: string;
  /** Venue address for directions */
  address?: string;
  /** Ticket purchase / reserve URL (or demo path) */
  ticketUrl?: string;
  ticketPriceUsd?: number;
}

export interface JobPosting {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  description: string;
  type: "full-time" | "part-time" | "seasonal" | "gig";
  city: CityId;
  postedAt: string;
  payRange?: string;
  /** External business careers / application URL */
  applyUrl?: string;
}

export interface PartnerMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceUsd: number;
  category: string;
  imageDataUrls?: string[];
}

export interface PartnerDealDraft {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: DealType;
  value: number | null;
  /** Regular / full price used to compute member savings */
  regularPriceUsd?: number;
  imageDataUrls?: string[];
  active: boolean;
  createdAt: string;
  /** Admin approval before public (default pending for new partner deals) */
  status?: ContentStatus;
}

export interface ModeratedFeedPost {
  id: string;
  city: CityId;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  hidden?: boolean;
  restaurantName?: string;
}

export interface RewardEvent {
  id: string;
  at: string;
  type: "earn" | "claim";
  points: number;
  note: string;
}

/** Owner, manager, and marketing can manage content; employees only redeem scan. */
export function canManagePartnerContent(
  staffRole: StaffRole | undefined,
): boolean {
  return (
    staffRole === "owner" ||
    staffRole === "manager" ||
    staffRole === "marketing"
  );
}
