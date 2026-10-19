"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlateRating } from "@/components/PlateRating";
import { cityLabel, cuisineLabel } from "@/lib/data";
import { CITY_CENTERS } from "@/lib/listing-map";
import { useLiveCatalog } from "@/lib/live-catalog";
import { formatMiles, milesBetween } from "@/lib/miles";
import { useStore } from "@/lib/store";
import type { Restaurant } from "@/lib/types";

const RADIUS_PRESETS = [1, 3, 5, 10, 15, 25];
const SWIPE_PX = 96;

type Origin = { lat: number; lng: number; kind: "you" | "city" };
type Decision = { id: string; choice: "yes" | "no" };
type Nearby = { restaurant: Restaurant; miles: number };
type LocStatus = "idle" | "asking" | "ready" | "denied" | "unavailable";
type Fly = "left" | "right" | null;

function menuPreview(restaurant: Restaurant) {
  return restaurant.menu.filter((item) => !item.soldOut).slice(0, 3);
}

function money(priceUsd: number) {
  if (!priceUsd) return null;
  return `$${priceUsd.toFixed(2)}`;
}

export function OnTheMenu() {
  const { city, isRestaurantApproved } = useStore();
  const { restaurants } = useLiveCatalog();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>("idle");
  const [radius, setRadius] = useState(5);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [view, setView] = useState<"deck" | "possibilities">("deck");
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [fly, setFly] = useState<Fly>(null);
  const [reel, setReel] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [exitArmed, setExitArmed] = useState(false);
  const [clearedNote, setClearedNote] = useState(false);

  const mounted = useRef(true);
  const exitRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const spinToken = useRef(0);
  const gesture = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    locked: "x" | "y" | null;
  } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      spinToken.current += 1;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const cityName = cityLabel(city);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("unavailable");
      return;
    }
    setLocStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted.current) return;
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          kind: "you",
        });
        setLocStatus("ready");
      },
      () => {
        if (!mounted.current) return;
        setLocStatus("denied");
      },
      { enableHighAccuracy: false, maximumAge: 2 * 60 * 1000, timeout: 10000 },
    );
  }, []);

  function applyCityCenter() {
    const center = CITY_CENTERS[city];
    setOrigin({ lat: center.lat, lng: center.lng, kind: "city" });
    setLocStatus("ready");
  }

  const focus = useMemo(() => {
    if (!origin) return null;
    if (origin.kind === "city") {
      const center = CITY_CENTERS[city];
      return { lat: center.lat, lng: center.lng, kind: "city" as const };
    }
    return origin;
  }, [origin, city]);

  const ranked = useMemo(() => {
    if (!focus) return [];
    const rows: Nearby[] = [];
    for (const restaurant of restaurants) {
      if (!restaurant.approved || !isRestaurantApproved(restaurant.id)) continue;
      if (!Number.isFinite(restaurant.lat) || !Number.isFinite(restaurant.lng)) continue;
      rows.push({
        restaurant,
        miles: milesBetween(focus.lat, focus.lng, restaurant.lat, restaurant.lng),
      });
    }
    rows.sort(
      (a, b) =>
        a.miles - b.miles || a.restaurant.name.localeCompare(b.restaurant.name),
    );
    return rows;
  }, [restaurants, focus, isRestaurantApproved]);

  const inRadius = ranked.filter((place) => place.miles <= radius);
  const decided = new Set(decisions.map((d) => d.id));
  const deck = inRadius.filter((place) => !decided.has(place.restaurant.id));
  const possibilities = decisions
    .filter((d) => d.choice === "yes")
    .map((d) => ranked.find((place) => place.restaurant.id === d.id))
    .filter((place): place is Nearby => Boolean(place));
  const top = deck[0];
  const topId = top?.restaurant.id ?? null;
  const reelSafe = possibilities.length ? reel % possibilities.length : 0;
  const winner = possibilities.find((place) => place.restaurant.id === winnerId) ?? null;

  const chooseRef = useRef<(choice: "yes" | "no") => void>(() => {});

  useEffect(() => {
    chooseRef.current = (choice: "yes" | "no") => {
      if (!topId || fly || exitRef.current) return;
      exitRef.current = topId;
      const id = topId;
      setFly(choice === "yes" ? "right" : "left");
      setDrag({ x: 0, y: 0, dragging: false });
      gesture.current = null;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (!mounted.current) return;
        setDecisions((prev) =>
          prev.some((d) => d.id === id) ? prev : [...prev, { id, choice }],
        );
        setFly(null);
        exitRef.current = null;
        if (choice === "yes") setClearedNote(false);
      }, 240);
    };
  }, [topId, fly]);

  function beginExit(choice: "yes" | "no") {
    chooseRef.current(choice);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view !== "deck") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      chooseRef.current(e.key === "ArrowRight" ? "yes" : "no");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  function undo() {
    if (fly || spinning || decisions.length === 0) return;
    const last = decisions[decisions.length - 1];
    if (winnerId === last.id) setWinnerId(null);
    setDecisions((prev) => prev.slice(0, -1));
  }

  function backToDeck() {
    spinToken.current += 1;
    setSpinning(false);
    setExitArmed(false);
    setView("deck");
  }

  function removeYes(id: string) {
    if (spinning) return;
    setDecisions((prev) => prev.filter((d) => !(d.id === id && d.choice === "yes")));
    setWinnerId((current) => (current === id ? null : current));
  }

  function exitTonight() {
    spinToken.current += 1;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    exitRef.current = null;
    setDecisions([]);
    setWinnerId(null);
    setReel(0);
    setSpinning(false);
    setFly(null);
    setDrag({ x: 0, y: 0, dragging: false });
    setExitArmed(false);
    setView("deck");
    setClearedNote(true);
  }

  function draw() {
    if (spinning || possibilities.length === 0) return;
    const pool = possibilities;
    const n = pool.length;
    const pick = Math.floor(Math.random() * n);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || n === 1) {
      setReel(pick);
      setWinnerId(pool[pick].restaurant.id);
      setSpinning(false);
      return;
    }
    const token = ++spinToken.current;
    const start = reelSafe;
    const steps = n * 3 + ((pick - start + n) % n);
    setSpinning(true);
    setWinnerId(null);
    let i = 0;
    const tick = () => {
      if (!mounted.current || spinToken.current !== token) return;
      i += 1;
      setReel((start + i) % n);
      if (i >= steps) {
        setSpinning(false);
        setWinnerId(pool[pick].restaurant.id);
        return;
      }
      const t = i / steps;
      window.setTimeout(tick, 45 + t * t * 260);
    };
    window.setTimeout(tick, 45);
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (fly || e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, locked: null };
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || fly) return;
    g.dx = e.clientX - g.x;
    g.dy = e.clientY - g.y;
    if (!g.locked) {
      if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) return;
      g.locked = Math.abs(g.dx) > Math.abs(g.dy) ? "x" : "y";
      if (g.locked === "x") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.locked !== "x") return;
    setDrag({ x: g.dx, y: g.dy * 0.12, dragging: true });
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.locked !== "x" || fly) {
      setDrag({ x: 0, y: 0, dragging: false });
      return;
    }
    if (g.dx >= SWIPE_PX) beginExit("yes");
    else if (g.dx <= -SWIPE_PX) beginExit("no");
    else setDrag({ x: 0, y: 0, dragging: false });
  }

  const yesOpacity =
    fly === "right" ? 1 : fly === "left" ? 0 : Math.max(0, Math.min(1, drag.x / 90));
  const noOpacity =
    fly === "left" ? 1 : fly === "right" ? 0 : Math.max(0, Math.min(1, -drag.x / 90));

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="gp-badge mb-4">Tonight only</p>
      <h1 className="gp-page-title">What&apos;s on the menu</h1>
      <p className="gp-page-sub">
        Swipe right if you want to try it. Swipe left to pass. Yes votes land
        in Possibilities for tonight, then a draw picks the place.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This is not a saved favorite. The list clears when you leave this page
        or exit Possibilities.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2" role="tablist" aria-label="Tonight">
        <button
          type="button"
          role="tab"
          aria-selected={view === "deck"}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            view === "deck"
              ? "bg-white/10 text-white"
              : "bg-white/4 text-muted hover:text-white"
          }`}
          onClick={backToDeck}
        >
          Want to try
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "possibilities"}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            view === "possibilities"
              ? "bg-white/10 text-white"
              : "bg-white/4 text-muted hover:text-white"
          }`}
          onClick={() => setView("possibilities")}
        >
          Possibilities
          {possibilities.length > 0 ? ` (${possibilities.length})` : ""}
        </button>
      </div>

      {!focus ? (
        <LocationGate
          cityName={cityName}
          status={locStatus}
          onLocate={locate}
          onCity={applyCityCenter}
        />
      ) : view === "deck" ? (
        <section className="mt-6" aria-label="Swipe restaurants">
          <RadiusControl
            radius={radius}
            onChange={setRadius}
            count={inRadius.length}
            origin={focus}
            cityName={cityName}
            onLocate={locate}
            onCity={applyCityCenter}
            locating={locStatus === "asking"}
          />
          {clearedNote && (
            <p className="mt-4 text-sm text-orange-200/90">
              Cleared. Tonight starts over.
            </p>
          )}

          {deck.length === 0 ? (
            <div className="mt-6 gp-card gp-card-static p-6 text-center">
              <p className="font-semibold">
                {inRadius.length === 0
                  ? `No restaurants within ${radius} ${radius === 1 ? "mile" : "miles"}.`
                  : "You’ve passed on every place in this radius."}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {inRadius.length === 0
                  ? "Widen the radius. Approved restaurants in any city count if they sit inside it."
                  : "Widen the radius, undo a pass, or open Possibilities."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {radius < 25 && (
                  <button
                    type="button"
                    className="gp-btn gp-btn-secondary text-sm"
                    onClick={() => setRadius((n) => Math.min(25, n + 5))}
                  >
                    Try {Math.min(25, radius + 5)} mi
                  </button>
                )}
                {possibilities.length > 0 && (
                  <button
                    type="button"
                    className="gp-btn gp-btn-primary text-sm"
                    onClick={() => setView("possibilities")}
                  >
                    Possibilities
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-center text-xs text-muted">
                {deck.length} left in this radius · closest first
              </p>
              <div className="relative mx-auto mt-3 max-w-md pb-3">
                {deck.slice(1, 3).map((place, i) => {
                  const index = i + 1;
                  return (
                    <article
                      key={place.restaurant.id}
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 gp-card gp-card-static overflow-hidden transition duration-200"
                      style={{
                        transform: `translateY(${index * 12}px) scale(${1 - index * 0.045})`,
                        zIndex: 20 - index,
                      }}
                    >
                      <PlaceFace place={place} />
                    </article>
                  );
                })}
                <article
                  key={top.restaurant.id}
                  className={`menu-swipe relative z-30 gp-card gp-card-static overflow-hidden ${
                    drag.dragging ? "" : "transition duration-200"
                  }`}
                  style={{
                    transform:
                      fly === "right"
                        ? "translate(120%, 0) rotate(12deg)"
                        : fly === "left"
                          ? "translate(-120%, 0) rotate(-12deg)"
                          : drag.dragging
                            ? `translate(${drag.x}px, ${drag.y}px) rotate(${Math.max(-14, Math.min(14, drag.x / 18))}deg)`
                            : "translate(0, 0)",
                    opacity: fly ? 0 : 1,
                  }}
                  aria-label={`${top.restaurant.name}, ${formatMiles(top.miles)}. Swipe right if you want to try it, left to pass.`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <span
                    className="pointer-events-none absolute left-4 top-4 z-10 rounded-md border-2 border-emerald-400 px-2 py-1 text-xs font-black tracking-wide text-emerald-300"
                    style={{ opacity: yesOpacity, transform: "rotate(-12deg)" }}
                  >
                    WANT TO TRY
                  </span>
                  <span
                    className="pointer-events-none absolute right-4 top-4 z-10 rounded-md border-2 border-red-400 px-2 py-1 text-xs font-black tracking-wide text-red-300"
                    style={{ opacity: noOpacity, transform: "rotate(12deg)" }}
                  >
                    PASS
                  </span>
                  <PlaceFace place={top} />
                </article>
              </div>
              <div className="mt-4 flex items-center justify-center gap-5">
                <button
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400/50 bg-red-500/10 text-lg font-bold text-red-200"
                  aria-label="Pass"
                  onClick={() => beginExit("no")}
                >
                  ✕
                </button>
                <button
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 text-lg font-bold text-emerald-200"
                  aria-label="Want to try"
                  onClick={() => beginExit("yes")}
                >
                  ✓
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                Drag the card, or use the buttons. Right arrow is yes. Left arrow is no.
              </p>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  className="text-sm text-muted hover:text-white disabled:opacity-40"
                  onClick={undo}
                  disabled={decisions.length === 0 || Boolean(fly)}
                >
                  Undo last swipe
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="mt-6" aria-label="Possibilities">
          <p className="text-sm leading-relaxed text-muted">
            Places you said yes to for tonight. Draw one. Nothing here is saved
            to your account.
          </p>
          {possibilities.length === 0 ? (
            <div className="mt-4 gp-card gp-card-static p-6 text-center">
              <p className="font-semibold">No possibilities yet.</p>
              <p className="mt-2 text-sm text-muted">
                Swipe right on a place you want to try.
              </p>
              <button
                type="button"
                className="gp-btn gp-btn-primary mt-4 text-sm"
                onClick={backToDeck}
              >
                Back to swiping
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 gp-card gp-card-static p-5 text-center" aria-live="polite">
                <p className="gp-section-label">Tonight&apos;s draw</p>
                <p className="mt-3 min-h-16 text-3xl font-bold tracking-tight">
                  {possibilities[reelSafe]?.restaurant.name}
                </p>
                <p className="text-sm text-muted">
                  {possibilities[reelSafe]
                    ? `${formatMiles(possibilities[reelSafe].miles)} · ${cuisineLabel(possibilities[reelSafe].restaurant.cuisine)}`
                    : ""}
                </p>
                <button
                  type="button"
                  className="gp-btn gp-btn-primary mt-5 w-full"
                  onClick={draw}
                  disabled={spinning}
                >
                  {spinning ? "Drawing…" : winner ? "Draw again" : "Draw a place"}
                </button>
                {possibilities.length === 1 && !spinning && (
                  <p className="mt-2 text-xs text-muted">Only one place on the list.</p>
                )}
              </div>

              {winner && !spinning && <WinnerCard place={winner} />}

              <ul className="mt-4 space-y-2">
                {possibilities.map((place, index) => {
                  const active = index === reelSafe;
                  const outside = place.miles > radius;
                  return (
                    <li
                      key={place.restaurant.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                        active ? "border-brand/60 bg-brand/10" : "border-border bg-card"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>
                        {place.restaurant.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {place.restaurant.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {formatMiles(place.miles)}
                          {outside ? " · outside the radius now" : ""}
                          {" · "}
                          {cuisineLabel(place.restaurant.cuisine)}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-muted hover:text-white disabled:opacity-40"
                        onClick={() => removeYes(place.restaurant.id)}
                        disabled={spinning}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  className="gp-btn gp-btn-secondary text-sm"
                  onClick={backToDeck}
                >
                  Back to swiping
                </button>
                {exitArmed ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="gp-btn gp-btn-primary text-sm"
                      onClick={exitTonight}
                    >
                      Clear list
                    </button>
                    <button
                      type="button"
                      className="gp-btn gp-btn-secondary text-sm"
                      onClick={() => setExitArmed(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="gp-btn gp-btn-ghost text-sm text-muted"
                    onClick={() => setExitArmed(true)}
                  >
                    Exit and clear
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function LocationGate({
  cityName,
  status,
  onLocate,
  onCity,
}: {
  cityName: string;
  status: LocStatus;
  onLocate: () => void;
  onCity: () => void;
}) {
  return (
    <div className="mt-6 gp-card gp-card-static p-6">
      <h2 className="text-lg font-bold tracking-tight">Places near you</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Default radius is 5 miles. You can change it. Your location is used
        only to measure distance on this page. It is not saved.
      </p>
      {status === "denied" && (
        <p className="mt-3 text-sm text-orange-200/90">
          Location is blocked. Allow it in the browser, or use the {cityName}{" "}
          center.
        </p>
      )}
      {status === "unavailable" && (
        <p className="mt-3 text-sm text-orange-200/90">
          This browser has no location. Use the {cityName} center instead.
        </p>
      )}
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          className="gp-btn gp-btn-primary"
          onClick={onLocate}
          disabled={status === "asking"}
        >
          {status === "asking" ? "Finding you…" : "Use my location"}
        </button>
        <button type="button" className="gp-btn gp-btn-secondary" onClick={onCity}>
          Use {cityName} center
        </button>
      </div>
    </div>
  );
}

function RadiusControl({
  radius,
  onChange,
  count,
  origin,
  cityName,
  onLocate,
  onCity,
  locating,
}: {
  radius: number;
  onChange: (miles: number) => void;
  count: number;
  origin: Origin;
  cityName: string;
  onLocate: () => void;
  onCity: () => void;
  locating: boolean;
}) {
  return (
    <div className="gp-card gp-card-static p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="menu-radius" className="text-sm font-semibold">
          Radius
        </label>
        <span className="text-sm font-bold text-orange-200">{radius} mi</span>
      </div>
      <input
        id="menu-radius"
        className="menu-radius mt-2"
        type="range"
        min={1}
        max={25}
        step={1}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={1}
        aria-valuemax={25}
        aria-valuenow={radius}
        aria-label="Search radius in miles"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {RADIUS_PRESETS.map((miles) => (
          <button
            key={miles}
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              radius === miles
                ? "bg-brand text-white"
                : "bg-white/6 text-muted hover:text-white"
            }`}
            onClick={() => onChange(miles)}
            aria-pressed={radius === miles}
          >
            {miles} mi
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {count} place{count === 1 ? "" : "s"}{" "}
        {origin.kind === "you"
          ? "within this radius of you."
          : `within this radius of ${cityName} center.`}
      </p>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-orange-200/90 hover:text-orange-100"
        onClick={origin.kind === "you" ? onCity : onLocate}
        disabled={locating}
      >
        {locating
          ? "Finding you…"
          : origin.kind === "you"
            ? `Use ${cityName} center instead`
            : "Use my location instead"}
      </button>
    </div>
  );
}

function PlaceFace({ place }: { place: Nearby }) {
  const { restaurant } = place;
  const deal = restaurant.deals.find((d) => d.active && !d.soldOut);
  const items = menuPreview(restaurant);
  return (
    <>
      <div
        className={`relative flex items-center justify-center text-6xl ${
          restaurant.logoUrl ? "h-40 bg-black" : "h-36"
        }`}
        style={
          restaurant.logoUrl
            ? undefined
            : {
                background: `linear-gradient(145deg, ${restaurant.accent}55, #121214 72%)`,
              }
        }
      >
        {restaurant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logoUrl}
            alt=""
            draggable={false}
            className="h-[78%] w-[78%] object-contain"
          />
        ) : (
          <span>{restaurant.emoji}</span>
        )}
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-white">
          {formatMiles(place.miles)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight">{restaurant.name}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {cuisineLabel(restaurant.cuisine)}
              {restaurant.neighborhood ? ` · ${restaurant.neighborhood}` : ""}
            </p>
          </div>
          {restaurant.plateRating > 0 && (
            <PlateRating value={restaurant.plateRating} size="sm" />
          )}
        </div>
        {restaurant.tagline && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {restaurant.tagline}
          </p>
        )}
        {deal && <span className="gp-badge !normal-case">{deal.title}</span>}
        {items.length > 0 && (
          <ul className="space-y-1 border-t border-border pt-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{item.name}</span>
                {money(item.priceUsd) && (
                  <span className="shrink-0 text-muted">{money(item.priceUsd)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function WinnerCard({ place }: { place: Nearby }) {
  const { restaurant } = place;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${restaurant.name}, ${restaurant.address}`,
  )}`;
  return (
    <div className="mt-4 rounded-xl border border-brand/40 bg-brand/10 p-4">
      <p className="gp-section-label text-orange-200/90">Go here tonight</p>
      <p className="mt-1 text-lg font-bold">{restaurant.name}</p>
      <p className="mt-1 text-sm text-muted">
        {formatMiles(place.miles)} · {restaurant.address}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="gp-btn gp-btn-primary text-sm"
        >
          Directions
        </a>
        <Link
          href={`/restaurants/${restaurant.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gp-btn gp-btn-secondary text-sm"
        >
          Full menu
        </Link>
      </div>
    </div>
  );
}
