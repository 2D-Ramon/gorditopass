/**
 * What restaurants (partners) may see about a member: first name, last initial,
 * and visit history. Never email, phone, address, or full last name.
 * Use these helpers on every server response that reaches a partner.
 */

/** "Maria" + "Lopez" -> "Maria L." ; no first name -> "Member". Never falls back to email. */
export function partnerSafeName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = (firstName ?? "").trim().split(/\s+/)[0] ?? "";
  if (!first || first.includes("@")) return "Member";
  const initial = partnerLastInitial(lastName);
  return initial ? `${first} ${initial}.` : first;
}

export function partnerFirstName(firstName?: string | null): string {
  const first = (firstName ?? "").trim().split(/\s+/)[0] ?? "";
  return !first || first.includes("@") ? "Member" : first;
}

export function partnerLastInitial(lastName?: string | null): string {
  const l = (lastName ?? "").trim();
  return l && !l.includes("@") ? l[0]!.toUpperCase() : "";
}

/**
 * Redact a stored free-text display name (e.g. legacy review author / message
 * from_name that may hold a full name or an email) to "First L.".
 */
export function redactDisplayName(name?: string | null): string {
  const raw = (name ?? "").trim();
  if (!raw || raw.includes("@") || /\d{3,}/.test(raw)) return "Member";
  const parts = raw.split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1]!.replace(/\.$/, "") : "";
  return partnerSafeName(parts[0], last);
}

/** Member-facing copy: what a restaurant sees about you. Keep in sync with server redaction above. */
export const RESTAURANT_SEES_COPY =
  "Restaurants you visit see your first name, last initial, and your visit history with them (which deals you redeemed and when). They do not get your contact info — no email, phone number, or address.";

/** Partner-facing copy: what you see about members. */
export const PARTNER_SEES_COPY =
  "You see each member's first name, last initial, and visit history at your restaurant. Members' contact info (email, phone, address) is never shared with restaurants.";
