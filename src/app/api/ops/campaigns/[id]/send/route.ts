import { NextResponse } from "next/server";
import { loadAudience } from "@/lib/ops-audience";
import type { CampaignAudience, CampaignChannel } from "@/lib/ops-types";
import { jsonError, withOps } from "../../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_campaigns");
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

  const resendKey = process.env.RESEND_API_KEY;
  let sent = 0;
  if (resendKey && campaign.channel === "email") {
    const from =
      process.env.RESEND_FROM || "GorditoPass <hello@gorditopass.local>";
    for (const row of audience) {
      if (!row.email) continue;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: row.email,
          subject: campaign.subject || campaign.name,
          text: campaign.body,
        }),
      });
      if (r.ok) sent += 1;
    }
    if (sent > 0) {
      await gate.supabase
        .from("campaigns")
        .update({ status: "sent" })
        .eq("id", id);
    }
  }

  return NextResponse.json({
    campaign: data,
    note: resendKey
      ? `Queued ${audience.length}. Emails sent: ${sent}. SMS needs Twilio later.`
      : "Audience saved. Add RESEND_API_KEY to actually send email.",
  });
}
