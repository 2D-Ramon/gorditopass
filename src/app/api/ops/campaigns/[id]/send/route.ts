import { NextResponse } from "next/server";
import { loadAudience } from "@/lib/ops-audience";
import type { CampaignAudience, CampaignChannel } from "@/lib/ops-types";
import { jsonError, withOps } from "../../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const { data: campaign, error: loadErr } = await gate.supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (loadErr || !campaign) return jsonError("Campaign not found.", 404);

  let audience;
  try {
    audience = await loadAudience(
      gate.supabase,
      campaign.channel as CampaignChannel,
      campaign.audience as CampaignAudience,
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not build audience.", 500);
  }

  await gate.supabase.from("campaign_recipients").delete().eq("campaign_id", id);
  if (audience.length) {
    const { error: recErr } = await gate.supabase.from("campaign_recipients").insert(
      audience.map((row) => ({
        campaign_id: id,
        member_id: row.member_id,
        business_id: row.business_id,
        email: row.email,
        phone: row.phone,
        name: row.name,
        status: "queued",
      })),
    );
    if (recErr) return jsonError(recErr.message, 500);
  }

  const { data, error } = await gate.supabase
    .from("campaigns")
    .update({
      status: "queued",
      recipient_count: audience.length,
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({
    campaign: data,
    note: "Audience saved in GorditoPass. Email/SMS delivery pipes (Resend / Twilio) connect next so these actually send.",
  });
}
