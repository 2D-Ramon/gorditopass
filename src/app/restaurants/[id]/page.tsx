"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PlateRating } from "@/components/PlateRating";
import { cuisineLabel, getRestaurant } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const restaurant = getRestaurant(id);
  const {
    user,
    addToCart,
    favorites,
    toggleFavorite,
    following,
    toggleFollow,
    submitPlateReview,
    getPlateRate,
    getReviewsForRestaurant,
  } = useStore();

  const [rateOpen, setRateOpen] = useState(false);
  const [plates, setPlates] = useState(5);
  const [rateText, setRateText] = useState("");
  const [rateDone, setRateDone] = useState(false);
  const [rateTick, setRateTick] = useState(0);

  const plateStats = useMemo(() => {
    void rateTick;
    return restaurant
      ? getPlateRate(restaurant.id)
      : { rating: 0, count: 0 };
  }, [restaurant, getPlateRate, rateTick]);

  const reviews = useMemo(() => {
    void rateTick;
    return restaurant ? getReviewsForRestaurant(restaurant.id) : [];
  }, [restaurant, getReviewsForRestaurant, rateTick]);

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Restaurant not found</h1>
        <Link href="/explore" className="mt-4 inline-block text-brand">
          Back to explore
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(restaurant.id);
  const isFollowing = following.includes(restaurant.id);
  const canRate = Boolean(user?.isMember || user?.role === "restaurant");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="gp-card flex flex-col gap-6 overflow-hidden p-0 sm:flex-row">
        <div
          className="flex min-h-48 flex-1 items-center justify-center text-7xl sm:max-w-xs"
          style={{
            background: `linear-gradient(145deg, ${restaurant.accent}66, #1c1917)`,
          }}
        >
          {restaurant.emoji}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {cuisineLabel(restaurant.cuisine)} · {restaurant.neighborhood}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                {restaurant.name}
              </h1>
              <p className="text-muted">{restaurant.tagline}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Plate rate
              </p>
              <PlateRating value={plateStats.rating} />
              <p className="mt-0.5 text-[10px] text-muted">
                {plateStats.count} rating{plateStats.count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <p className="text-sm text-stone-300">{restaurant.story}</p>
          <p className="text-sm text-muted">
            {restaurant.hours} · {restaurant.address}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-sm !py-2"
              onClick={() => toggleFavorite(restaurant.id)}
            >
              {isFav ? "★ Saved" : "☆ Want to try"}
            </button>
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-sm !py-2"
              onClick={() => toggleFollow(restaurant.id)}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
            {canRate ? (
              <button
                type="button"
                className="gp-btn gp-btn-primary text-sm !py-2"
                onClick={() => {
                  setRateOpen((v) => !v);
                  setRateDone(false);
                }}
              >
                Rate the plate
              </button>
            ) : (
              <Link
                href="/membership"
                className="gp-btn gp-btn-primary text-sm !py-2"
              >
                Join to rate the plate
              </Link>
            )}
            {restaurant.acceptsReservations && (
              <span className="gp-badge">Reservations available</span>
            )}
          </div>

          {rateOpen && canRate && (
            <form
              className="mt-2 space-y-3 rounded-lg border border-border bg-background/60 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitPlateReview({
                  restaurantId: restaurant.id,
                  plates,
                  text: rateText.trim() || "Rated the plate.",
                  cuisine: restaurant.cuisine,
                });
                setRateDone(true);
                setRateText("");
                setRateTick((t) => t + 1);
              }}
            >
              <p className="text-sm font-semibold">Rate the plate</p>
              <p className="text-xs text-muted">
                Your plates update this restaurant’s plate rate (average of all
                ratings).
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlates(n)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                      plates === n
                        ? "bg-brand/20 text-orange-200 ring-brand/40"
                        : "text-muted ring-border hover:text-white"
                    }`}
                  >
                    {n} plate{n > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              <PlateRating value={plates} showNumber={false} />
              <textarea
                className="gp-input min-h-[70px] text-sm"
                placeholder="Optional note (food, service, value…)"
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
              />
              <button type="submit" className="gp-btn gp-btn-primary text-sm">
                Submit rating
              </button>
              {rateDone && (
                <p className="text-sm text-success">
                  Thanks! New plate rate: {getPlateRate(restaurant.id).rating}{" "}
                  ({getPlateRate(restaurant.id).count} ratings)
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Member deals</h2>
        <p className="text-sm text-muted">
          Everyone can see these. Redeem requires membership.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {restaurant.deals
            .filter((d) => d.active)
            .map((deal) => (
              <div key={deal.id} className="gp-card p-5">
                <p className="gp-badge">{deal.type.replace("_", " ")}</p>
                <h3 className="mt-2 text-lg font-semibold">{deal.title}</h3>
                <p className="text-sm text-muted">{deal.description}</p>
                {deal.excludesAlcohol && (
                  <p className="mt-2 text-xs text-muted">
                    % deals exclude alcohol where required by law.
                  </p>
                )}
                <div className="mt-4">
                  {user?.isMember ? (
                    <Link
                      href={`/redeem/${deal.id}`}
                      className="gp-btn gp-btn-primary text-sm"
                    >
                      Redeem now
                    </Link>
                  ) : (
                    <Link
                      href="/membership"
                      className="gp-btn gp-btn-secondary text-sm"
                    >
                      Join to redeem
                    </Link>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Menu · order online</h2>
        <p className="text-sm text-muted">
          Full cart + checkout (demo). Delivery integration later.
        </p>
        <div className="mt-4 space-y-2">
          {restaurant.menu.map((item) => (
            <div
              key={item.id}
              className="gp-card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.imageEmoji ?? "🍽️"}</span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">${item.priceUsd.toFixed(2)}</span>
                <button
                  type="button"
                  className="gp-btn gp-btn-primary text-sm !py-2"
                  onClick={() =>
                    addToCart({
                      menuItemId: item.id,
                      restaurantId: restaurant.id,
                      name: item.name,
                      priceUsd: item.priceUsd,
                    })
                  }
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/cart"
          className="mt-4 inline-block text-sm text-brand hover:underline"
        >
          View cart →
        </Link>
      </section>

      <section className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Plate rate
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">Plate reviews</h2>
        <div className="mt-4 space-y-3">
          {reviews.length === 0 && (
            <p className="text-sm text-muted">No reviews yet — be the first.</p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="gp-card gp-card-static p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.author}</p>
                <div className="text-right">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Plate rate
                  </p>
                  <PlateRating value={r.plates} showNumber={false} />
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-300">{r.text}</p>
              {(r.menuItemName || r.dealTitle) && (
                <p className="mt-1 text-xs text-muted">
                  {r.menuItemName && <>Item: {r.menuItemName}</>}
                  {r.menuItemName && r.dealTitle && " · "}
                  {r.dealTitle && <>Deal: {r.dealTitle}</>}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{r.createdAt}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
