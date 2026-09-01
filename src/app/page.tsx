import Link from "next/link";
import { HomeFeaturedSection } from "@/components/HomeFeatured";
import { MEMBERSHIP_PLANS, monthlyRate, PLATFORM } from "@/lib/pricing";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="gp-badge mb-5">Dallas metro · early access</p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Local food.{" "}
              <span className="bg-gradient-to-r from-brand via-brand-gold to-brand-hot bg-clip-text text-transparent">
                Member prices.
              </span>
              <br className="hidden sm:block" /> More of what you love.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {PLATFORM.mission}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explore" className="gp-btn gp-btn-primary">
                Explore Dallas
              </Link>
              <Link href="/membership" className="gp-btn gp-btn-secondary">
                Membership from $7/mo
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link
                href="/membership"
                className="font-medium text-orange-200/90 hover:text-brand"
              >
                Membership & benefits →
              </Link>
              <Link
                href="/events"
                className="font-medium text-muted hover:text-white"
              >
                This month’s events →
              </Link>
            </div>
          </div>

          <div className="gp-card gp-card-static relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-3xl" />
            <p className="gp-section-label">How it works for you</p>
            <ol className="mt-5 space-y-5">
              {[
                {
                  title: "SURF",
                  body: "Browse Local Eats. See Every Deal. Listen to your taste buds.",
                },
                {
                  title: "SUBSCRIBE",
                  body: "Individual or Family & Friends plans available.",
                },
                {
                  title: "SAVOR",
                  body: "Redeem in store or online.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-orange-200 ring-1 ring-brand/20">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-bold uppercase tracking-wide text-brand">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-stone-300">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-lg border border-border/80 bg-background/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Extra member perks
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
                Join the city feed, track your savings, catch partner events, and
                level up with the rewards program, badges, and cuisine passports —
                fun that keeps you exploring.
              </p>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {MEMBERSHIP_PLANS.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-background/80 p-3 text-center"
                >
                  <p className="text-xs text-muted">{p.name}</p>
                  <p className="mt-0.5 text-lg font-bold tracking-tight">
                    ${p.priceUsd}
                  </p>
                  {p.months > 1 && (
                    <p className="text-[11px] font-medium text-brand">
                      ${monthlyRate(p)}/mo
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeFeaturedSection />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="gp-card gp-card-static flex flex-col p-7">
            <p className="gp-section-label">Diners</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Save on local plates
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              Browse free, redeem exclusive deals, join city feed, and track your
              savings.
            </p>
            <Link
              href="/membership"
              className="gp-btn gp-btn-primary mt-6 self-start"
            >
              Membership
            </Link>
          </div>
          <div className="gp-card gp-card-static flex flex-col p-7">
            <p className="gp-section-label">Restaurants</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Join free. Keep your margins.
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              No listing fee. Create your own deals. Optional marketing packages
              later.
            </p>
            <Link
              href="/for-restaurants"
              className="gp-btn gp-btn-secondary mt-6 self-start"
            >
              For restaurants
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
