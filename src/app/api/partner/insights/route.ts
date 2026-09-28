import { NextResponse } from "next/server";
import { requireManagers, requirePartner } from "@/app/api/partner/_guard";
import { loadRestaurantInsights } from "@/lib/load-restaurant-insights";
import { createOpsClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;

  const sb = createOpsClient();
  const { insights } = await loadRestaurantInsights(sb, profile.restaurant_id!);
  return NextResponse.json(insights);
}
