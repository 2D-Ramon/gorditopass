/**
 * Single source for every auto-renew disclosure and consent checkbox label.
 * Keyed by disclosure_key_version (sent in ConsentInput). ANY copy change = new key (@2), never edit in place.
 *
 * Tokens filled at render time (values from pricing.ts / PLATFORM / the date shown):
 *   {brand} {plan} {price} {every} {adverb} {renewal_date} {support_email}  (@2 templates do not use {support_email})
 * The filled string from fillDisclosure() is rendered verbatim as the only text node of
 * [data-testid="disclosure"], and the SAME string is passed to the hook as disclosureText, so
 * disclosure_text_sha256 = sha256(UTF-8 of that exact string). Whitespace: templates are single-line,
 * single-spaced, no leading/trailing space; no normalization is applied before hashing.
 */
import type { MembershipPlanId } from "@/lib/types";

export type DisclosureEntry = { text: string; checkboxLabel: string };

const CHECKOUT_TEXT =
  "{brand} {plan} Membership: {price} per {every}, plus applicable tax. You will be charged {price} today. Your membership automatically renews {adverb} on {renewal_date} and you will be charged {price} (plus tax) {adverb} until you cancel. You can cancel anytime online at Account > Membership > Cancel (/account/membership/cancel) or by emailing {support_email}. Canceling stops future renewals; access continues through the end of the term you already paid for. We do not pro-rate unused days; refunds within 7 days of purchase are generally given if you have not redeemed more than once. See the Terms of use and Refund Policy.";
const REMINDER = " We'll email you a reminder 15-45 days before each renewal.";
const CHECKOUT_LABEL =
  "I agree that my {brand} {plan} membership will automatically renew {adverb} at {price} (plus tax), starting {renewal_date}, until I cancel. I can cancel anytime online.";
const RESUME_TEXT =
  "{brand} {plan} Membership: {price} per {every}, plus applicable tax. If you resume, nothing is charged today. Your membership automatically renews {adverb} on {renewal_date} and you will be charged {price} (plus tax) {adverb} until you cancel. You can cancel anytime online at Account > Membership > Cancel (/account/membership/cancel) or by emailing {support_email}. We do not pro-rate unused days. See the Terms of use and Refund Policy.";

// @2 (2026-10-30): removed "or by emailing {support_email}"; cancel only via Account > Membership > Cancel.
const CHECKOUT_TEXT_2 = CHECKOUT_TEXT.replace(" or by emailing {support_email}", "");
const RESUME_TEXT_2 = RESUME_TEXT.replace(" or by emailing {support_email}", "");

const withReminder = (t: string) => t.replace(" See the Terms", REMINDER + " See the Terms");

/** @1 entries kept (superseded) so historical consent_events keys still resolve. */
export const DISCLOSURES = {
  "checkout.monthly@1": { text: CHECKOUT_TEXT, checkboxLabel: CHECKOUT_LABEL },
  "checkout.six_month@1": { text: CHECKOUT_TEXT, checkboxLabel: CHECKOUT_LABEL },
  "checkout.annual@1": { text: withReminder(CHECKOUT_TEXT), checkboxLabel: CHECKOUT_LABEL },
  "resume.monthly@1": { text: RESUME_TEXT, checkboxLabel: CHECKOUT_LABEL },
  "resume.six_month@1": { text: RESUME_TEXT, checkboxLabel: CHECKOUT_LABEL },
  "resume.annual@1": { text: withReminder(RESUME_TEXT), checkboxLabel: CHECKOUT_LABEL },
  "checkout.monthly@2": { text: CHECKOUT_TEXT_2, checkboxLabel: CHECKOUT_LABEL },
  "checkout.six_month@2": { text: CHECKOUT_TEXT_2, checkboxLabel: CHECKOUT_LABEL },
  "checkout.annual@2": { text: withReminder(CHECKOUT_TEXT_2), checkboxLabel: CHECKOUT_LABEL },
  "resume.monthly@2": { text: RESUME_TEXT_2, checkboxLabel: CHECKOUT_LABEL },
  "resume.six_month@2": { text: RESUME_TEXT_2, checkboxLabel: CHECKOUT_LABEL },
  "resume.annual@2": { text: withReminder(RESUME_TEXT_2), checkboxLabel: CHECKOUT_LABEL },
  "tos@1": { text: "", checkboxLabel: "I agree to the Terms of use and acknowledge the Privacy notice." },
  // FSE (server-required at checkout): prominent offers disclaimer, shown next to the pay button.
  "offers@1": { text: "Offers and partners change anytime. No guarantee.", checkboxLabel: "" },
} as const satisfies Record<string, DisclosureEntry>;

export type DisclosureKey = keyof typeof DISCLOSURES;

/** Current key per mode/plan. Bump here when a new @N entry is added. */
export function disclosureKey(mode: "checkout" | "resume", plan: MembershipPlanId): DisclosureKey {
  return `${mode}.${plan}@2` as DisclosureKey;
}

export const TOS_KEY: DisclosureKey = "tos@1";
export const OFFERS_KEY: DisclosureKey = "offers@1";

/**
 * FSE versioning: several @N of one family coexist; only the HIGHEST @N is accepted by
 * checkout/resume (server). Older ones stay for audit lookups. Adding @3 later is drop-in.
 */
export function keyFamily(key: string) {
  const i = key.lastIndexOf("@");
  return i < 0 ? { family: key, version: 0 } : { family: key.slice(0, i), version: Number(key.slice(i + 1)) || 0 };
}
export function currentKeyFor(family: string): DisclosureKey | null {
  let best: string | null = null;
  let bestV = -1;
  for (const k of Object.keys(DISCLOSURES)) {
    const { family: f, version } = keyFamily(k);
    if (f === family && version > bestV) { best = k; bestV = version; }
  }
  return best as DisclosureKey | null;
}

export function fillDisclosure(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}
