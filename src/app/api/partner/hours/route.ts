import { NextResponse } from "next/server";
import { requireManagers, requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const body = (await req.json().catch(() => null)) as {
    hours?: string;
    openStatus?: string;
    typicalWeeklyTickets?: number | null;
    googleMapsUrl?: string;
  } | null;
  const openStatus = ["open", "closed", "hours"].includes(String(body?.openStatus))
    ? String(body?.openStatus)
    : "hours";
  const tickets =
    body?.typicalWeeklyTickets == null || body.typicalWeeklyTickets === ("" as unknown)
      ? null
      : Math.max(0, Math.round(Number(body.typicalWeeklyTickets)));
  const sb = createOpsClient();
  const { error: err } = await sb
    .from("listings")
    .update({
      hours: String(body?.hours ?? "").trim(),
      open_status: openStatus,
      typical_weekly_tickets: Number.isFinite(tickets as number) ? tickets : null,
      google_maps_url: String(body?.googleMapsUrl ?? "").trim() || null,
    })
    .eq("id", profile.restaurant_id);
  if (err) {
    return NextResponse.json(
      { error: "Could not save hours. Run partner_ops.sql in Supabase." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
