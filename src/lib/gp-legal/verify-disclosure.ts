/**
 * Server-side check of the disclosure the member agreed to (checkout + resume).
 * Rebuilds the canonical text from DISCLOSURES[key] + renewal_date_shown + the CURRENT plan price
 * in pricing.ts, then compares SHA-256. Price is not part of the key: a price change changes the
 * filled text and therefore the hash. Bump @version only when wording changes.
 */
import { createHash } from "node:crypto";
import { PLATFORM } from "@/lib/pricing";
import type { MembershipPlanId } from "@/lib/types";
import { DISCLOSURES, currentKeyFor, fillDisclosure, keyFamily } from "./disclosures";
import { planDisclosure } from "./plans";

export type DisclosureCheck =
  | { ok: true }
  | { ok: false; code: "disclosure_unknown" | "disclosure_outdated" | "disclosure_mismatch" | "tos_unknown" | "offers_required"; error: string };

const RELOAD = "These terms were updated. Please reload the page and agree again.";

/** Known AND the current (highest) version of its family. */
export function isCurrentKey(key: string | null | undefined): key is string {
  if (!key || !(key in DISCLOSURES)) return false;
  return currentKeyFor(keyFamily(key).family) === key;
}

const KEY_RE = /^(checkout|resume)\.(monthly|six_month|annual)@\d+$/;

/** "2027-10-30" -> "October 30, 2027" (same format as planDisclosure().renewalDateText). */
export function renewalDateText(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function canonicalDisclosure(key: string, planId: MembershipPlanId, renewalYmd: string) {
  const entry = (DISCLOSURES as Record<string, { text: string; checkboxLabel: string }>)[key];
  if (!entry) return null;
  const d = planDisclosure(planId);
  const vars = {
    brand: PLATFORM.name, plan: d.plan.name, price: d.price, every: d.every, adverb: d.adverb,
    renewal_date: renewalDateText(renewalYmd), support_email: PLATFORM.supportEmail,
  };
  return { text: fillDisclosure(entry.text, vars), label: fillDisclosure(entry.checkboxLabel, vars) };
}

export const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

export function verifyDisclosure(
  c: { disclosure_key_version: string; disclosure_text_sha256: string; checkbox_label_text: string; renewal_date_shown?: string | null; tos_key_version?: string | null; offers_key_version?: string | null },
  mode: "checkout" | "resume",
  planId: string | null,
): DisclosureCheck {
  const m = KEY_RE.exec(c.disclosure_key_version);
  if (!m || !(c.disclosure_key_version in DISCLOSURES) || m[1] !== mode || (planId && m[2] !== planId)) {
    return { ok: false, code: "disclosure_unknown", error: RELOAD };
  }
  if (!isCurrentKey(c.disclosure_key_version)) return { ok: false, code: "disclosure_outdated", error: RELOAD };
  const tosKey = c.tos_key_version || "tos@1";
  if (!/^tos@\d+$/.test(tosKey) || !isCurrentKey(tosKey)) {
    return { ok: false, code: "tos_unknown", error: RELOAD };
  }
  if (mode === "checkout" && (!/^offers@\d+$/.test(c.offers_key_version ?? "") || !isCurrentKey(c.offers_key_version))) {
    return { ok: false, code: "offers_required", error: RELOAD };
  }
  if (!c.renewal_date_shown) {
    return { ok: false, code: "disclosure_mismatch", error: "The terms shown don't match. Please reload the page and agree again." };
  }
  const canon = canonicalDisclosure(c.disclosure_key_version, m[2] as MembershipPlanId, c.renewal_date_shown);
  if (!canon || sha256(canon.text) !== c.disclosure_text_sha256.toLowerCase() || canon.label !== c.checkbox_label_text) {
    return { ok: false, code: "disclosure_mismatch", error: "The terms or price shown have changed. Please reload the page and agree again." };
  }
  return { ok: true };
}

/** Optional SMS opt-in from checkout. Returns null when not opted in; throws nothing. */
export function parseSmsOptIn(raw: unknown): { phone: string; key: string; label: string } | { error: string } | null {
  const r = (raw ?? null) as { checked?: unknown; phone?: unknown; consent_key_version?: unknown; label_text?: unknown } | null;
  if (!r || r.checked !== true) return null;
  const digits = String(r.phone ?? "").replace(/[^\d+]/g, "");
  const e164 = /^\+\d{10,15}$/.test(digits) ? digits : /^\d{10}$/.test(digits) ? `+1${digits}` : /^1\d{10}$/.test(digits) ? `+${digits}` : null;
  if (!e164) return { error: "Enter a valid mobile number for texts, or leave the text option unchecked." };
  const key = String(r.consent_key_version ?? "");
  if (!/^sms@\d+$/.test(key) || !isCurrentKey(key)) return { error: RELOAD };
  const label = fillDisclosure((DISCLOSURES as Record<string, { checkboxLabel: string }>)[key].checkboxLabel, { brand: PLATFORM.name });
  if (typeof r.label_text === "string" && r.label_text !== label) return { error: RELOAD };
  return { phone: e164, key, label };
}
