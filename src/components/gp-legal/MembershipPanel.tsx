"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DraftBanner } from "./DraftBanner";
import { CANCEL_PATH, REFUNDS_PATH } from "@/lib/gp-legal/placeholders";
import { getMembershipSummary, type MembershipSummary } from "@/lib/gp-legal/hooks";
import { MEMBERSHIP_PLANS, PLATFORM } from "@/lib/pricing";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function adverb(months: number | null): string {
  return months === 1 ? "monthly" : months === 12 ? "yearly" : months ? `every ${months} months` : "";
}

export function MembershipPanel() {
  const [s, setS] = useState<MembershipSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getMembershipSummary().then(setS).catch((e) => setErr(e instanceof Error ? e.message : "Could not load membership."));
  }, []);

  const plan = MEMBERSHIP_PLANS.find((p) => p.id === s?.planId);
  const price = s?.priceUsd ?? plan?.priceUsd ?? null;
  const seats = s?.seats ?? 1;
  const priceText = price != null ? `$${(price * seats).toFixed(2).replace(/\.00$/, "")}` : "—";

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <DraftBanner />
      <h1 className="text-2xl font-bold sm:text-3xl">Membership</h1>
      <section className="mt-4 rounded-xl border border-white/15 bg-card p-4 sm:p-6">
        {err ? <p role="alert" className="text-red-200">{err}</p> : null}
        {!s && !err ? <p className="text-stone-300">Loading…</p> : null}
        {s && s.status === "none" ? (
          <p className="text-stone-200">
            You don&apos;t have an active membership. <Link href="/join/review" className="text-brand underline">Join {PLATFORM.name}</Link>
          </p>
        ) : null}
        {s && s.status !== "none" ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className="text-stone-300">Plan</dt>
            <dd className="font-semibold">{PLATFORM.name} {s.planName ?? plan?.name ?? "Membership"}{seats > 1 ? ` · ${seats} seats` : ""}</dd>
            <dt className="text-stone-300">Status</dt>
            {s.status === "canceling" ? (
              <dd className="font-semibold text-yellow-200">Canceled · access until {fmtDate(s.accessEndsAt)}</dd>
            ) : (
              <dd className="font-semibold text-emerald-300">Active · auto-renews {adverb(s.intervalMonths)}</dd>
            )}
            {s.status === "active" ? (
              <>
                <dt className="text-stone-300">Renews on</dt>
                <dd>{fmtDate(s.renewalDate)}</dd>
                <dt className="text-stone-300">Renewal amount</dt>
                <dd>{priceText} + tax</dd>
              </>
            ) : null}
          </dl>
        ) : null}
        {/* Cancel visible above the fold; 2 clicks to done (this + Click to cancel). */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {s?.status === "canceling" ? (
            <Link href={`/join/review?resume=1${s.planId ? `&plan=${s.planId}` : ""}`}
              className="rounded-lg border-2 border-emerald-400 px-4 py-2.5 text-center font-bold text-emerald-200 hover:bg-emerald-500/10">
              Resume membership
            </Link>
          ) : (
            <Link href={CANCEL_PATH} data-testid="cancel-entry"
              className="rounded-lg border-2 border-red-400 px-4 py-2.5 text-center font-bold text-red-200 hover:bg-red-500/10">
              Cancel membership
            </Link>
          )}
          <Link href={REFUNDS_PATH}
            className="rounded-lg border border-white/25 px-4 py-2.5 text-center font-semibold text-stone-100 hover:bg-white/5">
            Request refund
          </Link>
        </div>
        <p className="mt-3 text-sm text-stone-300">You can also cancel by emailing {PLATFORM.supportEmail}.</p>
      </section>
    </div>
  );
}
