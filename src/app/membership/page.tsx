"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MAX_FAMILY_SEATS,
  MEMBERSHIP_PLANS,
  monthlyRate,
  pricePerPerson,
  PLATFORM,
  POINT_ACTIONS,
  REFERRAL,
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
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 text-muted">
          Loading membership…
        </div>
      }
    >
      <MembershipInner />
    </Suspense>
  );
}

function MembershipInner() {
  const search = useSearchParams();
  const { user, activateMembership, setReferredByCode } = useStore();
  const [planId, setPlanId] = useState<MembershipPlanId>("monthly");
  const [seats, setSeats] = useState(1);
  const [step, setStep] = useState<Step>("plan");
  const [members, setMembers] = useState<MemberSeatProfile[]>([]);
  const [intakeError, setIntakeError] = useState("");
  const [referralCode, setReferralCode] = useState(
    () => user?.referredByCode ?? "",
  );
  const [primaryPassword, setPrimaryPassword] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [paying, setPaying] = useState(false);

  // Auto-populate from share link: /membership?ref=CODE
  useEffect(() => {
    const ref = (search.get("ref") || search.get("referral") || "").trim();
    if (ref) {
      const upper = ref.toUpperCase();
      setReferralCode(upper);
      setReferredByCode(upper);
    }
  }, [search, setReferredByCode]);

  const total = pricePerPerson(planId, seats);
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId)!;
  const isPartnerLogin = user?.role === "restaurant";

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

    const primary = finalized[0];
    if (!user && primaryPassword.length < 8) {
      setIntakeError("Create an 8+ character password for the primary account.");
      return;
    }

    void (async () => {
      setPaying(true);
      try {
        const { createBrowserClient } = await import("@/lib/supabase");
        const { authedFetch } = await import("@/lib/authed");
        const sb = createBrowserClient();
        if (sb && !user) {
          const reg = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: primary.email,
              password: primaryPassword,
              first_name: primary.firstName,
              last_name: primary.lastName,
              phone: primary.phone,
              role: "diner",
              email_opt_in: emailOptIn,
              sms_opt_in: smsOptIn,
            }),
          });
          const regJson = await reg.json();
          if (!reg.ok) {
            setIntakeError(regJson.error ?? "Could not create account.");
            setPaying(false);
            return;
          }
          const { error } = await sb.auth.signInWithPassword({
            email: primary.email,
            password: primaryPassword,
          });
          if (error) {
            setIntakeError(error.message);
            setPaying(false);
            return;
          }
        }
        const pay = await authedFetch("/api/membership/checkout", {
          method: "POST",
          body: JSON.stringify({
            planId,
            seats,
            members: finalized,
            email_opt_in: emailOptIn,
            sms_opt_in: smsOptIn,
            referral_code: referralCode.trim() || undefined,
          }),
        });
        const payJson = await pay.json();
        if (pay.ok && payJson.url) {
          window.location.href = payJson.url;
          return;
        }
        setIntakeError(payJson.error ?? "Could not start checkout.");
        if (!sb) {
          activateMembership(
            planId,
            seats,
            finalized,
            referralCode.trim() || undefined,
          );
          setStep("done");
        }
      } finally {
        setPaying(false);
      }
    })();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="gp-badge mb-4">For diners</p>
      <h1 className="gp-page-title">Membership</h1>
      <p className="gp-page-sub">{PLATFORM.mission}</p>

      {isPartnerLogin && (
        <div className="mt-6 rounded-lg border border-border bg-elevated/50 p-4 text-sm text-muted">
          You&apos;re signed in as partner staff. To enroll a{" "}
          <strong className="text-stone-300">customer</strong> and earn a $5
          referral, use{" "}
          <Link href="/restaurant/dashboard" className="text-brand underline">
            Partner dashboard → Enroll customer
          </Link>
          .
        </div>
      )}

      {search.get("paid") === "1" && (
        <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Payment received. Your membership is active — redeem deals on Explore.
        </div>
      )}

      {referralCode && (
        <div className="mt-4 rounded-lg border border-brand/30 bg-brand/10 px-4 py-2 text-sm text-orange-200">
          Referral code applied:{" "}
          <code className="font-mono font-bold">{referralCode}</code>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          How it works for you
        </h2>
        <ol className="mt-5 space-y-5">
          {[
            {
              title: "SURF",
              body: "Browse Local Eats. See Every Deal. Listen to your taste buds.",
            },
            {
              title: "SUBSCRIBE",
              body: "Individual or Family & Friends plans available.",
            },
            {
              title: "SAVOR",
              body: "Redeem in store or online.",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-orange-200 ring-1 ring-brand/20">
                {i + 1}
              </span>
              <span>
                <span className="font-bold uppercase tracking-wide text-brand">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-stone-300">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          Then fill intake for each seat, earn rewards & badges, and explore
          passports and the city feed.
        </p>
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
            {referralCode.trim() && (
              <p className="mt-2 text-xs font-medium text-brand">
                +{POINT_ACTIONS.referral_friend.points} referral welcome bonus ·
                your friend earns +{POINT_ACTIONS.referral_referrer.points} too.
              </p>
            )}
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
                const selected = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    aria-pressed={selected}
                    className={`gp-card relative p-5 text-left transition ${
                      selected
                        ? "border-2 border-brand bg-brand/10 ring-2 ring-brand/50 shadow-[var(--shadow-glow)]"
                        : "border border-border opacity-90 hover:border-brand/40 hover:opacity-100"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Selected
                      </span>
                    )}
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
            <p className="mt-3 text-center text-sm text-muted">
              Selected plan:{" "}
              <strong className="text-brand">{plan.name}</strong> · $
              {plan.priceUsd}
              {plan.months > 1
                ? ` ($${monthlyRate(plan)}/mo)`
                : ""}
            </p>

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
                {i === 0 && !user && (
                  <label className="block text-sm">
                    Password for this login (8+) *
                    <input
                      required
                      minLength={8}
                      type="password"
                      className="gp-input mt-1"
                      value={primaryPassword}
                      onChange={(e) => setPrimaryPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                )}
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

            <div className="gp-card gp-card-static space-y-2 p-5">
              <h3 className="font-semibold tracking-tight">
                Referral code{" "}
                <span className="text-xs font-normal text-muted">
                  (optional)
                </span>
              </h3>
              <p className="text-sm text-muted">
                Have a friend&apos;s code? Enter it for +{REFERRAL.friendPoints}{" "}
                welcome points. They earn +{REFERRAL.referrerPoints} when you
                activate.
              </p>
              <label className="block text-sm">
                Code
                <input
                  className="gp-input mt-1 max-w-xs font-mono uppercase tracking-wide"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="GP-FRIEND123"
                  autoComplete="off"
                />
              </label>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
              />
              Email me deals and city updates (unsubscribe anytime)
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
              />
              Text me (US). Msg/data rates may apply. Opt out by replying STOP.
            </label>

            {intakeError && (
              <p className="text-sm text-red-300">{intakeError}</p>
            )}

            <button
              type="submit"
              className="gp-btn gp-btn-primary"
              disabled={paying}
            >
              {paying
                ? "Starting checkout…"
                : `Create ${seats} account${seats > 1 ? "s" : ""} & pay · $${total.toFixed(2)}`}
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
