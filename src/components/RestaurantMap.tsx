"use client";

import { useEffect, useRef } from "react";
import type { Restaurant } from "@/lib/types";
import "leaflet/dist/leaflet.css";

export function RestaurantMap({
  restaurants,
  center,
  cityName,
}: {
  restaurants: Restaurant[];
  center: { lat: number; lng: number };
  cityName: string;
}) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      const view = L.map(el.current, { scrollWheelZoom: false }).setView(
        [center.lat, center.lng],
        11,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(view);

      const bounds: [number, number][] = [];
      for (const r of restaurants) {
        if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
        bounds.push([r.lat, r.lng]);
        const icon = L.divIcon({
          className: "gp-map-pin",
          html: `<span>${r.emoji}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([r.lat, r.lng], { icon })
          .addTo(view)
          .bindPopup(
            `<a href="/restaurants/${r.id}">${r.name}</a><br/><span>${r.address}</span>`,
          );
      }
      if (bounds.length > 1) {
        view.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
      } else if (bounds.length === 1) {
        view.setView(bounds[0], 14);
      }
      map = view;
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [restaurants, center.lat, center.lng]);

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-muted">{cityName} map</p>
      <div
        ref={el}
        className="h-72 w-full overflow-hidden rounded-lg ring-1 ring-border"
        aria-label={`${cityName} restaurant map`}
      />
    </div>
  );
}
