/**
 * Same-origin return path for ?next=. Only "/path" style values are accepted;
 * protocol-relative ("//evil"), backslash tricks, schemes and control chars are rejected.
 */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  let v = raw.trim();
  try {
    v = decodeURIComponent(v);
  } catch {
    return fallback;
  }
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback;
  try {
    const u = new URL(v, "https://gp.invalid");
    if (u.origin !== "https://gp.invalid") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

/** Reads ?next= from the current URL (client only). */
export function currentNext(fallback = "/account"): string {
  if (typeof window === "undefined") return fallback;
  return safeNext(new URLSearchParams(window.location.search).get("next"), fallback);
}
