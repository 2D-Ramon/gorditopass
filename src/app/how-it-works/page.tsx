import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">How it works</h1>
      <p className="gp-page-sub">{PLATFORM.mission}</p>

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
