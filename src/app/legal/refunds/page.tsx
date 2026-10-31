import Link from "next/link";
import { DraftBanner, Ph } from "@/components/gp-legal/DraftBanner";
import { CANCEL_PATH, GP_PLACEHOLDERS as P, SITE_STANCE } from "@/lib/gp-legal/placeholders";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "Refund policy (DRAFT)" };

// Stance from existing site copy: /legal/terms §5 + /faq. Spec 07 items the site doesn't answer stay as placeholders.
export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <DraftBanner note={`Stance source: ${SITE_STANCE.source}.`} />
      <h1 className="text-3xl font-bold">
        Refund and cancellation policy <span className="align-middle text-sm text-yellow-300">(DRAFT)</span>
      </h1>
      <p className="mt-4 text-sm text-muted">
        Effective <Ph>[DATE]</Ph>. Operated by <Ph>{P.ENTITY_NAME}</Ph>. Also see the{" "}
        <Link href="/legal/terms" className="text-brand underline">Terms of use</Link>.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">1. Cancel anytime</h2>
          <p className="mt-2">
            Cancel online at Account &gt; Membership &gt; Cancel (
            <Link href={CANCEL_PATH} className="text-brand underline">{CANCEL_PATH}</Link>) or email{" "}
            {PLATFORM.supportEmail}. Canceling stops future renewals. {SITE_STANCE.cancelTiming}{" "}
            {SITE_STANCE.proration}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">2. Refunds after purchase</h2>
          <p className="mt-2">
            Refunds of membership fees are case by case. If you have not redeemed more than once and you ask
            within 7 days of purchase, we will generally refund. After that, or once the membership has been
            used at a restaurant, we generally do not refund, except for a verified billing error or a
            documented problem we could not make right.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">3. Renewal charges</h2>
          <p className="mt-2">
            If you forgot to cancel before a renewal: <Ph>[RENEWAL REFUND WINDOW — site copy does not distinguish renewals from first purchase]</Ph>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">4. Charged in error or after cancellation</h2>
          <p className="mt-2">Any charge after you canceled, duplicate charge, or billing error will be refunded in full.</p>
        </section>
        <section>
          <h2 className="font-semibold text-white">5. Restaurant closures or exits</h2>
          <p className="mt-2">
            Partners may close or leave. <Ph>[PARTNER-EXIT REMEDY / THRESHOLD]</Ph>. If {PLATFORM.name} stops
            operating the program, <Ph>[PROGRAM-SHUTDOWN REFUND]</Ph>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">6. How to request</h2>
          <p className="mt-2">
            Email {PLATFORM.supportEmail}. Refunds go to the original payment method via Stripe in{" "}
            <Ph>[5-10]</Ph> business days. Please contact us before filing a chargeback.
          </p>
        </section>
      </div>
    </div>
  );
}
