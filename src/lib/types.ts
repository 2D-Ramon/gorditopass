export type CityId = "dallas" | "kansas-city" | "tulsa" | "okc";

export type Cuisine =
  | "mexican"
  | "latin"
  | "texmex"
  | "italian"
  | "bbq"
  | "american"
  | "wings"
  | "pizza"
  | "japanese"
  | "chinese"
  | "korean"
  | "thai"
  | "vietnamese"
  | "indian"
  | "mediterranean"
  | "greek"
  | "middle_eastern"
  | "french"
  | "caribbean"
  | "african"
  | "ethiopian"
  | "moroccan"
  | "german"
  | "seafood"
  | "other";

export type DealType =
  | "free_item"
  | "percent_off"
  | "percent_off_total"
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

export interface FeedPollOption {
  id: string;
  label: string;
  /** User ids who voted */
  voterIds: string[];
}

export interface FeedPoll {
  question: string;
  options: FeedPollOption[];
}

/** emoji -> list of user ids */
export type ReactionMap = Record<string, string[]>;

export interface FeedPost {
  id: string;
  city: CityId;
  author: string;
  /** Profile user id when known (for public profile links) */
  authorId?: string;
  authorAvatar?: string;
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
  poll?: FeedPoll;
  reactions?: ReactionMap;
  replies: {
    id: string;
    author: string;
    authorId?: string;
    authorAvatar?: string;
    body: string;
    createdAt: string;
    media?: FeedMedia[];
    reactions?: ReactionMap;
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
  /** Live listing this partner account manages */
  restaurantId?: string;
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
  /**
   * Passport ids currently held (badge active — all restaurants visited).
   * Badge pauses when a new restaurant joins until that stamp is earned.
   * Points for first completion are never clawed back.
   */
  completedPassports?: string[];
  /** Restaurant ids that counted when the passport was last earned / last known set */
  passportSnapshots?: Record<string, string[]>;
  /** Passport ids that already paid completion points (never award again) */
  passportPointsClaimed?: string[];
  /** Demo password for recommended per-person login (not for production) */
  demoPassword?: string;
  /** Household plan group id — shared billing, separate logins */
  householdPlanId?: string;
  /** Whether this seat is the billing primary */
  isPlanPrimary?: boolean;
  /** Membership billing window (ISO dates) */
  membershipActivatedAt?: string;
  membershipRenewsAt?: string;
  /** Unique code others can enter when they join */
  referralCode?: string;
  /** Code this user entered (friend who referred them) */
  referredByCode?: string;
  /** Successful referral count */
  referralCount?: number;
}

/** Payload from /api/me and member activity routes */
export interface LiveMemberBundle {
  user: MockUser;
  favorites?: string[];
  redemptions?: Redemption[];
  reviews?: Review[];
  household?: MemberSeatProfile[];
  rewardHistory?: RewardEvent[];
  feedPostCount?: number;
  savingsYtd?: number;
  newBadges?: string[];
}

/** Taste Buds = mutual friends between members */
export type TasteBudRequestStatus = "pending" | "accepted" | "declined";

export interface TasteBudRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatar?: string;
  toUserId: string;
  toName: string;
  toAvatar?: string;
  status: TasteBudRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

/** Staff signed up a customer for membership — $5 cash referral */
export interface StaffMembershipReferral {
  id: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  staffRole?: StaffRole;
  customerUserId: string;
  customerEmail: string;
  customerName: string;
  planId: MembershipPlanId;
  amountUsd: number;
  at: string;
  /** YYYY-MM for monthly check grouping */
  monthKey: string;
  checkStatus: "pending" | "paid";
}

export type NotificationType =
  | "passport_earned"
  | "passport_revoked"
  | "info";

export interface AppNotification {
  id: string;
  at: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  passportId?: string;
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

export interface ApplicationUpload {
  label: string;
  fileName: string;
  sizeBytes?: number;
  mimeType?: string;
  /** Demo-only preview (data URL) so admin can open images in queue */
  dataUrl?: string;
}

/** Business category on partner apply intake */
export type BusinessTypeId =
  | "restaurant"
  | "food_truck"
  | "grocery"
  | "bakery"
  | "coffee_shop"
  | "fast_food"
  | "event_center"
  | "candy_store"
  | "ice_cream"
  | "bar"
  | "snow_cone"
  | "zoo"
  | "movie_theater"
  | "tea_shop"
  | "home_plates"
  | "brewery"
  | "catering"
  | "other";

/** Ownership / brand structure */
export type OwnershipTypeId =
  | "independently_owned"
  | "franchise"
  | "chain"
  | "family_owned"
  | "co_op"
  | "other";

/** One concept / brand under a multi-location application */
export interface ApplicationConcept {
  id: string;
  conceptName: string;
  businessType: BusinessTypeId;
  businessTypeOther?: string;
  cuisineOrTheme?: string;
  locationCount: number;
  cities?: string;
  notes?: string;
}

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
  businessType?: BusinessTypeId;
  businessTypeOther?: string;
  ownershipType?: OwnershipTypeId;
  ownershipTypeOther?: string;
  /** Total locations across the group */
  totalLocations?: number;
  /** Breakdown when multiple concepts (Mexican + Italian + BBQ, etc.) */
  concepts?: ApplicationConcept[];
  uploads?: ApplicationUpload[];
  status?: ApplicationStatus;
}

/** Saved login identity — one person, one account (recommended model) */
export interface AuthAccount {
  id: string;
  email: string;
  /** Demo only — live app uses hashed passwords / magic links */
  password: string;
  role: "diner" | "restaurant" | "admin";
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  homeAddress?: string;
  city: CityId;
  isMember: boolean;
  planId: MembershipPlanId | null;
  familySeats: number;
  maxFamilySeats: number;
  staffRole?: StaffRole;
  householdPlanId?: string;
  isPlanPrimary?: boolean;
  householdMembers?: MemberSeatProfile[];
  rewardPoints?: number;
  rewardPointsLifetime?: number;
  rewardsClaimed?: number;
  badges?: string[];
  completedPassports?: string[];
  passportSnapshots?: Record<string, string[]>;
  passportPointsClaimed?: string[];
  awardedBonuses?: string[];
  feedPostCount?: number;
  favoriteRestaurant?: string;
  favoriteFoodType?: string;
  avatarDataUrl?: string;
  createdAt: string;
  referralCode?: string;
  referralCount?: number;
  referredByCode?: string;
}

export type ContentStatus = "pending" | "approved" | "rejected";

/** Shared moderation metadata on partner-submitted content */
export interface ContentModerationMeta {
  status: ContentStatus;
  createdAt: string;
  /** AI/demo flag — hold for human review */
  aiFlagged?: boolean;
  aiReasons?: string[];
  aiScore?: number;
  reviewedAt?: string;
}

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
  imageDataUrls?: string[];
  status?: ContentStatus;
  createdAt?: string;
  aiFlagged?: boolean;
  aiReasons?: string[];
  aiScore?: number;
  /** Optional auto-expire (ISO date) */
  expiresAt?: string | null;
  expireEnabled?: boolean;
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
  imageDataUrls?: string[];
  status?: ContentStatus;
  createdAt?: string;
  aiFlagged?: boolean;
  aiReasons?: string[];
  aiScore?: number;
  expiresAt?: string | null;
  expireEnabled?: boolean;
}

