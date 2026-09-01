"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CITIES } from "@/lib/data";
import { PLATFORM } from "@/lib/pricing";
import { isLocalDemoHost } from "@/lib/public-site";
import { useStore } from "@/lib/store";
import type { CityId } from "@/lib/types";

const dinerLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/feed", label: "City feed" },
  { href: "/membership", label: "Membership" },
];

const businessLinks = [{ href: "/for-restaurants", label: "For restaurants" }];

export function Header() {
  const pathname = usePathname();
  const { user, cartCount, signOut, city, setCity } = useStore();
  const [open, setOpen] = useState(false);
  const [localDemo, setLocalDemo] = useState(false);
  useEffect(() => setLocalDemo(isLocalDemoHost()), []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"
        >
          <BrandMark />
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
              aria-current={isActive(l.href) ? "page" : undefined}
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
              aria-current={isActive(l.href) ? "page" : undefined}
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
            href="/cart"
            className="gp-btn gp-btn-ghost relative text-sm"
            aria-label="Cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6h15l-1.5 9h-12z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" />
              <circle cx="18" cy="20" r="1.4" fill="currentColor" />
            </svg>
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
              <Link
                href="/login"
                className="text-[11px] text-muted hover:text-white"
              >
                Switch
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
              <Link
                href="/login"
                className="gp-btn gp-btn-secondary text-sm !px-3 !py-1.5"
              >
                Sign in
              </Link>
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
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="gp-btn gp-btn-secondary text-center text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/membership"
                onClick={() => setOpen(false)}
                className="gp-btn gp-btn-primary text-center text-sm"
              >
                Join
              </Link>
            </div>
          )}
          {localDemo && !user ? (
            <p className="mt-3 text-center text-[11px] text-muted">
              Local only: demo shortcuts live on the sign-in page.
            </p>
          ) : null}
        </div>
      )}
    </header>
  );
}
