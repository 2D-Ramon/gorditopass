import Link from "next/link";

export const metadata = { title: "Early access" };

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Diner early access</h1>
      <p className="mt-3 text-muted">
        Early product cap: ~50 diners while we build. Grab a membership demo
        seat now.
      </p>
      <Link href="/membership" className="mt-8 inline-block gp-btn gp-btn-primary">
        Join membership
      </Link>
      <p className="mt-4 text-sm text-muted">
        Or{" "}
        <Link href="/explore" className="text-brand underline">
          browse free
        </Link>
      </p>
    </div>
  );
}
