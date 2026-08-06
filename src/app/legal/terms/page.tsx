export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose-invert">
      <h1 className="text-3xl font-bold">Terms of service</h1>
      <p className="mt-4 text-sm text-muted">
        Placeholder legal draft for MVP demo — have an attorney review before
        public launch. Entity name TBD · Oklahoma.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-stone-300">
        <li>Accounts are for users 18+; younger diners may be plan seats only.</li>
        <li>Memberships renew per plan; cancel anytime; access until term end.</li>
        <li>Refunds are case-by-case as described in membership policy.</li>
        <li>Deals are offered by restaurants; platform facilitates discovery/redeem.</li>
        <li>Restaurants must honor approved active deals for valid members.</li>
        <li>No political content in community features.</li>
        <li>Alcohol discounts only where lawful; underage rules apply.</li>
      </ul>
    </div>
  );
}
