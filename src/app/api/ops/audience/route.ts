import { NextResponse } from "next/server";
import { loadAudience, type CampaignSpec, type CampaignTarget } from "@/lib/ops-audience";
import type { CampaignAudience, CampaignChannel } from "@/lib/ops-types";
import { jsonError, withOps } from "../_util";

export async function GET(req: Request) {
  const gate = await withOps("can_campaigns");
  if (!gate.ok) return gate.response;
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") as CampaignChannel | null;
  const target = url.searchParams.get("target") as CampaignTarget | null;
  const audience = url.searchParams.get("audience") as CampaignAudience | null;
  if (!channel || (!target && !audience)) return jsonError("channel and audience required.");
  const spec: CampaignSpec | undefined = target
    ? {
        target,
        city: url.searchParams.get("city") ?? "",
        restaurantId: url.searchParams.get("restaurantId") ?? "",
        zip: url.searchParams.get("zip") ?? "",
        cuisine: url.searchParams.get("cuisine") ?? "",
        sendOn: "",
        subject: "",
      }
    : undefined;
  try {
    const rows = await loadAudience(
      gate.supabase,
      channel,
      audience ?? "all_members",
      spec,
    );
    return NextResponse.json({ count: rows.length });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Audience failed.", 500);
  }
}
