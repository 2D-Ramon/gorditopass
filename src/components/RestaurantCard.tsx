import Link from "next/link";
import type { Restaurant } from "@/lib/types";
import { RestaurantProfileCard } from "@/components/RestaurantProfileCard";
import styles from "./restaurant-profile-card.module.css";

/** Lucide-style MapPin — lucide-react is not a project dependency. */
function MapPinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function RestaurantCard({
  restaurant,
  compact = true,
}: {
  restaurant: Restaurant;
  compact?: boolean;
}) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${restaurant.name}, ${restaurant.address}`,
  )}`;

  return (
    <article className="gp-card group relative flex flex-col overflow-hidden transition hover:border-brand/40 hover:shadow-[var(--shadow-glow)]">
      <Link
        href={`/restaurants/${restaurant.id}`}
        className="flex flex-1 flex-col"
      >
        <RestaurantProfileCard
          restaurant={restaurant}
          compact={compact}
          headingLevel={3}
        />
      </Link>
      {/* Sibling of the card link so we avoid nested <a>; sits on hero top-right (OTM miles slot). */}
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.mapPin}
        aria-label={`Directions to ${restaurant.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MapPinIcon />
      </a>
    </article>
  );
}
