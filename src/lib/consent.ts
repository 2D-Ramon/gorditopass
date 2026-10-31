/** Client-supplied consent evidence (spec §3). Server adds user, time, ip, UA, price. */
export type ConsentInput = {
  disclosure_key_version: string;
  disclosure_text_sha256: string;
  checkbox_label_text: string;
  checkbox_checked: true;
  page_url?: string | null;
  renewal_date_shown?: string | null;
  locale?: string | null;
  state_of_residence?: string | null;
  screenshot_ref?: string | null;
  tos_checked?: boolean;
};

const str = (v: unknown, max = 2000) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export function parseConsent(raw: unknown):
  | { ok: true; value: Omit<ConsentInput, "tos_checked" | "checkbox_checked"> & { checkbox_checked: true } }
  | { ok: false; error: string } {
  const c = (raw ?? {}) as Record<string, unknown>;
  if (c.checkbox_checked !== true) return { ok: false, error: "Please agree to automatic renewal to continue." };
  if (c.tos_checked === false) return { ok: false, error: "Please accept the Terms to continue." };
  const version = str(c.disclosure_key_version, 200);
  const sha = str(c.disclosure_text_sha256, 128);
  const label = str(c.checkbox_label_text);
  if (!version || !sha || !label) return { ok: false, error: "Missing disclosure details." };
  if (!/^[0-9a-f]{64}$/i.test(sha)) return { ok: false, error: "Bad disclosure hash." };
  const renewal = str(c.renewal_date_shown, 40);
  return {
    ok: true,
    value: {
      disclosure_key_version: version,
      disclosure_text_sha256: sha.toLowerCase(),
      checkbox_label_text: label,
      checkbox_checked: true,
      page_url: str(c.page_url, 1000),
      renewal_date_shown: renewal && !isNaN(Date.parse(renewal)) ? renewal.slice(0, 10) : null,
      locale: str(c.locale, 20),
      state_of_residence: str(c.state_of_residence, 40),
      screenshot_ref: str(c.screenshot_ref, 500),
    },
  };
}
