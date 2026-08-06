"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getRestaurant } from "@/lib/data";
import { BADGES, POINT_ACTIONS, REWARDS } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { StaffRole } from "@/lib/types";

export default function AccountPage() {
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
  } = useStore();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [claimMsg, setClaimMsg] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gp-page-title">Account</h1>
        <p className="mt-2 text-muted">Demo auth — pick a role to explore.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="gp-btn gp-btn-primary"
            onClick={() => signInDemo("diner")}
          >
            Sign in as diner
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("restaurant", "owner")}
          >
            Sign in as restaurant (owner)
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("restaurant", "employee")}
          >
            Sign in as restaurant (employee)
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary"
            onClick={() => signInDemo("admin")}
          >
            Sign in as admin
          </button>
        </div>
      </div>
    );
  }

  const isDiner = user.role === "diner";
  const isRestaurant = user.role === "restaurant";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="gp-page-title">Account</h1>

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
                ? `Tap to upload logo / photo · ${user.staffRole ?? "owner"}`
                : "Tap icon to upload a photo"}
            </p>
          </div>
        </div>
      )}

      {isDiner && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="gp-card gp-card-static p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Week
              </p>
              <p className="mt-1 text-lg font-bold text-success">
                ${savingsWeek.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted">saved</p>
            </div>
            <div className="gp-card gp-card-static p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Month
              </p>
              <p className="mt-1 text-lg font-bold text-success">
                ${savingsMonth.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted">saved</p>
            </div>
            <div className="gp-card gp-card-static p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                YTD
              </p>
              <p className="mt-1 text-lg font-bold text-success">
                ${savingsYtd.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted">saved</p>
            </div>
          </div>

          <div className="mt-4 gp-card gp-card-static p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="gp-section-label">Rewards</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {rewardPoints}{" "}
                  <span className="text-sm font-medium text-muted">pts</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Custom points for each task · {REWARDS.pointsPerReward} pts ={" "}
                  {REWARDS.rewardLabel}
                </p>
              </div>
              <button
                type="button"
                disabled={rewardsAvailable < 1}
                className="gp-btn gp-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  const ok = claimReward();
                  setClaimMsg(
                    ok
                      ? `Claimed ${REWARDS.rewardLabel}! Show this to staff.`
                      : `Need ${REWARDS.pointsPerReward - rewardProgress} more points.`,
                  );
                }}
              >
                Claim reward
                {rewardsAvailable > 0 ? ` (${rewardsAvailable})` : ""}
              </button>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-muted">
                <span>Progress to next free item</span>
                <span>
                  {rewardProgress}/{REWARDS.pointsPerReward}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-gold transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (rewardProgress / REWARDS.pointsPerReward) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-4 rounded-md border border-border/80 bg-elevated/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                How to earn points
              </p>
              <ul className="mt-2 grid gap-1 text-xs text-stone-300 sm:grid-cols-2">
                {Object.values(POINT_ACTIONS).map((a) => (
                  <li key={a.label}>
                    <span className="font-semibold text-brand">+{a.points}</span>{" "}
                    {a.label}
                  </li>
                ))}
              </ul>
            </div>
            {claimMsg && (
              <p className="mt-3 text-sm text-success">{claimMsg}</p>
            )}
            {rewardHistory.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted">
                {rewardHistory.slice(0, 5).map((h) => (
                  <li key={h.id}>
                    {h.type === "earn" ? "+" : ""}
                    {h.points} · {h.note} ·{" "}
                    {new Date(h.at).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 gp-card gp-card-static p-5">
            <p className="gp-section-label">Badges</p>
            <p className="mt-1 text-xs text-muted">
              Unlock achievements as you use GorditoPass.{" "}
              {earnedBadges.length}/{BADGES.length} earned
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((b) => {
                const unlocked = earnedBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`rounded-lg border p-3 text-center transition ${
                      unlocked
                        ? "border-brand/40 bg-brand/10"
                        : "border-border bg-elevated/40 opacity-50"
                    }`}
                    title={b.description}
                  >
                    <p className="text-2xl">{b.emoji}</p>
                    <p className="mt-1 text-xs font-semibold tracking-tight">
                      {b.name}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-muted">
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

          {householdMembers.length > 0 && (
            <div className="mt-4 gp-card gp-card-static p-5">
              <p className="gp-section-label">Household accounts</p>
              <p className="mt-1 text-xs text-muted">
                Created at signup from your family / friends seats.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {householdMembers.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-md border border-border bg-elevated/40 px-3 py-2"
                  >
                    <p className="font-medium">
                      {m.firstName} {m.lastName}
                      {m.isPrimary ? (
                        <span className="ml-2 text-xs text-brand">Primary</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {m.email} · {m.phone}
                    </p>
                    <p className="text-xs text-muted">{m.homeAddress}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {isRestaurant && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Rev · week
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueWeek.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Rev · month
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueMonth.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Rev · YTD
            </p>
            <p className="mt-1 text-lg font-bold text-success">
              ${partnerRevenueYtd.toFixed(0)}
            </p>
          </div>
          <div className="gp-card gp-card-static p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Redemptions
            </p>
            <p className="mt-1 text-lg font-bold text-brand-gold">
              {partnerRedemptionCount}
            </p>
            <p className="text-[10px] text-muted">total</p>
          </div>
        </div>
      )}

      <div className="mt-6 gp-card gp-card-static space-y-3 p-5 text-sm">
        <p>
          <span className="text-muted">Name:</span> {user.name}
        </p>
        <p>
          <span className="text-muted">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted">Role:</span> {user.role}
          {user.staffRole ? ` · ${user.staffRole}` : ""}
        </p>
        <p>
          <span className="text-muted">City:</span> {user.city}
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
            <span className="text-muted">Staff role (demo switch)</span>
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
            <span className="mt-1 block text-xs text-muted">
              Only owner / manager / marketing can edit deals, menu, events, and
              jobs. Employees can redeem only.
            </span>
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
                  onChange={(e) => updateProfile({ lastName: e.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-muted">Birthday</span>
              <input
                type="date"
                className="gp-input mt-1"
                value={user.birthday ?? ""}
                onChange={(e) => updateProfile({ birthday: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-muted">Phone number</span>
              <input
                type="tel"
                className="gp-input mt-1"
                placeholder="(555) 555-5555"
                value={user.phone ?? ""}
                onChange={(e) => updateProfile({ phone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-muted">Home address</span>
              <input
                className="gp-input mt-1"
                placeholder="Street, city, state, ZIP"
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
                placeholder="e.g. Mi Tierra Cocina"
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
                placeholder="e.g. Mexican, BBQ, pizza"
                value={user.favoriteFoodType ?? ""}
                onChange={(e) =>
                  updateProfile({ favoriteFoodType: e.target.value })
                }
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {!user.isMember && user.role === "diner" && (
          <Link href="/membership" className="gp-btn gp-btn-primary text-sm">
            Get membership
          </Link>
        )}
        {user.role === "restaurant" && (
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

      {isDiner && (
        <>
          <div className="mt-8">
            <h2 className="font-semibold tracking-tight">Want to try</h2>
            {favorites.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No restaurants saved yet. Tap “Want to try” on a restaurant
                page.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {favorites.map((id) => {
                  const r = getRestaurant(id);
                  return (
                    <li key={id}>
                      <Link
                        href={`/restaurants/${id}`}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:border-brand/40"
                      >
                        <span>{r?.emoji ?? "🍽️"}</span>
                        <span className="font-medium">{r?.name ?? id}</span>
                        {r && (
                          <span className="text-xs text-muted">
                            · {r.neighborhood}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-semibold tracking-tight">Recent redemptions</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {redemptions.slice(0, 8).map((r) => (
                <li key={r.at + r.code}>
                  {r.restaurantName ?? r.dealId} · saved $
                  {(r.savingsUsd ?? 0).toFixed(2)} · {r.code} ·{" "}
                  {new Date(r.at).toLocaleString()}
                </li>
              ))}
              {redemptions.length === 0 && (
                <li>None yet — redeem a deal to start tracking savings.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
