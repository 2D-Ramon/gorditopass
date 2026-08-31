"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDeal, getRestaurant } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Deal, DealType } from "@/lib/types";

function dealTypeLabel(type: DealType | string): string {
  return String(type).replace(/_/g, " ");
}

export default function RedeemPage() {
  const params = useParams();
  const dealId = String(params.dealId);
  const { user, rewardPoints, partnerDeals, hydrateFromServer } = useStore();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [staffOk, setStaffOk] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [lastSavings, setLastSavings] = useState<number | null>(null);
  const [liveErr, setLiveErr] = useState("");
  const [unlockedBadge, setUnlockedBadge] = useState("");

  const resolved = useMemo(() => {
    const partner = partnerDeals.find((d) => d.id === dealId);
    if (partner) {
      const restaurant = getRestaurant(partner.restaurantId);
      if (!restaurant) return null;
      const deal: Deal = {
        id: partner.id,
        restaurantId: partner.restaurantId,
        title: partner.title,
        description: partner.description,
        type: partner.type,
        value: partner.value,
        memberOnly: true,
        excludesAlcohol: true,
        active: partner.active,
      };
      return {
        deal,
        restaurant,
        regularPriceUsd: partner.regularPriceUsd,
        isPartner: true as const,
      };
    }
    const seed = getDeal(dealId);
    if (!seed) return null;
    return {
      deal: seed.deal,
      restaurant: seed.restaurant,
      regularPriceUsd: seed.restaurant.menu[0]?.priceUsd,
      isPartner: false as const,
    };
  }, [dealId, partnerDeals]);

  useEffect(() => {
    if (!code || !expiresAt || staffOk) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 250);
    return () => clearInterval(t);
  }, [code, expiresAt, staffOk]);

  useEffect(() => {
    if (!code || staffOk) return;
    let stop = false;
    const tick = async () => {
      const { authedFetch } = await import("@/lib/authed");
      const res = await authedFetch(`/api/redeem/status?code=${code}`);
      if (!res.ok || stop) return;
      const data = await res.json();
      if (data.status === "used") {
        const before = user?.rewardPoints ?? 0;
        const after = typeof data.points === "number" ? data.points : before;
        setPointsEarned(Math.max(0, after - before) || 10);
        const newly = Array.isArray(data.newBadges)
          ? data.newBadges
          : Array.isArray(data.badges)
            ? data.badges
            : [];
        if (newly.length) {
          setUnlockedBadge(
            newly
              .map((id: string) =>
                id === "first_bite"
                  ? "First Bite"
                  : id.replace(/_/g, " "),
              )
              .join(", "),
          );
        }
        setStaffOk(true);
        const me = await authedFetch("/api/me");
        if (me.ok) {
          const body = await me.json();
          if (body.user) {
            hydrateFromServer(body.user, body);
          }
        }
        return;
      }
      if (data.status === "expired") {
        setCode(null);
        setLiveErr("Code expired. Generate a new one.");
      }
    };
    const t = setInterval(() => void tick(), 1200);
    void tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [code, staffOk, hydrateFromServer, user?.rewardPoints]);

  if (!resolved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Deal not found</h1>
        <p className="mt-2 text-sm text-muted">
          This promo may still be pending approval, expired, or removed.
        </p>
        <Link href="/explore" className="mt-4 text-brand">
          Explore
        </Link>
      </div>
    );
  }

  const { deal, restaurant, regularPriceUsd } = resolved;

  // Live savings preview for display (especially % off total)
  const savingsPreview = useMemo(() => {
    const reg = regularPriceUsd && regularPriceUsd > 0 ? regularPriceUsd : 0;
    if (deal.type === "percent_off_total" || deal.type === "percent_off") {
      if (!deal.value || !reg) return null;
      return Math.round(reg * (deal.value / 100) * 100) / 100;
    }
    if (deal.type === "free_item" || deal.type === "bogo") {
      return reg || null;
    }
    if (deal.type === "fixed_price" && deal.value != null && reg) {
      return Math.max(0, Math.round((reg - deal.value) * 100) / 100);
    }
    return null;
  }, [deal, regularPriceUsd]);

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

  async function generate() {
    setLiveErr("");
    const { authedFetch } = await import("@/lib/authed");
    const res = await authedFetch("/api/redeem/start", {
      method: "POST",
      body: JSON.stringify({ dealId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLiveErr(data.error ?? "Could not issue a live code.");
      return;
    }
    setCode(data.code);
    setExpiresAt(new Date(data.expiresAt).getTime());
    setSecondsLeft(60);
    setStaffOk(false);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-muted">{restaurant.name}</p>
      <h1 className="text-3xl font-bold">{deal.title}</h1>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand">
        {dealTypeLabel(deal.type)}
        {deal.value != null &&
          (deal.type === "percent_off" || deal.type === "percent_off_total") &&
          ` · ${deal.value}%`}
      </p>
      <p className="mt-2 text-muted">{deal.description}</p>
      {deal.type === "percent_off_total" && (
        <p className="mt-2 rounded-md border border-brand/25 bg-brand/10 px-3 py-2 text-sm text-stone-300">
          <strong className="text-orange-200">% off total order</strong>
          {deal.value != null ? ` — ${deal.value}% off the full check.` : "."}
          {regularPriceUsd
            ? ` Typical order used for savings tracking: $${regularPriceUsd.toFixed(2)}.`
            : ""}
          {savingsPreview != null && (
            <span className="mt-1 block text-success">
              Est. member savings: ${savingsPreview.toFixed(2)}
            </span>
          )}
        </p>
      )}

      {staffOk ? (
        <div className="mt-8 gp-card border-success/40 p-6 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-xl font-bold text-success">Redeemed</p>
          <p className="text-sm text-muted">
            Staff confirmed · logged for restaurant dashboard
          </p>
          {lastSavings != null && lastSavings > 0 && (
            <p className="mt-2 text-sm font-medium text-success">
              Saved ${lastSavings.toFixed(2)}
              {deal.type === "percent_off_total" ? " on total order" : ""}
            </p>
          )}
          {pointsEarned > 0 && (
            <p className="mt-3 text-sm font-semibold text-brand-gold">
              +{pointsEarned} reward points · balance {rewardPoints}
            </p>
          )}
          {unlockedBadge && (
            <p className="mt-3 text-lg font-bold text-orange-200">
              🌮 Badge unlocked: {unlockedBadge}
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
                Waiting for staff… Keep this screen open. They confirm on
                /scan with the restaurant PIN. This code dies in 60 seconds
                and can be used once.
                {deal.type === "percent_off_total" && deal.value != null
                  ? ` Apply ${deal.value}% off the entire order on the POS.`
                  : ""}
              </p>
              <button
                type="button"
                onClick={generate}
                className="mt-6 block w-full text-xs text-muted underline"
              >
                Refresh code
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={generate}
                className="gp-btn gp-btn-primary mt-6"
              >
                Show redeem code
              </button>
              {liveErr && (
                <p className="mt-3 text-sm text-red-300">{liveErr}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
