"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getRestaurant } from "@/lib/data";
import { BADGES, POINT_ACTIONS, REWARDS } from "@/lib/pricing";
import { PASSPORTS, passportProgress } from "@/lib/passports";
import { useStore } from "@/lib/store";
import type { StaffRole } from "@/lib/types";

type TabId = "profile" | "passports" | "badges" | "household" | "staff";

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
  } = useStore();

  const avatarRef = useRef<HTMLInputElement>(null);
  const [claimMsg, setClaimMsg] = useState("");
  const [tab, setTab] = useState<TabId>("profile");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("employee");
  const [staffMsg, setStaffMsg] = useState("");

  useEffect(() => {
    const t = search.get("tab");
    if (
      t === "passports" ||
      t === "badges" ||
      t === "household" ||
      t === "staff" ||
      t === "profile"
    ) {
      setTab(t);
    }
  }, [search]);

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
    {
      id: "household",
      label: "Household",
      show: isDiner && (householdMembers.length > 0 || user.isMember),
    },
    { id: "staff", label: "Staff logins", show: canInviteStaff },
  ];

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
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Month
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${savingsMonth.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              YTD
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${savingsYtd.toFixed(0)}
            </p>
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
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="employee">Employee</option>
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
        <div className="mt-6 gp-card gp-card-static p-5">
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "household" && isDiner && (
        <div className="mt-6 space-y-4">
          <div className="gp-card gp-card-static p-5">
            <p className="gp-section-label">Household / plan seats</p>
            <p className="mt-1 text-sm text-muted">
              Shared billing plan — each person signs in with{" "}
              <strong className="text-stone-300">their own email</strong>. Default
              demo password: <code className="text-stone-300">demo1234</code>
            </p>
            {householdMembers.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No household seats yet.{" "}
                <Link href="/membership" className="text-brand underline">
                  Add seats at membership signup
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {householdMembers.map((m) => {
                  const hasLogin = accounts.some(
                    (a) =>
                      a.email.toLowerCase() === m.email.trim().toLowerCase(),
                  );
                  return (
                    <li
                      key={m.id}
                      className="rounded-md border border-border bg-elevated/40 px-3 py-2 text-sm"
                    >
                      <p className="font-medium">
                        {m.firstName} {m.lastName}
                        {m.isPrimary ? (
                          <span className="ml-2 text-xs text-brand">
                            Primary (billing)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {m.email} · {m.phone}
                      </p>
                      <p className="text-xs text-muted">{m.homeAddress}</p>
                      <p className="mt-1 text-[11px] text-success">
                        {hasLogin
                          ? "Login account ready"
                          : "Login created at signup"}
                      </p>
                      {!m.isPrimary && hasLogin && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-brand underline"
                          onClick={() => {
                            loginWithPassword(m.email, "demo1234");
                          }}
                        >
                          Switch to this person (demo)
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
                <option value="manager">Manager</option>
                <option value="marketing">Marketing</option>
                <option value="employee">Employee (redeem only)</option>
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
        {!user.isMember && isDiner && (
          <Link href="/membership" className="gp-btn gp-btn-primary text-sm">
            Get membership
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
