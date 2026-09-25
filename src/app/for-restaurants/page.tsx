import Link from "next/link";
import { WhyGordito } from "@/components/WhyGordito";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "For restaurants" };

export default function ForRestaurantsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="gp-badge mb-4">Business partners</p>
      <h1 className="gp-page-title">For restaurants</h1>
      <p className="gp-page-sub">
        Free to join after approval. You keep control of deals and margins.{" "}
        {PLATFORM.name} is built to help local food businesses—not extract high
        fees.
      </p>

      <WhyGordito
        items={[
          {
            icon: "megaphone",
            title: "Free to join",
            body: "Free to join after approval. No listing fee. Membership pays for the platform so you can fill seats.",
          },
          {
            icon: "bag",
            title: "Keep the sale",
            body: "No fee on in-store sales. We charge 1% of online orders.",
          },
          {
            icon: "case",
            title: "You set the offer",
            body: "You set the promotion and the margin. Member offers are not the same ones you run for the public at the same time.",
          },
        ]}
      />

      <div className="max-w-3xl">
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-stone-300">
          <li>
            Members browse local restaurants and see your exclusive promotion.
          </li>
          <li>
            They show a rotating code. Staff confirm it in the partner
            dashboard and honor the deal on your POS.
          </li>
          <li>
            After we set up your listing, you publish and edit promotions,
            menu, events, and job openings from the partner dashboard.
          </li>
        </ol>
      </section>

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

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Intake</h2>
      <ol className="mt-4 list-decimal space-y-4 pl-5 text-stone-300">
        <li className="leading-relaxed">Apply free.</li>
        <li className="leading-relaxed">Fill out application.</li>
        <li className="leading-relaxed">
          Customize your details through your partner dashboard, publish and
          edit your Promotions, Menu and photos, Events, and Job Openings. –
          its simple!
        </li>
        <li className="leading-relaxed">
          Create an EXCLUSIVE Promotion. Cannot have the same offer(s)
          available to the public at the same time. Suggested offers: Free
          item(s) or at least 20% off. Franchises will be a max of 12% off. Can
          run multiple offers at once. Suggest a minimum of two weeks to
          measure effectiveness.
        </li>
        <li className="leading-relaxed">
          We want you to keep your doors open! No listing fee, Free to sign
          up, No fees for in-store sales. We charge 1% of online orders and
          have optional paid marketing services.
        </li>
      </ol>

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
    </div>
  );
}
