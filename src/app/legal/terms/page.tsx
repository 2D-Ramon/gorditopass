import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms of use</h1>
      <p className="mt-4 text-sm text-muted">
        Last updated September 25, 2026. These terms are an agreement between
        you and {PLATFORM.name}. They cover the website, member tools, and
        restaurant listings. The{" "}
        <Link href="/legal/privacy" className="text-brand underline">
          Privacy Policy
        </Link>{" "}
        explains personal information. The{" "}
        <Link href="/legal/community" className="text-brand underline">
          Community guidelines
        </Link>{" "}
        cover the city feed, chat, and reviews. Together, those pages are the
        rules for the service.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">1. Agreement</h2>
          <p className="mt-2">
            By creating an account, buying a membership, applying as a
            restaurant, or otherwise using the service, you agree to these
            terms. If you do not agree, do not use {PLATFORM.name}.
          </p>
          <p className="mt-2">
            We may stop offering the service, or close your access to it, if
            you break these terms, if we cannot verify your account, or if we
            stop operating in your city. You may stop using the service at any
            time. Canceling a paid membership is described below. Sections that
            by their nature should continue, including payment disputes already
            in progress, limits on liability, and your content license, still
            apply after access ends.
          </p>
          <p className="mt-2">
            We may update these terms. The new version is effective when it is
            posted here. If a change is material, we will also email the
            address on your account. Continuing to use the service after the
            update means you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">2. The service</h2>
          <p className="mt-2">
            {PLATFORM.name} is a membership for finding local restaurants and
            redeeming member offers. Browsing is free. Membership unlocks
            member offers, rewards, and posting in the city feed.
          </p>
          <p className="mt-2">
            We provide the membership, the listing, and the tools to redeem an
            offer or place an online order. We do not cook the food, employ the
            restaurant’s staff, or operate a delivery fleet. A restaurant’s
            decision to list, to accept an order, or to honor an offer is the
            restaurant’s decision. Using the service does not make a restaurant
            our employee or our agent.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">
            3. Restaurants and other third parties
          </h2>
          <p className="mt-2">
            Menus, hours, prices, photos, and offers are provided by
            restaurants or linked from their own pages. When you leave{" "}
            {PLATFORM.name} for a restaurant’s site, map, or payment page,
            that destination has its own terms. We do not control those pages.
          </p>
          <p className="mt-2">
            Food quality, preparation, and allergen information are the
            restaurant’s responsibility. Ask the restaurant before you order if
            you have an allergy or dietary need. We do not guarantee that a
            table, item, hour, or discount will still be available when you
            arrive.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">4. Accounts</h2>
          <p className="mt-2">
            You need an account for membership, redemption, orders, rewards,
            and community features. You must be 18 or older to open an account.
            You may keep one account. You may not transfer it, sell it, or
            share the password.
          </p>
          <p className="mt-2">
            An adult who buys a Family &amp; Friends plan may add younger
            diners only as seats on that plan. The adult provides their
            details and is responsible for activity on those seats. Each person
            who can sign in gets their own login.
          </p>
          <p className="mt-2">
            Keep your name, email, phone, and payment details accurate. We may
            ask you to confirm your identity. We may refuse, pause, or delete
            an account that is duplicate, unused for a long time, opened with
            false information, or used without your permission when we cannot
            confirm it is yours. You are responsible for activity under your
            login.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">5. Membership and payment</h2>
          <p className="mt-2">
            Paid plans are Monthly ($7), 6 months ($36), and Annual ($60),
            charged per seat, up to 6 seats. A plan works in every city we
            launch. Membership renews for the same term unless you cancel.
            Cancel from your account billing page or by emailing{" "}
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-brand underline"
            >
              {PLATFORM.supportEmail}
            </a>
            . After you cancel, access continues until the term you already
            paid for ends. We do not pro-rate unused days.
          </p>
          <p className="mt-2">
            You pay the restaurant for food, tax, and tip. We do not take a cut
            of an in-store sale. If you order online through the site, the
            restaurant is still the seller. Card payments are handled by our
            payment provider. We do not store full card numbers. You authorize
            charges for the plan you select and for online orders you place.
          </p>
          <p className="mt-2">
            Refunds of membership fees are case by case. If you have not
            redeemed more than once and you ask within 7 days of purchase, we
            will generally refund. After that, or once the membership has been
            used at a restaurant, we generally do not refund, except for a
            verified billing error or a documented problem we could not make
            right.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">
            6. Offers, redemption, and online orders
          </h2>
          <p className="mt-2">
            Restaurants create member offers. A member offer is not the same
            offer the restaurant runs for the public at the same time. Offers
            can change, sell out, or end, and they apply only as the restaurant
            states. Alcohol is excluded where the offer says so or where the
            law requires it.
          </p>
          <p className="mt-2">
            Redeem in store by showing your rotating member code, or online
            where that restaurant allows it. Codes are personal. Do not share
            them. Staff confirm the code and apply the deal on the restaurant’s
            own checkout. Once a restaurant has started an online order, it may
            not be possible to cancel it.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">7. Restaurant partners</h2>
          <p className="mt-2">
            A restaurant is listed only after we approve the application. There
            is no listing fee and no fee on in-store sales. We charge the
            restaurant 1% of orders placed online through {PLATFORM.name}. We
            do not charge a delivery-app commission. Franchise offers are
            capped at 12% off.
          </p>
          <p className="mt-2">
            The person who applies must have authority to bind the business.
            The restaurant sets the member promotion and must honor active
            offers for valid members. We may refuse, pause, or remove a listing
            that breaks these terms, the offer rules, or the law.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">8. Rewards</h2>
          <p className="mt-2">
            Points, badges, and cuisine passports are a membership perk. They
            have no cash value, are not a stored balance, and cannot be sold or
            transferred. We may change how they are earned or redeemed, and we
            may remove rewards that came from misuse.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">
            9. Conduct, messages, and your content
          </h2>
          <p className="mt-2">
            Use the service only for lawful purposes. Do not harass restaurants
            or members, scrape the site, probe its security, or use it to build
            a competing product. Community spaces also follow the{" "}
            <Link href="/legal/community" className="text-brand underline">
              Community guidelines
            </Link>
            .
          </p>
          <p className="mt-2">
            Creating an account means we may send you service messages about
            billing, security, and, for restaurants, an application. Those
            messages are part of running the account. Promotional email and
            texts are sent only if you opt in, as described in the{" "}
            <Link href="/legal/privacy" className="text-brand underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-2">
            You keep ownership of photos, reviews, and messages you post. You
            give {PLATFORM.name} permission to display that content on the
            service, including the city feed, chat, and restaurant pages. Do
            not post anything you do not have rights to. We may remove content
            that breaks these terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">10. Our content</h2>
          <p className="mt-2">
            The service, including its name, logo, design, and software,
            belongs to {PLATFORM.name} or its licensors. We grant you a
            personal, non-exclusive, revocable license to use the site for your
            own membership or, if you are an approved restaurant, to manage
            your listing. You may not copy the service, resell access, or use
            our name or marks in your own product name, domain, or social
            account without written permission. Rights we do not grant here
            stay with us.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">
            11. Disclaimers and limits
          </h2>
          <p className="mt-2">
            The service is provided as is. We do not warrant that it will be
            uninterrupted or error-free, or that restaurant information will be
            complete. To the extent the law allows, {PLATFORM.name} is not
            liable for indirect or consequential losses, or for a restaurant’s
            food, service, staff, or refusal of an offer. If we are liable for
            a membership fee dispute, that liability is limited to the
            membership fees you paid us in the three months before the claim.
            Nothing here limits liability the law does not allow us to limit.
          </p>
          <p className="mt-2">
            If someone brings a claim against us because of your misuse of the
            service, your content, or your restaurant’s failure to honor an
            offer you control, you will cover our reasonable losses from that
            claim, to the extent the law allows.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-white">12. Other terms</h2>
          <p className="mt-2">
            These terms, the Privacy Policy, and the Community guidelines are
            the whole agreement about the service. If a court finds one part
            unenforceable, the rest still applies. These terms are governed by
            the laws of the State of Oklahoma, excluding conflict-of-law rules.
          </p>
          <p className="mt-2">
            Questions:{" "}
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
