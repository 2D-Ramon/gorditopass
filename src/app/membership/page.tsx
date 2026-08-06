"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  monthlyRate,
  pricePerPerson,
  PLATFORM,
} from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { MembershipPlanId } from "@/lib/types";

export default function MembershipPage() {
  const { user, signInDemo, activateMembership } = useStore();
  const [planId, setPlanId] = useState<MembershipPlanId>("monthly");
  const [seats, setSeats] = useState(1);
  const [done, setDone] = useState(false);

  const total = pricePerPerson(planId, seats);
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId)!;

  function handleSubscribe() {
    if (!user) signInDemo("diner");
    activateMembership(planId, seats);
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="gp-badge mb-4">For diners</p>
      <h1 className="gp-page-title">Membership</h1>
      <p className="gp-page-sub">{PLATFORM.mission}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-stone-300">
          <li className="leading-relaxed">
            Browse restaurants, maps, and every active deal free.
          </li>
          <li className="leading-relaxed">
            Subscribe: <strong className="text-white">$7/mo</strong>,{" "}
            <strong className="text-white">$36 / 6 mo ($6/mo)</strong>, or{" "}
            <strong className="text-white">$60/year ($5/mo)</strong>. Family /
            friends seats up to 6, priced per person.
          </li>
          <li className="leading-relaxed">
            Redeem in-store with a rotating QR / code staff confirms in seconds.
          </li>
          <li className="leading-relaxed">
            Order online with full cart + checkout. Delivery later.
          </li>
          <li className="leading-relaxed">
            Rate with <strong className="text-white">plates</strong>, post in the
            city feed (active members only), follow favorites, and track savings.
          </li>
          <li className="leading-relaxed">
            Check partner{" "}
            <Link href="/events" className="text-brand underline">
              events
            </Link>{" "}
            and local{" "}
            <Link href="/jobs" className="text-brand underline">
              jobs
            </Link>
            .
          </li>
        </ol>
      </section>

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
        <p className="mt-2 text-sm text-muted">
          Stripe test mode will plug in next — this demo activates membership
          locally.
        </p>

        {user?.isMember && !done && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
            You’re a member ({user.planId}, {user.familySeats} seat
            {user.familySeats > 1 ? "s" : ""}).{" "}
            <Link href="/explore" className="font-medium text-brand underline">
              Start exploring
            </Link>
          </div>
        )}

        {done && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4">
            <p className="font-semibold text-success">
              Membership activated (demo)
            </p>
            <p className="text-sm text-muted">
              {plan.name} · {seats} seat{seats > 1 ? "s" : ""} · $
              {total.toFixed(2)} (mock charge)
            </p>
            <Link
              href="/explore"
              className="mt-3 inline-block gp-btn gp-btn-primary text-sm"
            >
              Browse deals
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {MEMBERSHIP_PLANS.map((p) => {
            const perMo = monthlyRate(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={`gp-card p-5 text-left transition ${
                  planId === p.id
                    ? "border-brand ring-2 ring-brand/30 shadow-[var(--shadow-glow)]"
                    : ""
                }`}
              >
                <p className="text-sm font-medium text-muted">{p.name}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  ${p.priceUsd}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand">
                  ${perMo}/mo
                </p>
                {(p.bullets ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted">
                    {(p.bullets ?? []).map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 gp-card gp-card-static p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            Family / friends plan
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Same price <strong className="text-stone-300">per person</strong>.
            Max {MAX_FAMILY_SEATS} people on one plan. Under 18 can be added as
            seats; accounts are 18+.
          </p>
          <label className="mt-5 block text-sm font-medium">
            Seats (1–{MAX_FAMILY_SEATS})
            <input
              type="number"
              min={1}
              max={MAX_FAMILY_SEATS}
              className="gp-input mt-1.5 max-w-[8rem]"
              value={seats}
              onChange={(e) =>
                setSeats(
                  Math.min(
                    MAX_FAMILY_SEATS,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                )
              }
            />
          </label>
          <p className="mt-5 text-lg tracking-tight">
            Total: <strong>${total.toFixed(2)}</strong>
            <span className="text-sm text-muted">
              {" "}
              ({seats} × ${plan.priceUsd})
            </span>
          </p>
          <button
            type="button"
            onClick={handleSubscribe}
            className="gp-btn gp-btn-primary mt-6"
          >
            Subscribe (demo / test mode)
          </button>
          <p className="mt-3 text-xs text-muted">
            Cancel anytime — access until your paid term ends. See FAQ for
            refund policy.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Looking for business info?{" "}
        <Link href="/for-restaurants" className="text-brand underline">
          For restaurants
        </Link>
      </p>
    </div>
  );
}
