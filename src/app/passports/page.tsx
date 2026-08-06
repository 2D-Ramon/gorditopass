"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PASSPORTS, passportProgress } from "@/lib/passports";
import { useStore } from "@/lib/store";

export default function PassportsPage() {
  const {
    user,
    redemptions,
    isRestaurantApproved,
    completedPassports,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    unreadNotificationCount,
  } = useStore();

  const visited = useMemo(() => {
    const s = new Set<string>();
    for (const r of redemptions) {
      if (r.restaurantId) s.add(r.restaurantId);
    }
    return s;
  }, [redemptions]);

  const passportNotes = notifications.filter((n) => n.passportId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="gp-badge mb-4">Gamification</p>
      <h1 className="gp-page-title">Cuisine passports</h1>
      <p className="gp-page-sub">
        Collect the world on your plate. Visit every live partner in a category
        to earn that passport. If a new restaurant joins the category, your
        passport pauses until you stamp the new spot too.
      </p>

      {passportNotes.length > 0 && (
        <section className="mt-8 gp-card gp-card-static p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold tracking-tight">
              Notifications
              {unreadNotificationCount > 0 && (
                <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </h2>
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
          <ul className="mt-3 space-y-2">
            {passportNotes.slice(0, 8).map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read
                    ? "border-border bg-elevated/30 text-muted"
                    : n.type === "passport_revoked"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-success/40 bg-success/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-100">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {n.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!n.read && (
                      <button
                        type="button"
                        className="text-[10px] text-brand"
                        onClick={() => markNotificationRead(n.id)}
                      >
                        Read
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-[10px] text-muted"
                      onClick={() => dismissNotification(n.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!user && (
        <p className="mt-6 text-sm text-muted">
          <Link href="/account" className="text-brand underline">
            Sign in
          </Link>{" "}
          as a diner and redeem deals to stamp restaurants.
        </p>
      )}

      <div className="mt-8 space-y-4">
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
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">
                    {p.name}
                  </h2>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {p.region}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {p.description}
                  </p>
                </div>
                <div className="text-right">
                  {held ? (
                    <span className="inline-block rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                      Passport held
                    </span>
                  ) : prog.restaurants.length === 0 ? (
                    <span className="inline-block rounded-full bg-elevated px-3 py-1 text-xs text-muted">
                      Coming soon
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-elevated px-3 py-1 text-xs text-muted">
                      In progress
                    </span>
                  )}
                  <p className="mt-2 text-sm font-semibold">
                    {prog.visited.length}/{prog.restaurants.length || "—"}{" "}
                    <span className="text-xs font-normal text-muted">
                      stamped
                    </span>
                  </p>
                  {prog.restaurants.length > 0 && (
                    <p className="text-xs text-muted">{prog.percent}%</p>
                  )}
                </div>
              </div>

              {prog.restaurants.length > 0 && (
                <>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-gold transition-all"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {prog.restaurants.map((r) => {
                      const stamped = visited.has(r.id);
                      return (
                        <li key={r.id}>
                          <Link
                            href={`/restaurants/${r.id}`}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:border-brand/40 ${
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
                              {stamped ? "✓ Stamped" : "Visit"}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {prog.restaurants.length === 0 && (
                <p className="mt-3 text-xs text-muted">
                  No live partners in this category yet — passports open as
                  restaurants join GorditoPass.
                </p>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-muted">
        Demo tip: complete the Latin passport (Mi Tierra + Casa Arepa), then as
        admin approve <strong className="text-stone-300">El Sabor Nuevo</strong>{" "}
        — your Latin passport pauses with a notification until you visit the new
        taqueria.
      </p>
    </div>
  );
}
