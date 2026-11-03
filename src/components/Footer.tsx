import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { PLATFORM } from "@/lib/pricing";

const SOCIAL_LINKS = [
  {
    name: "X",
    href: "https://x.com/thegorditopass",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/thegorditopass",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.415.56.217.96.477 1.382.896.419.42.679.822.896 1.381.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.413 2.227-.217.56-.477.96-.896 1.382-.42.419-.822.679-1.382.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.413a3.71 3.71 0 0 1-1.381-.896 3.71 3.71 0 0 1-.896-1.382c-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.413-2.227.217-.56.477-.96.896-1.381.42-.419.822-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.902.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.902.13 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.058 1.278.261 2.15.558 2.913a5.88 5.88 0 0 0 1.384 2.126A5.88 5.88 0 0 0 4.14 23.37c.763.297 1.635.5 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.058 2.15-.261 2.913-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.763.5-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.278-.261-2.15-.558-2.913a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63C19.097.333 18.225.13 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@gorditopass",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    name: "Facebook",
    href: "https://facebook.com/gorditopass",
    path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-elevated/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-base font-bold tracking-tight">
            <BrandMark size="sm" />
            {PLATFORM.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {PLATFORM.tagline}
          </p>
          <p className="mt-3 text-sm">
            <a
              href={`mailto:${PLATFORM.supportEmail}`}
              className="text-stone-300 hover:text-brand"
            >
              {PLATFORM.supportEmail}
            </a>
          </p>
          <ul className="mt-4 flex items-center gap-3" aria-label="Social media">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${PLATFORM.name} on ${s.name} (opens in new tab)`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-stone-300 transition-colors hover:border-brand hover:text-brand"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true" focusable="false">
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
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
              <Link href="/on-the-menu" className="text-stone-300 hover:text-brand">
                Swipe &amp; Dine
              </Link>
            </li>

            <li>
              <Link href="/events" className="text-stone-300 hover:text-brand">
                Events
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="text-stone-300 hover:text-brand">
                How it works
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
            <li>
              <Link href="/chat" className="text-stone-300 hover:text-brand">
                Chat
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
          <p className="gp-section-label">Help</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <Link href="/login" className="text-stone-300 hover:text-brand">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-stone-300 hover:text-brand">
                Admin sign in
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-stone-300 hover:text-brand">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-stone-300 hover:text-brand">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-stone-300 hover:text-brand">
                About
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
        © {new Date().getFullYear()} {PLATFORM.name} · Dallas · Tulsa
      </div>
    </footer>
  );
}
