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
  CityId,
  ContentStatus,
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
  StaffRole,
} from "./types";
import {
  BADGES,
  MAX_FAMILY_SEATS,
  POINT_ACTIONS,
  REWARDS,
  type PointActionId,
} from "./pricing";
import { getDeal, getRestaurant, RESTAURANTS, REVIEWS } from "./data";
import { getPassportRestaurants, PASSPORTS } from "./passports";

const STORAGE_KEY = "gorditopass-mvp-v9";
const DEFAULT_DEMO_PASSWORD = "demo1234";

interface Persisted {
  user: MockUser | null;
  cart: CartLine[];
  favorites: string[];
  following: string[];
  redemptions: Redemption[];
  restaurantApplications: RestaurantApplication[];
  partnerEvents: PartnerEvent[];
  partnerJobs: JobPosting[];
  partnerDeals: PartnerDealDraft[];
  partnerMenuItems: PartnerMenuItem[];
  userReviews: Review[];
  rewardHistory: RewardEvent[];
  moderatedFeedPosts: ModeratedFeedPost[];
  restaurantApprovalOverrides: Record<string, boolean>;
  notifications: AppNotification[];
  /** Per-person accounts (recommended login model) */
  accounts: AuthAccount[];
}

interface StoreValue {
  user: MockUser | null;
  cart: CartLine[];
  favorites: string[];
  following: string[];
  redemptions: Redemption[];
  restaurantApplications: RestaurantApplication[];
  partnerEvents: PartnerEvent[];
  partnerJobs: JobPosting[];
  partnerDeals: PartnerDealDraft[];
  partnerMenuItems: PartnerMenuItem[];
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
  ) => void;
  updateProfile: (patch: Partial<MockUser>) => void;
  /** Award points for a completed task (custom values in POINT_ACTIONS) */
  awardPoints: (
    action: PointActionId,
    opts?: { note?: string; onceKey?: string },
  ) => number;
  /** Recompute badges from current stats */
  evaluateBadges: () => string[];
  /** Recompute cuisine passports (earn / revoke + notifications) */
  evaluatePassports: () => void;
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
  ) => { pointsEarned: number; totalPoints: number };
  submitRestaurantApplication: (
    app: Omit<RestaurantApplication, "at" | "status" | "id">,
  ) => void;
  setApplicationStatus: (id: string, status: ApplicationStatus) => void;
  setPartnerDealStatus: (id: string, status: ContentStatus) => void;
  setRestaurantApproved: (restaurantId: string, approved: boolean) => void;
  hideFeedPost: (post: Omit<ModeratedFeedPost, "hidden">) => void;
  unhideFeedPost: (id: string) => void;
  claimReward: () => boolean;
  resetDemoData: () => void;
  addPartnerEvent: (event: Omit<PartnerEvent, "id">) => void;
  addPartnerJob: (job: Omit<JobPosting, "id" | "postedAt">) => void;
  addPartnerDeal: (
    deal: Omit<PartnerDealDraft, "id" | "createdAt" | "active" | "status">,
  ) => void;
  addPartnerMenuItem: (item: Omit<PartnerMenuItem, "id">) => void;
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
  isMember: role === "restaurant" || role === "admin",
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
});

