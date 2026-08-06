"use client";

import Link from "next/link";
import { getRestaurant } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { cart, updateQty, cartTotal, clearCart } = useStore();
  const restaurant =
    cart.length > 0 ? getRestaurant(cart[0].restaurantId) : null;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/explore" className="mt-4 inline-block gp-btn gp-btn-primary">
          Explore restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Cart</h1>
      {restaurant && (
        <p className="text-muted">
          Ordering from <strong>{restaurant.name}</strong>
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {cart.map((line) => (
          <li
            key={line.menuItemId}
            className="gp-card flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="font-medium">{line.name}</p>
              <p className="text-sm text-muted">
                ${line.priceUsd.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="gp-btn gp-btn-secondary !px-3 !py-1"
                onClick={() => updateQty(line.menuItemId, line.qty - 1)}
              >
                −
              </button>
              <span className="w-6 text-center">{line.qty}</span>
              <button
                type="button"
                className="gp-btn gp-btn-secondary !px-3 !py-1"
                onClick={() => updateQty(line.menuItemId, line.qty + 1)}
              >
                +
              </button>
              <span className="ml-2 w-16 text-right font-semibold">
                ${(line.priceUsd * line.qty).toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 gp-card p-4">
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>Platform fee note</span>
          <span>~1% split later (Stripe)</span>
        </div>
        <div className="mt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/checkout" className="gp-btn gp-btn-primary">
            Checkout
          </Link>
          <button type="button" onClick={clearCart} className="gp-btn gp-btn-ghost text-sm">
            Clear cart
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Delivery via third-party or restaurant comes later — customer pays
          delivery then.
        </p>
      </div>
    </div>
  );
}
