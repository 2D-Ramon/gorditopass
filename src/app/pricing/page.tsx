import Link from "next/link";
import {
  MEMBERSHIP_PLANS,
  MAX_FAMILY_SEATS,
  monthlyRate,
} from "@/lib/pricing";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="gp-page-title">Pricing</h1>
      <p className="gp-page-sub">
        Simple on purpose: diners subscribe. Restaurants join free.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/membership"
          className="rounded-md border border-border bg-card px-3 py-1.5 font-medium hover:border-brand/40"
        >
          Membership (diners) →
        </Link>
        <Link
          href="/for-restaurants"
          className="rounded-md border border-border bg-card px-3 py-1.5 font-medium hover:border-brand/40"
        >
          Restaurant details →
        </Link>
      </div>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Diners</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {MEMBERSHIP_PLANS.map((p) => {
          const perMo = monthlyRate(p);
          return (
            <div key={p.id} className="gp-card gp-card-static p-5">
              <p className="text-sm font-medium text-muted">{p.name}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                ${p.priceUsd}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand">
                ${perMo}/mo
              </p>
              {(p.bullets ?? []).length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {(p.bullets ?? []).map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>
          Family / friends: up to {MAX_FAMILY_SEATS} seats, cost still per
          person.
        </li>
        <li>No free trial — start monthly if you want flexibility.</li>
        <li>Gift memberships supported (coming in product flow).</li>
        <li>Cancel anytime; access until paid term ends.</li>
        <li>
          Refund policy: see{" "}
          <Link href="/faq" className="text-brand underline">
            FAQ
          </Link>
          .
        </li>
      </ul>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">
        Restaurants
      </h2>
      <div className="mt-4 gp-card gp-card-static p-6">
        <p className="text-2xl font-bold tracking-tight text-brand-mint uppercase">
          FREE TO JOIN
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No listing fee. No % of redemptions. Optional marketing packages
          later. Hands-on onboarding available for a fee by quote.
        </p>
        <Link
          href="/for-restaurants"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Full restaurant guide →
        </Link>
      </div>

      <Link
        href="/membership"
        className="mt-10 inline-block gp-btn gp-btn-primary"
      >
        Become a member
      </Link>
    </div>
  );
}
