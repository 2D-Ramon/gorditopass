import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_deals")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ deals: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot manage deals." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const sb = createOpsClient();
  const id = `deal-${profile.restaurant_id}-${Date.now()}`;
  const { error } = await sb.from("listing_deals").insert({
    id,
    restaurant_id: profile.restaurant_id,
    title,
    description: String(body?.description ?? "").trim(),
    type: body?.type || "free_item",
    value: body?.value ? Number(body.value) : null,
    regular_price_usd: body?.regularPrice ? Number(body.regularPrice) : null,
    active: true,
    hidden: false,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
