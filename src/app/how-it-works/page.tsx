import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "How it works" };

const DINER_STEPS = [
  {
    title: "SURF",
    body: "Browse local eats — see every deal.",
  },
  {
    title: "SUBSCRIBE",
    body: "Individual (seat) or family & friends (table — up to 6 seats) plans available.",
  },
  {
    title: "SAVOR",
    body: "Redeem in store or online, automatically.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">How it works</h1>
      <p className="gp-page-sub">{PLATFORM.mission}</p>

      <section className="mt-10">
        <p className="gp-section-label">How it works for you</p>
        <ol className="mt-5 space-y-5">
          {DINER_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-orange-200 ring-1 ring-brand/20">
                {i + 1}
              </span>
              <span>
                <span className="font-bold uppercase tracking-wide text-brand">
                  {step.title}
                </span>
                <span className="text-stone-300"> — {step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/membership"
          className="gp-card group p-6 transition hover:border-brand/40 hover:shadow-[var(--shadow-glow)]"
        >
          <p className="gp-section-label">Consumers</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight group-hover:text-orange-200">
            Membership
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Browse free, join membership, redeem deals, city feed, savings, and
            more.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand">
            Open membership →
          </span>
        </Link>
        <Link
          href="/for-restaurants"
          className="gp-card group p-6 transition hover:border-brand/40 hover:shadow-[var(--shadow-glow)]"
        >
          <p className="gp-section-label">Business</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight group-hover:text-orange-200">
            For restaurants
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Free listing, intake, deals, staff redeem, events, and jobs.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand">
            Open restaurant guide →
          </span>
        </Link>
      </div>
    </div>
  );
}
