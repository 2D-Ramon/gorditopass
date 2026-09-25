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

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Why Gordito</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Most food apps win by charging restaurants until it hurts. GorditoPass
          is membership-funded so you can fill seats and keep the sale.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-300">
          <li>Free to join after approval. No listing fee.</li>
          <li>No fee on in-store sales. We charge 1% of online orders.</li>
          <li>
            You set the promotion and the margin. Member offers are not the
            same ones you run for the public at the same time.
          </li>
          <li>
            Mom-and-pop preferred. Franchises are welcome, with a max of 12%
            off.
          </li>
        </ul>
      </section>

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

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Intake</h2>
      <ol className="mt-4 list-decimal space-y-4 pl-5 text-stone-300">
        <li className="leading-relaxed">
          Apply free — intake approval required (mom-and-pop preferred;
          franchises OK).
        </li>
        <li className="leading-relaxed">
          Fill out application and Upload required documents.
        </li>
        <li className="leading-relaxed">
          We will upload everything for you to start, future changes will be
          done through your partner dashboard, publish and edit your
          Promotions, Menu, Events, and Job Openings. – its simple!
        </li>
        <li className="leading-relaxed">
          Create an EXCLUSIVE Promotion. Cannot have the same offer(s)
          available to the public at the same time. Suggested offers: Free
          item(s) or at least 20% off. Franchises will be a max of 12% off. Can
          run multiple offers at once. Suggest a minimum of two weeks to
          measure effectiveness.
        </li>
        <li className="leading-relaxed">
          Staff opens dashboard → scan member code → honor deal on your POS.
        </li>
        <li className="leading-relaxed">
          Its simple – We want you to keep your doors open! No listing fee,
          Free to sign up, No fees for in-store sales. We charge 1% of online
          orders and have optional paid marketing services.
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
