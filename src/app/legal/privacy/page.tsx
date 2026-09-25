import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy notice</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        When you use {PLATFORM.name}, you trust us with personal information.
        This notice describes what we collect, how we use and share it, and the
        choices you have. Membership billing, offers, and restaurant duties are
        in the{" "}
        <Link href="/legal/terms" className="text-brand underline">
          Terms of use
        </Link>
        . Last updated September 25, 2026.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Who this covers</h2>
          <p className="mt-2">
            This notice applies when you use the {PLATFORM.name} site to browse
            restaurants, join a membership, redeem an offer, or place an order.
            That includes the adult who owns an account, people added as seats
            on a Family &amp; Friends plan, and someone who receives an order
            placed for them.
          </p>
          <p className="mt-2">
            Restaurant applications are covered in section 7. This notice does
            not change the rules of a membership or a restaurant listing. Those
            are in the terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            2. Information we collect
          </h2>
          <h3 className="mt-4 font-semibold text-white">Information you give us</h3>
          <p className="mt-2">
            When you create or update an account we collect your name, email,
            phone number, birthday, home address, password, and the city you
            choose. If you join a plan we also store the plan, the number of
            seats, and any referral code you enter. A profile photo is
            optional.
          </p>
          <p className="mt-2">
            We collect your birthday to confirm that the account owner is 18 or
            older. We do not ask for a government ID to open a diner account.
          </p>
          <p className="mt-2">
            When you post, we collect the reviews, city-feed posts, chat
            messages, ratings, and photos you choose to upload.
          </p>

          <h3 className="mt-4 font-semibold text-white">
            Information from using the service
          </h3>
          <p className="mt-2">
            We keep a record of redemptions, online orders, rewards, and
            favorites. An order record includes the restaurant, items, time,
            amount, and the offer applied. A redemption record includes the
            restaurant, the offer, and the time the code was confirmed.
          </p>
          <p className="mt-2">
            We use an approximate location from your IP address, or from your
            device only if location permission was already granted, to suggest
            the closest city we serve. You can pick a different city. We do not
            follow you on a trip, and we do not sell location information.
          </p>
          <p className="mt-2">
            We also receive ordinary technical data from your browser or phone:
            IP address, browser type, pages you open, and the time of a visit.
            That is used to run the site and to spot abuse. If you contact us,
            we keep the message and our reply.
          </p>

          <h3 className="mt-4 font-semibold text-white">
            Information from other people
          </h3>
          <p className="mt-2">
            If a member refers you, we receive the name and contact details
            they submit with the referral code. If an adult adds you as a seat
            on a family plan, we receive the details that adult enters. A
            restaurant may tell us that a code was honored or that an order had
            a problem. Our payment provider confirms whether a membership
            charge succeeded. We do not buy marketing lists.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. How we use it</h2>
          <p className="mt-2">
            We use this information to create and secure accounts, run
            memberships, show restaurants in your city, redeem offers, process
            online orders, award rewards, and send receipts or order updates.
          </p>
          <p className="mt-2">
            We use it to prevent fake accounts, shared redeem codes, and
            payment fraud, and to answer support requests. We send service
            messages about billing, security, and changes to these policies
            because they are part of the account. Those are not marketing.
          </p>
          <p className="mt-2">
            The only automated choice we make about you is which city to
            suggest from that approximate location. You can change the city
            yourself. We do not use automated scoring to deny membership.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            4. Email, texts, and cookies
          </h2>
          <p className="mt-2">
            Promotional email and texts are sent only if you opt in. We will
            never sell your information. Those messages are only about
            promotions, updated terms, and offers. Unsubscribe from email in
            the message. Reply STOP to opt out of texts. Message and data rates
            may apply.
          </p>
          <p className="mt-2">
            We store a session and your city choice in the browser so you stay
            signed in and do not have to pick a city on every visit. We do not
            use advertising cookies or sell cookie data. You can clear that
            storage in your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            5. When we share it
          </h2>
          <p className="mt-2">
            A restaurant sees what it needs to honor your visit: that you are a
            member, the offer, and the code you present. For an online order it
            also sees the items and the name on the order. It does not receive
            our member list.
          </p>
          <p className="mt-2">
            Stripe processes card payments. We do not store full card numbers.
            Account data is stored with Supabase, photos and files with
            Cloudflare, and the site is hosted on Vercel. They process
            information only so we can run the service. We may also disclose
            information if the law requires it, or to investigate fraud and
            abuse. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            6. How long we keep it, and deletion
          </h2>
          <p className="mt-2">
            We keep account, order, and redemption records while your account
            is open and afterward for as long as we need them for support,
            fraud checks, and accounting. Chat and feed posts stay until you
            delete them or we remove them under the community guidelines.
          </p>
          <p className="mt-2">
            Email{" "}
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-brand underline"
            >
              {PLATFORM.supportEmail}
            </a>{" "}
            to ask for a copy of your information, a correction, or deletion of
            your account. We may keep a limited record of a payment or a
            redemption where we have a legal reason to.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            7. Restaurant applications
          </h2>
          <p className="mt-2">
            If you apply to list a restaurant, we collect the business and
            contact details, the market you choose, promotion notes, and the
            files the application requires, including the logo, menu, health
            license, tax documents, and owner identification. We use those only
            to review the application, set up the listing, and confirm the
            business. Staff logins the owner creates are used to run that
            listing. We keep application files while the business is listed and
            for a period afterward for our records. This section does not
            replace the diner notice above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Children</h2>
          <p className="mt-2">
            Account owners must be 18 or older. We do not knowingly let a child
            open an account. An adult may add a younger diner as a seat on a
            family plan and is the person who provides that seat’s details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            9. Your choices and updates
          </h2>
          <p className="mt-2">
            Update your profile in your account. Change the city in the header.
            Turn off marketing email or texts as described above. You can
            withhold device location. The site will still suggest a city from
            your IP address, and you can override it.
          </p>
          <p className="mt-2">
            If we change this notice, we will post the new version here and
            update the date. Questions:{" "}
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
