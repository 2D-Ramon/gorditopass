export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-4 text-sm text-muted">
        How GorditoPass handles member and restaurant data. Last updated August
        31, 2026. Entity of record TBD, Oklahoma.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        <section>
          <h2 className="font-semibold text-white">What we collect</h2>
          <p className="mt-2">
            Name, email, phone, address, birthday, city, membership plan,
            redemption history, rewards, optional photos, and marketing opt-in
            choices. Restaurants also provide business details, menus, and deals.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Where it lives</h2>
          <p className="mt-2">
            Account and membership data is stored in our database (Supabase).
            Photos (menus, feed, chat, profiles) are compressed and stored on
            Cloudflare R2. Card numbers are handled by Stripe — we do not store
            full card data. Some demo features may still use your browser until
            fully migrated.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">How we use it</h2>
          <p className="mt-2">
            To run memberships, redeem deals, show restaurants, award rewards,
            and (only if you opt in) email or text about deals. We do not sell
            your personal information. SMS: you can reply STOP. Email:
            unsubscribe link on every marketing message.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">Your choices</h2>
          <p className="mt-2">
            Update your profile in Account. Cancel membership in billing. Email
            hello@gorditopass.local to request a copy or deletion of your data.
          </p>
        </section>
      </div>
    </div>
  );
}
