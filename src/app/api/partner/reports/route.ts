import { NextResponse } from "next/server";
import { requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const body = (await req.json().catch(() => null)) as {
    code?: string;
    memberName?: string;
    note?: string;
    redeemId?: string;
  } | null;
  const note = String(body?.note ?? "").trim();
  if (note.length < 4) {
    return NextResponse.json({ error: "Say what looked wrong." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { error: err } = await sb.from("redeem_reports").insert({
    restaurant_id: profile.restaurant_id,
    redeem_id: body?.redeemId || null,
    code: String(body?.code ?? "").replace(/\D/g, "").slice(0, 6) || null,
    member_name: String(body?.memberName ?? "").trim() || null,
    note,
    reported_by: profile.id,
  });
  if (err) {
    return NextResponse.json(
      { error: "Could not save report. Run partner_ops.sql in Supabase." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
