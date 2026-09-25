"use client";

import { useEffect, useMemo, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { CITIES, cuisineLabel } from "@/lib/data";
import { asCity, CITY_CENTERS } from "@/lib/listing-map";
import { useLiveCatalog } from "@/lib/live-catalog";
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
  const { city, setCity, isRestaurantApproved } = useStore();
  const { restaurants } = useLiveCatalog();
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine | "all">("all");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("city");
    if (raw) setCity(asCity(raw));
  }, [setCity]);

  const list = useMemo(() => {
    return restaurants.filter((r) => {
      if (!isRestaurantApproved(r.id) || !r.approved) return false;
      if (r.city !== city) return false;
      if (cuisine !== "all" && r.cuisine !== cuisine) return false;
      if (q) {
        const hay = `${r.name} ${r.neighborhood} ${r.tagline}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [city, cuisine, q, isRestaurantApproved, restaurants]);
  const cityMeta = CITIES.find((c) => c.id === city);
  const center = CITY_CENTERS[city];

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
        <RestaurantMap
          restaurants={list}
          center={center}
          cityName={cityMeta?.name ?? "City"}
        />
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
          {cityMeta?.live
            ? `No matches in ${cityMeta.name} yet. Approved restaurants in this city show up here.`
            : `${cityMeta?.name ?? "This city"} is coming later.`}
        </p>
      )}
    </div>
  );
}