function emptyPersisted(): Persisted {
  return {
    user: null,
    cart: [],
    favorites: [],
    following: [],
    redemptions: [],
    restaurantApplications: [],
    partnerEvents: [],
    partnerJobs: [],
    partnerDeals: [],
    partnerMenuItems: [],
    userReviews: [],
    rewardHistory: [],
    moderatedFeedPosts: [],
    restaurantApprovalOverrides: {},
    notifications: [],
    accounts: [],
  };
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
      redemptions: (parsed.redemptions ?? []).map((r) => ({
        ...r,
        savingsUsd: r.savingsUsd ?? 0,
      })),
      partnerEvents: parsed.partnerEvents ?? [],
      partnerJobs: parsed.partnerJobs ?? [],
      partnerDeals: (parsed.partnerDeals ?? []).map((d) => ({
        ...d,
        status: d.status ?? "approved",
      })),
      partnerMenuItems: parsed.partnerMenuItems ?? [],
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
    if (type === "percent_off" && value) {
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
  if (type === "percent_off" && value) {
    const base = 12;
    return {
      savingsUsd: Math.round(((base * value) / 100) * 100) / 100,
      revenueUsd: base,
    };
  }
  return { savingsUsd: 5, revenueUsd: 10 };
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
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [moderatedFeedPosts, setModeratedFeedPosts] = useState<
    ModeratedFeedPost[]
  >([]);
  const [restaurantApprovalOverrides, setRestaurantApprovalOverrides] =
    useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [city, setCity] = useState<CityId>("dallas");

  useEffect(() => {
    const data = load();
    setUser(data.user);
    setCart(data.cart);
    setFavorites(data.favorites);
    setFollowing(data.following);
    setRedemptions(data.redemptions);
    setRestaurantApplications(data.restaurantApplications);
    setPartnerEvents(data.partnerEvents);
    setPartnerJobs(data.partnerJobs);
    setPartnerDeals(data.partnerDeals);
    setPartnerMenuItems(data.partnerMenuItems);
    setUserReviews(data.userReviews);
    setRewardHistory(data.rewardHistory);
    setModeratedFeedPosts(data.moderatedFeedPosts);
    setRestaurantApprovalOverrides(data.restaurantApprovalOverrides);
    setNotifications(data.notifications ?? []);
    setAccounts(data.accounts ?? []);
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
      redemptions,
      restaurantApplications,
      partnerEvents,
      partnerJobs,
      partnerDeals,
      partnerMenuItems,
      userReviews,
      rewardHistory,
      moderatedFeedPosts,
      restaurantApprovalOverrides,
      notifications,
      accounts,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    user,
    cart,
    favorites,
    following,
    redemptions,
    restaurantApplications,
    partnerEvents,
    partnerJobs,
    partnerDeals,
    partnerMenuItems,
    userReviews,
    rewardHistory,
    moderatedFeedPosts,
    restaurantApprovalOverrides,
    notifications,
    accounts,
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

  const activateMembership = useCallback(
    (
      planId: MembershipPlanId,
      seats: number,
      members?: MemberSeatProfile[],
    ) => {
      const seatCount = Math.min(Math.max(seats, 1), MAX_FAMILY_SEATS);
      const list =
        members && members.length > 0
          ? members.slice(0, seatCount)
          : undefined;
      const primary = list?.find((m) => m.isPrimary) ?? list?.[0];
      const joinPts = POINT_ACTIONS.join_member.points;
      const planGroupId = `plan-${Date.now()}`;

      // Create a separate login account for every seat (recommended model)
      if (list && list.length > 0) {
        setAccounts((prev) => {
          let next = [...prev];
          for (const m of list) {
            const email = m.email.trim().toLowerCase();
            const name = `${m.firstName} ${m.lastName}`.trim();
            const isPrimary = Boolean(m.isPrimary);
            const existing = next.find((a) => a.email.toLowerCase() === email);
            const acct: AuthAccount = {
              id: existing?.id ?? m.id ?? `acct-${email}`,
              email,
              password: existing?.password ?? DEFAULT_DEMO_PASSWORD,
              role: "diner",
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
              rewardPoints: isPrimary
                ? (existing?.rewardPoints ?? 0) +
                  (existing?.isMember ? 0 : joinPts)
                : (existing?.rewardPoints ?? 0),
              rewardPointsLifetime: isPrimary
                ? (existing?.rewardPointsLifetime ?? 0) +
                  (existing?.isMember ? 0 : joinPts)
                : (existing?.rewardPointsLifetime ?? 0),
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            };
            next = next.filter((a) => a.email.toLowerCase() !== email);
            next.push(acct);
          }
          return next;
        });
      }

      setUser((u) => {
        const base = u ?? defaultUser("diner");
        const alreadyMember = base.isMember;
        const fullName = primary
          ? `${primary.firstName} ${primary.lastName}`.trim()
          : base.name;
        const next: MockUser = {
          ...base,
          isMember: true,
          planId,
          familySeats: seatCount,
          role: "diner",
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
          rewardPoints: base.rewardPoints ?? 0,
          rewardPointsLifetime: base.rewardPointsLifetime ?? 0,
          rewardsClaimed: base.rewardsClaimed ?? 0,
          badges: base.badges ?? [],
          awardedBonuses: base.awardedBonuses ?? [],
          passportPointsClaimed: base.passportPointsClaimed ?? [],
        };
        if (!alreadyMember && joinPts > 0) {
          next.rewardPoints = (next.rewardPoints ?? 0) + joinPts;
          next.rewardPointsLifetime =
            (next.rewardPointsLifetime ?? 0) + joinPts;
        }
        return next;
      });

      if (!user?.isMember && joinPts > 0) {
        setRewardHistory((prev) => [
          {
            id: `rw-join-${Date.now()}`,
            at: new Date().toISOString(),
            type: "earn",
            points: joinPts,
            note: POINT_ACTIONS.join_member.label,
          },
          ...prev,
        ]);
      }
    },
    [user?.isMember],
  );

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

  const evaluateBadges = useCallback((): string[] => {
    let unlocked: string[] = [];
    setUser((u) => {
      if (!u || u.role !== "diner") return u;
      const stats = {
        redemptions: redemptions.length,
        reviews: userReviews.filter((r) => r.author === u.name || r.fromFeed)
          .length,
        feed_posts: u.feedPostCount ?? 0,
        lifetime_points: u.rewardPointsLifetime ?? 0,
        savings_ytd: sumField(
          redemptions,
          "savingsUsd",
          Date.now() - ytdStartMs(),
        ),
        rewards_claimed: u.rewardsClaimed ?? 0,
        household: u.familySeats ?? 1,
        favorites: favorites.length,
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
  }, [redemptions, userReviews, favorites]);

  const evaluatePassports = useCallback(() => {
    const visited = new Set(
      redemptions
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
      setFavorites((prev) => {
        const removing = prev.includes(restaurantId);
        if (removing) return prev.filter((id) => id !== restaurantId);
        // Award points only when adding
        queueMicrotask(() => {
          awardPoints("favorite");
          evaluateBadges();
        });
        return [...prev, restaurantId];
      });
    },
    [awardPoints, evaluateBadges],
  );

  const toggleFollow = useCallback((id: string) => {
    setFollowing((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

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
      setRedemptions((prev) => {
        isFirst = prev.length === 0;
        return [
          {
            dealId,
            code,
            at: new Date().toISOString(),
            ...meta,
          },
          ...prev,
        ];
      });
      const basePts = POINT_ACTIONS.redeem.points;
      const bonusPts = isFirst ? POINT_ACTIONS.first_redeem.points : 0;
      const points = basePts + bonusPts;
      let totalPoints = points;
      setUser((u) => {
        if (!u || u.role !== "diner") return u;
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
      queueMicrotask(() => {
        evaluateBadges();
        evaluatePassports();
      });
      return { pointsEarned: points, totalPoints };
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
    setUser(null);
    setCart([]);
    setFavorites([]);
    setFollowing([]);
    setRedemptions([]);
    setRestaurantApplications([]);
    setPartnerEvents([]);
    setPartnerJobs([]);
    setPartnerDeals([]);
    setPartnerMenuItems([]);
    setUserReviews([]);
    setRewardHistory([]);
    setModeratedFeedPosts([]);
    setRestaurantApprovalOverrides({});
    setNotifications([]);
    setAccounts([]);
    setCity("dallas");
  }, []);

  const addPartnerEvent = useCallback((event: Omit<PartnerEvent, "id">) => {
    setPartnerEvents((prev) => [
      { ...event, id: `pev-${Date.now()}` },
      ...prev,
    ]);
  }, []);

  const addPartnerJob = useCallback(
    (job: Omit<JobPosting, "id" | "postedAt">) => {
      setPartnerJobs((prev) => [
        {
          ...job,
          id: `pjob-${Date.now()}`,
          postedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
    },
    [],
  );

  const addPartnerDeal = useCallback(
    (
      deal: Omit<PartnerDealDraft, "id" | "createdAt" | "active" | "status">,
    ) => {
      setPartnerDeals((prev) => [
        {
          ...deal,
          id: `pdeal-${Date.now()}`,
          active: false,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const addPartnerMenuItem = useCallback(
    (item: Omit<PartnerMenuItem, "id">) => {
      setPartnerMenuItems((prev) => [
        { ...item, id: `pmenu-${Date.now()}` },
        ...prev,
      ]);
    },
    [],
  );

  const submitPlateReview = useCallback(
    (
      review: Omit<Review, "id" | "createdAt" | "author"> & {
        author?: string;
      },
    ) => {
      const plates = Math.min(5, Math.max(1, Math.round(review.plates)));
      const full: Review = {
        ...review,
        plates,
        id: `urev-${Date.now()}`,
        author: review.author ?? user?.name ?? "Member",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUserReviews((prev) => [full, ...prev]);
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
      queueMicrotask(() => evaluateBadges());
      return full;
    },
    [user?.name, awardPoints, evaluateBadges],
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
    redemptions,
    restaurantApplications,
    partnerEvents,
    partnerJobs,
    partnerDeals,
    partnerMenuItems,
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
    setRestaurantApproved,
    hideFeedPost,
    unhideFeedPost,
    claimReward,
    resetDemoData,
    addPartnerEvent,
    addPartnerJob,
    addPartnerDeal,
    addPartnerMenuItem,
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
