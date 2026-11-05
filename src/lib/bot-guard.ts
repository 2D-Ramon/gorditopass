import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

const SEARCH_BOTS = new Set(["googlebot", "bingbot", "duckduckbot", "applebot"]);

const HEADERS = {
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "private, no-store",
};

export function catalogJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

/**
 * Reject scripted reads of the public catalog. Real browsers pass a Vercel
 * BotID challenge. Search crawlers that Vercel has verified still get through.
 * If the check itself errors, the read continues so a BotID outage does not
 * blank the menu.
 */
export async function blockAutomatedCatalogRead(): Promise<NextResponse | null> {
  try {
    const verification = await checkBotId({
      advancedOptions: { checkLevel: "basic" },
    });
    if (!verification.isBot) return null;
    const name =
      "verifiedBotName" in verification
        ? verification.verifiedBotName?.toLowerCase()
        : undefined;
    if (verification.isVerifiedBot && name && SEARCH_BOTS.has(name)) return null;
    return catalogJson({ error: "Access denied." }, 403);
  } catch {
    return null;
  }
}
