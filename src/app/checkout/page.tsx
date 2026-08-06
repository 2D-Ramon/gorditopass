"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const { cart, cartTotal, checkoutDemo, user, signInDemo } = useStore();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<{ orderId: string; total: number } | null>(
    null,
  );

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

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!user) signInDemo("diner");
          setOrder(checkoutDemo());
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

        <div className="gp-card p-4 text-sm">
          <div className="flex justify-between">
            <span>{cart.length} line items</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <p className="mt-2 text-xs text-muted">
            Card: demo only — no real charge. Future: Stripe test mode.
          </p>
        </div>

        <button type="submit" className="gp-btn gp-btn-primary w-full">
          Place order · ${cartTotal.toFixed(2)}
        </button>
      </form>
    </div>
  );
}
