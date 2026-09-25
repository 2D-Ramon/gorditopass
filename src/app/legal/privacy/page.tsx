import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-4 text-sm text-muted">
        This policy explains what {PLATFORM.name} collects and why. Membership
        billing, offers, and restaurant rules are in the{" "}
        <Link href="/legal/terms" className="text-brand underline">
          Terms of service
        </Link>
        . Last updated September 25, 2026.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">Who this covers</h2>
          <p className="mt-2">
            This applies to diners, family-plan seats, and restaurants that
            apply or list on {PLATFORM.name}.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Information from diners</h2>
          <p className="mt-2">
            When you create an account or join a plan, we collect the name,
            email, phone, birthday, and home address you enter, plus the city
            you use on the site, your plan, and referral codes. As you use the
            service we store redemptions, online orders, rewards, favorites,
            reviews, city-feed posts, and chat messages. Profile and food photos
            are optional.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">
            Information from restaurants
          </h2>
          <p className="mt-2">
            An application includes the business and contact details you submit,
            the market you choose, promotion ideas, and required files such as
            the logo, menu, health license, tax documents, and owner
            identification. After approval we store the listing, offers, menu,
            events, and jobs you publish, plus staff logins the owner creates.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">City and device</h2>
          <p className="mt-2">
            We use an approximate location from your IP address, or from your
            device if permission was already granted, only to suggest the
            closest city we serve. You can pick a different city. We remember
            that choice in your browser. We do not sell location data.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">How we use it</h2>
          <p className="mt-2">
            We use this information to create accounts, run memberships, show
            restaurants and offers, redeem deals, process online orders, award
            rewards, review restaurant applications, and answer support
            requests. We also use it to keep the service secure and to prevent
            fake accounts and code sharing.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Email and text messages</h2>
          <p className="mt-2">
            We send promotional email or texts only if you opt in. We will never
            sell your information. Messages are only about promotions, updated
            terms, and offers. You can unsubscribe from email in any marketing
            message. Text STOP to opt out of texts. Message and data rates may
            apply. Account messages about a billing problem or a restaurant
            application are not marketing, and they do not require that opt-in.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Who else sees it</h2>
          <p className="mt-2">
            A restaurant sees what it needs to honor your offer, such as your
            membership status and the code you present. It does not receive our
            member list to market on its own. Stripe processes card payments. We
            do not store full card numbers. Account data is stored with
            Supabase, photos and documents with Cloudflare, and the site is
            hosted on Vercel. Those providers process data only so we can run
            the service. We may also share information if the law requires it.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Children</h2>
          <p className="mt-2">
            Account owners must be 18 or older. We do not knowingly let a child
            open an account. An adult may add a younger diner as a seat on a
            family plan. The adult provides that seat’s details.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">How long we keep it</h2>
          <p className="mt-2">
            We keep account, order, and redemption records while your account is
            open and for as long as we need them for support, fraud checks, and
            tax or accounting rules. Restaurant application files are kept for
            the review and for as long as the business stays listed. You can ask
            us to delete your account by emailing{" "}
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-brand underline"
            >
              {PLATFORM.supportEmail}
            </a>
            . We may keep a limited record of a redemption or a payment where we
            have to.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Your choices</h2>
          <p className="mt-2">
            Update your profile in your account. Turn off marketing email or
            texts as described above. Email us for a copy of the personal
            information we hold about you, or to correct it.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Changes</h2>
          <p className="mt-2">
            If we change this policy, we will post the new version here and
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
