"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getRestaurant } from "@/lib/data";
import {
  BADGES,
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  POINT_ACTIONS,
  REFERRAL,
  REWARDS,
} from "@/lib/pricing";
import { PASSPORTS, passportProgress } from "@/lib/passports";
import { useStore } from "@/lib/store";
import type { StaffRole } from "@/lib/types";

type TabId =
  | "profile"
  | "passports"
  | "badges"
  | "rewards"
  | "billing"
  | "referral"
  | "chat"
  | "staff";

function AccountInner() {
  const search = useSearchParams();
  const {
    user,
    signInDemo,
    signOut,
    favorites,
    redemptions,
    updateProfile,
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
    claimReward,
    rewardHistory,
    resetDemoData,
    earnedBadges,
    householdMembers,
    completedPassports,
    isRestaurantApproved,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    inviteStaffAccount,
    accounts,
    loginWithPassword,
    addHouseholdSeat,
    removeHouseholdSeat,
    ensureReferralCode,
    setReferredByCode,
  } = useStore();

  const avatarRef = useRef<HTMLInputElement>(null);
  const [claimMsg, setClaimMsg] = useState("");
  const [tab, setTab] = useState<TabId>("profile");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("employee");
  const [staffMsg, setStaffMsg] = useState("");
  const [seatForm, setSeatForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    homeAddress: "",
  });
  const [seatMsg, setSeatMsg] = useState("");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [referralMsg, setReferralMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const t = search.get("tab");
    if (
      t === "passports" ||
      t === "badges" ||
      t === "rewards" ||
      t === "billing" ||
      t === "referral" ||
      t === "chat" ||
      t === "household" ||
      t === "staff" ||
      t === "profile"
    ) {
      setTab(t === "household" ? "billing" : t);
    }
  }, [search]);

  // Ensure logged-in users have a shareable referral code
  useEffect(() => {
    if (user && !user.referralCode) {
      ensureReferralCode();
    }
  }, [user, ensureReferralCode]);

  const visited = useMemo(() => {
    const s = new Set<string>();
    for (const r of redemptions) {
      if (r.restaurantId) s.add(r.restaurantId);
    }
    return s;
  }, [redemptions]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gp-page-title">Account</h1>
        <p className="mt-2 text-muted">
          Sign in with your own email — one person, one login.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/login" className="gp-btn gp-btn-primary">
            Sign in / create account
          </Link>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("diner")}
          >
            Quick demo diner
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("restaurant", "owner")}
          >
            Quick demo restaurant (owner)
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("admin")}
          >
            Quick demo admin
          </button>
        </div>
      </div>
    );
  }

  const isDiner = user.role === "diner";
  const isRestaurant = user.role === "restaurant";
  const canInviteStaff =
    isRestaurant &&
    (user.staffRole === "owner" || user.staffRole === "manager");

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: "profile", label: "Profile", show: true },
    { id: "passports", label: "Passports", show: isDiner },
    { id: "badges", label: "Badges", show: isDiner },
    { id: "rewards", label: "Rewards", show: isDiner || isRestaurant },
    {
      id: "billing",
      label: "Billing",
      show: isDiner || (isRestaurant && Boolean(user.isMember)),
    },
    { id: "referral", label: "Referrals", show: true },
    { id: "chat", label: "Chat", show: isDiner || isRestaurant },
    { id: "staff", label: "Staff logins", show: canInviteStaff },
  ];

  const plan = MEMBERSHIP_PLANS.find((p) => p.id === user.planId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="gp-page-title">Account</h1>
      <p className="gp-page-sub">
        {user.name} · {user.email}
        {unreadNotificationCount > 0 && isDiner ? (
          <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
            {unreadNotificationCount} new
          </span>
        ) : null}
      </p>

      {(isDiner || isRestaurant) && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-elevated ring-2 ring-brand/20 transition hover:ring-brand/50"
            onClick={() => avatarRef.current?.click()}
            aria-label="Upload profile picture"
          >
            {user.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarDataUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl text-muted">
                {isRestaurant ? "🏪" : "📷"}
              </span>
            )}
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white shadow">
              +
            </span>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () =>
                updateProfile({ avatarDataUrl: String(reader.result) });
              reader.readAsDataURL(file);
            }}
          />
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-muted">
              {isRestaurant
                ? `Tap to upload logo · ${user.staffRole ?? "owner"}`
                : "Tap to upload a photo"}
            </p>
          </div>
        </div>
      )}

      {isDiner && (
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Week
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${savingsWeek.toFixed(0)}
            </p>
            <p className="text-[10px] font-medium text-success/90">saved</p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Month
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${savingsMonth.toFixed(0)}
            </p>
            <p className="text-[10px] font-medium text-success/90">saved</p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              YTD
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${savingsYtd.toFixed(0)}
            </p>
            <p className="text-[10px] font-medium text-success/90">saved</p>
          </div>
        </div>
      )}

      {isRestaurant && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Rev · week
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueWeek.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Rev · month
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueMonth.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Rev · YTD
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueYtd.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Redeems
            </p>
            <p className="mt-1 text-lg font-bold text-brand-gold">
              {partnerRedemptionCount}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-border pb-2">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-brand/20 text-brand"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
              {t.id === "passports" && unreadNotificationCount > 0
                ? ` (${unreadNotificationCount})`
                : ""}
            </button>
          ))}
      </div>

      {tab === "profile" && (
        <div className="mt-6 space-y-4">
          {isDiner && (
            <div className="gp-card gp-card-static p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="gp-section-label">Rewards</p>
                  <p className="mt-1 text-2xl font-bold">
                    {rewardPoints}{" "}
                    <span className="text-sm font-medium text-muted">pts</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {REWARDS.pointsPerReward} pts = {REWARDS.rewardLabel}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={rewardsAvailable < 1}
                  className="gp-btn gp-btn-primary text-sm disabled:opacity-40"
                  onClick={() => {
                    const ok = claimReward();
                    setClaimMsg(
                      ok
                        ? `Claimed ${REWARDS.rewardLabel}!`
                        : `Need ${REWARDS.pointsPerReward - rewardProgress} more pts.`,
                    );
                  }}
                >
                  Claim reward
                  {rewardsAvailable > 0 ? ` (${rewardsAvailable})` : ""}
                </button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-gold"
                  style={{
                    width: `${Math.min(100, (rewardProgress / REWARDS.pointsPerReward) * 100)}%`,
                  }}
                />
              </div>
              {claimMsg && (
                <p className="mt-2 text-sm text-success">{claimMsg}</p>
              )}
              <ul className="mt-3 space-y-1 text-[11px] text-muted sm:grid sm:grid-cols-2 sm:gap-1">
                {Object.values(POINT_ACTIONS).map((a) => (
                  <li key={a.label}>
                    <span className="text-brand">+{a.points}</span> {a.label}
                  </li>
                ))}
              </ul>
              {rewardHistory.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted">
                  {rewardHistory.slice(0, 4).map((h) => (
                    <li key={h.id}>
                      {h.type === "earn" ? "+" : ""}
                      {h.points} · {h.note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="gp-card gp-card-static space-y-3 p-5 text-sm">
            <p>
              <span className="text-muted">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-muted">Role:</span> {user.role}
              {user.staffRole ? ` · ${user.staffRole}` : ""}
            </p>
            {isDiner && (
              <p>
                <span className="text-muted">Member:</span>{" "}
                {user.isMember
                  ? `Yes (${user.planId}, ${user.familySeats} seats)`
                  : "No"}
              </p>
            )}
            {isRestaurant && (
              <label className="block">
                <span className="text-muted">Staff role (demo)</span>
                <select
                  className="gp-input mt-1"
                  value={user.staffRole ?? "owner"}
                  onChange={(e) =>
                    updateProfile({ staffRole: e.target.value as StaffRole })
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
            )}
            {isDiner && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-muted">First name</span>
                    <input
                      className="gp-input mt-1"
                      value={user.firstName ?? ""}
                      onChange={(e) =>
                        updateProfile({ firstName: e.target.value })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-muted">Last name</span>
                    <input
                      className="gp-input mt-1"
                      value={user.lastName ?? ""}
                      onChange={(e) =>
                        updateProfile({ lastName: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-muted">Birthday</span>
                  <input
                    type="date"
                    className="gp-input mt-1"
                    value={user.birthday ?? ""}
                    onChange={(e) =>
                      updateProfile({ birthday: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-muted">Phone</span>
                  <input
                    type="tel"
                    className="gp-input mt-1"
                    value={user.phone ?? ""}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-muted">Home address</span>
                  <input
                    className="gp-input mt-1"
                    value={user.homeAddress ?? ""}
                    onChange={(e) =>
                      updateProfile({ homeAddress: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-muted">Favorite restaurant</span>
                  <input
                    className="gp-input mt-1"
                    value={user.favoriteRestaurant ?? ""}
                    onChange={(e) =>
                      updateProfile({ favoriteRestaurant: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-muted">Favorite food type</span>
                  <input
                    className="gp-input mt-1"
                    value={user.favoriteFoodType ?? ""}
                    onChange={(e) =>
                      updateProfile({ favoriteFoodType: e.target.value })
                    }
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "passports" && isDiner && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="gp-section-label">Notifications</p>
                <p className="mt-1 text-xs text-muted">
                  New restaurants to stamp — your points never go down.
                </p>
              </div>
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  className="text-xs text-brand underline"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No notifications yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {notifications.slice(0, 10).map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-md border px-3 py-2 text-xs ${
                      n.read
                        ? "border-border text-muted"
                        : n.type === "passport_revoked"
                          ? "border-amber-500/40 bg-amber-500/10 text-stone-200"
                          : "border-brand/30 bg-brand/10 text-stone-200"
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 text-muted">{n.body}</p>
                    <div className="mt-1 flex gap-2">
                      {!n.read && (
                        <button
                          type="button"
                          className="text-brand"
                          onClick={() => markNotificationRead(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-muted"
                        onClick={() => dismissNotification(n.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm text-muted">
            Visit every live partner in a category to earn the passport badge.
            First completion awards points once. New partners pause the badge
            only — points stay.
          </p>

          {PASSPORTS.map((p) => {
            const prog = passportProgress(p, visited, isRestaurantApproved);
            const held = completedPassports.includes(p.id);
            return (
              <article
                key={p.id}
                className={`gp-card gp-card-static p-5 ${
                  held ? "ring-1 ring-brand/40" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl">{p.emoji}</p>
                    <h2 className="mt-1 font-semibold tracking-tight">
                      {p.name}
                    </h2>
                    <p className="text-xs uppercase tracking-wider text-muted">
                      {p.region}
                    </p>
                    <p className="mt-2 text-sm text-muted">{p.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    {held ? (
                      <span className="text-brand font-semibold">Held ✓</span>
                    ) : prog.restaurants.length === 0 ? (
                      <span className="text-muted">Coming soon</span>
                    ) : (
                      <span className="text-muted">
                        {prog.visited.length}/{prog.restaurants.length} ·{" "}
                        {prog.percent}%
                      </span>
                    )}
                  </div>
                </div>
                {prog.restaurants.length > 0 && (
                  <>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-gold"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {prog.restaurants.map((r) => {
                        const stamped = visited.has(r.id);
                        return (
                          <li key={r.id}>
                            <Link
                              href={`/restaurants/${r.id}`}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                stamped
                                  ? "border-success/30 bg-success/10"
                                  : "border-border bg-elevated/40"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="flex-1 font-medium">
                                {r.name}
                              </span>
                              <span className="text-[10px] text-muted">
                                {stamped ? "✓" : "Visit"}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </article>
            );
          })}

          <p className="text-xs text-muted">
            Demo: complete Latin (Mi Tierra + Casa Arepa), then as admin approve{" "}
            <strong className="text-stone-300">El Sabor Nuevo</strong> — Latin
            badge pauses with a notification; other passports stay; points stay.
          </p>
        </div>
      )}

      {tab === "badges" && isDiner && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Achievement badges</p>
            <p className="mt-1 text-xs text-muted">
              {earnedBadges.filter((b) => !b.startsWith("passport_")).length}/
              {BADGES.length} earned
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((b) => {
                const unlocked = earnedBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`rounded-lg border p-3 text-center ${
                      unlocked
                        ? "border-brand/40 bg-brand/10"
                        : "border-border bg-elevated/40 opacity-50"
                    }`}
                  >
                    <p className="text-2xl">{b.emoji}</p>
                    <p className="mt-1 text-xs font-semibold">{b.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {b.description}
                    </p>
                    {unlocked && (
                      <p className="mt-1 text-[10px] font-medium text-success">
                        Unlocked
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Passport badges</p>
            <p className="mt-1 text-xs text-muted">
              Added when you complete a passport. Pauses if a new restaurant
              joins until you stamp it — points stay.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PASSPORTS.map((p) => {
                const held =
                  completedPassports.includes(p.id) ||
                  earnedBadges.includes(`passport_${p.id}`);
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 text-center ${
                      held
                        ? "border-brand/40 bg-brand/10"
                        : "border-border bg-elevated/40 opacity-50"
                    }`}
                  >
                    <p className="text-2xl">{p.emoji}</p>
                    <p className="mt-1 text-xs font-semibold">
                      {p.name.replace(" Passport", "")}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">{p.region}</p>
                    {held ? (
                      <p className="mt-1 text-[10px] font-medium text-success">
                        Earned
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-muted">Locked</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "rewards" && (isDiner || isRestaurant) && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Rewards balance</p>
            <p className="mt-2 text-3xl font-bold">
              {rewardPoints}{" "}
              <span className="text-sm font-medium text-muted">pts</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {rewardProgress}/{REWARDS.pointsPerReward} to next free item ·{" "}
              {user.rewardsClaimed ?? 0} claimed
            </p>
            <button
              type="button"
              disabled={rewardsAvailable < 1}
              className="gp-btn gp-btn-primary mt-4 text-sm disabled:opacity-40"
              onClick={() => claimReward()}
            >
              Claim {REWARDS.rewardLabel}
            </button>
            <Link
              href="/rewards"
              className="mt-3 block text-sm text-brand underline"
            >
              Open full rewards page →
            </Link>
          </div>
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Claim catalog (placeholders)</p>
            <p className="mt-1 text-xs text-muted">
              Six sample rewards — claim process later.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                "🍟 Free fries voucher",
                "🥤 Free soft drink",
                "🍰 Free dessert bite",
                "🥗 Free appetizer credit",
                "✨ Sticker pack",
                "🎟️ Raffle entry",
              ].map((label) => (
                <li
                  key={label}
                  className="rounded-md border border-border px-3 py-2 text-xs"
                >
                  {label}
                  <button
                    type="button"
                    disabled
                    className="mt-1 block text-[10px] text-muted"
                  >
                    Claim soon
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Recent redemptions</p>
            {redemptions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {redemptions.slice(0, 8).map((r, i) => (
                  <li key={`${r.code}-${i}`}>
                    {r.restaurantName ?? "Restaurant"} · $
                    {r.savingsUsd.toFixed(0)} saved ·{" "}
                    {new Date(r.at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "referral" && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Your referral code</p>
            <p className="mt-2 text-sm text-muted">
              Share this code with friends. When they activate a membership
              with it, you earn{" "}
              <strong className="text-brand">
                +{REFERRAL.referrerPoints} points
              </strong>{" "}
              and they get{" "}
              <strong className="text-brand">
                +{REFERRAL.friendPoints} welcome points
              </strong>
              .
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-brand/30 bg-brand/10 px-4 py-2 font-mono text-lg font-bold tracking-wider text-orange-200">
                {user.referralCode ?? "—"}
              </code>
              <button
                type="button"
                className="gp-btn gp-btn-secondary text-sm"
                onClick={async () => {
                  const code = user.referralCode || ensureReferralCode();
                  if (!code) return;
                  try {
                    await navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  } catch {
                    setReferralMsg("Copy failed — select the code manually.");
                  }
                }}
              >
                {copiedCode ? "Copied!" : "Copy code"}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">
              Successful referrals:{" "}
              <strong className="text-stone-200">
                {user.referralCount ?? 0}
              </strong>
            </p>
          </div>

          {!user.isMember && (
            <div className="gp-card gp-card-static p-5">
              <p className="gp-section-label">Enter a friend&apos;s code</p>
              <p className="mt-2 text-sm text-muted">
                Save their code now — it applies when you activate membership
                (+{REFERRAL.friendPoints} pts for you).
              </p>
              {user.referredByCode ? (
                <p className="mt-3 text-sm text-success">
                  Saved code:{" "}
                  <code className="font-mono font-semibold">
                    {user.referredByCode}
                  </code>
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    className="gp-input max-w-xs font-mono uppercase tracking-wide"
                    value={friendCodeInput}
                    onChange={(e) =>
                      setFriendCodeInput(e.target.value.toUpperCase())
                    }
                    placeholder="GP-FRIEND123"
                  />
                  <button
                    type="button"
                    className="gp-btn gp-btn-primary text-sm"
                    onClick={() => {
                      const res = setReferredByCode(friendCodeInput);
                      setReferralMsg(
                        res.ok
                          ? "Referral code saved."
                          : res.error ?? "Could not save code.",
                      );
                    }}
                  >
                    Save code
                  </button>
                </div>
              )}
              {referralMsg && (
                <p className="mt-2 text-sm text-muted">{referralMsg}</p>
              )}
            </div>
          )}

          {user.isMember && user.referredByCode && (
            <div className="gp-card gp-card-static p-5 text-sm text-muted">
              You joined with code{" "}
              <code className="font-mono text-stone-300">
                {user.referredByCode}
              </code>
              .
            </div>
          )}
        </div>
      )}

      {tab === "billing" && (isDiner || (isRestaurant && user.isMember)) && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Plan & billing</p>
            {user.isMember && plan ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">Plan</dt>
                  <dd className="font-semibold">{plan.name}</dd>
                  <dd className="text-xs text-muted">${plan.priceUsd} / term</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Seats</dt>
                  <dd className="font-semibold">
                    {user.familySeats} / {MAX_FAMILY_SEATS}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Activated</dt>
                  <dd className="font-semibold">
                    {user.membershipActivatedAt
                      ? new Date(user.membershipActivatedAt).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Auto-renew / next bill</dt>
                  <dd className="font-semibold">
                    {user.membershipRenewsAt
                      ? new Date(user.membershipRenewsAt).toLocaleDateString()
                      : "—"}
                  </dd>
                  <dd className="text-[11px] text-muted">
                    Access continues until this date if you cancel.
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No active plan.{" "}
                <Link href="/membership" className="text-brand underline">
                  Choose a membership
                </Link>
                .
              </p>
            )}
          </div>
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Seats on this plan</p>
            <p className="mt-1 text-sm text-muted">
              Each seat is a separate login. Demo password:{" "}
              <code className="text-stone-300">demo1234</code>
            </p>
            {householdMembers.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No seats listed yet — add below or complete membership intake.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {householdMembers.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-md border border-border bg-elevated/40 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {m.firstName} {m.lastName}
                          {m.isPrimary ? (
                            <span className="ml-2 text-xs text-brand">Primary</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {m.email} · {m.phone}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!m.isPrimary && (
                          <button
                            type="button"
                            className="text-xs text-brand underline"
                            onClick={() => loginWithPassword(m.email, "demo1234")}
                          >
                            Switch to
                          </button>
                        )}
                        {!m.isPrimary && householdMembers.length >= 2 && (
                          <button
                            type="button"
                            className="text-xs text-red-300"
                            onClick={() => {
                              const res = removeHouseholdSeat(m.id);
                              setSeatMsg(
                                res.ok ? "Seat removed." : res.error ?? "Could not remove",
                              );
                            }}
                          >
                            Remove seat
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {householdMembers.length < MAX_FAMILY_SEATS && (
              <form
                className="mt-6 space-y-2 border-t border-border pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = addHouseholdSeat(seatForm);
                  setSeatMsg(
                    res.ok
                      ? "Seat added — they can sign in with demo1234."
                      : res.error ?? "Failed",
                  );
                  if (res.ok) {
                    setSeatForm({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      birthday: "",
                      homeAddress: "",
                    });
                  }
                }}
              >
                <p className="text-sm font-semibold">Add seat</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    required
                    className="gp-input"
                    placeholder="First name"
                    value={seatForm.firstName}
                    onChange={(e) =>
                      setSeatForm((s) => ({ ...s, firstName: e.target.value }))
                    }
                  />
                  <input
                    required
                    className="gp-input"
                    placeholder="Last name"
                    value={seatForm.lastName}
                    onChange={(e) =>
                      setSeatForm((s) => ({ ...s, lastName: e.target.value }))
                    }
                  />
                </div>
                <input
                  required
                  type="email"
                  className="gp-input"
                  placeholder="Email"
                  value={seatForm.email}
                  onChange={(e) =>
                    setSeatForm((s) => ({ ...s, email: e.target.value }))
                  }
                />
                <input
                  required
                  className="gp-input"
                  placeholder="Phone"
                  value={seatForm.phone}
                  onChange={(e) =>
                    setSeatForm((s) => ({ ...s, phone: e.target.value }))
                  }
                />
                <input
                  required
                  type="date"
                  className="gp-input"
                  value={seatForm.birthday}
                  onChange={(e) =>
                    setSeatForm((s) => ({ ...s, birthday: e.target.value }))
                  }
                />
                <input
                  required
                  className="gp-input"
                  placeholder="Home address"
                  value={seatForm.homeAddress}
                  onChange={(e) =>
                    setSeatForm((s) => ({ ...s, homeAddress: e.target.value }))
                  }
                />
                <button type="submit" className="gp-btn gp-btn-primary text-sm">
                  Add seat
                </button>
                {seatMsg && <p className="text-sm text-success">{seatMsg}</p>}
              </form>
            )}
          </div>
        </div>
      )}

      {tab === "chat" && (isDiner || isRestaurant) && (
        <div className="mt-6 gp-card gp-card-static p-5">
          <p className="gp-section-label">Community chat</p>
          <p className="mt-2 text-sm text-muted">
            Private DMs and group chats with other members — keep it friendly
            and food-first.
          </p>
          <Link href="/chat" className="gp-btn gp-btn-primary mt-4">
            Open chat
          </Link>
          <p className="mt-3 text-xs text-muted">
            Tip: open someone’s public profile from the city feed, then message
            them from chat.
          </p>
        </div>
      )}

      {tab === "staff" && canInviteStaff && (
        <div className="mt-6 gp-card gp-card-static p-5">
          <p className="gp-section-label">Invite staff (separate logins)</p>
          <p className="mt-1 text-sm text-muted">
            Never share the owner password. Each employee gets their own email
            login and role.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const res = inviteStaffAccount({
                email: staffEmail,
                name: staffName,
                staffRole,
              });
              setStaffMsg(
                res.ok
                  ? `Invited ${staffEmail} as ${staffRole}. They sign in with password demo1234.`
                  : res.error ?? "Failed",
              );
              if (res.ok) {
                setStaffEmail("");
                setStaffName("");
              }
            }}
          >
            <label className="block text-sm">
              Name
              <input
                required
                className="gp-input mt-1"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                className="gp-input mt-1"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Role
              <select
                className="gp-input mt-1"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as StaffRole)}
              >
                <option value="employee">Employee (redeem only)</option>
                <option value="manager">Manager</option>
                <option value="marketing">Marketing</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Create staff login
            </button>
            {staffMsg && (
              <p className="text-sm text-success">{staffMsg}</p>
            )}
          </form>
          <ul className="mt-4 space-y-1 text-xs text-muted">
            {accounts
              .filter((a) => a.role === "restaurant")
              .map((a) => (
                <li key={a.id}>
                  {a.name} · {a.email} · {a.staffRole ?? "—"}
                </li>
              ))}
          </ul>
        </div>
      )}

      {isDiner && favorites.length > 0 && tab === "profile" && (
        <div className="mt-6 gp-card gp-card-static p-5">
          <p className="gp-section-label">Want to try</p>
          <ul className="mt-2 space-y-1 text-sm">
            {favorites.map((id) => (
              <li key={id}>
                <Link
                  href={`/restaurants/${id}`}
                  className="text-brand underline"
                >
                  {getRestaurant(id)?.name ?? id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {!user.isMember && (isDiner || isRestaurant) && (
          <Link href="/membership" className="gp-btn gp-btn-primary text-sm">
            {isRestaurant
              ? `Add membership · +${POINT_ACTIONS.partner_member_bonus.points} pts`
              : "Get membership"}
          </Link>
        )}
        {isRestaurant && (
          <Link
            href="/restaurant/dashboard"
            className="gp-btn gp-btn-secondary text-sm"
          >
            Partner dashboard
          </Link>
        )}
        {user.role === "admin" && (
          <Link href="/admin" className="gp-btn gp-btn-secondary text-sm">
            Admin
          </Link>
        )}
        <Link href="/login" className="gp-btn gp-btn-ghost text-sm">
          Switch account
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="gp-btn gp-btn-ghost text-sm"
        >
          Sign out
        </button>
        <button
          type="button"
          className="gp-btn gp-btn-ghost text-xs text-red-300/90"
          onClick={() => {
            if (confirm("Reset all demo data in this browser?")) {
              resetDemoData();
            }
          }}
        >
          Reset demo
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted">
          Loading account…
        </div>
      }
    >
      <AccountInner />
    </Suspense>
  );
}
