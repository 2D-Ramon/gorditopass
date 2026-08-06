export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-4 text-sm text-muted">
        Placeholder for MVP. Company of record TBD. Do not use for real personal
        data until policies and hosting are production-ready.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-stone-300">
        <li>We collect account, membership, order, and redemption data to run the service.</li>
        <li>Demo stores some state in your browser (localStorage).</li>
        <li>Future: Supabase + Stripe with least-privilege access.</li>
        <li>We do not sell restaurant inventory; payment processors may process cards.</li>
        <li>Contact for privacy requests will live on the About page.</li>
      </ul>
    </div>
  );
}
