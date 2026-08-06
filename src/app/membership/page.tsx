"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  monthlyRate,
  pricePerPerson,
  PLATFORM,
  POINT_ACTIONS,
} from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { MemberSeatProfile, MembershipPlanId } from "@/lib/types";

type Step = "plan" | "intake" | "done";

function emptySeat(i: number, isPrimary: boolean): MemberSeatProfile {
  return {
    id: `seat-${i}-${Date.now()}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    homeAddress: "",
    isPrimary,
  };
}

export default function MembershipPage() {
  const { user, signInDemo, activateMembership } = useStore();
  const [planId, setPlanId] = useState<MembershipPlanId>("monthly");
  const [seats, setSeats] = useState(1);
  const [step, setStep] = useState<Step>("plan");
  const [members, setMembers] = useState<MemberSeatProfile[]>([]);
  const [intakeError, setIntakeError] = useState("");

  const total = pricePerPerson(planId, seats);
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId)!;

  const seatForms = useMemo(() => members, [members]);

  function goToIntake() {
    setIntakeError("");
    setMembers(
      Array.from({ length: seats }, (_, i) => emptySeat(i, i === 0)),
    );
    setStep("intake");
  }

  function updateSeat(
    index: number,
    field: keyof MemberSeatProfile,
    value: string,
  ) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function handleCompleteIntake(e: React.FormEvent) {
    e.preventDefault();
    setIntakeError("");

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (
        !m.firstName.trim() ||
        !m.lastName.trim() ||
        !m.email.trim() ||
        !m.phone.trim() ||
        !m.birthday ||
        !m.homeAddress.trim()
      ) {
        setIntakeError(
          `Please complete all fields for person ${i + 1}${i === 0 ? " (primary)" : ""}.`,
        );
        return;
      }
      if (!m.email.includes("@")) {
        setIntakeError(`Enter a valid email for person ${i + 1}.`);
        return;
      }
    }

    const emails = members.map((m) => m.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      setIntakeError("Each person needs a unique email (one account each).");
      return;
    }

    if (!user) signInDemo("diner");

    const finalized = members.map((m, i) => ({
      ...m,
      firstName: m.firstName.trim(),
      lastName: m.lastName.trim(),
      email: m.email.trim(),
      phone: m.phone.trim(),
      homeAddress: m.homeAddress.trim(),
      isPrimary: i === 0,
      id: m.id || `seat-${i}-${Date.now()}`,
    }));

    activateMembership(planId, seats, finalized);
    setStep("done");
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
            After you pick a plan, fill an intake form for{" "}
            <strong className="text-white">each person</strong> — each seat
            gets its own account.
          </li>
          <li className="leading-relaxed">
            Earn points & badges for redemptions, reviews, favorites, and more.
          </li>
          <li className="leading-relaxed">
            Redeem in-store with a rotating QR / code staff confirms in seconds.
          </li>
        </ol>
      </section>

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          {step === "plan" && "1 · Choose a plan"}
          {step === "intake" && "2 · Member intake"}
          {step === "done" && "You're in!"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Stripe test mode will plug in next — this demo activates membership
          locally.
        </p>

        {user?.isMember && step === "plan" && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
            You’re a member ({user.planId}, {user.familySeats} seat
            {user.familySeats > 1 ? "s" : ""}).{" "}
            <Link href="/explore" className="font-medium text-brand underline">
              Start exploring
            </Link>
            {" · "}
            <Link href="/account" className="font-medium text-brand underline">
              Account & badges
            </Link>
          </div>
        )}

        {step === "done" && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4">
            <p className="font-semibold text-success">
              Membership activated (demo)
            </p>
            <p className="mt-1 text-sm text-muted">
              {plan.name} · {seats} seat{seats > 1 ? "s" : ""} · $
              {total.toFixed(2)} (mock charge)
            </p>
            <p className="mt-2 text-sm text-stone-300">
              Created {seats} account{seats > 1 ? "s" : ""}:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {members.map((m, i) => (
                <li key={m.id}>
                  {i === 0 ? "★ " : "· "}
                  {m.firstName} {m.lastName} · {m.email}
                  {i === 0 ? " (primary — signed in)" : ""}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              +{POINT_ACTIONS.join_member.points} welcome points on the primary
              account. Favorites & food prefs can be set later in profile.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/explore" className="gp-btn gp-btn-primary text-sm">
                Browse deals
              </Link>
              <Link href="/account" className="gp-btn gp-btn-secondary text-sm">
                View account
              </Link>
            </div>
          </div>
        )}

        {step === "plan" && (
          <>
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
                Same price <strong className="text-stone-300">per person</strong>
                . Max {MAX_FAMILY_SEATS} people on one plan. Under 18 can be
                added as seats; accounts are 18+.
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
                onClick={goToIntake}
                className="gp-btn gp-btn-primary mt-6"
              >
                Continue to member info →
              </button>
              <p className="mt-3 text-xs text-muted">
                Next: fill name, email, phone, birthday & address for each seat.
                Cancel anytime — access until your paid term ends.
              </p>
            </div>
          </>
        )}

        {step === "intake" && (
          <form onSubmit={handleCompleteIntake} className="mt-8 space-y-6">
            <div className="rounded-lg border border-border bg-elevated/40 p-4 text-sm text-muted">
              <p>
                Plan: <strong className="text-stone-200">{plan.name}</strong> ·{" "}
                {seats} seat{seats > 1 ? "s" : ""} ·{" "}
                <strong className="text-stone-200">${total.toFixed(2)}</strong>
              </p>
              <p className="mt-1">
                Person 1 is the primary account (signed in after submit). Each
                other person also gets an account under this plan.
              </p>
              <button
                type="button"
                className="mt-2 text-brand underline"
                onClick={() => setStep("plan")}
              >
                ← Change plan or seats
              </button>
            </div>

            {seatForms.map((m, i) => (
              <div
                key={m.id}
                className="gp-card gp-card-static space-y-3 p-5"
              >
                <h3 className="font-semibold tracking-tight">
                  Person {i + 1}
                  {i === 0 ? (
                    <span className="ml-2 text-xs font-medium text-brand">
                      Primary account
                    </span>
                  ) : null}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    First name *
                    <input
                      required
                      className="gp-input mt-1"
                      value={m.firstName}
                      onChange={(e) =>
                        updateSeat(i, "firstName", e.target.value)
                      }
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="block text-sm">
                    Last name *
                    <input
                      required
                      className="gp-input mt-1"
                      value={m.lastName}
                      onChange={(e) =>
                        updateSeat(i, "lastName", e.target.value)
                      }
                      autoComplete="family-name"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  Email *
                  <input
                    required
                    type="email"
                    className="gp-input mt-1"
                    value={m.email}
                    onChange={(e) => updateSeat(i, "email", e.target.value)}
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </label>
                <label className="block text-sm">
                  Phone number *
                  <input
                    required
                    type="tel"
                    className="gp-input mt-1"
                    value={m.phone}
                    onChange={(e) => updateSeat(i, "phone", e.target.value)}
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                  />
                </label>
                <label className="block text-sm">
                  Birthday *
                  <input
                    required
                    type="date"
                    className="gp-input mt-1 max-w-xs"
                    value={m.birthday}
                    onChange={(e) =>
                      updateSeat(i, "birthday", e.target.value)
                    }
                  />
                </label>
                <label className="block text-sm">
                  Home address *
                  <input
                    required
                    className="gp-input mt-1"
                    value={m.homeAddress}
                    onChange={(e) =>
                      updateSeat(i, "homeAddress", e.target.value)
                    }
                    autoComplete="street-address"
                    placeholder="Street, city, state, ZIP"
                  />
                </label>
              </div>
            ))}

            {intakeError && (
              <p className="text-sm text-red-300">{intakeError}</p>
            )}

            <button type="submit" className="gp-btn gp-btn-primary">
              Create {seats} account{seats > 1 ? "s" : ""} & subscribe · $
              {total.toFixed(2)}
            </button>
            <p className="text-xs text-muted">
              Favorite restaurant & food type can be filled in later on each
              person’s profile.
            </p>
          </form>
        )}
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
