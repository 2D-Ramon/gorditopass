"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getRestaurant } from "@/lib/data";
import { MEMBERSHIP_PLANS, monthlyRate } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const {
    cart,
    cartTotal,
    checkoutDemo,
    user,
    partnerDeals,
  } = useStore();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [note, setNote] = useState("");
  const [addMembership, setAddMembership] = useState(false);
  const [planId, setPlanId] = useState<"monthly" | "six_month" | "annual">(
    "monthly",
  );
  const [order, setOrder] = useState<{
    orderId: string;
    total: number;
    membershipAdded?: boolean;
  } | null>(null);

  const isGuest = !user || (user.role === "diner" && !user.isMember);
  const isLoggedMember = Boolean(user?.isMember);

  const restaurantId = cart[0]?.restaurantId;
  const restaurant = restaurantId ? getRestaurant(restaurantId) : undefined;

  const memberOffer = useMemo(() => {
    if (!restaurantId) return null;
    const partner = partnerDeals.find(
      (d) =>
        d.restaurantId === restaurantId &&
        (d.status ?? "pending") === "approved" &&
        d.active,
    );
    if (partner) {
      const reg = partner.regularPriceUsd ?? 0;
      let savings = 0;
      if (partner.type === "free_item" || partner.type === "bogo") savings = reg;
      else if (
        (partner.type === "percent_off" ||
          partner.type === "percent_off_total") &&
        partner.value
      )
        savings = (reg * partner.value) / 100;
      else if (partner.type === "fixed_price" && partner.value != null)
        savings = Math.max(0, reg - partner.value);
      return {
        title: partner.title,
        description: partner.description,
        savingsEst: savings,
        image: partner.imageDataUrls?.[0],
      };
    }
    const seed = restaurant?.deals.find((d) => d.active);
    if (!seed) return null;
    const menuPrice = restaurant?.menu[0]?.priceUsd ?? 10;
    let savings = menuPrice * 0.2;
    if (seed.type === "free_item" || seed.type === "bogo") savings = menuPrice;
    else if (
      (seed.type === "percent_off" || seed.type === "percent_off_total") &&
      seed.value
    )
      savings = (menuPrice * seed.value) / 100;
    return {
      title: seed.title,
      description: seed.description,
      savingsEst: savings,
      image: undefined as string | undefined,
    };
  }, [restaurantId, restaurant, partnerDeals]);

  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId)!;
  const membershipFee = addMembership && !isLoggedMember ? plan.priceUsd : 0;
  const grandTotal = cartTotal + membershipFee;

  if (cart.length === 0 && !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to checkout</h1>
        <Link href="/explore" className="mt-4 inline-block text-brand">
          Browse menu
        </Link>
      </div>
    );
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">Order placed (demo)</h1>
        <p className="mt-2 text-muted">
          Order <strong>{order.orderId}</strong> · $
          {order.total.toFixed(2)}
        </p>
        {order.membershipAdded && (
          <p className="mt-2 text-sm text-success">
            Membership added at checkout — welcome aboard!
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          Stripe / your processor will power real charges. Pickup for now;
          delivery later.
        </p>
        <Link href="/explore" className="mt-6 inline-block gp-btn gp-btn-primary">
          Back to explore
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="text-sm text-muted">
        Full cart + checkout flow (demo payment).
      </p>

      {isGuest && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-amber-100">
            You’re checking out as a guest
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            Guests can order online. Sign in or join to save favorites, follow
            kitchens, redeem deals, and earn rewards.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block text-xs font-medium text-brand underline"
          >
            Already a member? Sign in
          </Link>
        </div>
      )}

      {isGuest && memberOffer && (
        <div className="mt-4 gp-card gp-card-static p-4">
          <p className="gp-section-label">Member offer at this spot</p>
          {memberOffer.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={memberOffer.image}
              alt=""
              className="mt-2 h-28 w-full rounded-md object-cover"
            />
          )}
          <p className="mt-2 font-semibold">{memberOffer.title}</p>
          <p className="text-xs text-muted">{memberOffer.description}</p>
          {memberOffer.savingsEst > 0 && (
            <p className="mt-2 text-sm font-semibold text-success">
              Est. member savings: ~${memberOffer.savingsEst.toFixed(2)} on this
              deal
            </p>
          )}
          <p className="mt-1 text-xs text-muted">
            Membership unlocks in-store redeem + this offer and more.
          </p>
        </div>
      )}

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // Guest checkout allowed without forced demo sign-in
          const result = checkoutDemo();
          setOrder({
            ...result,
            total: grandTotal,
            membershipAdded: addMembership && !isLoggedMember,
          });
        }}
      >
        <label className="block text-sm">
          Name
          <input
            required
            className="gp-input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {isGuest && (
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              className="gp-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </label>
        )}
        <label className="block text-sm">
          Phone
          <input
            required
            className="gp-input mt-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(214) 555-0100"
          />
        </label>
        <label className="block text-sm">
          Order note
          <textarea
            className="gp-input mt-1 min-h-[80px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="No onions, extra napkins…"
          />
        </label>

        {isGuest && (
          <div className="rounded-lg border border-brand/30 bg-brand/10 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={addMembership}
                onChange={(e) => setAddMembership(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-orange-100">
                  Add membership at checkout
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Unlock deals, rewards, passports, and feed posting. Plans from
                  ${monthlyRate(MEMBERSHIP_PLANS[2])}/mo effective.
                </span>
              </span>
            </label>
            {addMembership && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {MEMBERSHIP_PLANS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`rounded-lg border p-2 text-left text-xs ${
                      planId === p.id
                        ? "border-brand bg-brand/15"
                        : "border-border"
                    }`}
                  >
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-brand">${p.priceUsd}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="gp-card p-4 text-sm">
          <div className="flex justify-between">
            <span>Food ({cart.length} lines)</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          {membershipFee > 0 && (
            <div className="mt-1 flex justify-between text-brand">
              <span>Membership ({plan.name})</span>
              <strong>${membershipFee.toFixed(2)}</strong>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span>Total</span>
            <strong>${grandTotal.toFixed(2)}</strong>
          </div>
          <p className="mt-2 text-xs text-muted">
            Card: demo only — no real charge. Future: Stripe test mode.
          </p>
        </div>

        <button type="submit" className="gp-btn gp-btn-primary w-full">
          Place order · ${grandTotal.toFixed(2)}
        </button>
      </form>
    </div>
  );
}