export interface PartnerMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceUsd: number;
  category: string;
  imageDataUrls?: string[];
  status?: ContentStatus;
  createdAt?: string;
  active?: boolean;
  aiFlagged?: boolean;
  aiReasons?: string[];
  aiScore?: number;
  expiresAt?: string | null;
  expireEnabled?: boolean;
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
  aiFlagged?: boolean;
  aiReasons?: string[];
  aiScore?: number;
  expiresAt?: string | null;
  expireEnabled?: boolean;
}

/** Claimable reward catalog placeholders */
export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  emoji: string;
  /** placeholder until real claim flow */
  placeholder?: boolean;
}

/** Direct / group chat */
export interface ChatMessage {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  at: string;
  reactions?: ReactionMap;
}

export interface ChatThread {
  id: string;
  type: "dm" | "group";
  title: string;
  memberIds: string[];
  memberNames: string[];
  createdAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
  /**
   * Group chats are always public / shareable (never private).
   * DMs remain 1:1.
   */
  isPublic?: boolean;
  /** Who created the group (for invite permissions) */
  createdById?: string;
}

/** Member interest on partner events */
export type EventRsvpStatus = "interested" | "going";

export interface EventRsvp {
  eventId: string;
  userId: string;
  userName: string;
  status: EventRsvpStatus;
  at: string;
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
