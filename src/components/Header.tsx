"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/lib/data";
import { PLATFORM } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { CityId } from "@/lib/types";

const dinerLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/passports", label: "Passports" },
  { href: "/events", label: "Events" },
  { href: "/jobs", label: "Jobs" },
  { href: "/feed", label: "City feed" },
  { href: "/membership", label: "Membership" },
];

const businessLinks = [{ href: "/for-restaurants", label: "For restaurants" }];

export function Header() {
  const pathname = usePathname();
  const {
    user,
    cartCount,
    signInDemo,
    signOut,
    city,
    setCity,
    unreadNotificationCount,
  } = useStore();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-hot text-base shadow-md shadow-orange-500/20 ring-1 ring-white/10">
            🍽️
          </span>
          <span className="text-[0.95rem]">
            {PLATFORM.name}
            <span className="ml-1.5 hidden rounded-md bg-brand/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-300/90 sm:inline">
              beta
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {dinerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${
                isActive(l.href)
                  ? "bg-white/8 text-white"
                  : "text-muted hover:bg-white/4 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {businessLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${
                isActive(l.href)
                  ? "bg-white/8 text-white"
                  : "text-muted hover:bg-white/4 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <label className="gp-city-select-wrap hidden sm:inline-flex">
            <span className="sr-only">City</span>
            <select
              className="gp-city-select"
              value={city}
              onChange={(e) => setCity(e.target.value as CityId)}
              aria-label="City"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.live ? " (soon)" : ""}
                </option>
              ))}
            </select>
          </label>

          <Link
            href="/passports"
            className="gp-btn gp-btn-ghost relative text-sm"
            aria-label="Passports and notifications"
            title="Passports"
          >
            🛂
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="gp-btn gp-btn-ghost relative text-sm"
            aria-label="Cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "restaurant" && (
                <Link
                  href="/restaurant/dashboard"
                  className="text-[13px] text-muted hover:text-white"
                >
                  Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-[13px] text-muted hover:text-white"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="text-[13px] font-medium text-orange-200/90 hover:text-orange-100"
              >
                {user.name}
                {user.isMember && (
                  <span className="ml-1 gp-badge !normal-case">Member</span>
                )}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-muted hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => signInDemo("diner")}
                className="gp-btn gp-btn-secondary text-sm !px-3 !py-1.5"
              >
                Demo sign in
              </button>
              <Link
                href="/membership"
                className="gp-btn gp-btn-primary text-sm !px-3 !py-1.5"
              >
                Join
              </Link>
            </div>
          )}

          <button
            type="button"
            className="gp-btn gp-btn-ghost lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-elevated px-4 py-4 lg:hidden">
          <label className="mb-3 block text-sm">
            <span className="gp-section-label mb-1.5 block">City</span>
            <span className="gp-city-select-wrap block w-full">
              <select
                className="gp-city-select w-full"
                value={city}
                onChange={(e) => setCity(e.target.value as CityId)}
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.live ? " (soon)" : ""}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <p className="gp-section-label mb-2">Diners</p>
          <div className="flex flex-col gap-0.5">
            {dinerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-card"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="gp-section-label mb-2 mt-4">Business</p>
          <div className="flex flex-col gap-0.5">
            {businessLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-card"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/restaurant/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm hover:bg-card"
            >
              Partner dashboard
            </Link>
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => {
                signInDemo("diner");
                setOpen(false);
              }}
              className="gp-btn gp-btn-primary mt-4 w-full"
            >
              Demo sign in
            </button>
          )}
        </div>
      )}
    </header>
  );
}
