import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "For restaurants" };

export default function ForRestaurantsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="gp-badge mb-4">Business partners</p>
      <h1 className="gp-page-title">For restaurants</h1>
      <p className="gp-page-sub">
        Free to join after approval. You keep control of deals and margins.{" "}
        {PLATFORM.name} is built to help local food businesses—not extract high
        fees.
      </p>

      <ol className="mt-10 list-decimal space-y-4 pl-5 text-stone-300">
        <li className="leading-relaxed">
          Apply free — intake approval required (mom-and-pop preferred;
          franchises OK).
        </li>
        <li className="leading-relaxed">
          Upload logo, food photos, menu, tax ID, state license paperwork, and
          your promotion. Schedule future deals anytime.
        </li>
        <li className="leading-relaxed">
          Use the partner dashboard forms to publish deals, menu items, events,
          and job openings.
        </li>
        <li className="leading-relaxed">
          Suggested offers: free item(s) or at least 20% off. Keep an offer ~2
          weeks to measure results.
        </li>
        <li className="leading-relaxed">
          Staff opens dashboard → scan member code → honor deal on your POS.
        </li>
        <li className="leading-relaxed">
          No listing fee. Optional paid marketing packages later. We don’t take
          a cut of in-store sales.
        </li>
      </ol>

      <div className="mt-10 gp-card gp-card-static p-6">
        <p className="text-2xl font-bold tracking-tight text-brand-mint uppercase">
          FREE TO JOIN
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Planned start date must be at least 2 weeks out so we can complete
          approval and setup. Contact must have authority to make decisions (or
          upload owner permission).
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/apply" className="gp-btn gp-btn-primary">
          Apply to join
        </Link>
        <Link href="/restaurant/dashboard" className="gp-btn gp-btn-secondary">
          Partner dashboard
        </Link>
      </div>

      <div className="mt-10 gp-card gp-card-static p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Questions before signing up?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Not sure about fees, intake, deals, or how staff redeem works? We’re
          happy to walk you through it.
        </p>
        <Link href="/contact" className="gp-btn gp-btn-secondary mt-4 text-sm">
          Contact us
        </Link>
      </div>

      <p className="mt-10 text-sm text-muted">
        Looking for diner membership?{" "}
        <Link href="/membership" className="text-brand underline">
          Membership
        </Link>
      </p>
    </div>
  );
}
