export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms of service</h1>
      <p className="mt-4 text-sm text-muted">
        GorditoPass is a membership for local restaurant deals. Entity to be
        formed in Oklahoma. Have an attorney review before taking card payments
        at scale. Last updated August 31, 2026.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">Accounts</h2>
          <p className="mt-2">
            You must be 18+ to own an account. Younger diners may be added only
            as seats on a family/friends plan. One login per person — do not
            share passwords.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Membership and billing</h2>
          <p className="mt-2">
            Plans are Monthly ($7), 6 months ($36), and Annual ($60), billed per
            seat (max 6). Memberships renew at the end of the paid term unless
            you cancel. Cancel anytime from Account → billing portal (or email{" "}
            hello@gorditopass.local). You keep access until the term you already
            paid for ends. We do not pro-rate unused days.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Refunds</h2>
          <p className="mt-2">
            Refunds are case-by-case. If you have not redeemed more than once
            and request a refund within 7 days of purchase, we will generally
            refund. After that, or if membership was used at restaurants, we
            generally do not refund except for verified billing errors or a
            documented bad experience we could not make right.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Deals and restaurants</h2>
          <p className="mt-2">
            Deals are offered by restaurants. GorditoPass helps you find and
            redeem them. Restaurants must honor approved, active deals for valid
            members. Alcohol discounts only where lawful. We do not take a cut of
            in-store sales; you still pay the restaurant for food.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Acceptable use</h2>
          <p className="mt-2">
            No sharing redeem codes, fake accounts, harassment, or political
            campaigning in community features. We may suspend accounts that
            break these rules.
          </p>
        </section>
      </div>
    </div>
  );
}
