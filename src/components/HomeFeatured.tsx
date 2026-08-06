"use client";

import { RestaurantCard } from "@/components/RestaurantCard";
import { RESTAURANTS } from "@/lib/data";
import { useStore } from "@/lib/store";

export function HomeFeatured() {
  const { isRestaurantApproved } = useStore();
  const featured = RESTAURANTS.filter((r) => isRestaurantApproved(r.id)).slice(
    0,
    6,
  );

  if (featured.length === 0) {
    return (
      <p className="text-sm text-muted">
        No live restaurants yet — check back after admin approval.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {featured.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}
