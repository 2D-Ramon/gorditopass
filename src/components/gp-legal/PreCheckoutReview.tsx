"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DraftBanner, Ph } from "./DraftBanner";
import { DISCLOSURES, disclosureKey, fillDisclosure, OFFERS_KEY, TOS_KEY } from "@/lib/gp-legal/disclosures";
import { GP_PLACEHOLDERS as P, REFUNDS_PATH } from "@/lib/gp-legal/placeholders";
import { planDisclosure, SELLABLE_PLANS } from "@/lib/gp-legal/plans";
import { PLATFORM } from "@/lib/pricing";
import type { MembershipPlanId } from "@/lib/types";
import { createCheckoutSession, GpApiError, logCheckoutConsent, resumeMembership, type ConsentPayload } from "@/lib/gp-legal/hooks";


export function PreCheckoutReview({ initialPlan, mode = "checkout" }: { initialPlan: MembershipPlanId; mode?: "checkout" | "resume" }) {
  const router = useRouter();
  const [planId, setPlanId] = useState<MembershipPlanId>(initialPlan);
  const d = useMemo(() => planDisclosure(planId), [planId]);
  const [autoRenew, setAutoRenew] = useState(false); // never pre-checked
  const [tos, setTos] = useState(false); // never pre-checked
  const [busy, setBusy] = useState(false);
  const [stubMsg, setStubMsg] = useState<string | null>(null);
  const ready = autoRenew && tos;

  // All copy comes from lib/gp-legal/disclosures.ts (keyed by disclosure_key_version).
  const key = disclosureKey(mode, planId);
  const vars = {
    brand: PLATFORM.name, plan: d.plan.name, price: d.price, every: d.every, adverb: d.adverb,
    renewal_date: d.renewalDateText, support_email: PLATFORM.supportEmail,
  };
  const disclosureText = fillDisclosure(DISCLOSURES[key].text, vars);
  const autoRenewLabel = fillDisclosure(DISCLOSURES[key].checkboxLabel, vars);
  const tosLabel = DISCLOSURES[TOS_KEY].checkboxLabel;

  function choose(id: MembershipPlanId) {
    setPlanId(id);
    // Consent is to plan-specific terms: changing plan clears it.
    setAutoRenew(false);
    setTos(false);
    setStubMsg(null);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.set("plan", id);
      window.history.replaceState(null, "", u);
    }
  }

  async function onPay() {
    if (!ready) return;
    setBusy(true);
    setStubMsg(null);
    const payload: ConsentPayload = {
      planId,
      disclosureKeyVersion: key,
      disclosureText, // identical to the [data-testid="disclosure"] text node; hashed as-is
      checkboxLabelText: autoRenewLabel,
      tosLabelText: tosLabel,
      tosKeyVersion: TOS_KEY,
      offersKeyVersion: OFFERS_KEY,
      priceCents: Math.round(d.plan.priceUsd * 100),
      currency: "usd",
      intervalMonths: d.plan.months,
      renewalDateShown: d.renewalDate.toISOString(),
      pageUrl: window.location.href,
      locale: "en-US",
    };
    try {
      if (mode === "resume") {
        await resumeMembership(payload);
        router.push("/account/membership");
        return;
      }
      // Consent is recorded server-side inside the checkout request, before the Stripe session.
      const { consentId } = await logCheckoutConsent(payload);
      const { checkoutUrl } = await createCheckoutSession(consentId, planId);
      window.location.assign(checkoutUrl);
    } catch (e) {
      setBusy(false);
      if (e instanceof GpApiError && e.status === 401) {
        const next = window.location.pathname + window.location.search;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setStubMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-3 sm:py-10">
      <DraftBanner />
      <h1 className="text-xl font-bold sm:text-3xl">{mode === "resume" ? "Resume your membership" : "Review your membership"}</h1>

      {mode === "checkout" ? (<fieldset className="mt-3 grid grid-cols-3 gap-2" data-testid="plan-picker">
        <legend className="sr-only">Choose a plan</legend>
        {SELLABLE_PLANS.map((p) => {
          const on = p.id === planId;
          return (
            <label
              key={p.id}
              data-testid={`plan-${p.id}`}
              className={`cursor-pointer rounded-lg border-2 px-2 py-1.5 text-center text-sm ${on ? "border-brand bg-brand/10 text-white" : "border-white/15 text-stone-300"}`}
            >
              <input type="radio" name="plan" value={p.id} checked={on} onChange={() => choose(p.id)} className="sr-only" />
              <span className="block font-bold">{p.name}</span>
              <span className="block">{planDisclosure(p.id).price}</span>
            </label>
          );
        })}
      </fieldset>) : null}

      <section aria-label="Membership terms" className="mt-3 rounded-xl border border-white/15 bg-card p-3 sm:p-6">
        {/* FSE placeholder for the server-required offers disclaimer; UI Dev to style (keep text verbatim). */}
        <p data-testid="offers-disclosure" data-disclosure-key={OFFERS_KEY} className="mb-2 rounded border border-yellow-300/60 bg-yellow-500/10 px-2 py-1 text-sm font-bold text-yellow-100">{DISCLOSURES[OFFERS_KEY].text}</p>
        <p data-testid="disclosure" data-disclosure-key={key} className="text-sm leading-snug text-stone-100 sm:text-[15px] sm:leading-relaxed">{disclosureText}</p>
        <p className="mt-1 text-xs text-stone-400">
          <Link href="/legal/terms" className="text-brand underline">Terms of use</Link> ·{" "}
          <Link href={REFUNDS_PATH} className="text-brand underline">Refund Policy</Link> ·{" "}
          <Link href="/account/membership/cancel" className="text-brand underline">Cancel online</Link>
        </p>
        <p className="mt-1 text-xs text-stone-400">
          Tax: <Ph>{P.TAX}</Ph> · Price is per seat (pricing.ts); 1 seat shown.
        </p>

        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-3 text-sm leading-snug text-white sm:text-[15px]">
            <input type="checkbox" name="consent_autorenew" data-testid="consent-autorenew" required checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-orange-500" />
            <span className="font-bold">{autoRenewLabel}</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-snug text-white sm:text-[15px]">
            <input type="checkbox" name="consent_tos" data-testid="consent-tos" required checked={tos}
              onChange={(e) => setTos(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-orange-500" />
            <span>{tosLabel}</span>
          </label>
        </div>

        {stubMsg ? <p role="alert" data-testid="checkout-error" className="mt-3 rounded bg-red-500/15 p-2 text-sm text-red-100">{stubMsg}</p> : null}
        <button type="button" data-testid="pay-button" disabled={!ready || busy} onClick={onPay}
          className="mt-3 w-full rounded-lg bg-brand px-3 py-3 text-base font-bold text-black disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300">
          {mode === "resume" ? "Resume membership" : "Continue to secure payment"}
        </button>
        {!ready ? (
          <p className="mt-2 text-sm text-yellow-200" aria-live="polite">Check both boxes to continue.</p>
        ) : (
          <p className="mt-2 text-sm text-stone-300">{mode === "resume" ? "No charge today. Auto-renewal turns back on." : `Next: Stripe secure checkout (${d.price} today). Card details are entered there.`}</p>
        )}
      </section>
    </div>
  );
}
