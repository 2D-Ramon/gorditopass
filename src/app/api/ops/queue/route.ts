import { NextResponse } from "next/server";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps();
  if (!gate.ok) return gate.response;
  const sb = gate.supabase;
  const [
    { data: applications, error: appErr },
    { data: deals },
    { data: menu },
    { data: events },
    { data: jobs },
    { data: listings },
    { count: redeemCount },
    { data: posts },
  ] = await Promise.all([
    sb.from("partner_applications").select("*").order("created_at", { ascending: false }),
    sb.from("listing_deals").select("*").order("created_at", { ascending: false }),
    sb.from("listing_menu").select("*").order("created_at", { ascending: false }),
    sb.from("listing_events").select("*").order("created_at", { ascending: false }),
    sb.from("listing_jobs").select("*").order("created_at", { ascending: false }),
    sb.from("listings").select("*").order("created_at", { ascending: false }),
    sb.from("redeem_codes").select("id", { count: "exact", head: true }).eq("status", "used"),
    sb.from("city_posts").select("*").order("created_at", { ascending: false }).limit(80),
  ]);
  if (appErr) return jsonError(appErr.message, 500);
  return NextResponse.json({
    applications: applications ?? [],
    deals: deals ?? [],
    menu: menu ?? [],
    events: events ?? [],
    jobs: jobs ?? [],
    listings: listings ?? [],
    redemptions: redeemCount ?? 0,
    posts: posts ?? [],
  });
}
