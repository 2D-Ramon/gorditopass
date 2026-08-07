"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RestaurantCard } from "@/components/RestaurantCard";
import { CITIES, RESTAURANTS } from "@/lib/data";
import { useStore } from "@/lib/store";

/**
 * Auto-scrolling horizontal gallery (right → left), swipeable either way.
 * Home page only — explore page is unchanged.
 */
export function HomeFeatured() {
  const { isRestaurantApproved, city } = useStore();
  const cityName =
    CITIES.find((c) => c.id === city)?.name ?? "your city";
  const featured = RESTAURANTS.filter(
    (r) => isRestaurantApproved(r.id) && r.city === city,
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || featured.length === 0) return;

    let raf = 0;
    let last = performance.now();
    const speed = 0.45; // px per ms ≈ slow marquee

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += speed * dt;
        // loop seamlessly when near end of first half (duplicated track)
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [featured.length]);

  if (featured.length === 0) {
    return (
      <p className="text-sm text-muted">
        No live restaurants in {cityName} yet — check back after admin
        approval.
      </p>
    );
  }

  // Duplicate cards for seamless loop
  const loop = [...featured, ...featured];

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex touch-pan-x gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => {
          // resume after a short delay so swipe feels natural
          setTimeout(() => {
            pausedRef.current = false;
          }, 1200);
        }}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {loop.map((r, i) => (
          <div
            key={`${r.id}-${i}`}
            className="w-[min(280px,78vw)] shrink-0"
          >
            <RestaurantCard restaurant={r} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        Swipe left or right · auto-scrolls when idle
      </p>
    </div>
  );
}

/** Full home “Featured in {city}” block (title + carousel). */
export function HomeFeaturedSection() {
  const { city } = useStore();
  const cityName = CITIES.find((c) => c.id === city)?.name ?? "your city";

  return (
    <section className="border-y border-border bg-elevated/40 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Featured in {cityName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Local spots with member deals you can redeem after you join.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-sm font-medium text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        <HomeFeatured />
      </div>
    </section>
  );
}
