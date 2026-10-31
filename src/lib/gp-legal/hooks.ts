/**
 * GorditoPass checkout consent + cancel hooks, wired to the real back end.
 * All calls send Authorization: Bearer <Supabase session JWT> via authedFetch.
 *
 * Consent rides INSIDE the checkout request (POST /api/membership/checkout body.consent):
 * the server writes consent_events before it creates the Stripe Checkout Session.
 * logCheckoutConsent() therefore builds + validates the ConsentInput locally and returns a
 * handle; createCheckoutSession(handle, planId) sends it with the checkout request.
 */

import { authedFetch, getAccessToken } from "@/lib/authed";
import type { ConsentInput } from "@/lib/consent";
import type { MembershipPlanId } from "@/lib/types";

export type ConsentPayload = {
  planId: MembershipPlanId;
  disclosureKeyVersion: string; // checkout.disclosure_full version
  /** Ignored if disclosureText is available: the hook hashes the exact text shown. */
  disclosureTextSha256?: string;
  /** Exact disclosure text shown. If omitted, the hook reads [data-testid="disclosure"] from the page. */
  disclosureText?: string;
  checkboxLabelText: string; // exact auto-renew label shown
  tosLabelText: string;
  /** DISCLOSURES key of the ToS checkbox label shown (default "tos@1"). */
  tosKeyVersion?: string;
  /** DISCLOSURES key of the offers disclaimer rendered on the page (OFFERS_KEY). Required at checkout. */
  offersKeyVersion?: string;
  priceCents: number; // display only; server prices from pricing.ts / Stripe
  currency: "usd";
  intervalMonths: number;
  renewalDateShown: string;
  pageUrl: string;
  locale: string;
  stateOfResidence?: string;
};

export type ConsentResult = { consentId: string };
export type CheckoutResult = { checkoutUrl: string };
export type CancelResult = { confirmationNumber: string; accessEndsAt: string; alreadyCanceled?: boolean };

/** Thrown for any failed call. `status === 401` means the user must sign in again. */
export class GpApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new GpApiError("Sign in required.", 401);
  const res = await authedFetch(path, init, token);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new GpApiError(String(json.error ?? `Request failed (${res.status})`), res.status, json.code as string | undefined);
  }
  return json as T;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function localYmd(v: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shownDisclosureText(p: ConsentPayload): string {
  if (p.disclosureText?.trim()) return p.disclosureText;
  if (typeof document !== "undefined") {
    const el = document.querySelector('[data-testid="disclosure"]');
    const t = (el as HTMLElement | null)?.innerText ?? el?.textContent ?? "";
    if (t.trim()) return t;
  }
  throw new GpApiError("Disclosure text not found on the page.", 400, "disclosure_missing");
}

/** Builds the server ConsentInput (spec §3) from what the user saw. */
export async function buildConsentInput(p: ConsentPayload): Promise<ConsentInput> {
  if (!p.disclosureKeyVersion?.trim() || !p.checkboxLabelText?.trim()) {
    throw new GpApiError("Missing disclosure details.", 400, "consent_invalid");
  }
  return {
    disclosure_key_version: p.disclosureKeyVersion,
    disclosure_text_sha256: await sha256Hex(shownDisclosureText(p)),
    checkbox_label_text: p.checkboxLabelText,
    checkbox_checked: true,
    tos_checked: true,
    page_url: p.pageUrl,
    // Local calendar date the user saw (the server rebuilds the canonical text from it).
    renewal_date_shown: localYmd(p.renewalDateShown),
    tos_key_version: p.tosKeyVersion ?? "tos@1",
    offers_key_version: p.offersKeyVersion ?? null,
    locale: p.locale,
    state_of_residence: p.stateOfResidence ?? null,
  };
}

const pendingConsent = new Map<string, { planId: MembershipPlanId; input: ConsentInput}>();

/** Call only after BOTH boxes are checked. Returns a local handle; nothing is sent yet. */
export async function logCheckoutConsent(p: ConsentPayload): Promise<ConsentResult> {
  const input = await buildConsentInput(p);
  const consentId = crypto.randomUUID();
  pendingConsent.set(consentId, { planId: p.planId, input });
  return { consentId };
}

/** POST /api/membership/checkout with the consent; server records consent, then creates the session. */
export async function createCheckoutSession(consentId: string, planId: MembershipPlanId): Promise<CheckoutResult> {
  const held = pendingConsent.get(consentId);
  if (!held || held.planId !== planId) {
    throw new GpApiError("Please review and agree to the terms again.", 422, "consent_required");
  }
  const res = await call<{ url?: string; comp?: boolean }>("/api/membership/checkout", {
    method: "POST",
    body: JSON.stringify({
      planId,
      seats: 1,
      consent: held.input,
    }),
  });
  pendingConsent.delete(consentId);
  if (!res.url) throw new GpApiError("Checkout did not return a payment page.", 502);
  return { checkoutUrl: res.url };
}

/** POST /api/membership/cancel. Safe to retry (returns the same confirmation). */
export async function cancelMembership(opts: { retentionOfferShown: boolean; retentionOfferAccepted?: boolean }): Promise<CancelResult> {
  const r = await call<{ confirmation_number: string; access_ends_at: string; already_canceled: boolean }>(
    "/api/membership/cancel",
    {
      method: "POST",
      body: JSON.stringify({
        retention_offer_shown: opts.retentionOfferShown,
        retention_offer_accepted: Boolean(opts.retentionOfferAccepted),
      }),
    },
  );
  return { confirmationNumber: r.confirmation_number, accessEndsAt: r.access_ends_at, alreadyCanceled: r.already_canceled };
}

/** POST /api/membership/resume. Requires fresh consent captured on the review screen. */
export async function resumeMembership(consent: ConsentPayload): Promise<{ ok: boolean; renewsAt: string | null }> {
  const input = await buildConsentInput(consent);
  const r = await call<{ resumed: boolean; renews_at: string | null }>("/api/membership/resume", {
    method: "POST",
    body: JSON.stringify({ consent: input }),
  });
  return { ok: r.resumed, renewsAt: r.renews_at };
}

export type MembershipSummary = {
  status: "active" | "canceling" | "none";
  planId: MembershipPlanId | null;
  planName: string | null;
  priceUsd: number | null; // pricing.ts display value
  intervalMonths: number | null;
  seats: number;
  renewalDate: string | null; // ISO
  accessEndsAt: string | null; // ISO, when canceling
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
};

/** GET /api/membership/status?me=1 */
export async function getMembershipSummary(): Promise<MembershipSummary> {
  const r = await call<{
    membership: {
      status: MembershipSummary["status"];
      plan_id: MembershipPlanId | null;
      plan_name: string | null;
      price_usd: number | null;
      interval_months: number | null;
      seats: number;
      renews_at: string | null;
      cancel_at_period_end: boolean;
      access_ends_at: string | null;
      has_subscription: boolean;
    };
  }>("/api/membership/status?me=1");
  const m = r.membership;
  return {
    status: m.status,
    planId: m.plan_id,
    planName: m.plan_name,
    priceUsd: m.price_usd,
    intervalMonths: m.interval_months,
    seats: m.seats,
    renewalDate: m.renews_at,
    accessEndsAt: m.access_ends_at,
    cancelAtPeriodEnd: m.cancel_at_period_end,
    hasSubscription: m.has_subscription,
  };
}
