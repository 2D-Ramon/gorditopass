import { NextResponse } from "next/server";
import {
  bizCapReached,
  countLiveListings,
} from "@/lib/market";
import { PLATFORM } from "@/lib/pricing";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database is not connected." }, { status: 503 });
  }
  const n = await countLiveListings();
  if (bizCapReached(n)) {
    return NextResponse.json(
      { error: `Early partner cap is ${PLATFORM.earlyCapBusinesses} businesses.` },
      { status: 403 },
    );
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!name || !email.includes("@")) {
    return NextResponse.json({ error: "Business name and email are required." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { data: app, error } = await sb
    .from("partner_applications")
    .insert({
      name,
      email,
      contact_name: String(body?.contactName ?? "").trim() || null,
      position: String(body?.position ?? "").trim() || null,
      address: String(body?.address ?? "").trim() || null,
      city: String(body?.city ?? "dallas"),
      promo: String(body?.promo ?? "").trim() || null,
      payload: body,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("business_accounts").insert({
    name,
    status: "applied",
    city: String(body?.city ?? "dallas"),
    contact_name: String(body?.contactName ?? "").trim() || null,
    contact_email: email,
    address: String(body?.address ?? "").trim() || null,
    notes: String(body?.promo ?? "").trim() || null,
    source: "website-apply",
  });
  return NextResponse.json({ ok: true, id: app.id });
}
