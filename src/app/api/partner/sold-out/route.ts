import { NextResponse } from "next/server";
import { requireManagers, requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const body = (await req.json().catch(() => null)) as {
    kind?: string;
    id?: string;
    soldOut?: boolean;
  } | null;
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing item." }, { status: 400 });
  const table = body?.kind === "menu" ? "listing_menu" : "listing_deals";
  const sb = createOpsClient();
  const { error: err } = await sb
    .from(table)
    .update({ sold_out: Boolean(body?.soldOut) })
    .eq("id", id)
    .eq("restaurant_id", profile.restaurant_id);
  if (err) {
    return NextResponse.json(
      { error: "Could not update sold-out. Run partner_ops.sql in Supabase." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
