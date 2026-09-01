"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RestaurantCard } from "@/components/RestaurantCard";
import { CITIES } from "@/lib/data";
import { useLiveCatalog } from "@/lib/live-catalog";
import { useStore } from "@/lib/store";

/**
 * Auto-scrolling horizontal gallery (right → left), swipeable either way.
 * Uses translate3d for smooth sub-pixel motion (home only — explore unchanged).
 */
export function HomeFeatured() {
  const { isRestaurantApproved, city } = useStore();
  const { restaurants } = useLiveCatalog();
  const cityName =
    CITIES.find((c) => c.id === city)?.name ?? "your city";
  const featured = restaurants.filter(
    (r) => isRestaurantApproved(r.id) && r.city === city && r.approved,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startOffset: number;
  }>({ active: false, startX: 0, startOffset: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track || featured.length === 0) return;

    let raf = 0;
    let last = performance.now();
    // Slow, smooth marquee (~28 px/sec)
    const speed = 0.028;

    const halfWidth = () => track.scrollWidth / 2;

    const apply = () => {
      const half = halfWidth();
      if (half <= 0) return;
      // Keep offset in [0, half)
      while (offsetRef.current >= half) offsetRef.current -= half;
      while (offsetRef.current < 0) offsetRef.current += half;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    };

    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (
        !pausedRef.current &&
        !dragRef.current.active &&
        track.scrollWidth > (viewportRef.current?.clientWidth ?? 0)
      ) {
        offsetRef.current += speed * dt;
        apply();
      }
      raf = requestAnimationFrame(tick);
    };
    apply();
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

  const loop = [...featured, ...featured];

  function onPointerDown(e: React.PointerEvent) {
    pausedRef.current = true;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startOffset: offsetRef.current,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active || !trackRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    // Dragging right reveals content on the left → decrease offset
    offsetRef.current = dragRef.current.startOffset - dx;
    const half = trackRef.current.scrollWidth / 2;
    while (offsetRef.current >= half) offsetRef.current -= half;
    while (offsetRef.current < 0) offsetRef.current += half;
    trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      pausedRef.current = false;
    }, 900);
  }

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="cursor-grab overflow-hidden active:cursor-grabbing"
        aria-label="Featured restaurants"
        onMouseEnter={() => {
          if (!dragRef.current.active) pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (!dragRef.current.active) pausedRef.current = false;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex gap-4 will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
        >
          {loop.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="w-[min(280px,78vw)] shrink-0 select-none"
              aria-hidden={i >= featured.length}
            >
              <RestaurantCard restaurant={r} highlightPromo />
            </div>
          ))}
        </div>
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
