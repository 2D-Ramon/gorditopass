"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppNotification,
  ApplicationStatus,
  AuthAccount,
  CartLine,
  ChatThread,
  CityId,
  ContentStatus,
  EventRsvp,
  EventRsvpStatus,
  JobPosting,
  MemberSeatProfile,
  MembershipPlanId,
  ModeratedFeedPost,
  MockUser,
  PartnerDealDraft,
  PartnerEvent,
  PartnerMenuItem,
  Redemption,
  RestaurantApplication,
  Review,
  RewardEvent,
  StaffMembershipReferral,
  StaffRole,
  TasteBudRequest,
} from "./types";
import { canManagePartnerContent } from "./types";
import {
  BADGES,
  MAX_FAMILY_SEATS,
  POINT_ACTIONS,
  REWARDS,
  STAFF_MEMBERSHIP_REFERRAL,
  type PointActionId,
} from "./pricing";
import { getDeal, getRestaurant, RESTAURANTS, REVIEWS } from "./data";
import { getPassportRestaurants, PASSPORTS } from "./passports";
import {
  defaultAutoApprove,
  moderatePartnerContent,
  type ContentKind,
  type RestaurantAutoApprove,
} from "./contentModeration";
import { MEMBERSHIP_PLANS } from "./pricing";

const STORAGE_KEY = "gorditopass-mvp-v13";
const DEFAULT_DEMO_PASSWORD = "demo1234";

interface Persisted {
  user: MockUser | null;
  cart: CartLine[];
  favorites: string[];
  following: string[];
  /** Member user ids this account follows (movements) */
  memberFollowing: string[];
  tasteBudRequests: TasteBudRequest[];
  staffMembershipReferrals: StaffMembershipReferral[];
  redemptions: Redemption[];
  restaurantApplications: RestaurantApplication[];
  partnerEvents: PartnerEvent[];
  partnerJobs: JobPosting[];
  partnerDeals: PartnerDealDraft[];
  partnerMenuItems: PartnerMenuItem[];
  partnerStories: Record<string, string>;
  userReviews: Review[];
  rewardHistory: RewardEvent[];
  moderatedFeedPosts: ModeratedFeedPost[];
  restaurantApprovalOverrides: Record<string, boolean>;
  notifications: AppNotification[];
  /** Per-person accounts (recommended login model) */
  accounts: AuthAccount[];
  /** Admin: auto-approve settings per restaurant + content type */
  autoApproveSettings: RestaurantAutoApprove[];
  chats: ChatThread[];
  eventRsvps: EventRsvp[];
}

