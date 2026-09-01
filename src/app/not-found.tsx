import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="gp-badge">404</p>
      <h1 className="gp-page-title mt-4">That page isn’t here</h1>
      <p className="gp-page-sub">
        The link may be old, or the page moved. Try one of these:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/explore" className="gp-btn gp-btn-primary">
          Explore Dallas
        </Link>
        <Link href="/faq" className="gp-btn gp-btn-secondary">
          Help / FAQ
        </Link>
        <Link href="/contact" className="gp-btn gp-btn-secondary">
          Contact us
        </Link>
      </div>
    </div>
  );
}
