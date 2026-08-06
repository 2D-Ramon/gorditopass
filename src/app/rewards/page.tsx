"use client";

import Link from "next/link";
import {
  BADGES,
  POINT_ACTIONS,
  REWARD_CATALOG,
  REWARDS,
} from "@/lib/pricing";
import { PASSPORTS } from "@/lib/passports";
import { useStore } from "@/lib/store";

export default function RewardsPage() {
  const {
    user,
    rewardPoints,
    rewardProgress,
    rewardsAvailable,
    rewardHistory,
    redemptions,
    completedPassports,
    earnedBadges,
  } = useStore();

  const claimed = user?.rewardsClaimed ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="gp-badge mb-4">Members</p>
      <h1 className="gp-page-title">Rewards & redemptions</h1>
      <p className="gp-page-sub">
        Earn points for deals, reviews, favorites, and passports. Claim free
        items when you hit the threshold. Track every stamp and badge.
      </p>

      {!user || user.role !== "diner" ? (
        <div className="mt-8 gp-card gp-card-static p-6 text-center">
          <p className="text-muted">
            Sign in as a diner member to track rewards.
          </p>
          <Link href="/login" className="gp-btn gp-btn-primary mt-4">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="gp-card gp-card-static p-5 text-center">
              <p className="text-xs text-muted">Points balance</p>
              <p className="mt-1 text-3xl font-bold text-brand">{rewardPoints}</p>
            </div>
            <div className="gp-card gp-card-static p-5 text-center">
              <p className="text-xs text-muted">Toward free item</p>
              <p className="mt-1 text-3xl font-bold">
                {rewardProgress}
                <span className="text-sm text-muted">
                  /{REWARDS.pointsPerReward}
                </span>
              </p>
            </div>
            <div className="gp-card gp-card-static p-5 text-center">
              <p className="text-xs text-muted">Rewards claimed</p>
              <p className="mt-1 text-3xl font-bold text-success">{claimed}</p>
            </div>
          </div>

          <div className="mt-6 gp-card gp-card-static p-5">
            <p className="gp-section-label">Rewards catalog</p>
            <p className="mt-1 text-sm text-muted">
              Placeholder items — claim flow coming soon. Spend progress:{" "}
              {rewardProgress}/{REWARDS.pointsPerReward} pts toward a free item.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-gold"
                style={{
                  width: `${Math.min(
                    100,
                    (rewardProgress / REWARDS.pointsPerReward) * 100,
                  )}%`,
                }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {REWARD_CATALOG.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-elevated/40 p-4"
                >
                  <p className="text-2xl">{item.emoji}</p>
                  <p className="mt-1 font-semibold">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                  <p className="mt-2 text-sm font-medium text-brand">
                    {item.pointsCost} pts
                  </p>
                  <button
                    type="button"
                    disabled
                    className="gp-btn gp-btn-secondary mt-3 w-full text-xs opacity-60"
                    title="Claim process coming soon"
                  >
                    Claim (coming soon)
                  </button>
                </div>
              ))}
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">How to earn points</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.values(POINT_ACTIONS).map((a) => (
                <li
                  key={a.label}
                  className="rounded-lg border border-border bg-elevated/40 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-brand">+{a.points}</span>{" "}
                  {a.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Point history</h2>
            {rewardHistory.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {rewardHistory.map((h) => (
                  <li
                    key={h.id}
                    className="flex justify-between gap-3 border-b border-border/60 py-2"
                  >
                    <span className="text-muted">{h.note}</span>
                    <span
                      className={
                        h.type === "earn" ? "text-success" : "text-brand"
                      }
                    >
                      {h.type === "earn" ? "+" : ""}
                      {h.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Deal redemptions</h2>
            {redemptions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No redemptions yet.{" "}
                <Link href="/explore" className="text-brand underline">
                  Explore deals
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {redemptions.map((r, i) => (
                  <li
                    key={`${r.code}-${i}`}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <p className="font-medium">
                      {r.restaurantName ?? "Restaurant"} · code {r.code}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(r.at).toLocaleString()} · saved $
                      {r.savingsUsd.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Badges & passports</h2>
            <p className="mt-1 text-sm text-muted">
              {earnedBadges.length} badges · {completedPassports.length}{" "}
              passports held
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-lg border p-3 text-center text-xs ${
                    earnedBadges.includes(b.id)
                      ? "border-brand/40 bg-brand/10"
                      : "border-border opacity-40"
                  }`}
                >
                  <p className="text-xl">{b.emoji}</p>
                  <p className="mt-1 font-semibold">{b.name}</p>
                </div>
              ))}
              {PASSPORTS.map((p) => {
                const held = completedPassports.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 text-center text-xs ${
                      held
                        ? "border-brand/40 bg-brand/10"
                        : "border-border opacity-40"
                    }`}
                  >
                    <p className="text-xl">{p.emoji}</p>
                    <p className="mt-1 font-semibold">
                      {p.name.replace(" Passport", "")}
                    </p>
                    <p className="text-[10px] text-muted">Passport</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <p className="mt-10 text-sm text-muted">
        Also in your{" "}
        <Link href="/account?tab=rewards" className="text-brand underline">
          account → Rewards
        </Link>{" "}
        tab.
      </p>
    </div>
  );
}
