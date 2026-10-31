/**
 * GorditoPass legal DRAFT placeholders (spec: shared/gordito/legal/00-07).
 * Only items the site itself cannot answer stay as placeholders.
 * Prices/terms come from src/lib/pricing.ts (read-only, FSE-owned).
 */
export const GP_PLACEHOLDERS = {
  ENTITY_NAME: "[ENTITY NAME]",
  ENTITY_TYPE: "[ENTITY TYPE]",
  STATE: "[STATE]",
  MAILING_ADDRESS: "[MAILING ADDRESS]",
  PERIOD_END: "[PERIOD_END]", // TODO(FSE): from Stripe current_period_end
  CONFIRMATION_NUMBER: "[CONFIRMATION #]",
  TAX: "[TAX HANDLING]",
} as const;

export const DRAFT_COPY_VERSION = "draft-0.2";
export const CANCEL_PATH = "/account/membership/cancel";
export const REFUNDS_PATH = "/legal/refunds";

/**
 * Cancel timing + refund stance, taken from the EXISTING site copy (not new decisions):
 * - src/app/legal/terms/page.tsx §5 "Membership and payment": "After you cancel, access continues
 *   until the term you already paid for ends. We do not pro-rate unused days." and refunds
 *   "case by case ... not redeemed more than once and you ask within 7 days of purchase, we will
 *   generally refund ... except for a verified billing error".
 * - src/app/faq/page.tsx "What is your refund policy?" (consistent).
 */
export const SITE_STANCE = {
  cancelTiming: "Access continues through the end of the term you already paid for.",
  proration: "We do not pro-rate unused days.",
  refundShort:
    "no pro-rated refund for unused days; refunds within 7 days of purchase are generally given if you have not redeemed more than once",
  source: "Existing Terms of use §5 (/legal/terms) and FAQ “What is your refund policy?” (/faq)",
} as const;
