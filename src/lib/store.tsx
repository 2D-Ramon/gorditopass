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
  ApplicationStatus,
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

const STORAGE_KEY = "gorditopass-mvp-v7";

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
  householdMembers: MemberSeatProfile[];
  earnedBadges: string[];
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
  };
}

function load(): Persisted {
  if (typeof window === "undefined") return emptyPersisted();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
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
  ]);

  const signInDemo = useCallback(
    (role: MockUser["role"] = "diner", staffRole: StaffRole = "owner") => {
      setUser(defaultUser(role, staffRole));
    },
    [],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

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
          rewardPoints: base.rewardPoints ?? 0,
          rewardPointsLifetime: base.rewardPointsLifetime ?? 0,
          rewardsClaimed: base.rewardsClaimed ?? 0,
          badges: base.badges ?? [],
          awardedBonuses: base.awardedBonuses ?? [],
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
      unlocked = Array.from(have);
      if (newly.length === 0) return u;
      return { ...u, badges: unlocked };
    });
    return unlocked;
  }, [redemptions, userReviews, favorites]);

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
      queueMicrotask(() => evaluateBadges());
      return { pointsEarned: points, totalPoints };
    },
    [partnerDeals, evaluateBadges],
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
    },
    [],
  );

  const isRestaurantApproved = useCallback(
    (restaurantId: string) => {
      if (restaurantId in restaurantApprovalOverrides) {
        return restaurantApprovalOverrides[restaurantId];
      }
      return getRestaurant(restaurantId)?.approved ?? false;
    },
    [restaurantApprovalOverrides],
  );

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
    activateMembership,
    updateProfile,
    awardPoints,
    evaluateBadges,
    householdMembers,
    earnedBadges,
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
