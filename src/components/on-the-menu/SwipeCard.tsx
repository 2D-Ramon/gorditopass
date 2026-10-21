import { PlateRating } from "@/components/PlateRating";
import { cuisineLabel } from "@/lib/data";
import { formatMiles } from "@/lib/miles";
import type { Restaurant } from "@/lib/types";
import home from "@/components/home/home.module.css";
import { dealTag } from "./dealTag";
import styles from "./on-the-menu.module.css";

export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** First active deal, same rule the page already used for its cards. */
export function activeDeal(restaurant: Restaurant) {
  return restaurant.deals.find((d) => d.active && !d.soldOut) ?? null;
}

/** Hero photo: first menu item photo, if the data has one. */
function heroPhoto(restaurant: Restaurant) {
  return restaurant.menu.find((item) => item.imageUrl && !item.soldOut)?.imageUrl ?? null;
}

export function RestaurantLogo({ restaurant, size = 56 }: { restaurant: Restaurant; size?: number }) {
  return (
    <span
      className={styles.logo}
      style={{ width: size, height: size, background: restaurant.logoUrl ? "#000" : restaurant.accent }}
    >
      {restaurant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={restaurant.logoUrl} alt="" draggable={false} />
      ) : (
        <span style={{ fontSize: size * 0.36 }}>{initials(restaurant.name)}</span>
      )}
    </span>
  );
}

export function SwipeCard({
  restaurant,
  miles,
  compact = false,
}: {
  restaurant: Restaurant;
  miles: number;
  compact?: boolean;
}) {
  const deal = activeDeal(restaurant);
  const photo = heroPhoto(restaurant);
  const tag = deal ? dealTag(deal.type) : null;
  return (
    <div className={`${styles.face} ${compact ? styles.faceCompact : ""}`}>
      <div
        className={styles.hero}
        style={
          photo
            ? undefined
            : {
                background: `radial-gradient(120% 90% at 20% 15%, ${restaurant.accent} 0%, ${restaurant.accent}99 35%, transparent 75%), linear-gradient(160deg, ${restaurant.accent}cc, #121214 95%)`,
              }
        }
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" draggable={false} className={styles.heroImg} />
        ) : restaurant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.logoUrl} alt="" draggable={false} className={styles.heroLogo} />
        ) : (
          <svg className={styles.heroIcon} style={{ color: "rgba(255,255,255,0.7)" }} viewBox="0 0 48 48" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="24" cy="26" r="13" />
            <circle cx="24" cy="26" r="8" />
            <path d="M6 8v10a3 3 0 0 0 6 0V8M9 18v24M42 8c-4 2-5 8-5 13h5v21" />
          </svg>
        )}
        <span className={styles.miles}>{formatMiles(miles)}</span>
        <span className={styles.logoSlot}>
          <RestaurantLogo restaurant={restaurant} />
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className="min-w-0">
            <h2 className={styles.name}>{restaurant.name}</h2>
            <p className={styles.cuisine}>
              {cuisineLabel(restaurant.cuisine)}
              {restaurant.neighborhood ? ` · ${restaurant.neighborhood}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Plate rate
            </p>
            {restaurant.plateRating > 0 ? (
              <PlateRating value={restaurant.plateRating} size="sm" />
            ) : (
              <span className="text-xs text-muted">No reviews yet</span>
            )}
          </div>
        </div>
        {deal ? (
          <div className={styles.deal}>
            <div className={styles.dealHead}>
              <p className={styles.dealLabel}>Member deal</p>
              {tag && (
                <span
                  className={`${home.type} ${styles.dealTag}`}
                  data-type={tag.kind}
                  data-deal-tag={tag.kind}
                  // The home sheet scopes this token to its own root; same value here.
                  style={{ "--orange-300": "#fdba74" } as React.CSSProperties}
                >
                  {tag.label}
                </span>
              )}
            </div>
            <p className={styles.dealTitle}>{deal.title}</p>
            <p className={styles.dealFine}>Members redeem in store</p>
          </div>
        ) : (
          <div className={`${styles.deal} ${styles.dealNone}`}>
            <p className={styles.dealFine}>No active deal right now</p>
          </div>
        )}
      </div>
    </div>
  );
}
