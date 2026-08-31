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
    .from("listing_menu")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ menu: data ?? [] });
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot manage menu." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required." }, { status: 400 });
  const sb = createOpsClient();
  const id = `menu-${profile.restaurant_id}-${Date.now()}`;
  const { error } = await sb.from("listing_menu").insert({
    id,
    restaurant_id: profile.restaurant_id,
    name,
    description: String(body?.description ?? "").trim(),
    price_usd: body?.priceUsd ? Number(body.priceUsd) : 0,
    category: body?.category || "Mains",
    active: true,
    hidden: false,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, status: "pending" });
}
