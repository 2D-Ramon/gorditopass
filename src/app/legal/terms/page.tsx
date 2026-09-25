import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms of service</h1>
      <p className="mt-4 text-sm text-muted">
        These terms cover using {PLATFORM.name}. How we handle personal
        information is in the{" "}
        <Link href="/legal/privacy" className="text-brand underline">
          Privacy Policy
        </Link>
        . Last updated September 25, 2026.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">What GorditoPass is</h2>
          <p className="mt-2">
            {PLATFORM.name} is a membership for finding and redeeming deals at
            independent restaurants. We are not the restaurant, and we are not a
            delivery company. The restaurant prepares and sells the food. You
            pay the restaurant for what you order. Browsing the site is free.
            Membership is what unlocks member offers, rewards, and posting in
            the city feed.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Accounts</h2>
          <p className="mt-2">
            You must be 18 or older to open an account. Younger diners may be
            added only as seats on a Family &amp; Friends plan, by the adult who
            owns that plan. Each person gets their own login. Do not share
            passwords or redeem codes. You are responsible for activity on your
            account.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Membership and billing</h2>
          <p className="mt-2">
            Paid plans are Monthly ($7), 6 months ($36), and Annual ($60),
            billed per seat, up to 6 seats. A plan works in every city we
            launch. Membership renews at the end of the term you paid for unless
            you cancel. You can cancel from your account billing page or by
            emailing{" "}
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-brand underline"
            >
              {PLATFORM.supportEmail}
            </a>
            . After you cancel, you keep access until the term you already paid
            for ends. We do not pro-rate unused days.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Refunds</h2>
          <p className="mt-2">
            Refunds are case by case. If you have not redeemed more than once
            and you ask within 7 days of purchase, we will generally refund. After
            that, or once the membership has been used at restaurants, we
            generally do not refund, except for a verified billing error or a
            documented problem we could not make right.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Offers and redemption</h2>
          <p className="mt-2">
            Restaurants create the offers. A member offer is not the same offer
            the restaurant runs for the public at the same time. Offers can
            change, sell out, or end. An offer applies only as the restaurant
            states it, and alcohol is excluded where the offer says so or where
            the law requires it. Show your rotating member code in store, or
            redeem online where that restaurant allows it. Codes are personal.
            Staff confirm the code and apply the deal on the restaurant’s own
            checkout. We do not take a cut of that in-store sale.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Online orders</h2>
          <p className="mt-2">
            If you order through the site, the restaurant is still the seller of
            the food. We do not cook it, deliver it, or set the kitchen’s prices.
            Questions about an order, including ingredients and allergens, go to
            the restaurant. Card payments are processed by our payment provider.
            We do not store full card numbers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Restaurant partners</h2>
          <p className="mt-2">
            Restaurants apply and are listed only after we approve them. There
            is no listing fee and no fee on in-store sales. We charge the
            restaurant 1% of orders placed online through {PLATFORM.name}. We do
            not charge a delivery-app commission. The restaurant sets the member
            promotion and must honor active offers for valid members. Franchise
            offers are capped at 12% off. The person who applies must have
            authority to bind the business. We may refuse, pause, or remove a
            listing that breaks these terms, the offer rules, or the law.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Rewards</h2>
          <p className="mt-2">
            Points, badges, and cuisine passports are a membership perk. They
            have no cash value, cannot be transferred, and are not a bank
            balance. We may change how points are earned or redeemed, and we may
            close rewards that were obtained by misuse.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">What you post</h2>
          <p className="mt-2">
            You keep ownership of photos, reviews, and messages you post. You
            give {PLATFORM.name} permission to display that content on the
            service, including the city feed, chat, and restaurant pages. Do not
            post anything you do not have the right to share.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Acceptable use</h2>
          <p className="mt-2">
            Do not misuse redeem codes, open fake accounts, scrape the service,
            or interfere with restaurants or other members. City feed, chat, and
            reviews also follow the{" "}
            <Link href="/legal/community" className="text-brand underline">
              Community guidelines
            </Link>
            . We may remove content and suspend accounts that break these terms.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Food and availability</h2>
          <p className="mt-2">
            Menus, hours, prices, and offers come from the restaurants and can
            be wrong or out of date. The restaurant is responsible for food
            quality, preparation, and allergen information. {PLATFORM.name} does
            not guarantee that a particular table, item, or discount will be
            available when you arrive.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Limits</h2>
          <p className="mt-2">
            The service is provided as is. To the extent the law allows,{" "}
            {PLATFORM.name} is not liable for indirect or consequential losses,
            or for a restaurant’s food, service, or refusal of an offer. Nothing
            here limits liability that the law does not allow us to limit.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Changes and disputes</h2>
          <p className="mt-2">
            We may update these terms. If we do, we will post the new date on
            this page, and we will email members when a change is material.
            Continued use after the update means you accept the new terms. These
            terms are governed by the laws of the State of Oklahoma, excluding
            conflict-of-law rules. Questions:{" "}
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-brand underline"
            >
              {PLATFORM.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
