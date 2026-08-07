"use client";

import { useMemo, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RESTAURANTS, cuisineLabel } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Cuisine } from "@/lib/types";

const CUISINES: (Cuisine | "all")[] = [
  "all",
  "american",
  "bbq",
  "caribbean",
  "french",
  "indian",
  "italian",
  "japanese",
  "latin",
  "mediterranean",
  "mexican",
  "pizza",
  "seafood",
  "thai",
  "wings",
];

export default function ExplorePage() {
  const { city, isRestaurantApproved } = useStore();
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine | "all">("all");

  const list = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      if (!isRestaurantApproved(r.id)) return false;
      if (r.city !== city) return false;
      if (cuisine !== "all" && r.cuisine !== cuisine) return false;
      if (q) {
        const hay = `${r.name} ${r.neighborhood} ${r.tagline}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [city, cuisine, q, isRestaurantApproved]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="gp-page-title">Explore</h1>
        <p className="gp-page-sub">
          Browse free. Every deal shown is active. Membership unlocks redeem.
          City is set in the header.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <input
          className="gp-input"
          placeholder="Search name, neighborhood…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="gp-input"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value as Cuisine | "all")}
        >
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All cuisines" : cuisineLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 gp-card gp-card-static p-4">
        <p className="mb-3 text-sm font-medium text-muted">Map (demo pins)</p>
        <div className="relative h-48 overflow-hidden rounded-lg bg-background ring-1 ring-border">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(#3f3f46 1px, transparent 1px), linear-gradient(90deg, #3f3f46 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {list.map((r, i) => (
            <div
              key={r.id}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-elevated text-sm shadow-lg"
              style={{
                left: `${12 + ((i * 17) % 70)}%`,
                top: `${18 + ((i * 23) % 55)}%`,
              }}
              title={r.name}
            >
              {r.emoji}
            </div>
          ))}
          <p className="absolute bottom-2 right-2 text-[10px] text-muted">
            Google Maps live tiles plug-in later
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        {list.length} place{list.length === 1 ? "" : "s"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-8 text-center text-muted">
          No matches in this city yet. Dallas is live for the demo.
        </p>
      )}
    </div>
  );
}
