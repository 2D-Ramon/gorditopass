import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-elevated/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-bold tracking-tight">{PLATFORM.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {PLATFORM.tagline}
          </p>
        </div>
        <div>
          <p className="gp-section-label">Diners</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <Link href="/membership" className="text-stone-300 hover:text-brand">
                Membership
              </Link>
            </li>
            <li>
              <Link href="/explore" className="text-stone-300 hover:text-brand">
                Explore
              </Link>
            </li>

            <li>
              <Link href="/events" className="text-stone-300 hover:text-brand">
                Events
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="text-stone-300 hover:text-brand">
                Jobs
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-stone-300 hover:text-brand">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/rewards" className="text-stone-300 hover:text-brand">
                Rewards
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="gp-section-label">Business</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <Link
                href="/for-restaurants"
                className="text-stone-300 hover:text-brand"
              >
                For restaurants
              </Link>
            </li>
            <li>
              <Link href="/apply" className="text-stone-300 hover:text-brand">
                Apply to join
              </Link>
            </li>
            <li>
              <Link
                href="/restaurant/dashboard"
                className="text-stone-300 hover:text-brand"
              >
                Partner dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="gp-section-label">Company</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="text-stone-300 hover:text-brand">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-stone-300 hover:text-brand">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-stone-300 hover:text-brand">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-stone-300 hover:text-brand">
                Admin
              </Link>
            </li>
            <li>
              <Link href="/cities" className="text-stone-300 hover:text-brand">
                Cities
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="text-stone-300 hover:text-brand">
                Terms
              </Link>
            </li>
            <li>
              <Link
                href="/legal/privacy"
                className="text-stone-300 hover:text-brand"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/legal/community"
                className="text-stone-300 hover:text-brand"
              >
                Community guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {PLATFORM.name} · Working name · Placeholder
        brand · MVP demo
      </div>
    </footer>
  );
}
