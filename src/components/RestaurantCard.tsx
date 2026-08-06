import Link from "next/link";
import type { Restaurant } from "@/lib/types";
import { cuisineLabel } from "@/lib/data";
import { PlateRating } from "./PlateRating";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const topDeal = restaurant.deals.find((d) => d.active);

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="gp-card group flex flex-col overflow-hidden transition hover:border-brand/40 hover:shadow-[var(--shadow-glow)]"
    >
      <div
        className="relative flex h-36 items-center justify-center text-5xl"
        style={{
          background: `linear-gradient(145deg, ${restaurant.accent}40, #121214 70%)`,
        }}
      >
        <span className="drop-shadow-md transition duration-200 group-hover:scale-105">
          {restaurant.emoji}
        </span>
        {topDeal && (
          <span className="absolute bottom-2.5 left-2.5 gp-badge max-w-[90%] truncate !normal-case !tracking-normal">
            {topDeal.title}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-snug tracking-tight group-hover:text-orange-200">
              {restaurant.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {cuisineLabel(restaurant.cuisine)} · {restaurant.neighborhood}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Plate rate
            </p>
            <PlateRating value={restaurant.plateRating} size="sm" />
          </div>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {restaurant.tagline}
        </p>
      </div>
    </Link>
  );
}
