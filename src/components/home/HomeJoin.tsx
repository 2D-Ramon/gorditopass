"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PLATFORM } from "@/lib/pricing";
import { Icon } from "./Icon";
import {
  DEFAULT_PLAN_ID,
  HOME_PLANS,
  JOIN_CTA,
  MAX_SEATS,
  type HomePlan,
} from "./content";
import s from "./home.module.css";

type PlanId = HomePlan["id"];

type JoinCtx = {
  plan: PlanId;
  setPlan: (id: PlanId) => void;
  openJoin: () => void;
  /** Bumped after the demo finishes so the CTAs pulse once. */
  pulseKey: number;
  celebrate: () => void;
  /** Show the sticky mobile CTA even before scrolling past the hero. */
  wantBar: () => void;
};

const Ctx = createContext<JoinCtx | null>(null);

export function useJoin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJoin must be used inside <HomeJoinProvider>");
  return ctx;
}

/**
 * Shared state for the home page join flow: selected plan, the join drawer
 * and the sticky mobile CTA bar.
 */
export function HomeJoinProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [pulseKey, setPulseKey] = useState(0);
  const [barWanted, setBarWanted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const openJoin = useCallback(() => {
    const d = dialogRef.current;
    if (!d) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    document.documentElement.style.overflow = "hidden";
  }, []);

  const closeJoin = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // If the page changes while the drawer is open, don't leave the page scroll-locked.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const celebrate = useCallback(() => {
    setPulseKey((k) => k + 1);
    setBarWanted(true);
  }, []);

  const wantBar = useCallback(() => setBarWanted(true), []);

  const value = useMemo(
    () => ({ plan, setPlan, openJoin, pulseKey, celebrate, wantBar }),
    [plan, openJoin, pulseKey, celebrate, wantBar],
  );

  const selected = HOME_PLANS.find((p) => p.id === plan) ?? HOME_PLANS[0];

  return (
    <Ctx.Provider value={value}>
      {children}
      <StickyBar wanted={barWanted} />
      <dialog
        ref={dialogRef}
        className={s.dialog}
        aria-labelledby="home-join-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeJoin();
        }}
        onClose={() => {
          document.documentElement.style.overflow = "";
          lastFocus.current?.focus?.();
        }}
      >
        <div className={s.jd}>
          <button
            type="button"
            className={s.jdX}
            aria-label="Close"
            onClick={closeJoin}
          >
            <Icon name="close" />
          </button>
          <h2 id="home-join-title">Join {PLATFORM.name}</h2>
          <p className={s.lead}>
            Pick a plan, then finish signing up on the next step. Cancel
            anytime.
          </p>
          <fieldset className={s.jdPlans}>
            <legend className="gp-section-label">Choose your plan</legend>
            {HOME_PLANS.map((p) => (
              <label key={p.id} className={s.jp}>
                <input
                  type="radio"
                  name="home-join-plan"
                  value={p.id}
                  checked={plan === p.id}
                  onChange={() => setPlan(p.id)}
                />
                <span className={s.jpIn}>
                  <span>
                    <span className={s.jpN}>{p.label}</span>
                    <span className={s.jpD}>{p.drawer}</span>
                  </span>
                  <span className={s.jpP}>
                    {p.price}
                    <small>{p.unit}</small>
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <Link
            href={`/membership?plan=${selected.id}`}
            className={`gp-btn gp-btn-primary ${s.cta}`}
            onClick={closeJoin}
          >
            Continue with {selected.label}
          </Link>
          <p className={s.small}>
            You must be 18+ to own an account. Up to {MAX_SEATS} people per
            plan. No free trial. Redeem in store.
          </p>
          <p className={s.small}>
            Already a member?{" "}
            <Link href="/login" onClick={closeJoin}>
              Sign in
            </Link>
          </p>
        </div>
      </dialog>
    </Ctx.Provider>
  );
}

/** Primary CTA that opens the join drawer. */
export function JoinButton({
  id,
  pulse = false,
  className = "",
  tabIndex,
}: {
  id?: string;
  pulse?: boolean;
  className?: string;
  tabIndex?: number;
}) {
  const { openJoin, pulseKey } = useJoin();
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!pulse || pulseKey === 0) return;
    // Restart the one-shot pulse animation on the next frame.
    const raf = requestAnimationFrame(() => setPulsing(true));
    return () => cancelAnimationFrame(raf);
  }, [pulse, pulseKey]);

  return (
    <button
      id={id}
      type="button"
      tabIndex={tabIndex}
      className={`gp-btn gp-btn-primary ${s.cta} ${pulsing ? s.pulse : ""} ${className}`}
      onClick={openJoin}
      onAnimationEnd={() => setPulsing(false)}
    >
      {JOIN_CTA}
    </button>
  );
}

function StickyBar({ wanted }: { wanted: boolean }) {
  const [past, setPast] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => {
      const hero = document.getElementById("home-hero");
      setPast(hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 48);
      setMobile(mq.matches);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const show = (wanted || past) && mobile;

  // Keep the footer clear of the bar while it is showing (home page only).
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom =
      "calc(65px + env(safe-area-inset-bottom, 0px) + 19px)";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [show]);

  return (
    <div className={s.stickyBar} data-show={show} aria-hidden={!show}>
      <JoinButton pulse tabIndex={show ? 0 : -1} />
    </div>
  );
}
