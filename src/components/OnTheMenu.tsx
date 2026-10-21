"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlotMachine } from "@/components/on-the-menu/SlotMachine";
import { RestaurantLogo, SwipeCard } from "@/components/on-the-menu/SwipeCard";
import styles from "@/components/on-the-menu/on-the-menu.module.css";
import { cityLabel, cuisineLabel } from "@/lib/data";
import { activeDeal } from "@/components/on-the-menu/SwipeCard";
import { CITY_CENTERS } from "@/lib/listing-map";
import { useLiveCatalog } from "@/lib/live-catalog";
import { formatMiles, milesBetween } from "@/lib/miles";
import { useStore } from "@/lib/store";
import type { Restaurant } from "@/lib/types";

const RADIUS_PRESETS = [1, 3, 5, 10, 15, 25];
const SWIPE_PX = 100;
const FLICK_PX_PER_MS = 0.6;
const SPIN_MS = 3400;

type Origin = { lat: number; lng: number; kind: "you" | "city" };
type Decision = { id: string; choice: "yes" | "no" };
type Nearby = { restaurant: Restaurant; miles: number };
type LocStatus = "idle" | "asking" | "ready" | "denied" | "unavailable";
type Fly = "left" | "right" | null;


type NightMemory = {
  origin: Origin | null;
  radius: number;
  decisions: Decision[];
  view: "deck" | "possibilities";
  winnerId: string | null;
};

/** Survives a trip to a restaurant page in this tab. A reload or exit clears it. */
let nightMemory: NightMemory | null = null;

