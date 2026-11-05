/**
 * Fields that must never leave the server on a public listing payload:
 * owner/staff contact details. Anything that looks like an email, phone, or
 * contact field is dropped too, so a future column can't leak by default.
 */
const PRIVATE_KEYS = new Set(["owner_email", "owner_phone", "owner_name"]);
const PRIVATE_PATTERN = /(email|phone|contact)/i;

export function stripPrivateListingFields<T extends Record<string, unknown>>(
  row: T,
): Omit<T, "owner_email"> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (PRIVATE_KEYS.has(k) || PRIVATE_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out as Omit<T, "owner_email">;
}