interface StoreValue {
  user: MockUser | null;
  cart: CartLine[];
  favorites: string[];
  following: string[];
  memberFollowing: string[];
  tasteBudRequests: TasteBudRequest[];
  staffMembershipReferrals: StaffMembershipReferral[];
  redemptions: Redemption[];
  restaurantApplications: RestaurantApplication[];
  partnerEvents: PartnerEvent[];
  partnerJobs: JobPosting[];
  partnerDeals: PartnerDealDraft[];
  partnerMenuItems: PartnerMenuItem[];
  partnerStories: Record<string, string>;
  userReviews: Review[];
  rewardHistory: RewardEvent[];
  moderatedFeedPosts: ModeratedFeedPost[];
  restaurantApprovalOverrides: Record<string, boolean>;
  city: CityId;
  setCity: (c: CityId) => void;
  signInDemo: (role?: MockUser["role"], staffRole?: StaffRole) => void;
  signOut: () => void;
  /** Recommended model: each person logs in with their own email */
  loginWithPassword: (
    email: string,
    password: string,
  ) => { ok: boolean; error?: string };
  /** Demo magic link — “sends” a link then signs that account in */
  loginWithMagicLink: (email: string) => { ok: boolean; error?: string };
  /** Create or update a diner account (signup) */
  registerDinerAccount: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => { ok: boolean; error?: string };
  /** Owner invites staff — separate login, role-gated */
  inviteStaffAccount: (input: {
    email: string;
    name: string;
    staffRole: StaffRole;
    password?: string;
  }) => { ok: boolean; error?: string };
  accounts: AuthAccount[];
  activateMembership: (
    planId: MembershipPlanId,
    seats: number,
    members?: MemberSeatProfile[],
    referralCodeInput?: string,
  ) => void;
  /**
   * Partner staff enrolls a customer who does not yet have membership.
   * Staff earns $5 cash referral (tracked for monthly check).
   */
  staffEnrollCustomerMembership: (input: {
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone?: string;
    planId: MembershipPlanId;
    seats?: number;
  }) => { ok: boolean; error?: string; bonusUsd?: number };
  markStaffReferralChecksPaid: (monthKey: string, staffUserId?: string) => void;
  /** Store a referral code to apply at membership activation */
  setReferredByCode: (code: string) => { ok: boolean; error?: string };
  ensureReferralCode: () => string;
  /** Follow another member’s movements */
  followMember: (userId: string) => void;
  unfollowMember: (userId: string) => void;
  isFollowingMember: (userId: string) => boolean;
  requestTasteBud: (userId: string) => { ok: boolean; error?: string };
  respondTasteBud: (
    requestId: string,
    accept: boolean,
  ) => { ok: boolean; error?: string };
  removeTasteBud: (userId: string) => void;
  /** Mutual Taste Buds (accepted) for current user */
  tasteBudIds: string[];
  updateProfile: (patch: Partial<MockUser>) => void;
  /** Award points for a completed task (custom values in POINT_ACTIONS) */
  awardPoints: (
    action: PointActionId,
    opts?: { note?: string; onceKey?: string },
  ) => number;
  /** Recompute badges from current stats (optional overrides avoid off-by-one) */
  evaluateBadges: (overrides?: {
    redemptions?: Redemption[];
    favorites?: string[];
    userReviews?: Review[];
  }) => string[];
  /** Recompute cuisine passports; pass fresh redemptions after a redeem */
  evaluatePassports: (redListOverride?: Redemption[]) => void;
  householdMembers: MemberSeatProfile[];
  earnedBadges: string[];
  completedPassports: string[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  addToCart: (line: Omit<CartLine, "qty">, qty?: number) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  toggleFavorite: (restaurantId: string) => void;
  toggleFollow: (id: string) => void;
  createRedeemCode: (dealId: string) => { code: string; expiresAt: number };
  recordRedemption: (
    dealId: string,
    code: string,
  ) => {
    pointsEarned: number;
    totalPoints: number;
    savingsUsd?: number;
    revenueUsd?: number;
  };
  submitRestaurantApplication: (
    app: Omit<RestaurantApplication, "at" | "status" | "id">,
  ) => void;
  setApplicationStatus: (id: string, status: ApplicationStatus) => void;
  setPartnerDealStatus: (id: string, status: ContentStatus) => void;
  setPartnerMenuStatus: (id: string, status: ContentStatus) => void;
  setPartnerEventStatus: (id: string, status: ContentStatus) => void;
  setPartnerJobStatus: (id: string, status: ContentStatus) => void;
  setRestaurantApproved: (restaurantId: string, approved: boolean) => void;
  autoApproveSettings: RestaurantAutoApprove[];
  getAutoApprove: (restaurantId: string) => RestaurantAutoApprove;
  setAutoApprove: (
    restaurantId: string,
    patch: Partial<Omit<RestaurantAutoApprove, "restaurantId">>,
  ) => void;
  addHouseholdSeat: (seat: Omit<MemberSeatProfile, "id" | "isPrimary">) => {
    ok: boolean;
    error?: string;
  };
  removeHouseholdSeat: (seatId: string) => { ok: boolean; error?: string };
  hideFeedPost: (post: Omit<ModeratedFeedPost, "hidden">) => void;
  unhideFeedPost: (id: string) => void;
  claimReward: () => boolean;
  resetDemoData: () => void;
  addPartnerEvent: (
    event: Omit<
      PartnerEvent,
      | "id"
      | "status"
      | "createdAt"
      | "aiFlagged"
      | "aiReasons"
      | "aiScore"
    >,
  ) => { id: string; status: ContentStatus; aiFlagged: boolean };
  addPartnerJob: (
    job: Omit<
      JobPosting,
      | "id"
      | "postedAt"
      | "status"
      | "createdAt"
      | "aiFlagged"
      | "aiReasons"
      | "aiScore"
    >,
  ) => { id: string; status: ContentStatus; aiFlagged: boolean };
  addPartnerDeal: (
    deal: Omit<
      PartnerDealDraft,
      | "id"
      | "createdAt"
      | "active"
      | "status"
      | "aiFlagged"
      | "aiReasons"
      | "aiScore"
    >,
  ) => { id: string; status: ContentStatus; aiFlagged: boolean };
  addPartnerMenuItem: (
    item: Omit<
      PartnerMenuItem,
      | "id"
      | "status"
      | "createdAt"
      | "active"
      | "aiFlagged"
      | "aiReasons"
      | "aiScore"
    >,
  ) => { id: string; status: ContentStatus; aiFlagged: boolean };
  updatePartnerDeal: (
    id: string,
    patch: Partial<PartnerDealDraft>,
  ) => void;
  updatePartnerMenuItem: (
    id: string,
    patch: Partial<PartnerMenuItem>,
  ) => void;
  updatePartnerEvent: (id: string, patch: Partial<PartnerEvent>) => void;
  updatePartnerJob: (id: string, patch: Partial<JobPosting>) => void;
  deletePartnerDeal: (id: string) => void;
  deletePartnerMenuItem: (id: string) => void;
  deletePartnerEvent: (id: string) => void;
  deletePartnerJob: (id: string) => void;
  getRestaurantStory: (restaurantId: string) => string;
  updatePartnerStory: (
    restaurantId: string,
    body: string,
  ) => { ok: boolean; error?: string };
  chats: ChatThread[];
  createDmChat: (otherUserId: string, otherName: string) => string;
  createGroupChat: (title: string, memberIds: string[], memberNames: string[]) => string;
  inviteToGroupChat: (
    chatId: string,
    memberIds: string[],
    memberNames: string[],
  ) => { ok: boolean; error?: string };
  joinGroupChat: (chatId: string) => { ok: boolean; error?: string };
  sendChatMessage: (chatId: string, body: string) => void;
  reactToChatMessage: (
    chatId: string,
    messageId: string,
    emoji: string,
  ) => void;
  eventRsvps: EventRsvp[];
  setEventRsvp: (
    eventId: string,
    status: EventRsvpStatus,
  ) => { ok: boolean; error?: string };
  getEventRsvp: (eventId: string) => EventRsvpStatus | null;
  getEventRsvpCounts: (eventId: string) => {
    interested: number;
    going: number;
  };
  submitPlateReview: (
    review: Omit<Review, "id" | "createdAt" | "author"> & { author?: string },
  ) => Review;
  getPlateRate: (restaurantId: string) => { rating: number; count: number };
  getReviewsForRestaurant: (restaurantId: string) => Review[];
  isRestaurantApproved: (restaurantId: string) => boolean;
  checkoutDemo: () => { orderId: string; total: number };
  savingsWeek: number;
  savingsMonth: number;
  savingsYtd: number;
  partnerRevenueWeek: number;
  partnerRevenueMonth: number;
  partnerRevenueYtd: number;
  partnerRedemptionCount: number;
  rewardPoints: number;
  rewardProgress: number;
  rewardsAvailable: number;
  feedPostCount: number;
}

const StoreContext = createContext<StoreValue | null>(null);

const defaultUser = (
  role: MockUser["role"] = "diner",
  staffRole: StaffRole = "owner",
): MockUser => ({
  id: "demo-user",
  name:
    role === "admin"
      ? "Admin"
      : role === "restaurant"
        ? staffRole === "employee"
          ? "Staff Member"
          : staffRole === "marketing"
            ? "Marketing Lead"
            : staffRole === "manager"
              ? "Restaurant Manager"
              : "Restaurant Owner"
        : "Demo Diner",
  email:
    role === "admin"
      ? "admin@gorditopass.local"
      : role === "restaurant"
        ? "partner@gorditopass.local"
        : "diner@gorditopass.local",
  role,
  city: "dallas",
  // Partners are not diner members; staff can enroll customers instead
  isMember: role === "admin",
  planId: null,
  familySeats: 1,
  maxFamilySeats: MAX_FAMILY_SEATS,
  birthday: "",
  phone: "",
  favoriteRestaurant: "",
  favoriteFoodType: "",
  avatarDataUrl: "",
  staffRole: role === "restaurant" ? staffRole : undefined,
  rewardPoints: 0,
  rewardPointsLifetime: 0,
  rewardsClaimed: 0,
  badges: [],
  householdMembers: [],
  awardedBonuses: [],
  feedPostCount: 0,
  firstName: "",
  lastName: "",
  homeAddress: "",
  completedPassports: [],
  passportSnapshots: {},
  passportPointsClaimed: [],
  demoPassword: "demo1234",
  referralCode: undefined,
  referredByCode: undefined,
  referralCount: 0,
});

function emptyPersisted(): Persisted {
  return {
    user: null,
    cart: [],
    favorites: [],
    following: [],
    memberFollowing: [],
    tasteBudRequests: [],
    staffMembershipReferrals: [],
    redemptions: [],
    restaurantApplications: [],
    partnerEvents: [],
    partnerJobs: [],
    partnerDeals: [],
    partnerMenuItems: [],
    partnerStories: {},
    userReviews: [],
    rewardHistory: [],
    moderatedFeedPosts: [],
    restaurantApprovalOverrides: {},
    notifications: [],
    accounts: [],
    autoApproveSettings: [],
    chats: [],
    eventRsvps: [],
  };
}

function monthKeyFrom(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Content is public when approved and not past expire date */
export function isPartnerContentLive(item: {
  status?: ContentStatus;
  active?: boolean;
  expireEnabled?: boolean;
  expiresAt?: string | null;
}): boolean {
  if ((item.status ?? "pending") !== "approved") return false;
  if (item.active === false) return false;
  if (item.expireEnabled && item.expiresAt) {
    const end = new Date(item.expiresAt + "T23:59:59").getTime();
    if (Date.now() > end) return false;
  }
  return true;
}

function planRenewalDate(planId: MembershipPlanId, fromIso: string): string {
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  const months = plan?.months ?? 1;
  const d = new Date(fromIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function resolveContentStatus(
  restaurantId: string,
  kind: ContentKind,
  aiFlagged: boolean,
  settings: RestaurantAutoApprove[],
): ContentStatus {
  if (aiFlagged) return "pending";
  const s =
    settings.find((x) => x.restaurantId === restaurantId) ??
    defaultAutoApprove(restaurantId);
  return s[kind] ? "approved" : "pending";
}

function mockUserFromAccount(a: AuthAccount): MockUser {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    city: a.city,
    isMember: a.isMember,
    planId: a.planId,
    familySeats: a.familySeats,
    maxFamilySeats: a.maxFamilySeats,
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone,
    birthday: a.birthday,
    homeAddress: a.homeAddress,
    favoriteRestaurant: a.favoriteRestaurant,
    favoriteFoodType: a.favoriteFoodType,
    avatarDataUrl: a.avatarDataUrl,
    staffRole: a.staffRole,
    rewardPoints: a.rewardPoints ?? 0,
    rewardPointsLifetime: a.rewardPointsLifetime ?? 0,
    rewardsClaimed: a.rewardsClaimed ?? 0,
    badges: a.badges ?? [],
    householdMembers: a.householdMembers ?? [],
    awardedBonuses: a.awardedBonuses ?? [],
    feedPostCount: a.feedPostCount ?? 0,
    completedPassports: a.completedPassports ?? [],
    passportSnapshots: a.passportSnapshots ?? {},
    passportPointsClaimed: a.passportPointsClaimed ?? [],
    demoPassword: a.password,
    householdPlanId: a.householdPlanId,
    isPlanPrimary: a.isPlanPrimary,
    referralCode: a.referralCode,
    referralCount: a.referralCount ?? 0,
    referredByCode: a.referredByCode,
  };
}

function upsertAccountFromUser(
  accounts: AuthAccount[],
  user: MockUser,
  password?: string,
): AuthAccount[] {
  const email = user.email.trim().toLowerCase();
  const existing = accounts.find((a) => a.email.toLowerCase() === email);
  const base: AuthAccount = {
    id: existing?.id ?? user.id ?? `acct-${Date.now()}`,
    email,
    password: password ?? existing?.password ?? DEFAULT_DEMO_PASSWORD,
    role: user.role,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    birthday: user.birthday,
    homeAddress: user.homeAddress,
    city: user.city,
    isMember: user.isMember,
    planId: user.planId,
    familySeats: user.familySeats,
    maxFamilySeats: user.maxFamilySeats,
    staffRole: user.staffRole,
    householdPlanId: user.householdPlanId,
    isPlanPrimary: user.isPlanPrimary,
    householdMembers: user.householdMembers,
    rewardPoints: user.rewardPoints,
    rewardPointsLifetime: user.rewardPointsLifetime,
    rewardsClaimed: user.rewardsClaimed,
    badges: user.badges,
    completedPassports: user.completedPassports,
    passportSnapshots: user.passportSnapshots,
    passportPointsClaimed: user.passportPointsClaimed,
    awardedBonuses: user.awardedBonuses,
    feedPostCount: user.feedPostCount,
    favoriteRestaurant: user.favoriteRestaurant,
    favoriteFoodType: user.favoriteFoodType,
    avatarDataUrl: user.avatarDataUrl,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    referralCode: user.referralCode ?? existing?.referralCode,
    referralCount: user.referralCount ?? existing?.referralCount ?? 0,
    referredByCode: user.referredByCode ?? existing?.referredByCode,
  };
  if (existing) {
    return accounts.map((a) => (a.email.toLowerCase() === email ? base : a));
  }
  return [...accounts, base];
}

function load(): Persisted {
  if (typeof window === "undefined") return emptyPersisted();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("gorditopass-mvp-v12") ??
      localStorage.getItem("gorditopass-mvp-v11") ??
      localStorage.getItem("gorditopass-mvp-v10") ??
      localStorage.getItem("gorditopass-mvp-v9") ??
      localStorage.getItem("gorditopass-mvp-v8") ??
      localStorage.getItem("gorditopass-mvp-v7") ??
      localStorage.getItem("gorditopass-mvp-v6") ??
      localStorage.getItem("gorditopass-mvp-v5") ??
      localStorage.getItem("gorditopass-mvp-v4") ??
      localStorage.getItem("gorditopass-mvp-v3") ??
      localStorage.getItem("gorditopass-mvp-v2") ??
      localStorage.getItem("gorditopass-mvp-v1");
    if (!raw) return emptyPersisted();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      ...emptyPersisted(),
      ...parsed,
      notifications: parsed.notifications ?? [],
      accounts: parsed.accounts ?? [],
      autoApproveSettings: parsed.autoApproveSettings ?? [],
      chats: (parsed.chats ?? []).map((c) => {
        // Drop system/notification lines — rooms only keep real messages
        const messages = (c.messages ?? []).filter(
          (m) => m.authorId !== "system",
        );
        return c.type === "group"
          ? { ...c, isPublic: true, messages }
          : { ...c, messages };
      }),
      eventRsvps: parsed.eventRsvps ?? [],
      memberFollowing: parsed.memberFollowing ?? [],
      tasteBudRequests: parsed.tasteBudRequests ?? [],
      staffMembershipReferrals: parsed.staffMembershipReferrals ?? [],
      redemptions: (parsed.redemptions ?? []).map((r) => ({
        ...r,
        savingsUsd: r.savingsUsd ?? 0,
      })),
      partnerEvents: (parsed.partnerEvents ?? []).map((e) => ({
        ...e,
        status: e.status ?? "pending",
        createdAt: e.createdAt ?? e.date ?? new Date().toISOString(),
      })),
      partnerJobs: (parsed.partnerJobs ?? []).map((j) => ({
        ...j,
        status: j.status ?? "pending",
        createdAt: j.createdAt ?? j.postedAt ?? new Date().toISOString(),
      })),
      partnerDeals: (parsed.partnerDeals ?? []).map((d) => ({
        ...d,
        status: d.status ?? "pending",
      })),
      partnerMenuItems: (parsed.partnerMenuItems ?? []).map((m) => ({
        ...m,
        status: m.status ?? "pending",
        createdAt: m.createdAt ?? new Date().toISOString(),
      })),
      partnerStories: parsed.partnerStories ?? {},
      userReviews: parsed.userReviews ?? [],
      rewardHistory: parsed.rewardHistory ?? [],
      moderatedFeedPosts: parsed.moderatedFeedPosts ?? [],
      restaurantApprovalOverrides: parsed.restaurantApprovalOverrides ?? {},
      restaurantApplications: (parsed.restaurantApplications ?? []).map(
        (a, i) => ({
          ...a,
          id: a.id ?? `app-${a.at}-${i}`,
          status: a.status ?? "pending",
        }),
      ),
      user: parsed.user
        ? {
            ...parsed.user,
            rewardPoints: parsed.user.rewardPoints ?? 0,
            rewardPointsLifetime: parsed.user.rewardPointsLifetime ?? 0,
            rewardsClaimed: parsed.user.rewardsClaimed ?? 0,
            badges: parsed.user.badges ?? [],
            householdMembers: parsed.user.householdMembers ?? [],
            awardedBonuses: parsed.user.awardedBonuses ?? [],
            feedPostCount: parsed.user.feedPostCount ?? 0,
            completedPassports: parsed.user.completedPassports ?? [],
            passportSnapshots: parsed.user.passportSnapshots ?? {},
            passportPointsClaimed: parsed.user.passportPointsClaimed ?? [],
          }
        : null,
    };
  } catch {
    return emptyPersisted();
  }
}

function calcDealSavings(
  type: string,
  value: number | null,
  regularPriceUsd: number | undefined,
): { savingsUsd: number; revenueUsd: number } {
  const reg = regularPriceUsd && regularPriceUsd > 0 ? regularPriceUsd : 0;
  if (reg > 0) {
    if (type === "free_item") {
      return { savingsUsd: reg, revenueUsd: reg };
    }
    if (type === "bogo") {
      // Buy one get one free → save full price of the free item
      return { savingsUsd: reg, revenueUsd: reg * 2 };
    }
    if (
      (type === "percent_off" || type === "percent_off_total") &&
      value
    ) {
      return {
        savingsUsd: Math.round(reg * (value / 100) * 100) / 100,
        revenueUsd: reg,
      };
    }
    if (type === "fixed_price" && value != null) {
      return {
        savingsUsd: Math.max(0, Math.round((reg - value) * 100) / 100),
        revenueUsd: reg,
      };
    }
    return { savingsUsd: Math.round(reg * 0.2 * 100) / 100, revenueUsd: reg };
  }
  // Fallback estimates when no regular price on file
  if (type === "free_item") return { savingsUsd: 6, revenueUsd: 12 };
  if (type === "bogo") return { savingsUsd: 12, revenueUsd: 24 };
  if (
    (type === "percent_off" || type === "percent_off_total") &&
    value
  ) {
    const base = type === "percent_off_total" ? 40 : 12;
    return {
      savingsUsd: Math.round(((base * value) / 100) * 100) / 100,
      revenueUsd: base,
    };
  }
  return { savingsUsd: 5, revenueUsd: 10 };
}

function makeReferralCode(name: string): string {
  const slug = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase();
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GP-${slug || "FOOD"}${tail}`;
}

function estimateSavings(
  dealId: string,
  partnerDeals: PartnerDealDraft[],
): {
  savingsUsd: number;
  revenueUsd: number;
  restaurantId?: string;
  restaurantName?: string;
} {
  const partner = partnerDeals.find((d) => d.id === dealId);
  if (partner) {
    const calc = calcDealSavings(
      partner.type,
      partner.value,
      partner.regularPriceUsd,
    );
    const rest = getRestaurant(partner.restaurantId);
    return {
      ...calc,
      restaurantId: partner.restaurantId,
      restaurantName: rest?.name,
    };
  }
  const found = getDeal(dealId);
  if (!found) return { savingsUsd: 5, revenueUsd: 10 };
  const { deal, restaurant } = found;
  // Seed deals: use first menu item as regular price proxy when possible
  const menuPrice = restaurant.menu[0]?.priceUsd;
  const calc = calcDealSavings(deal.type, deal.value, menuPrice);
  return {
    ...calc,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
  };
}

function sumField(
  redemptions: Redemption[],
  field: "savingsUsd" | "revenueUsd",
  sinceMs: number | null,
  restaurantId?: string,
): number {
  const now = Date.now();
  return redemptions.reduce((sum, r) => {
    if (restaurantId && r.restaurantId !== restaurantId) return sum;
    const t = new Date(r.at).getTime();
    if (sinceMs != null && now - t > sinceMs) return sum;
    return sum + (r[field] || 0);
  }, 0);
}

function ytdStartMs(): number {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1).getTime();
}

function partnerRestaurantId(): string {
  return RESTAURANTS[0]?.id ?? "mi-tierra";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [memberFollowing, setMemberFollowing] = useState<string[]>([]);
  const [tasteBudRequests, setTasteBudRequests] = useState<TasteBudRequest[]>(
    [],
  );
  const [staffMembershipReferrals, setStaffMembershipReferrals] = useState<
    StaffMembershipReferral[]
  >([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [restaurantApplications, setRestaurantApplications] = useState<
    RestaurantApplication[]
  >([]);
  const [partnerEvents, setPartnerEvents] = useState<PartnerEvent[]>([]);
  const [partnerJobs, setPartnerJobs] = useState<JobPosting[]>([]);
  const [partnerDeals, setPartnerDeals] = useState<PartnerDealDraft[]>([]);
  const [partnerMenuItems, setPartnerMenuItems] = useState<PartnerMenuItem[]>(
    [],
  );
  const [partnerStories, setPartnerStories] = useState<Record<string, string>>(
    {},
  );
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [moderatedFeedPosts, setModeratedFeedPosts] = useState<
    ModeratedFeedPost[]
  >([]);
  const [restaurantApprovalOverrides, setRestaurantApprovalOverrides] =
    useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [autoApproveSettings, setAutoApproveSettings] = useState<
    RestaurantAutoApprove[]
  >([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [eventRsvps, setEventRsvps] = useState<EventRsvp[]>([]);
  const [city, setCity] = useState<CityId>("dallas");

  useEffect(() => {
    const data = load();
    setUser(data.user);
    setCart(data.cart);
    setFavorites(data.favorites);
    setFollowing(data.following);
    setMemberFollowing(data.memberFollowing ?? []);
    setTasteBudRequests(data.tasteBudRequests ?? []);
    setStaffMembershipReferrals(data.staffMembershipReferrals ?? []);
    setRedemptions(data.redemptions);
    setRestaurantApplications(data.restaurantApplications);
    setPartnerEvents(data.partnerEvents);
    setPartnerJobs(data.partnerJobs);
    setPartnerDeals(data.partnerDeals);
    setPartnerMenuItems(data.partnerMenuItems);
    setPartnerStories(data.partnerStories ?? {});
    setUserReviews(data.userReviews);
    setRewardHistory(data.rewardHistory);
    setModeratedFeedPosts(data.moderatedFeedPosts);
    setRestaurantApprovalOverrides(data.restaurantApprovalOverrides);
    setNotifications(data.notifications ?? []);
    setAccounts(data.accounts ?? []);
    setAutoApproveSettings(data.autoApproveSettings ?? []);
    setChats(data.chats ?? []);
    setEventRsvps(data.eventRsvps ?? []);
    if (data.user?.city) setCity(data.user.city);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = {
      user,
      cart,
      favorites,
      following,
      memberFollowing,
      tasteBudRequests,
      staffMembershipReferrals,
      redemptions,
      restaurantApplications,
      partnerEvents,
      partnerJobs,
      partnerDeals,
      partnerMenuItems,
      partnerStories,
      userReviews,
      rewardHistory,
      moderatedFeedPosts,
      restaurantApprovalOverrides,
      notifications,
      accounts,
      autoApproveSettings,
      chats,
      eventRsvps,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    user,
    cart,
    favorites,
    following,
    memberFollowing,
    tasteBudRequests,
    staffMembershipReferrals,
    redemptions,
    restaurantApplications,
    partnerEvents,
    partnerJobs,
    partnerDeals,
    partnerMenuItems,
    partnerStories,
    userReviews,
    rewardHistory,
    moderatedFeedPosts,
    restaurantApprovalOverrides,
    notifications,
    accounts,
    autoApproveSettings,
    chats,
    eventRsvps,
  ]);

  // Keep logged-in user mirrored into accounts list
  useEffect(() => {
    if (!hydrated || !user) return;
    setAccounts((prev) => upsertAccountFromUser(prev, user));
  }, [hydrated, user]);

  const signInDemo = useCallback(
    (role: MockUser["role"] = "diner", staffRole: StaffRole = "owner") => {
      const u = defaultUser(role, staffRole);
      u.demoPassword = DEFAULT_DEMO_PASSWORD;
      setUser(u);
      setAccounts((prev) => upsertAccountFromUser(prev, u, DEFAULT_DEMO_PASSWORD));
    },
    [],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

  const loginWithPassword = useCallback(
    (email: string, password: string) => {
      const key = email.trim().toLowerCase();
      if (!key || !password) {
        return { ok: false, error: "Email and password required." };
      }
      const acct = accounts.find((a) => a.email.toLowerCase() === key);
      if (!acct) {
        return {
          ok: false,
          error:
            "No account for that email. Use Sign up, membership intake, or demo sign-in first.",
        };
      }
      if (acct.password !== password) {
        return { ok: false, error: "Incorrect password." };
      }
      setUser(mockUserFromAccount(acct));
      if (acct.city) setCity(acct.city);
      return { ok: true };
    },
    [accounts],
  );

  const loginWithMagicLink = useCallback(
    (email: string) => {
      const key = email.trim().toLowerCase();
      if (!key.includes("@")) {
        return { ok: false, error: "Enter a valid email." };
      }
      let acct = accounts.find((a) => a.email.toLowerCase() === key);
      if (!acct) {
        // Create a light diner account on first magic link (demo)
        acct = {
          id: `acct-ml-${Date.now()}`,
          email: key,
          password: DEFAULT_DEMO_PASSWORD,
          role: "diner",
          name: key.split("@")[0],
          city: "dallas",
          isMember: false,
          planId: null,
          familySeats: 1,
          maxFamilySeats: MAX_FAMILY_SEATS,
          createdAt: new Date().toISOString(),
        };
        setAccounts((prev) => [...prev, acct!]);
      }
      setUser(mockUserFromAccount(acct));
      return { ok: true };
    },
    [accounts],
  );

  const registerDinerAccount = useCallback(
    (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      const key = input.email.trim().toLowerCase();
      if (!key.includes("@") || input.password.length < 6) {
        return {
          ok: false,
          error: "Valid email and password (6+ chars) required.",
        };
      }
      if (accounts.some((a) => a.email.toLowerCase() === key)) {
        return { ok: false, error: "An account already exists for that email." };
      }
      const name = `${input.firstName} ${input.lastName}`.trim();
      const acct: AuthAccount = {
        id: `acct-${Date.now()}`,
        email: key,
        password: input.password,
        role: "diner",
        name: name || key,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone,
        city: "dallas",
        isMember: false,
        planId: null,
        familySeats: 1,
        maxFamilySeats: MAX_FAMILY_SEATS,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, acct]);
      setUser(mockUserFromAccount(acct));
      return { ok: true };
    },
    [accounts],
  );

  const inviteStaffAccount = useCallback(
    (input: {
      email: string;
      name: string;
      staffRole: StaffRole;
      password?: string;
    }) => {
      const key = input.email.trim().toLowerCase();
      if (!key.includes("@") || !input.name.trim()) {
        return { ok: false, error: "Name and email required." };
      }
      const password = input.password || DEFAULT_DEMO_PASSWORD;
      const acct: AuthAccount = {
        id: `staff-${Date.now()}`,
        email: key,
        password,
        role: "restaurant",
        name: input.name.trim(),
        city: "dallas",
        isMember: true,
        planId: null,
        familySeats: 1,
        maxFamilySeats: MAX_FAMILY_SEATS,
        staffRole: input.staffRole,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => {
        const without = prev.filter((a) => a.email.toLowerCase() !== key);
        return [...without, acct];
      });
      return { ok: true };
    },
    [],
  );

  const ensureReferralCode = useCallback(() => {
    let code = "";
    setUser((u) => {
      if (!u) return u;
      if (u.referralCode) {
        code = u.referralCode;
        return u;
      }
      code = makeReferralCode(u.name || u.email || "FOOD");
      return { ...u, referralCode: code };
    });
    return code;
  }, []);

  const setReferredByCode = useCallback(
    (code: string) => {
      const cleaned = code.trim().toUpperCase();
      if (!cleaned) return { ok: false, error: "Enter a referral code." };
      const mine = (user?.referralCode ?? "").toUpperCase();
      if (mine && cleaned === mine) {
        return { ok: false, error: "You can’t use your own code." };
      }
      setUser((u) =>
        u
          ? {
              ...u,
              referredByCode: cleaned,
              referralCode:
                u.referralCode ?? makeReferralCode(u.name || "FOOD"),
            }
          : u,
      );
      return { ok: true };
    },
    [user?.referralCode],
  );

  const activateMembership = useCallback(
    (
      planId: MembershipPlanId,
      seats: number,
      members?: MemberSeatProfile[],
      referralCodeInput?: string,
    ) => {
      const seatCount = Math.min(Math.max(seats, 1), MAX_FAMILY_SEATS);
      const list =
        members && members.length > 0
          ? members.slice(0, seatCount)
          : undefined;
      const primary = list?.find((m) => m.isPrimary) ?? list?.[0];
      const joinPts = POINT_ACTIONS.join_member.points;
      const planGroupId = `plan-${Date.now()}`;
      const refCode = (
        referralCodeInput ||
        user?.referredByCode ||
        ""
      )
        .trim()
        .toUpperCase();

      // Create a separate login account for every seat (recommended model)
      if (list && list.length > 0) {
        setAccounts((prev) => {
          let next = [...prev];
          for (const m of list) {
            const email = m.email.trim().toLowerCase();
            const name = `${m.firstName} ${m.lastName}`.trim();
            const isPrimary = Boolean(m.isPrimary);
            const existing = next.find((a) => a.email.toLowerCase() === email);
            // Partners who add membership keep restaurant/admin role + staffRole
            const keepPartnerRole =
              existing?.role === "restaurant" || existing?.role === "admin"
                ? existing.role
                : "diner";
            const acct: AuthAccount = {
              id: existing?.id ?? m.id ?? `acct-${email}`,
              email,
              password: existing?.password ?? DEFAULT_DEMO_PASSWORD,
              role: keepPartnerRole,
              name: name || email,
              firstName: m.firstName,
              lastName: m.lastName,
              phone: m.phone,
              birthday: m.birthday,
              homeAddress: m.homeAddress,
              city: "dallas",
              isMember: true,
              planId,
              familySeats: seatCount,
              maxFamilySeats: MAX_FAMILY_SEATS,
              householdPlanId: planGroupId,
              isPlanPrimary: isPrimary,
              householdMembers: list,
              staffRole: existing?.staffRole,
              rewardPoints: isPrimary
                ? (existing?.rewardPoints ?? 0) +
                  (existing?.isMember ? 0 : joinPts)
                : (existing?.rewardPoints ?? 0),
              rewardPointsLifetime: isPrimary
                ? (existing?.rewardPointsLifetime ?? 0) +
                  (existing?.isMember ? 0 : joinPts)
                : (existing?.rewardPointsLifetime ?? 0),
              createdAt: existing?.createdAt ?? new Date().toISOString(),
              referralCode: existing?.referralCode,
              referralCount: existing?.referralCount ?? 0,
              referredByCode: existing?.referredByCode,
              awardedBonuses: existing?.awardedBonuses,
            };
            next = next.filter((a) => a.email.toLowerCase() !== email);
            next.push(acct);
          }
          return next;
        });
      }

      const historyRows: RewardEvent[] = [];
      let alreadyMember = false;

      setUser((u) => {
        // Partner staff should not convert their own login into a diner membership
        // via this path when role is restaurant — diner signup only.
        const base = u?.role === "restaurant" ? defaultUser("diner") : (u ?? defaultUser("diner"));
        // If currently a partner, keep partner session unchanged for membership of customer only
        // (activateMembership is for diner flow; staff use staffEnrollCustomerMembership)
        if (u?.role === "restaurant") {
          // Don't overwrite partner session when somehow called from partner account
          alreadyMember = true;
          return u;
        }
        alreadyMember = base.isMember;
        const fullName = primary
          ? `${primary.firstName} ${primary.lastName}`.trim()
          : base.name;
        const activatedAt =
          base.membershipActivatedAt ?? new Date().toISOString();
        const keepRole =
          base.role === "admin" ? base.role : "diner";
        const myCode =
          base.referralCode ?? makeReferralCode(fullName || base.email);
        let pts = base.rewardPoints ?? 0;
        let ptsLife = base.rewardPointsLifetime ?? 0;
        const bonuses = [...(base.awardedBonuses ?? [])];

        if (!alreadyMember && joinPts > 0) {
          pts += joinPts;
          ptsLife += joinPts;
          historyRows.push({
            id: `rw-join-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: joinPts,
            note: POINT_ACTIONS.join_member.label,
          });
        }

        // Referral welcome bonus for friend
        if (
          !alreadyMember &&
          refCode &&
          refCode !== myCode.toUpperCase() &&
          !bonuses.includes("referral_friend")
        ) {
          const friendPts = POINT_ACTIONS.referral_friend.points;
          pts += friendPts;
          ptsLife += friendPts;
          bonuses.push("referral_friend");
          historyRows.push({
            id: `rw-ref-friend-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: friendPts,
            note: POINT_ACTIONS.referral_friend.label,
          });
        }

        return {
          ...base,
          isMember: true,
          planId,
          familySeats: seatCount,
          role: keepRole,
          staffRole: base.staffRole,
          name: fullName || base.name,
          firstName: primary?.firstName ?? base.firstName,
          lastName: primary?.lastName ?? base.lastName,
          email: primary?.email || base.email,
          phone: primary?.phone ?? base.phone,
          birthday: primary?.birthday ?? base.birthday,
          homeAddress: primary?.homeAddress ?? base.homeAddress,
          householdMembers: list ?? base.householdMembers ?? [],
          householdPlanId: planGroupId,
          isPlanPrimary: true,
          demoPassword: base.demoPassword ?? DEFAULT_DEMO_PASSWORD,
          membershipActivatedAt: activatedAt,
          membershipRenewsAt: planRenewalDate(planId, activatedAt),
          rewardPoints: pts,
          rewardPointsLifetime: ptsLife,
          rewardsClaimed: base.rewardsClaimed ?? 0,
          badges: base.badges ?? [],
          awardedBonuses: bonuses,
          passportPointsClaimed: base.passportPointsClaimed ?? [],
          referralCode: myCode,
          referredByCode: refCode || base.referredByCode,
        };
      });

      if (historyRows.length) {
        setRewardHistory((prev) => [...historyRows, ...prev]);
      }

      // Credit referrer account (+ optional live user if they're the same session later)
      if (!alreadyMember && refCode) {
        const refPts = POINT_ACTIONS.referral_referrer.points;
        setAccounts((prev) =>
          prev.map((a) => {
            if ((a.referralCode ?? "").toUpperCase() === refCode) {
              return {
                ...a,
                rewardPoints: (a.rewardPoints ?? 0) + refPts,
                rewardPointsLifetime: (a.rewardPointsLifetime ?? 0) + refPts,
                referralCount: (a.referralCount ?? 0) + 1,
              };
            }
            if (
              list?.some(
                (m) => m.email.trim().toLowerCase() === a.email.toLowerCase(),
              )
            ) {
              return { ...a, isMember: true, planId };
            }
            return a;
          }),
        );
        // If the referrer is currently signed in (same browser, switched), credit live user
        setUser((u) => {
          if (!u || (u.referralCode ?? "").toUpperCase() !== refCode) return u;
          return {
            ...u,
            rewardPoints: (u.rewardPoints ?? 0) + refPts,
            rewardPointsLifetime: (u.rewardPointsLifetime ?? 0) + refPts,
            referralCount: (u.referralCount ?? 0) + 1,
          };
        });
      }
    },
    [user?.referredByCode],
  );

  /** Partner staff enrolls a non-member customer → staff earns $5 referral */
  const staffEnrollCustomerMembership = useCallback(
    (input: {
      customerEmail: string;
      customerFirstName: string;
      customerLastName: string;
      customerPhone?: string;
      planId: MembershipPlanId;
      seats?: number;
    }): { ok: boolean; error?: string; bonusUsd?: number } => {
      if (!user || user.role !== "restaurant") {
        return { ok: false, error: "Sign in as partner staff to enroll customers." };
      }
      const email = input.customerEmail.trim().toLowerCase();
      if (!email.includes("@")) {
        return { ok: false, error: "Enter a valid customer email." };
      }
      if (!input.customerFirstName.trim() || !input.customerLastName.trim()) {
        return { ok: false, error: "Customer first and last name required." };
      }
      const existing = accounts.find((a) => a.email.toLowerCase() === email);
      if (existing?.isMember) {
        return {
          ok: false,
          error: "This customer already has an active membership.",
        };
      }
      const name =
        `${input.customerFirstName.trim()} ${input.customerLastName.trim()}`.trim();
      const seats = Math.min(
        Math.max(input.seats ?? 1, 1),
        MAX_FAMILY_SEATS,
      );
      const planGroupId = `plan-staff-${Date.now()}`;
      const joinPts = POINT_ACTIONS.join_member.points;
      const customerId = existing?.id ?? `acct-${email}`;
      const activatedAt = new Date().toISOString();
      const bonus = STAFF_MEMBERSHIP_REFERRAL.amountUsd;

      setAccounts((prev) => {
        const without = prev.filter((a) => a.email.toLowerCase() !== email);
        const acct: AuthAccount = {
          id: customerId,
          email,
          password: existing?.password ?? DEFAULT_DEMO_PASSWORD,
          role: "diner",
          name,
          firstName: input.customerFirstName.trim(),
          lastName: input.customerLastName.trim(),
          phone: input.customerPhone?.trim() || existing?.phone,
          city: "dallas",
          isMember: true,
          planId: input.planId,
          familySeats: seats,
          maxFamilySeats: MAX_FAMILY_SEATS,
          householdPlanId: planGroupId,
          isPlanPrimary: true,
          rewardPoints: (existing?.rewardPoints ?? 0) + joinPts,
          rewardPointsLifetime: (existing?.rewardPointsLifetime ?? 0) + joinPts,
          referralCode: existing?.referralCode ?? makeReferralCode(name),
          createdAt: existing?.createdAt ?? activatedAt,
        };
        return [...without, acct];
      });

      setStaffMembershipReferrals((prev) => [
        {
          id: `sref-${Date.now()}`,
          staffUserId: user.id,
          staffName: user.name,
          staffEmail: user.email,
          staffRole: user.staffRole,
          customerUserId: customerId,
          customerEmail: email,
          customerName: name,
          planId: input.planId,
          amountUsd: bonus,
          at: activatedAt,
          monthKey: monthKeyFrom(),
          checkStatus: "pending",
        },
        ...prev,
      ]);

      return { ok: true, bonusUsd: bonus };
    },
    [user, accounts],
  );

  const markStaffReferralChecksPaid = useCallback(
    (monthKey: string, staffUserId?: string) => {
      setStaffMembershipReferrals((prev) =>
        prev.map((r) => {
          if (r.monthKey !== monthKey || r.checkStatus !== "pending") return r;
          if (staffUserId && r.staffUserId !== staffUserId) return r;
          return { ...r, checkStatus: "paid" as const };
        }),
      );
    },
    [],
  );

  const followMember = useCallback(
    (userId: string) => {
      if (!user || user.id === userId) return;
      setMemberFollowing((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
    },
    [user],
  );

  const unfollowMember = useCallback((userId: string) => {
    setMemberFollowing((prev) => prev.filter((id) => id !== userId));
  }, []);

  const isFollowingMember = useCallback(
    (userId: string) => memberFollowing.includes(userId),
    [memberFollowing],
  );

  const requestTasteBud = useCallback(
    (userId: string): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Sign in first." };
      if (user.id === userId) {
        return { ok: false, error: "You can’t request yourself." };
      }
      if (!user.isMember && user.role === "diner") {
        return { ok: false, error: "Active membership required for Taste Buds." };
      }
      const target =
        accounts.find((a) => a.id === userId) ??
        (userId.startsWith("mem-")
          ? {
              id: userId,
              name: userId.replace("mem-", "").replace(/^\w/, (c) => c.toUpperCase()),
            }
          : null);
      if (!target) return { ok: false, error: "Member not found." };

      const alreadyAccepted = tasteBudRequests.some(
        (r) =>
          r.status === "accepted" &&
          ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.toUserId === user.id && r.fromUserId === userId)),
      );
      if (alreadyAccepted) {
        return { ok: false, error: "Already Taste Buds." };
      }
      const pending = tasteBudRequests.some(
        (r) =>
          r.status === "pending" &&
          ((r.fromUserId === user.id && r.toUserId === userId) ||
            (r.toUserId === user.id && r.fromUserId === userId)),
      );
      if (pending) {
        return { ok: false, error: "Request already pending." };
      }

      // Demo seed members auto-accept
      const autoAccept = userId.startsWith("mem-");
      setTasteBudRequests((prev) => [
        {
          id: `tb-${Date.now()}`,
          fromUserId: user.id,
          fromName: user.name,
          fromAvatar: user.avatarDataUrl,
          toUserId: userId,
          toName: "name" in target ? target.name : "Member",
          toAvatar:
            "avatarDataUrl" in target
              ? (target as AuthAccount).avatarDataUrl
              : undefined,
          status: autoAccept ? "accepted" : "pending",
          createdAt: new Date().toISOString(),
          respondedAt: autoAccept ? new Date().toISOString() : undefined,
        },
        ...prev,
      ]);
      // Also follow when becoming Taste Buds
      setMemberFollowing((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
      return { ok: true };
    },
    [user, accounts, tasteBudRequests],
  );

  const respondTasteBud = useCallback(
    (requestId: string, accept: boolean): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Sign in first." };
      const req = tasteBudRequests.find((r) => r.id === requestId);
      if (!req || req.toUserId !== user.id) {
        return { ok: false, error: "Request not found." };
      }
      if (req.status !== "pending") {
        return { ok: false, error: "Already responded." };
      }
      setTasteBudRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: accept ? "accepted" : "declined",
                respondedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      if (accept) {
        setMemberFollowing((prev) =>
          prev.includes(req.fromUserId) ? prev : [...prev, req.fromUserId],
        );
      }
      return { ok: true };
    },
    [user, tasteBudRequests],
  );

  const removeTasteBud = useCallback(
    (userId: string) => {
      if (!user) return;
      setTasteBudRequests((prev) =>
        prev.map((r) => {
          if (r.status !== "accepted") return r;
          const pair =
            (r.fromUserId === user.id && r.toUserId === userId) ||
            (r.toUserId === user.id && r.fromUserId === userId);
          return pair
            ? { ...r, status: "declined" as const, respondedAt: new Date().toISOString() }
            : r;
        }),
      );
    },
    [user],
  );

  const tasteBudIds = useMemo(() => {
    if (!user) return [] as string[];
    const ids = new Set<string>();
    for (const r of tasteBudRequests) {
      if (r.status !== "accepted") continue;
      if (r.fromUserId === user.id) ids.add(r.toUserId);
      if (r.toUserId === user.id) ids.add(r.fromUserId);
    }
    return [...ids];
  }, [user, tasteBudRequests]);

  const updateProfile = useCallback((patch: Partial<MockUser>) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      if (patch.firstName != null || patch.lastName != null) {
        const fn = patch.firstName ?? u.firstName ?? "";
        const ln = patch.lastName ?? u.lastName ?? "";
        if (fn || ln) next.name = `${fn} ${ln}`.trim();
      }
      return next;
    });
  }, []);

  const awardPoints = useCallback(
    (
      action: PointActionId,
      opts?: { note?: string; onceKey?: string },
    ): number => {
      const def = POINT_ACTIONS[action];
      if (!def || def.points <= 0) return 0;
      let earned = 0;
      setUser((u) => {
        if (!u || u.role !== "diner") return u;
        const once = opts?.onceKey ?? action;
        // onceKey unique bonuses
        if (
          opts?.onceKey &&
          (u.awardedBonuses ?? []).includes(opts.onceKey)
        ) {
          return u;
        }
        earned = def.points;
        return {
          ...u,
          rewardPoints: (u.rewardPoints ?? 0) + earned,
          rewardPointsLifetime: (u.rewardPointsLifetime ?? 0) + earned,
          awardedBonuses: opts?.onceKey
            ? [...(u.awardedBonuses ?? []), once]
            : u.awardedBonuses,
        };
      });
      if (earned > 0) {
        setRewardHistory((prev) => [
          {
            id: `rw-${action}-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: earned,
            note: opts?.note ?? def.label,
          },
          ...prev,
        ]);
      }
      return earned;
    },
    [],
  );

  const isRestaurantApproved = useCallback(
    (restaurantId: string) => {
      const base = RESTAURANTS.find((r) => r.id === restaurantId)?.approved;
      const override = restaurantApprovalOverrides[restaurantId];
      if (override !== undefined) return override;
      return base ?? false;
    },
    [restaurantApprovalOverrides],
  );

  /**
   * Optional overrides avoid off-by-one badges: callers that just updated
   * redemptions/favorites/reviews pass the *new* arrays because React state
   * is still stale inside queueMicrotask / same-tick callbacks.
   */
  const evaluateBadges = useCallback(
    (overrides?: {
      redemptions?: Redemption[];
      favorites?: string[];
      userReviews?: Review[];
    }): string[] => {
      const redList = overrides?.redemptions ?? redemptions;
      const favList = overrides?.favorites ?? favorites;
      const revList = overrides?.userReviews ?? userReviews;
      let unlocked: string[] = [];
      setUser((u) => {
        if (!u || u.role !== "diner") return u;
        const stats = {
          redemptions: redList.length,
          reviews: revList.filter((r) => r.author === u.name || r.fromFeed)
            .length,
          feed_posts: u.feedPostCount ?? 0,
          lifetime_points: u.rewardPointsLifetime ?? 0,
          savings_ytd: sumField(
            redList,
            "savingsUsd",
            Date.now() - ytdStartMs(),
          ),
          rewards_claimed: u.rewardsClaimed ?? 0,
          household: u.familySeats ?? 1,
          favorites: favList.length,
        };
        const have = new Set(u.badges ?? []);
        const newly: string[] = [];
        for (const b of BADGES) {
          if (have.has(b.id)) continue;
          const r = b.rule;
          let ok = false;
          if (r.type === "redemptions") ok = stats.redemptions >= r.min;
          else if (r.type === "reviews") ok = stats.reviews >= r.min;
          else if (r.type === "feed_posts") ok = stats.feed_posts >= r.min;
          else if (r.type === "lifetime_points")
            ok = stats.lifetime_points >= r.min;
          else if (r.type === "savings_ytd") ok = stats.savings_ytd >= r.min;
          else if (r.type === "rewards_claimed")
            ok = stats.rewards_claimed >= r.min;
          else if (r.type === "household") ok = stats.household >= r.min;
          else if (r.type === "favorites") ok = stats.favorites >= r.min;
          if (ok) {
            have.add(b.id);
            newly.push(b.id);
          }
        }
        // Passport badges mirror completedPassports
        for (const pid of u.completedPassports ?? []) {
          const badgeId = `passport_${pid}`;
          if (!have.has(badgeId)) {
            have.add(badgeId);
            newly.push(badgeId);
          }
        }
        unlocked = Array.from(have);
        if (newly.length === 0 && unlocked.length === (u.badges ?? []).length)
          return u;
        return { ...u, badges: unlocked };
      });
      return unlocked;
    },
    [redemptions, userReviews, favorites],
  );

  const evaluatePassports = useCallback((redListOverride?: Redemption[]) => {
    const redList = redListOverride ?? redemptions;
    const visited = new Set(
      redList
        .map((r) => r.restaurantId)
        .filter((id): id is string => Boolean(id)),
    );

    const notes: AppNotification[] = [];
    const historyRows: RewardEvent[] = [];
    let pointsToAward = 0;

    setUser((u) => {
      if (!u || u.role !== "diner") return u;

      let completed = [...(u.completedPassports ?? [])];
      const snapshots = { ...(u.passportSnapshots ?? {}) };
      const pointsClaimed = new Set(u.passportPointsClaimed ?? []);
      let badges = new Set(u.badges ?? []);
      let pts = u.rewardPoints ?? 0;
      let ptsLife = u.rewardPointsLifetime ?? 0;
      let changed = false;

      for (const p of PASSPORTS) {
        const list = getPassportRestaurants(p, isRestaurantApproved);
        const currentIds = list.map((r) => r.id).sort();
        if (currentIds.length === 0) continue;

        const allVisited = currentIds.every((id) => visited.has(id));
        const wasHeld = completed.includes(p.id);
        const snap = snapshots[p.id];
        const badgeId = `passport_${p.id}`;
        const newSpots =
          snap && snap.length > 0
            ? list.filter((r) => !snap.includes(r.id))
            : [];

        // Held badge: only THIS passport pauses when NEW partners join
        if (wasHeld) {
          if (!snap || snap.length === 0) {
            // Repair missing snapshot — do not wipe other passports
            snapshots[p.id] = currentIds;
            changed = true;
            if (!allVisited) {
              completed = completed.filter((id) => id !== p.id);
              badges.delete(badgeId);
            }
            continue;
          }

          if (newSpots.length > 0) {
            completed = completed.filter((id) => id !== p.id);
            badges.delete(badgeId);
            snapshots[p.id] = currentIds;
            changed = true;
            const names = newSpots.map((r) => r.name).join(", ");
            notes.push({
              id: `n-travel-${p.id}-${Date.now()}`,
              at: new Date().toISOString(),
              type: "passport_revoked",
              title: `${p.emoji} New place to stamp`,
              body: `${names} joined your ${p.name}. Your points stay. Visit ${newSpots.length === 1 ? "this partner" : "these partners"} to restore the passport badge.`,
              read: false,
              passportId: p.id,
            });
          }
          continue;
        }

        // Not held: notify if more partners appeared while in progress
        if (snap && newSpots.length > 0 && !allVisited) {
          snapshots[p.id] = currentIds;
          changed = true;
          const names = newSpots.map((r) => r.name).join(", ");
          notes.push({
            id: `n-travel2-${p.id}-${Date.now()}`,
            at: new Date().toISOString(),
            type: "info",
            title: `${p.emoji} Passport path updated`,
            body: `${names} added to ${p.name}. Keep collecting stamps — points you’ve earned stay.`,
            read: false,
            passportId: p.id,
          });
        }

        // Complete / restore badge
        if (allVisited) {
          if (!completed.includes(p.id)) {
            completed.push(p.id);
            changed = true;
          }
          snapshots[p.id] = currentIds;
          badges.add(badgeId);
          changed = true;

          const firstTimePoints = !pointsClaimed.has(p.id);
          if (firstTimePoints) {
            pointsClaimed.add(p.id);
            pointsToAward += p.completePoints;
            pts += p.completePoints;
            ptsLife += p.completePoints;
            historyRows.push({
              id: `rw-pass-${p.id}-${Date.now()}`,
              at: new Date().toISOString(),
              type: "earn",
              points: p.completePoints,
              note: `${p.name} complete`,
            });
            notes.push({
              id: `n-earn-${p.id}-${Date.now()}`,
              at: new Date().toISOString(),
              type: "passport_earned",
              title: `${p.emoji} ${p.name} earned!`,
              body: `Every live partner stamped. +${p.completePoints} pts (one-time). Keep exploring.`,
              read: false,
              passportId: p.id,
            });
          } else if (!wasHeld) {
            notes.push({
              id: `n-restore-${p.id}-${Date.now()}`,
              at: new Date().toISOString(),
              type: "passport_earned",
              title: `${p.emoji} ${p.name} restored`,
              body: `Badge is back after your new stamp(s). No extra points (already awarded once).`,
              read: false,
              passportId: p.id,
            });
          }
        } else if (!snap) {
          // Track known set for progress (no badge yet)
          snapshots[p.id] = currentIds;
          changed = true;
        }
      }

      if (!changed && pointsToAward === 0 && notes.length === 0) return u;
      return {
        ...u,
        completedPassports: completed,
        passportSnapshots: snapshots,
        passportPointsClaimed: Array.from(pointsClaimed),
        badges: Array.from(badges),
        rewardPoints: pts,
        rewardPointsLifetime: ptsLife,
      };
    });

    if (notes.length) {
      setNotifications((prev) => [...notes, ...prev]);
    }
    if (historyRows.length) {
      setRewardHistory((prev) => [...historyRows, ...prev]);
    }
  }, [redemptions, isRestaurantApproved]);

  // Note: evaluatePassports still closes over isRestaurantApproved; redList is passed in.

  const addToCart = useCallback(
    (line: Omit<CartLine, "qty">, qty = 1) => {
      setCart((prev) => {
        const sameRestaurant =
          prev.length === 0 || prev[0].restaurantId === line.restaurantId;
        const base = sameRestaurant ? prev : [];
        const existing = base.find((l) => l.menuItemId === line.menuItemId);
        if (existing) {
          return base.map((l) =>
            l.menuItemId === line.menuItemId
              ? { ...l, qty: l.qty + qty }
              : l,
          );
        }
        return [...base, { ...line, qty }];
      });
    },
    [],
  );

  const updateQty = useCallback((menuItemId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.menuItemId === menuItemId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.priceUsd * l.qty, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.qty, 0),
    [cart],
  );

  const toggleFavorite = useCallback(
    (restaurantId: string) => {
      // Guests cannot save — need an account to attach favorites
      if (!user) return;
      setFavorites((prev) => {
        const removing = prev.includes(restaurantId);
        if (removing) return prev.filter((id) => id !== restaurantId);
        const next = [...prev, restaurantId];
        queueMicrotask(() => {
          awardPoints("favorite");
          evaluateBadges({ favorites: next });
        });
        return next;
      });
    },
    [awardPoints, evaluateBadges, user],
  );

  const toggleFollow = useCallback(
    (id: string) => {
      if (!user) return;
      setFollowing((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [user],
  );

  const createRedeemCode = useCallback((dealId: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 60_000;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(
        `redeem-${dealId}`,
        JSON.stringify({ code, expiresAt }),
      );
    }
    return { code, expiresAt };
  }, []);

  const recordRedemption = useCallback(
    (dealId: string, code: string) => {
      const meta = estimateSavings(dealId, partnerDeals);
      let isFirst = false;
      let nextReds: Redemption[] = [];
      setRedemptions((prev) => {
        isFirst = prev.length === 0;
        nextReds = [
          {
            dealId,
            code,
            at: new Date().toISOString(),
            ...meta,
          },
          ...prev,
        ];
        return nextReds;
      });
      const basePts = POINT_ACTIONS.redeem.points;
      const bonusPts = isFirst ? POINT_ACTIONS.first_redeem.points : 0;
      const points = basePts + bonusPts;
      let totalPoints = points;
      setUser((u) => {
        // Members earn points (diner membership, or any member account)
        if (!u || !u.isMember) return u;
        totalPoints = (u.rewardPoints ?? 0) + points;
        return {
          ...u,
          rewardPoints: totalPoints,
          rewardPointsLifetime: (u.rewardPointsLifetime ?? 0) + points,
          awardedBonuses: isFirst
            ? [...(u.awardedBonuses ?? []), "first_redeem"]
            : u.awardedBonuses,
        };
      });
      setRewardHistory((prev) => {
        const rows: RewardEvent[] = [
          {
            id: `rw-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: basePts,
            note: POINT_ACTIONS.redeem.label,
          },
        ];
        if (bonusPts > 0) {
          rows.unshift({
            id: `rw-first-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: bonusPts,
            note: POINT_ACTIONS.first_redeem.label,
          });
        }
        return [...rows, ...prev];
      });
      // Pass nextReds so badges/passports see this redemption immediately
      queueMicrotask(() => {
        evaluatePassports(nextReds);
        evaluateBadges({ redemptions: nextReds });
      });
      return {
        pointsEarned: points,
        totalPoints,
        savingsUsd: meta.savingsUsd,
        revenueUsd: meta.revenueUsd,
      };
    },
    [partnerDeals, evaluateBadges, evaluatePassports],
  );

  const claimReward = useCallback(() => {
    let ok = false;
    setUser((u) => {
      if (!u || u.role !== "diner") return u;
      const pts = u.rewardPoints ?? 0;
      if (pts < REWARDS.pointsPerReward) return u;
      ok = true;
      return {
        ...u,
        rewardPoints: pts - REWARDS.pointsPerReward,
        rewardsClaimed: (u.rewardsClaimed ?? 0) + 1,
      };
    });
    if (ok) {
      setRewardHistory((prev) => [
        {
          id: `rw-claim-${Date.now()}`,
          at: new Date().toISOString(),
          type: "claim",
          points: -REWARDS.pointsPerReward,
          note: `Claimed ${REWARDS.rewardLabel}`,
        },
        ...prev,
      ]);
      queueMicrotask(() => evaluateBadges());
    }
    return ok;
  }, [evaluateBadges]);

  const submitRestaurantApplication = useCallback(
    (app: Omit<RestaurantApplication, "at" | "status" | "id">) => {
      setRestaurantApplications((prev) => [
        {
          ...app,
          id: `app-${Date.now()}`,
          at: new Date().toISOString(),
          status: "pending",
        },
        ...prev,
      ]);
    },
    [],
  );

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      setRestaurantApplications((prev) =>
        prev.map((a) =>
          (a.id ?? a.at + a.email) === id || a.id === id
            ? { ...a, status }
            : a,
        ),
      );
    },
    [],
  );

  const setPartnerDealStatus = useCallback(
    (id: string, status: ContentStatus) => {
      setPartnerDeals((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status, active: status === "approved" }
            : d,
        ),
      );
    },
    [],
  );

  const setPartnerMenuStatus = useCallback(
    (id: string, status: ContentStatus) => {
      setPartnerMenuItems((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, status, active: status === "approved" }
            : m,
        ),
      );
    },
    [],
  );

  const setPartnerEventStatus = useCallback(
    (id: string, status: ContentStatus) => {
      setPartnerEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e)),
      );
    },
    [],
  );

  const setPartnerJobStatus = useCallback(
    (id: string, status: ContentStatus) => {
      setPartnerJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status } : j)),
      );
    },
    [],
  );

  const getAutoApprove = useCallback(
    (restaurantId: string) =>
      autoApproveSettings.find((s) => s.restaurantId === restaurantId) ??
      defaultAutoApprove(restaurantId),
    [autoApproveSettings],
  );

  const setAutoApprove = useCallback(
    (
      restaurantId: string,
      patch: Partial<Omit<RestaurantAutoApprove, "restaurantId">>,
    ) => {
      setAutoApproveSettings((prev) => {
        const existing = prev.find((s) => s.restaurantId === restaurantId);
        if (existing) {
          return prev.map((s) =>
            s.restaurantId === restaurantId ? { ...s, ...patch } : s,
          );
        }
        return [...prev, { ...defaultAutoApprove(restaurantId), ...patch }];
      });
    },
    [],
  );

  const addHouseholdSeat = useCallback(
    (seat: Omit<MemberSeatProfile, "id" | "isPrimary">) => {
      if (!user || user.role !== "diner") {
        return { ok: false, error: "Sign in as a member first." };
      }
      const seats = user.householdMembers ?? [];
      if (seats.length >= MAX_FAMILY_SEATS) {
        return {
          ok: false,
          error: `Max ${MAX_FAMILY_SEATS} seats on a plan.`,
        };
      }
      if (!seat.email.includes("@")) {
        return { ok: false, error: "Valid email required." };
      }
      const email = seat.email.trim().toLowerCase();
      if (
        seats.some((s) => s.email.trim().toLowerCase() === email) ||
        accounts.some((a) => a.email.toLowerCase() === email)
      ) {
        return { ok: false, error: "That email already has a seat or account." };
      }
      const newSeat: MemberSeatProfile = {
        ...seat,
        id: `seat-${Date.now()}`,
        email,
        isPrimary: false,
      };
      const nextSeats = [...seats, newSeat];
      const planId = user.planId ?? "monthly";
      const planGroupId = user.householdPlanId ?? `plan-${Date.now()}`;
      setUser((u) =>
        u
          ? {
              ...u,
              householdMembers: nextSeats,
              familySeats: nextSeats.length,
              isMember: true,
              planId: u.planId ?? planId,
              householdPlanId: planGroupId,
              membershipActivatedAt:
                u.membershipActivatedAt ?? new Date().toISOString(),
              membershipRenewsAt:
                u.membershipRenewsAt ??
                planRenewalDate(
                  (u.planId ?? planId) as MembershipPlanId,
                  u.membershipActivatedAt ?? new Date().toISOString(),
                ),
            }
          : u,
      );
      setAccounts((prev) => {
        const acct: AuthAccount = {
          id: newSeat.id,
          email,
          password: DEFAULT_DEMO_PASSWORD,
          role: "diner",
          name: `${seat.firstName} ${seat.lastName}`.trim(),
          firstName: seat.firstName,
          lastName: seat.lastName,
          phone: seat.phone,
          birthday: seat.birthday,
          homeAddress: seat.homeAddress,
          city: user.city,
          isMember: true,
          planId: user.planId ?? planId,
          familySeats: nextSeats.length,
          maxFamilySeats: MAX_FAMILY_SEATS,
          householdPlanId: planGroupId,
          isPlanPrimary: false,
          householdMembers: nextSeats,
          createdAt: new Date().toISOString(),
        };
        return [...prev.filter((a) => a.email.toLowerCase() !== email), acct];
      });
      return { ok: true };
    },
    [user, accounts],
  );

  const removeHouseholdSeat = useCallback(
    (seatId: string) => {
      if (!user || user.role !== "diner") {
        return { ok: false, error: "Sign in as a member first." };
      }
      const seats = user.householdMembers ?? [];
      if (seats.length < 2) {
        return { ok: false, error: "Need at least two seats to remove one." };
      }
      const target = seats.find((s) => s.id === seatId);
      if (!target) return { ok: false, error: "Seat not found." };
      if (target.isPrimary) {
        return { ok: false, error: "Cannot remove the primary billing seat." };
      }
      const nextSeats = seats.filter((s) => s.id !== seatId);
      setUser((u) =>
        u
          ? {
              ...u,
              householdMembers: nextSeats,
              familySeats: nextSeats.length,
            }
          : u,
      );
      setAccounts((prev) =>
        prev.filter(
          (a) => a.email.toLowerCase() !== target.email.trim().toLowerCase(),
        ),
      );
      return { ok: true };
    },
    [user],
  );

  const setRestaurantApproved = useCallback(
    (restaurantId: string, approved: boolean) => {
      setRestaurantApprovalOverrides((prev) => ({
        ...prev,
        [restaurantId]: approved,
      }));
      // New live partner may expand a cuisine passport → revoke if held
      queueMicrotask(() => evaluatePassports());
    },
    [evaluatePassports],
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const hideFeedPost = useCallback((post: Omit<ModeratedFeedPost, "hidden">) => {
    setModeratedFeedPosts((prev) => {
      const existing = prev.find((p) => p.id === post.id);
      if (existing) {
        return prev.map((p) =>
          p.id === post.id ? { ...p, hidden: true } : p,
        );
      }
      return [{ ...post, hidden: true }, ...prev];
    });
  }, []);

  const unhideFeedPost = useCallback((id: string) => {
    setModeratedFeedPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hidden: false } : p)),
    );
  }, []);

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("gorditopass-mvp-v11");
    setUser(null);
    setCart([]);
    setFavorites([]);
    setFollowing([]);
    setMemberFollowing([]);
    setTasteBudRequests([]);
    setStaffMembershipReferrals([]);
    setRedemptions([]);
    setRestaurantApplications([]);
    setPartnerEvents([]);
    setPartnerJobs([]);
    setPartnerDeals([]);
    setPartnerMenuItems([]);
    setPartnerStories({});
    setUserReviews([]);
    setRewardHistory([]);
    setModeratedFeedPosts([]);
    setRestaurantApprovalOverrides({});
    setNotifications([]);
    setAccounts([]);
    setAutoApproveSettings([]);
    setChats([]);
    setEventRsvps([]);
    setCity("dallas");
  }, []);

  const addPartnerEvent = useCallback(
    (
      event: Omit<
        PartnerEvent,
        | "id"
        | "status"
        | "createdAt"
        | "aiFlagged"
        | "aiReasons"
        | "aiScore"
      >,
    ) => {
      const mod = moderatePartnerContent({
        title: event.title,
        description: event.description,
      });
      const status = resolveContentStatus(
        event.restaurantId,
        "event",
        mod.flagged,
        autoApproveSettings,
      );
      const id = `pev-${Date.now()}`;
      setPartnerEvents((prev) => [
        {
          ...event,
          id,
          status,
          createdAt: new Date().toISOString(),
          aiFlagged: mod.flagged,
          aiReasons: mod.reasons,
          aiScore: mod.score,
        },
        ...prev,
      ]);
      return { id, status, aiFlagged: mod.flagged };
    },
    [autoApproveSettings],
  );

  const addPartnerJob = useCallback(
    (
      job: Omit<
        JobPosting,
        | "id"
        | "postedAt"
        | "status"
        | "createdAt"
        | "aiFlagged"
        | "aiReasons"
        | "aiScore"
      >,
    ) => {
      const mod = moderatePartnerContent({
        title: job.title,
        description: job.description,
        extra: job.payRange,
      });
      const status = resolveContentStatus(
        job.restaurantId,
        "job",
        mod.flagged,
        autoApproveSettings,
      );
      const id = `pjob-${Date.now()}`;
      setPartnerJobs((prev) => [
        {
          ...job,
          id,
          postedAt: new Date().toISOString().slice(0, 10),
          status,
          createdAt: new Date().toISOString(),
          aiFlagged: mod.flagged,
          aiReasons: mod.reasons,
          aiScore: mod.score,
        },
        ...prev,
      ]);
      return { id, status, aiFlagged: mod.flagged };
    },
    [autoApproveSettings],
  );

  const addPartnerDeal = useCallback(
    (
      deal: Omit<
        PartnerDealDraft,
        | "id"
        | "createdAt"
        | "active"
        | "status"
        | "aiFlagged"
        | "aiReasons"
        | "aiScore"
      >,
    ) => {
      const mod = moderatePartnerContent({
        title: deal.title,
        description: deal.description,
      });
      const status = resolveContentStatus(
        deal.restaurantId,
        "deal",
        mod.flagged,
        autoApproveSettings,
      );
      const id = `pdeal-${Date.now()}`;
      setPartnerDeals((prev) => [
        {
          ...deal,
          id,
          active: status === "approved",
          status,
          createdAt: new Date().toISOString(),
          aiFlagged: mod.flagged,
          aiReasons: mod.reasons,
          aiScore: mod.score,
        },
        ...prev,
      ]);
      return { id, status, aiFlagged: mod.flagged };
    },
    [autoApproveSettings],
  );

  const addPartnerMenuItem = useCallback(
    (
      item: Omit<
        PartnerMenuItem,
        | "id"
        | "status"
        | "createdAt"
        | "active"
        | "aiFlagged"
        | "aiReasons"
        | "aiScore"
      >,
    ) => {
      const mod = moderatePartnerContent({
        title: item.name,
        description: item.description,
        extra: item.category,
      });
      const status = resolveContentStatus(
        item.restaurantId,
        "menu",
        mod.flagged,
        autoApproveSettings,
      );
      const id = `pmenu-${Date.now()}`;
      setPartnerMenuItems((prev) => [
        {
          ...item,
          id,
          status,
          active: status === "approved",
          createdAt: new Date().toISOString(),
          aiFlagged: mod.flagged,
          aiReasons: mod.reasons,
          aiScore: mod.score,
        },
        ...prev,
      ]);
      return { id, status, aiFlagged: mod.flagged };
    },
    [autoApproveSettings],
  );

  const updatePartnerDeal = useCallback(
    (id: string, patch: Partial<PartnerDealDraft>) => {
      setPartnerDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [],
  );
  const updatePartnerMenuItem = useCallback(
    (id: string, patch: Partial<PartnerMenuItem>) => {
      setPartnerMenuItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );
  const updatePartnerEvent = useCallback(
    (id: string, patch: Partial<PartnerEvent>) => {
      setPartnerEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );
  const updatePartnerJob = useCallback(
    (id: string, patch: Partial<JobPosting>) => {
      setPartnerJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...patch } : j)),
      );
    },
    [],
  );
  const deletePartnerDeal = useCallback((id: string) => {
    setPartnerDeals((prev) => prev.filter((d) => d.id !== id));
  }, []);
  const deletePartnerMenuItem = useCallback((id: string) => {
    setPartnerMenuItems((prev) => prev.filter((m) => m.id !== id));
  }, []);
  const deletePartnerEvent = useCallback((id: string) => {
    setPartnerEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);
  const deletePartnerJob = useCallback((id: string) => {
    setPartnerJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const getRestaurantStory = useCallback(
    (restaurantId: string) => {
      if (Object.prototype.hasOwnProperty.call(partnerStories, restaurantId)) {
        return partnerStories[restaurantId];
      }
      return getRestaurant(restaurantId)?.story ?? "";
    },
    [partnerStories],
  );

  const updatePartnerStory = useCallback(
    (restaurantId: string, body: string) => {
      if (!user || user.role !== "restaurant") {
        return { ok: false, error: "Sign in as a partner to edit Our story." };
      }
      if (!canManagePartnerContent(user.staffRole ?? "owner")) {
        return { ok: false, error: "Employees cannot edit Our story." };
      }
      setPartnerStories((prev) => ({
        ...prev,
        [restaurantId]: body.trim(),
      }));
      return { ok: true };
    },
    [user],
  );

  const createDmChat = useCallback(
    (otherUserId: string, otherName: string) => {
      if (!user) return "";
      const existing = chats.find(
        (c) =>
          c.type === "dm" &&
          c.memberIds.includes(user.id) &&
          c.memberIds.includes(otherUserId),
      );
      if (existing) return existing.id;
      const id = `chat-${Date.now()}`;
      const thread: ChatThread = {
        id,
        type: "dm",
        title: otherName,
        memberIds: [user.id, otherUserId],
        memberNames: [user.name, otherName],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messages: [],
      };
      setChats((prev) => [thread, ...prev]);
      return id;
    },
    [user, chats],
  );

  const createGroupChat = useCallback(
    (title: string, memberIds: string[], memberNames: string[]) => {
      if (!user) return "";
      const id = `chat-g-${Date.now()}`;
      const ids = Array.from(new Set([user.id, ...memberIds]));
      const names = [user.name, ...memberNames.filter(Boolean)];
      const thread: ChatThread = {
        id,
        type: "group",
        title: title.trim() || "Group chat",
        memberIds: ids,
        memberNames: names,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        // Groups are never private — always public & shareable
        isPublic: true,
        createdById: user.id,
        // No system/notification messages — only member messages
        messages: [],
      };
      setChats((prev) => [thread, ...prev]);
      return id;
    },
    [user],
  );

  const inviteToGroupChat = useCallback(
    (
      chatId: string,
      memberIds: string[],
      memberNames: string[],
    ): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Sign in first." };
      if (!memberIds.length) {
        return { ok: false, error: "Pick at least one member to invite." };
      }
      const chat = chats.find((c) => c.id === chatId);
      if (!chat || chat.type !== "group") {
        return { ok: false, error: "Group not found." };
      }
      if (!chat.memberIds.includes(user.id)) {
        return { ok: false, error: "Join the group before inviting others." };
      }
      const at = new Date().toISOString();
      const newIds = memberIds.filter((id) => !chat.memberIds.includes(id));
      if (newIds.length === 0) {
        return { ok: false, error: "Those members are already in the group." };
      }
      const nameById = new Map(
        memberIds.map((id, i) => [id, memberNames[i] ?? "Member"]),
      );
      const addedNames = newIds.map((id) => nameById.get(id) ?? "Member");
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            isPublic: true,
            memberIds: [...c.memberIds, ...newIds],
            memberNames: [...c.memberNames, ...addedNames],
            lastMessageAt: at,
            // Membership updates only — no system notification in the room
            messages: c.messages,
          };
        }),
      );
      return { ok: true };
    },
    [user, chats],
  );

  const joinGroupChat = useCallback(
    (chatId: string): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Sign in to join groups." };
      const chat = chats.find((c) => c.id === chatId);
      if (!chat || chat.type !== "group") {
        return { ok: false, error: "Group not found or link expired." };
      }
      // Groups are always public
      if (chat.memberIds.includes(user.id)) {
        return { ok: true };
      }
      const at = new Date().toISOString();
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            isPublic: true,
            memberIds: [...c.memberIds, user.id],
            memberNames: [...c.memberNames, user.name],
            lastMessageAt: at,
            // Join silently — no system notification in the room
            messages: c.messages,
          };
        }),
      );
      return { ok: true };
    },
    [user, chats],
  );

  const setEventRsvp = useCallback(
    (
      eventId: string,
      status: EventRsvpStatus,
    ): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Sign in to RSVP." };
      setEventRsvps((prev) => {
        const existing = prev.find(
          (r) => r.eventId === eventId && r.userId === user.id,
        );
        // Toggle off if same status clicked again
        if (existing?.status === status) {
          return prev.filter(
            (r) => !(r.eventId === eventId && r.userId === user.id),
          );
        }
        const row: EventRsvp = {
          eventId,
          userId: user.id,
          userName: user.name,
          status,
          at: new Date().toISOString(),
        };
        return [
          ...prev.filter(
            (r) => !(r.eventId === eventId && r.userId === user.id),
          ),
          row,
        ];
      });
      return { ok: true };
    },
    [user],
  );

  const getEventRsvp = useCallback(
    (eventId: string): EventRsvpStatus | null => {
      if (!user) return null;
      return (
        eventRsvps.find((r) => r.eventId === eventId && r.userId === user.id)
          ?.status ?? null
      );
    },
    [user, eventRsvps],
  );

  const getEventRsvpCounts = useCallback(
    (eventId: string) => {
      const rows = eventRsvps.filter((r) => r.eventId === eventId);
      return {
        interested: rows.filter((r) => r.status === "interested").length,
        going: rows.filter((r) => r.status === "going").length,
      };
    },
    [eventRsvps],
  );

  const sendChatMessage = useCallback(
    (chatId: string, body: string) => {
      if (!user || !body.trim()) return;
      const msg = {
        id: `msg-${Date.now()}`,
        chatId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatarDataUrl,
        body: body.trim(),
        at: new Date().toISOString(),
        reactions: {},
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessageAt: msg.at,
                messages: [...c.messages, msg],
              }
            : c,
        ),
      );
    },
    [user],
  );

  const reactToChatMessage = useCallback(
    (chatId: string, messageId: string, emoji: string) => {
      if (!user) return;
      const uid = user.id;
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id !== messageId) return m;
              const reactions = { ...(m.reactions ?? {}) };
              const list = [...(reactions[emoji] ?? [])];
              const idx = list.indexOf(uid);
              if (idx >= 0) list.splice(idx, 1);
              else list.push(uid);
              if (list.length === 0) delete reactions[emoji];
              else reactions[emoji] = list;
              return { ...m, reactions };
            }),
          };
        }),
      );
    },
    [user],
  );

  const submitPlateReview = useCallback(
    (
      review: Omit<Review, "id" | "createdAt" | "author"> & {
        author?: string;
      },
    ) => {
      // Restaurants (and admins acting as partners) cannot rate plates
      if (user?.role === "restaurant") {
        throw new Error("Restaurants cannot submit plate ratings.");
      }
      const plates = Math.min(5, Math.max(1, Math.round(review.plates)));
      const full: Review = {
        ...review,
        plates,
        id: `urev-${Date.now()}`,
        author: review.author ?? user?.name ?? "Member",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      let nextReviews: Review[] = [];
      setUserReviews((prev) => {
        nextReviews = [full, ...prev];
        return nextReviews;
      });
      if (full.fromFeed) {
        setUser((u) =>
          u
            ? { ...u, feedPostCount: (u.feedPostCount ?? 0) + 1 }
            : u,
        );
        awardPoints("feed_post");
      } else {
        awardPoints("review");
      }
      queueMicrotask(() =>
        evaluateBadges({ userReviews: nextReviews }),
      );
      return full;
    },
    [user?.name, user?.role, awardPoints, evaluateBadges],
  );

  const getReviewsForRestaurant = useCallback(
    (restaurantId: string) => {
      const seed = REVIEWS.filter((r) => r.restaurantId === restaurantId);
      const user = userReviews.filter((r) => r.restaurantId === restaurantId);
      return [...user, ...seed];
    },
    [userReviews],
  );

  const getPlateRate = useCallback(
    (restaurantId: string) => {
      const all = getReviewsForRestaurant(restaurantId);
      const restaurant = getRestaurant(restaurantId);
      if (all.length === 0) {
        return {
          rating: restaurant?.plateRating ?? 0,
          count: restaurant?.reviewCount ?? 0,
        };
      }
      // Blend seed aggregate with new reviews so plate rate updates live
      const seedCount = restaurant?.reviewCount ?? 0;
      const seedAvg = restaurant?.plateRating ?? 0;
      const newSum = all
        .filter((r) => r.id.startsWith("urev-"))
        .reduce((s, r) => s + r.plates, 0);
      const newCount = all.filter((r) => r.id.startsWith("urev-")).length;
      if (newCount === 0) {
        return { rating: seedAvg, count: seedCount || all.length };
      }
      const totalWeight = seedCount + newCount;
      const rating =
        totalWeight > 0
          ? (seedAvg * seedCount + newSum) / totalWeight
          : newSum / newCount;
      return {
        rating: Math.round(rating * 10) / 10,
        count: totalWeight || newCount,
      };
    },
    [getReviewsForRestaurant],
  );

  const checkoutDemo = useCallback(() => {
    const orderId = `GP-${Date.now().toString(36).toUpperCase()}`;
    const total = cartTotal;
    setCart([]);
    awardPoints("order");
    return { orderId, total };
  }, [cartTotal, awardPoints]);

  const rid = partnerRestaurantId();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const ytdMs = Date.now() - ytdStartMs();

  const savingsWeek = useMemo(
    () => sumField(redemptions, "savingsUsd", weekMs),
    [redemptions, weekMs],
  );
  const savingsMonth = useMemo(
    () => sumField(redemptions, "savingsUsd", monthMs),
    [redemptions, monthMs],
  );
  const savingsYtd = useMemo(
    () => sumField(redemptions, "savingsUsd", ytdMs),
    [redemptions, ytdMs],
  );

  const partnerRevenueWeek = useMemo(
    () => sumField(redemptions, "revenueUsd", weekMs, rid),
    [redemptions, weekMs, rid],
  );
  const partnerRevenueMonth = useMemo(
    () => sumField(redemptions, "revenueUsd", monthMs, rid),
    [redemptions, monthMs, rid],
  );
  const partnerRevenueYtd = useMemo(
    () => sumField(redemptions, "revenueUsd", ytdMs, rid),
    [redemptions, ytdMs, rid],
  );
  const partnerRedemptionCount = useMemo(
    () => redemptions.filter((r) => r.restaurantId === rid).length,
    [redemptions, rid],
  );

  const rewardPoints = user?.rewardPoints ?? 0;
  const rewardProgress = rewardPoints % REWARDS.pointsPerReward;
  const rewardsAvailable = Math.floor(rewardPoints / REWARDS.pointsPerReward);
  const householdMembers = user?.householdMembers ?? [];
  const earnedBadges = user?.badges ?? [];
  const feedPostCount = user?.feedPostCount ?? 0;
  const completedPassports = user?.completedPassports ?? [];
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value: StoreValue = {
    user,
    cart,
    favorites,
    following,
    memberFollowing,
    tasteBudRequests,
    staffMembershipReferrals,
    redemptions,
    restaurantApplications,
    partnerEvents,
    partnerJobs,
    partnerDeals,
    partnerMenuItems,
    partnerStories,
    userReviews,
    rewardHistory,
    moderatedFeedPosts,
    restaurantApprovalOverrides,
    city,
    setCity,
    signInDemo,
    signOut,
    loginWithPassword,
    loginWithMagicLink,
    registerDinerAccount,
    inviteStaffAccount,
    accounts,
    activateMembership,
    staffEnrollCustomerMembership,
    markStaffReferralChecksPaid,
    setReferredByCode,
    ensureReferralCode,
    followMember,
    unfollowMember,
    isFollowingMember,
    requestTasteBud,
    respondTasteBud,
    removeTasteBud,
    tasteBudIds,
    updateProfile,
    awardPoints,
    evaluateBadges,
    evaluatePassports,
    householdMembers,
    earnedBadges,
    completedPassports,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    addToCart,
    updateQty,
    clearCart,
    cartTotal,
    cartCount,
    toggleFavorite,
    toggleFollow,
    createRedeemCode,
    recordRedemption,
    submitRestaurantApplication,
    setApplicationStatus,
    setPartnerDealStatus,
    setPartnerMenuStatus,
    setPartnerEventStatus,
    setPartnerJobStatus,
    setRestaurantApproved,
    autoApproveSettings,
    getAutoApprove,
    setAutoApprove,
    addHouseholdSeat,
    removeHouseholdSeat,
    hideFeedPost,
    unhideFeedPost,
    claimReward,
    resetDemoData,
    addPartnerEvent,
    addPartnerJob,
    addPartnerDeal,
    addPartnerMenuItem,
    updatePartnerDeal,
    updatePartnerMenuItem,
    updatePartnerEvent,
    updatePartnerJob,
    deletePartnerDeal,
    deletePartnerMenuItem,
    deletePartnerEvent,
    deletePartnerJob,
    getRestaurantStory,
    updatePartnerStory,
    chats,
    createDmChat,
    createGroupChat,
    inviteToGroupChat,
    joinGroupChat,
    sendChatMessage,
    reactToChatMessage,
    eventRsvps,
    setEventRsvp,
    getEventRsvp,
    getEventRsvpCounts,
    submitPlateReview,
    getPlateRate,
    getReviewsForRestaurant,
    isRestaurantApproved,
    checkoutDemo,
    savingsWeek,
    savingsMonth,
    savingsYtd,
    partnerRevenueWeek,
    partnerRevenueMonth,
    partnerRevenueYtd,
    partnerRedemptionCount,
    rewardPoints,
    rewardProgress,
    rewardsAvailable,
    feedPostCount,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Active diner member or restaurant partner (or admin) can post in city feed. */
export function canPostInFeed(user: MockUser | null): boolean {
  if (!user) return false;
  if (user.role === "restaurant" || user.role === "admin") return true;
  return user.isMember === true;
}
