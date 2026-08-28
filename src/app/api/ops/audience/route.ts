import { NextResponse } from "next/server";
import { loadAudience } from "@/lib/ops-audience";
import type { CampaignAudience, CampaignChannel } from "@/lib/ops-types";
import { jsonError, withOps } from "../_util";

export async function GET(req: Request) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") as CampaignChannel | null;
  const audience = url.searchParams.get("audience") as CampaignAudience | null;
  if (!channel || !audience) return jsonError("channel and audience required.");
  try {
    const rows = await loadAudience(gate.supabase, channel, audience);
    return NextResponse.json({ count: rows.length });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Audience failed.", 500);
  }
}