export function OnTheMenu() {
  const router = useRouter();
  const { city, isRestaurantApproved } = useStore();
  const { restaurants } = useLiveCatalog();
  const remembered = nightMemory;
  // Start on the city center so the cards show first. Location lives behind the settings button.
  const [origin, setOrigin] = useState<Origin | null>(
    remembered?.origin ?? { ...CITY_CENTERS[city], kind: "city" },
  );
  const [locStatus, setLocStatus] = useState<LocStatus>(
    remembered?.origin?.kind === "you" ? "ready" : "idle",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [reduced, setReduced] = useState(false);
  const [radius, setRadius] = useState(remembered?.radius ?? 5);
  const [decisions, setDecisions] = useState<Decision[]>(remembered?.decisions ?? []);
  const [view, setView] = useState<"deck" | "possibilities">(remembered?.view ?? "deck");
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [fly, setFly] = useState<Fly>(null);
  const [shift, setShift] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(remembered?.winnerId ?? null);
  const [exitArmed, setExitArmed] = useState(false);
  const [clearedNote, setClearedNote] = useState(false);

  const mounted = useRef(true);
  const exitRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const spinToken = useRef(0);
  const spinTimer = useRef<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    t: number;
    locked: "x" | "y" | null;
  } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      spinToken.current += 1;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      if (spinTimer.current != null) window.clearTimeout(spinTimer.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [settingsOpen]);

  useEffect(() => {
    nightMemory = { origin, radius, decisions, view, winnerId };
  }, [origin, radius, decisions, view, winnerId]);

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
  const shownIndex = possibilities.length
    ? ((shift % possibilities.length) + possibilities.length) % possibilities.length
    : 0;
  const winner = possibilities.find((place) => place.restaurant.id === winnerId) ?? null;

  const chooseRef = useRef<(choice: "yes" | "no") => void>(() => {});

  useEffect(() => {
    chooseRef.current = (choice: "yes" | "no") => {
      if (!topId || fly || exitRef.current) return;
      exitRef.current = topId;
      const id = topId;
      const name = deck[0]?.restaurant.name ?? "";
      setAnnounce(choice === "yes" ? `Added ${name} to Possibilities.` : `Skipped ${name}.`);
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
  });

  function beginExit(choice: "yes" | "no") {
    chooseRef.current(choice);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view !== "deck" || settingsOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Backspace") {
        e.preventDefault();
        undoRef.current();
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      chooseRef.current(e.key === "ArrowRight" ? "yes" : "no");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, settingsOpen]);

  const undoRef = useRef<() => void>(() => {});
  useEffect(() => {
    undoRef.current = undo;
  });

  function undo() {
    if (fly || spinning || decisions.length === 0) return;
    const last = decisions[decisions.length - 1];
    if (winnerId === last.id) setWinnerId(null);
    setDecisions((prev) => prev.slice(0, -1));
    setAnnounce("Undid the last swipe.");
  }

  function startOver() {
    if (fly) return;
    setDecisions((prev) => prev.filter((d) => d.choice === "yes"));
    setAnnounce("Skipped places are back in the stack.");
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
    setShift(0);
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
    if (spinTimer.current != null) window.clearTimeout(spinTimer.current);
    if (reduced || n === 1) {
      setShift(pick);
      setWinnerId(pool[pick].restaurant.id);
      setSpinning(false);
      return;
    }
    const token = ++spinToken.current;
    const currentMod = ((shift % n) + n) % n;
    const delta = (pick - currentMod + n) % n;
    const travel = n * 6 + delta;
    setWinnerId(null);
    setSpinning(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!mounted.current || spinToken.current !== token) return;
        setShift(shift + travel);
      });
    });
    spinTimer.current = window.setTimeout(() => {
      spinTimer.current = null;
      if (!mounted.current || spinToken.current !== token) return;
      setSpinning(false);
      setShift(pick);
      setWinnerId(pool[pick].restaurant.id);
    }, SPIN_MS);
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (fly || e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: performance.now(), locked: null };
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

  function openRestaurant(id: string) {
    router.push(`/restaurants/${id}`);
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (!g || fly) {
      setDrag({ x: 0, y: 0, dragging: false });
      return;
    }
    if (g.locked === "x") {
      const speed = g.dx / Math.max(1, performance.now() - g.t);
      if (g.dx >= SWIPE_PX || (g.dx > 30 && speed > FLICK_PX_PER_MS)) beginExit("yes");
      else if (g.dx <= -SWIPE_PX || (g.dx < -30 && speed < -FLICK_PX_PER_MS)) beginExit("no");
      else setDrag({ x: 0, y: 0, dragging: false });
      return;
    }
    setDrag({ x: 0, y: 0, dragging: false });
    if (!g.locked && Math.hypot(g.dx, g.dy) < 10 && topId) openRestaurant(topId);
  }

  const yesOpacity =
    fly === "right" ? 1 : fly === "left" ? 0 : Math.max(0, Math.min(1, drag.x / 90));
  const noOpacity =
    fly === "left" ? 1 : fly === "right" ? 0 : Math.max(0, Math.min(1, -drag.x / 90));

  const cardTransform = reduced
    ? "none"
    : fly === "right"
      ? "translate(130%, 0) rotate(12deg)"
      : fly === "left"
        ? "translate(-130%, 0) rotate(-12deg)"
        : drag.dragging
          ? `translate(${drag.x}px, ${drag.y}px) rotate(${Math.max(-12, Math.min(12, drag.x * 0.06))}deg)`
          : "translate(0, 0)";
  const locationLine = focus
    ? `Using ${focus.kind === "you" ? "your location" : `${cityName} center`} · ${radius} mi`
    : "";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-10">
      <p className="gp-badge mb-4">Tonight only</p>
      <h1 className="gp-page-title">What&apos;s on the menu</h1>
      <p className="gp-page-sub">
        Swipe right on places you&apos;re interested in, left to skip. Then spin for tonight&apos;s pick.
      </p>

      <div className={`${styles.anchor} mt-6`}>
        <div className="flex items-center gap-2">
          <div
            className="grid flex-1 grid-cols-2 gap-1 rounded-full border border-border bg-white/4 p-1"
            role="tablist"
            aria-label="Tonight"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "deck"}
              className={`min-h-9 rounded-full px-3 text-sm font-semibold ${
                view === "deck" ? "bg-white/12 text-white" : "text-muted hover:text-white"
              }`}
              onClick={backToDeck}
            >
              Want to try
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "possibilities"}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold ${
                view === "possibilities" ? "bg-white/12 text-white" : "text-muted hover:text-white"
              }`}
              onClick={() => setView("possibilities")}
            >
              Possibilities
              {possibilities.length > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold leading-5 text-white">
                  {possibilities.length}
                </span>
              )}
            </button>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Location and radius"
            aria-expanded={settingsOpen}
            aria-controls="menu-settings"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
          </button>
        </div>
        {settingsOpen && focus && (
          <>
            <div className={styles.backdrop} onClick={() => setSettingsOpen(false)} aria-hidden />
            <div id="menu-settings" role="dialog" aria-label="Places near you" className={styles.sheet}>
              <div className={styles.grab} aria-hidden />
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold tracking-tight">Places near you</h2>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-muted hover:text-white"
                  onClick={() => setSettingsOpen(false)}
                >
                  Done
                </button>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-muted">
                Your location is used only to measure distance on this page. It is not saved.
              </p>
              {locStatus === "denied" && (
                <p className="mb-3 text-sm text-orange-200/90">
                  Location is blocked. Allow it in the browser, or use the {cityName} center.
                </p>
              )}
              {locStatus === "unavailable" && (
                <p className="mb-3 text-sm text-orange-200/90">
                  This browser has no location. Use the {cityName} center instead.
                </p>
              )}
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
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {focus && (
          <button type="button" className={styles.chip} onClick={() => setSettingsOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <span className="truncate">{locationLine}</span>
          </button>
        )}
        <p className="text-xs text-muted">Not saved to your account.</p>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>

      {!focus ? null : view === "deck" ? (
        <section className="mt-5" aria-label="Swipe restaurants">
          {clearedNote && (
            <p className="mb-3 text-center text-sm text-orange-200/90">Cleared. Tonight starts over.</p>
          )}
          {deck.length === 0 ? (
            <div className="mx-auto max-w-[380px] gp-card gp-card-static p-6 text-center">
              <p className="text-lg font-bold">
                {inRadius.length === 0
                  ? `No restaurants within ${radius} ${radius === 1 ? "mile" : "miles"}.`
                  : "That’s everyone for tonight"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {inRadius.length === 0
                  ? "Widen the radius from the settings button."
                  : "Spin your Possibilities, or bring back the places you skipped."}
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                {possibilities.length > 0 && (
                  <button
                    type="button"
                    className="gp-btn gp-btn-primary w-full text-sm"
                    onClick={() => setView("possibilities")}
                  >
                    See your Possibilities ({possibilities.length})
                  </button>
                )}
                {inRadius.length === 0 && radius < 25 && (
                  <button
                    type="button"
                    className="gp-btn gp-btn-secondary w-full text-sm"
                    onClick={() => setRadius((n) => Math.min(25, n + 5))}
                  >
                    Try {Math.min(25, radius + 5)} mi
                  </button>
                )}
                {decisions.some((d) => d.choice === "no") && (
                  <button
                    type="button"
                    className="text-sm font-medium text-orange-200/90 hover:text-orange-100"
                    onClick={startOver}
                  >
                    Start over
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={styles.stack}>
                {deck.slice(1, 3).map((place, i) => {
                  const index = i + 1;
                  const lift = drag.dragging || fly ? 0.5 : 0;
                  const step = index - lift;
                  return (
                    <article
                      key={place.restaurant.id}
                      aria-hidden
                      className={`${styles.peek} gp-card gp-card-static`}
                      style={{
                        transform: `translateY(${step * 10}px) scale(${1 - step * 0.05})`,
                        filter: `brightness(${1 - step * 0.22})`,
                        zIndex: 20 - index,
                      }}
                    >
                      <SwipeCard restaurant={place.restaurant} miles={place.miles} />
                    </article>
                  );
                })}
                <article
                  key={top.restaurant.id}
                  role="link"
                  tabIndex={0}
                  data-swipe-card
                  className={`${styles.card} gp-card gp-card-static z-30 ${drag.dragging ? "" : styles.spring}`}
                  style={{ transform: cardTransform, opacity: fly ? 0 : 1, zIndex: 30 }}
                  aria-label={`${top.restaurant.name}. ${cuisineLabel(top.restaurant.cuisine)}. ${
                    top.restaurant.plateRating > 0 ? `Plate rate ${top.restaurant.plateRating.toFixed(1)}.` : "No reviews yet."
                  } ${activeDeal(top.restaurant)?.title ?? "No active deal"}. ${formatMiles(top.miles)}. Press Enter to open the restaurant, right arrow for interested, left arrow to skip.`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && topId) {
                      e.preventDefault();
                      openRestaurant(topId);
                    }
                  }}
                >
                  <span className={`${styles.stamp} ${styles.stampYes}`} style={{ opacity: yesOpacity }}>
                    Interested
                  </span>
                  <span className={`${styles.stamp} ${styles.stampNo}`} style={{ opacity: noOpacity }}>
                    Skip
                  </span>
                  <SwipeCard restaurant={top.restaurant} miles={top.miles} />
                </article>
              </div>
              <div className={styles.controls}>
                <div className={styles.ctrl}>
                  <span className={styles.ctrlSlot}><button type="button" className={`${styles.round} ${styles.skip}`} aria-label="Skip" onClick={() => beginExit("no")}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                  </span>
                  <span className={styles.btnLabel} aria-hidden>Skip</span>
                </div>
                <div className={styles.ctrl}>
                  <span className={styles.ctrlSlot}><button
                    type="button"
                    className={`${styles.round} ${styles.undo}`}
                    aria-label="Undo last swipe"
                    onClick={undo}
                    disabled={decisions.length === 0 || Boolean(fly)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 14L4 9l5-5" />
                      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
                    </svg>
                  </button>
                  </span>
                  <span className={styles.btnLabel} aria-hidden>Undo</span>
                </div>
                <div className={styles.ctrl}>
                  <span className={styles.ctrlSlot}><button type="button" className={`${styles.round} ${styles.interested}`} aria-label="Interested" onClick={() => beginExit("yes")}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.9 5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.6 0 5.7 3.6 4.4 6.8C19.5 16.4 12 21 12 21z" />
                    </svg>
                  </button>
                  </span>
                  <span className={styles.btnLabel} aria-hidden>Interested</span>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                {deck.length} left · closest first · ← skip · → interested · tap card for details
              </p>
            </>
          )}
        </section>
      ) : (
        <section className="mt-6" aria-label="Possibilities">
          <p className="text-sm leading-relaxed text-muted">
            Places you said yes to for tonight. Spin the slots to pick one.
            Nothing here is saved to your account.
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
              <SlotMachine
                places={possibilities}
                shift={shift}
                spinning={spinning}
                winner={winner}
                spinMs={SPIN_MS}
                reduced={reduced}
                onSpin={draw}
                onRemove={removeYes}
              />
              {possibilities.length === 1 && (
                <div className="mt-3 text-center">
                  <button type="button" className="text-sm font-medium text-orange-200/90 hover:text-orange-100" onClick={backToDeck}>
                    Back to Want to try
                  </button>
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {possibilities.map((place, index) => {
                  const active = !spinning && index === shownIndex;
                  const outside = place.miles > radius;
                  return (
                    <li
                      key={place.restaurant.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                        active ? "border-brand/60 bg-brand/10" : "border-border bg-card"
                      }`}
                    >
                      <RestaurantLogo restaurant={place.restaurant} size={32} />
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
