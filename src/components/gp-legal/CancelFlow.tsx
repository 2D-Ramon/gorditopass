"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DraftBanner } from "./DraftBanner";
import { GP_PLACEHOLDERS as P, REFUNDS_PATH, SITE_STANCE } from "@/lib/gp-legal/placeholders";
import { PLATFORM } from "@/lib/pricing";
import { cancelMembership, getMembershipSummary, type CancelResult, type MembershipSummary } from "@/lib/gp-legal/hooks";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return P.PERIOD_END;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? P.PERIOD_END : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function StanceNote() {
  return (
    <p className="mt-3 rounded border border-dashed border-fuchsia-400/60 bg-fuchsia-500/10 p-2 text-xs text-fuchsia-100" data-testid="stance-source">
      DRAFT note: cancel timing and refund wording taken from {SITE_STANCE.source}. Attorney to confirm.
    </p>
  );
}

export function CancelFlow() {
  const [done, setDone] = useState<CancelResult | null>(null);
  const [busy, setBusy] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<MembershipSummary | null>(null);
  useEffect(() => {
    getMembershipSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  async function onCancel() {
    setBusy(true);
    setErr(null);
    try {
      setDone(await cancelMembership({ retentionOfferShown: false }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cancel failed. Please try again or email support.");
    } finally {
      setBusy(false);
    }
  }

  const refundLine = (
    <>
      {SITE_STANCE.proration} See the <Link href={REFUNDS_PATH} className="text-brand underline">Refund Policy</Link>.
    </>
  );

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
        <DraftBanner />
        <section data-testid="cancel-done" className="rounded-xl border border-emerald-400/50 bg-card p-4 sm:p-6">
          <h1 className="text-2xl font-bold">Your membership is canceled.</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-100">
            You won&apos;t be charged again. Access ends <strong>{fmtDate(done.accessEndsAt)}</strong>.
            Confirmation #<strong className="font-mono">{done.confirmationNumber}</strong>. {refundLine}
          </p>
          <p className="mt-2 text-sm text-stone-300">We&apos;ve emailed a confirmation. Questions: {PLATFORM.supportEmail}.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href={`/join/review?resume=1${summary?.planId ? `&plan=${summary.planId}` : ""}`}
              className="rounded-lg border border-white/25 px-4 py-2.5 text-center font-semibold">
              Changed your mind? Resume before {fmtDate(done.accessEndsAt)}
            </Link>
            <Link href="/account/membership" className="rounded-lg px-4 py-2.5 text-center text-brand underline">Back to membership</Link>
          </div>
          <StanceNote />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <DraftBanner />
      <section data-testid="cancel-confirm" className="rounded-xl border border-white/15 bg-card p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Cancel your {PLATFORM.name} membership</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-100">
          Your membership will not renew. You keep access until <strong>{fmtDate(summary?.renewalDate ?? summary?.accessEndsAt)}</strong>, the end of the term you
          already paid for. {refundLine}
        </p>
        <button type="button" data-testid="click-to-cancel" onClick={onCancel} disabled={busy}
          className="mt-4 w-full rounded-lg bg-red-500 px-4 py-3 text-base font-bold text-white hover:bg-red-600 disabled:opacity-60">
          Click to cancel
        </button>
        {err ? <p role="alert" className="mt-2 text-sm text-red-200">{err}</p> : null}
        <p className="mt-3 text-sm text-stone-300">
          <Link href="/account/membership" className="underline">Keep my membership</Link>
        </p>
        <StanceNote />
      </section>
    </div>
  );
}
