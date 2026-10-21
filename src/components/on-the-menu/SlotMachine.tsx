"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Restaurant } from "@/lib/types";
import { RestaurantLogo, SwipeCard } from "./SwipeCard";
import s from "./slot-machine.module.css";

type Place = { restaurant: Restaurant; miles: number };

const CELL = 76; // px per reel row
const BULBS = 18;
const CONFETTI = 28;

/** Reel stop offsets: left, middle, right stop in turn and the right one lands with the draw. */
const STOP_FRACTION = [0.6 / 1.4, 1.0 / 1.4, 1];

function shortName(name: string) {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

export function SlotMachine({
  places,
  shift,
  spinning,
  winner,
  spinMs,
  reduced,
  onSpin,
  onRemove,
}: {
  places: Place[];
  shift: number;
  spinning: boolean;
  winner: Place | null;
  spinMs: number;
  reduced: boolean;
  onSpin: () => void;
  onRemove: (id: string) => void;
}) {
  const n = places.length;
  const canSpin = n >= 2 && !spinning;
  const [spins, setSpins] = useState(0);
  const [pull, setPull] = useState(0); // 0..1
  const [pulling, setPulling] = useState(false);
  const lever = useRef<{ y: number; moved: boolean } | null>(null);
  const dragged = useRef(false);

  const won = Boolean(winner) && !spinning && spins > 0;
  const landed = Boolean(winner) && !spinning;
  // At rest with a winner, sit on the winner's row. This also restores the reels after Back.
  const winnerRow = winner ? places.findIndex((p) => p.restaurant.id === winner.restaurant.id) : -1;
  const shown = !spinning && winnerRow >= 0 ? winnerRow : shift;
  // Keep the last result card in place (faded, inert) while a new spin runs, so nothing jumps.
  const [held, setHeld] = useState<Place | null>(winner);
  const heldValid = held && places.some((p) => p.restaurant.id === held.restaurant.id) ? held : null;
  if (!spinning && (winner?.restaurant.id ?? null) !== (held?.restaurant.id ?? null)) {
    setHeld(winner);
  }
  // Before any result, a hidden copy of a card reserves the result's height so the list never jumps.
  const display = spinning ? (heldValid ?? places[0] ?? null) : (winner ?? (n >= 2 ? places[0] : null));
  const placeholder = spinning ? !heldValid : !winner;
  const rows = Math.max(n * 8, shown + 4);
  // Show the landed row in the middle of a 2-row-tall window.
  const offset = CELL / 2;

  function spin() {
    if (!canSpin) return;
    setSpins((c) => c + 1);
    onSpin();
  }

  function pullLever() {
    if (!canSpin) return;
    if (!reduced) {
      setPulling(true);
      window.setTimeout(() => setPulling(false), 300);
    }
    spin();
  }

  function onLeverDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!canSpin || e.button !== 0) return;
    lever.current = { y: e.clientY, moved: false };
    dragged.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onLeverMove(e: React.PointerEvent<HTMLButtonElement>) {
    const g = lever.current;
    if (!g) return;
    const dy = Math.max(0, e.clientY - g.y);
    if (dy > 6) g.moved = true;
    setPull(Math.min(1, dy / 70));
  }
  function onLeverUp() {
    const g = lever.current;
    lever.current = null;
    const p = pull;
    setPull(0);
    if (!g || !g.moved) return; // plain click handled by onClick
    dragged.current = true;
    if (p > 0.5) spin();
  }

  const knobPull = pulling ? 1 : pull;

  return (
    <div className={s.wrap}>
      <div
        className={`${s.cabinet} ${won ? s.won : ""} ${reduced ? s.reduced : ""}`}
        data-slot-machine
        data-state={spinning ? "spinning" : landed ? "won" : "idle"}
      >
        <div className={s.marquee}>
          <div className={s.bulbs} aria-hidden>
            {Array.from({ length: BULBS }, (_, i) => (
              <span key={i} className={s.bulb} style={{ animationDelay: `${(i % 6) * 0.2}s` }} />
            ))}
          </div>
          <div className={`${s.bulbs} ${s.bulbsBottom}`} aria-hidden>
            {Array.from({ length: BULBS }, (_, i) => (
              <span key={i} className={s.bulb} style={{ animationDelay: `${((i + 3) % 6) * 0.2}s` }} />
            ))}
          </div>
          <p className={s.sign}>Tonight&apos;s pick</p>
          <p className={s.subsign}>Gordito slots</p>
        </div>

        <div className={s.body}>
          <div className={s.glass}>
            <span className={`${s.notch} ${s.notchL}`} aria-hidden />
            <span className={`${s.notch} ${s.notchR}`} aria-hidden />
            <div className={s.reels} aria-hidden>
              {[0, 1, 2].map((r) => {
                const dur = Math.round(spinMs * STOP_FRACTION[r]);
                return (
                  <div key={r} className={s.reel} style={{ height: CELL * 2 }}>
                    <div
                      className={`${s.track} ${spinning && !reduced ? s.blurring : ""}`}
                      data-reel={r}
                      style={{
                        transform: `translateY(${offset - shown * CELL}px)`,
                        transition:
                          spinning && !reduced
                            ? `transform ${dur}ms cubic-bezier(0.18, 0.72, 0.22, 1.05)`
                            : "none",
                        animationDuration: `${dur}ms`,
                      }}
                    >
                      {n > 0 &&
                        Array.from({ length: rows }, (_, i) => {
                          const restaurant = places[i % n].restaurant;
                          return (
                            <div
                              key={`${restaurant.id}-${i}`}
                              className={s.cell}
                              style={{ height: CELL }}
                              data-slot-name={i === shown ? restaurant.name : undefined}
                            >
                              <RestaurantLogo restaurant={restaurant} size={36} />
                              <span className={s.cellName}>{shortName(restaurant.name)}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={s.payline} aria-hidden />
          </div>

          <button
            type="button"
            className={s.lever}
            aria-label="Pull the lever to spin"
            disabled={!canSpin}
            onPointerDown={onLeverDown}
            onPointerMove={onLeverMove}
            onPointerUp={onLeverUp}
            onPointerCancel={onLeverUp}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              pullLever();
            }}
            data-lever
          >
            <span className={s.leverBase} aria-hidden />
            <span
              className={`${s.leverArm} ${pull > 0 ? "" : s.leverSpring}`}
              style={{ transform: `scaleY(${1 - knobPull * 0.75})` }}
              aria-hidden
            />
            <span
              className={`${s.knob} ${pull > 0 ? "" : s.leverSpring}`}
              style={{ transform: `translateY(${knobPull * 64}px)` }}
              aria-hidden
            />
          </button>
        </div>

        {n < 2 ? (
          <p className={s.note}>Add at least 2 places to spin.</p>
        ) : null}

        <div className={s.tray}>
          <button type="button" className={s.spin} onClick={spin} disabled={!canSpin} data-spin>
            {spinning ? "Spinning…" : landed ? "Spin again" : "Spin"}
          </button>
        </div>

        {won && !reduced && (
          <div className={s.confetti} key={spins} aria-hidden>
            {Array.from({ length: CONFETTI }, (_, i) => (
              <span
                key={i}
                className={`${s.bit} ${i % 3 === 0 ? s.bitFork : ""}`}
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: i % 3 === 0 ? undefined : ["#f97316", "#fbbf24", "#2dd4bf"][i % 3],
                  color: ["#f97316", "#fbbf24", "#2dd4bf"][i % 3],
                  animationDelay: `${(i % 7) * 0.08}s`,
                  animationDuration: `${1.4 + (i % 5) * 0.18}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {spinning ? "Spinning" : winner && spins > 0 ? `Tonight's pick: ${winner.restaurant.name}` : ""}
      </p>

      {display && placeholder ? (
        <div className={`${s.result} ${s.skeleton}`} data-slot-result="placeholder" aria-hidden inert>
          <p className={s.resultLabel}>{spinning ? "Picking…" : "Your pick lands here"}</p>
          <div className={`gp-card gp-card-static ${s.skelCard}`}>
            <span className={s.skelLogo} />
            <span className={s.skelLines}>
              <span className={s.skelLine} style={{ width: "60%" }} />
              <span className={s.skelLine} style={{ width: "40%" }} />
              <span className={s.skelDeal} />
            </span>
          </div>
        </div>
      ) : display ? (
        <div
          className={`${s.result} ${reduced ? s.resultFade : ""} ${spinning ? s.resultBusy : ""}`}
          key={spinning ? "held" : `${display.restaurant.id}-${spins}`}
          data-slot-result={spinning ? "held" : "ready"}
          aria-hidden={spinning ? true : undefined}
          inert={spinning ? true : undefined}
        >
          <p className={s.resultLabel}>Go here tonight</p>
          <div className="gp-card gp-card-static overflow-hidden">
            <SwipeCard restaurant={display.restaurant} miles={display.miles} compact />
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Link href={`/restaurants/${display.restaurant.id}`} className="gp-btn gp-btn-primary w-full">
                Let&apos;s go
              </Link>
              <button
                type="button"
                className="gp-btn gp-btn-secondary w-full text-sm"
                onClick={() => onRemove(display.restaurant.id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
