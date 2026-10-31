"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { Restaurant } from "@/lib/types";
import "leaflet/dist/leaflet.css";

type LeafletModule = typeof import("leaflet");

/**
 * The map is created once per mount. Filtering only swaps markers and moves the view
 * (no animation), so there is never a pending zoom/pan animation on a map that has
 * been removed — that was the source of "Cannot read properties of undefined
 * (reading '_leaflet_pos')" when typing in search or changing filters.
 */
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
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [ready, setReady] = useState(false);

  // Create once; tear down fully on unmount (also covers StrictMode double mount).
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: LeafletModule }).default ?? mod) as LeafletModule;
      const node = el.current;
      if (cancelled || !node || mapRef.current) return;
      const map = L.map(node, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      leafletRef.current = L;
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      const map = mapRef.current;
      mapRef.current = null;
      layerRef.current = null;
      if (map) {
        map.stop();
        map.off();
        map.remove();
      }
      setReady(false);
    };
  }, []);

  // Update markers + view without re-creating the map.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !layer || !L) return;
    map.stop();
    layer.clearLayers();
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
        .bindPopup(`<a href="/restaurants/${r.id}">${r.name}</a><br/><span>${r.address}</span>`)
        .addTo(layer);
    }
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: false });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14, { animate: false });
    } else {
      map.setView([center.lat, center.lng], 11, { animate: false });
    }
  }, [ready, restaurants, center.lat, center.lng]);

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
