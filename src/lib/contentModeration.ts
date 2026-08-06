/**
 * Demo “AI” content check for partner submissions.
 * Live app would call a real moderation model; here we flag
 * political / inappropriate keyword patterns for admin review first.
 */

export type ContentKind = "deal" | "menu" | "event" | "job";

export interface AiModerationResult {
  flagged: boolean;
  /** Always require human review when true */
  requiresReview: boolean;
  reasons: string[];
  score: number;
}

const POLITICAL = [
  "democrat",
  "republican",
  "vote for",
  "election",
  "maga",
  "biden",
  "trump",
  "congress",
  "senate",
  "political",
  "campaign",
  "ballot",
  "partisan",
  "left wing",
  "right wing",
  "liberal",
  "conservative party",
];

const INAPPROPRIATE = [
  "nude",
  "naked",
  "sex ",
  "porn",
  "xxx",
  "onlyfans",
  "stripper",
  "escort",
  "drug deal",
  "cocaine",
  "heroin",
  "meth",
  "kill yourself",
  "nazi",
  "hate speech",
  "slur",
  "racist",
  "homophobic",
];

function scan(text: string, list: string[]): string[] {
  const lower = text.toLowerCase();
  return list.filter((w) => lower.includes(w));
}

/** Run moderation over title, description, and any free text fields. */
export function moderatePartnerContent(fields: {
  title?: string;
  description?: string;
  extra?: string;
}): AiModerationResult {
  const blob = [fields.title, fields.description, fields.extra]
    .filter(Boolean)
    .join(" \n ");
  const political = scan(blob, POLITICAL);
  const bad = scan(blob, INAPPROPRIATE);
  const reasons: string[] = [];
  if (political.length) {
    reasons.push(`Possible political content (${political.slice(0, 3).join(", ")})`);
  }
  if (bad.length) {
    reasons.push(`Possible inappropriate content (${bad.slice(0, 3).join(", ")})`);
  }
  const flagged = reasons.length > 0;
  return {
    flagged,
    requiresReview: flagged,
    reasons,
    score: flagged ? Math.min(99, 40 + reasons.length * 20) : 5,
  };
}

export type AutoApproveKey = ContentKind;

export interface RestaurantAutoApprove {
  restaurantId: string;
  deal: boolean;
  menu: boolean;
  event: boolean;
  job: boolean;
}

export function defaultAutoApprove(
  restaurantId: string,
): RestaurantAutoApprove {
  return {
    restaurantId,
    deal: false,
    menu: false,
    event: false,
    job: false,
  };
}
