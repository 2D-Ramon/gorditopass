"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DraftBanner, Ph } from "./DraftBanner";
import { CANCEL_PATH, DRAFT_COPY_VERSION, GP_PLACEHOLDERS as P, REFUNDS_PATH, SITE_STANCE } from "@/lib/gp-legal/placeholders";
import { planDisclosure, SELLABLE_PLANS } from "@/lib/gp-legal/plans";
import { PLATFORM } from "@/lib/pricing";
import type { MembershipPlanId } from "@/lib/types";
import { createCheckoutSession, GpApiError, logCheckoutConsent, resumeMembership, type ConsentPayload } from "@/lib/gp-legal/hooks";

const TOS_LABEL = "I agree to the Terms of use and acknowledge the Privacy notice.";

export function PreCheckoutReview({ initialPlan, mode = "checkout" }: { initialPlan: MembershipPlanId; mode?: "checkout" | "resume" }) {
  const [planId, setPlanId] = useState<MembershipPlanId>(initialPlan);
  const d = useMemo(() => planDisclosure(planId), [planId]);
  const [autoRenew, setAutoRenew] = useState(false); // never pre-checked
  const [tos, setTos] = useState(false); // never pre-checked
  const [busy, setBusy] = useState(false);
  const [stubMsg, setStubMsg] = useState<string | null>(null);
  const ready = autoRenew && tos;

  // checkout.consent_autorenew (per plan). TODO(FSE): move to legal.en.json, version + sha256.
  const autoRenewLabel = `I agree that my ${PLATFORM.name} ${d.plan.name} membership will automatically renew ${d.adverb} at ${d.price} (plus tax), starting ${d.renewalDateText}, until I cancel. I can cancel anytime online.`;

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
      disclosureKeyVersion: DRAFT_COPY_VERSION,
      // disclosureText omitted: the hook hashes the exact rendered [data-testid="disclosure"] text.
      checkboxLabelText: autoRenewLabel,
      tosLabelText: TOS_LABEL,
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
        window.location.assign("/account/membership");
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
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
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

      <section aria-labelledby="gp-disclosure" data-testid="disclosure" className="mt-3 rounded-xl border border-white/15 bg-card p-3 sm:p-6">
        {/* checkout.disclosure_full — same visual block as checkboxes + pay button */}
        <h2 id="gp-disclosure" className="text-base font-bold text-white">
          {PLATFORM.name} {d.plan.name} Membership: {d.price} per {d.every}, plus applicable tax.
        </h2>
        <p className="mt-2 text-sm leading-snug text-stone-100 sm:text-[15px] sm:leading-relaxed">
          You will be charged {d.price} today.{" "}
          <strong>Your membership automatically renews {d.adverb}</strong> on {d.renewalDateText} and you will be charged{" "}
          <strong>{d.price}</strong> (plus tax) {d.adverb} <strong>until you cancel</strong>. You can cancel anytime online at{" "}
          <strong>Account &gt; Membership &gt; Cancel</strong> (
          <Link href={CANCEL_PATH} className="text-brand underline">{CANCEL_PATH}</Link>) or by emailing {PLATFORM.supportEmail}. Canceling stops future
          renewals; {SITE_STANCE.cancelTiming.toLowerCase().replace(/\.$/, "")}, with {SITE_STANCE.refundShort}.
          {d.sendsReminder ? " We'll email you a reminder 15-45 days before each renewal." : null} See{" "}
          <Link href="/legal/terms" className="text-brand underline">Terms</Link> and{" "}
          <Link href={REFUNDS_PATH} className="text-brand underline">Refund Policy</Link>.
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
            <span>
              I agree to the <Link href="/legal/terms" className="text-brand underline">Terms of use</Link> and acknowledge the{" "}
              <Link href="/legal/privacy" className="text-brand underline">Privacy notice</Link>.
            </span>
          </label>
        </div>

        <button type="button" data-testid="pay-button" disabled={!ready || busy} onClick={onPay}
          className="mt-3 w-full rounded-lg bg-brand px-3 py-3 text-base font-bold text-black disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300">
          {mode === "resume" ? "Resume membership" : "Continue to secure payment"}
        </button>
        {!ready ? (
          <p className="mt-2 text-sm text-yellow-200" aria-live="polite">Check both boxes to continue.</p>
        ) : (
          <p className="mt-2 text-sm text-stone-300">Next: Stripe secure checkout ({d.price} today). Card details are entered there.</p>
        )}
        {stubMsg ? <p role="alert" className="mt-2 rounded bg-red-500/15 p-2 text-sm text-red-100">{stubMsg}</p> : null}
      </section>
    </div>
  );
}
