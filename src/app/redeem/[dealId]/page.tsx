"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDeal } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function RedeemPage() {
  const params = useParams();
  const dealId = String(params.dealId);
  const found = getDeal(dealId);
  const { user, createRedeemCode, recordRedemption, rewardPoints } = useStore();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [staffOk, setStaffOk] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (!code || !expiresAt) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setCode(null);
      }
    }, 250);
    return () => clearInterval(t);
  }, [code, expiresAt]);

  if (!found) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Deal not found</h1>
        <Link href="/explore" className="mt-4 text-brand">
          Explore
        </Link>
      </div>
    );
  }

  const { deal, restaurant } = found;

  if (!user?.isMember) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Members only</h1>
        <p className="mt-2 text-muted">
          Browse free — redeem requires an active membership.
        </p>
        <Link href="/membership" className="mt-6 inline-block gp-btn gp-btn-primary">
          Get membership
        </Link>
      </div>
    );
  }

  function generate() {
    const r = createRedeemCode(dealId);
    setCode(r.code);
    setExpiresAt(r.expiresAt);
    setSecondsLeft(60);
    setStaffOk(false);
  }

  function staffConfirm() {
    if (!code) return;
    const result = recordRedemption(dealId, code);
    setPointsEarned(result.pointsEarned);
    setStaffOk(true);
    setCode(null);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-muted">{restaurant.name}</p>
      <h1 className="text-3xl font-bold">{deal.title}</h1>
      <p className="mt-2 text-muted">{deal.description}</p>

      {staffOk ? (
        <div className="mt-8 gp-card border-success/40 p-6 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-xl font-bold text-success">Redeemed</p>
          <p className="text-sm text-muted">
            Staff confirmed · logged for restaurant dashboard
          </p>
          {pointsEarned > 0 && (
            <p className="mt-3 text-sm font-semibold text-brand-gold">
              +{pointsEarned} reward points · balance {rewardPoints}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={`/restaurants/${restaurant.id}`}
              className="text-sm text-brand hover:underline"
            >
              Back to restaurant
            </Link>
            <Link href="/account" className="text-sm text-muted hover:text-white">
              View rewards →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 gp-card p-6 text-center">
          <p className="text-sm text-muted">
            Dynamic code refreshes every 60s — screenshots go stale.
          </p>
          {code ? (
            <>
              <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-2">
                <div
                  className="grid h-full w-full grid-cols-5 gap-0.5"
                  aria-hidden
                >
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        (parseInt(code, 10) + i * 7) % 3 === 0
                          ? "bg-black"
                          : "bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 font-mono text-3xl font-bold tracking-[0.3em]">
                {code}
              </p>
              <p className="mt-2 text-sm text-brand-gold">
                Expires in {secondsLeft}s
              </p>
              <p className="mt-4 text-xs text-muted">
                Show this to staff. They scan or type the code in their
                dashboard.
              </p>
              <button
                type="button"
                onClick={staffConfirm}
                className="gp-btn gp-btn-secondary mt-6 text-sm"
              >
                Simulate staff scan ✓
              </button>
              <button
                type="button"
                onClick={generate}
                className="mt-3 block w-full text-xs text-muted underline"
              >
                Refresh code
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={generate}
              className="gp-btn gp-btn-primary mt-6"
            >
              Show redeem code
            </button>
          )}
        </div>
      )}
    </div>
  );
}
