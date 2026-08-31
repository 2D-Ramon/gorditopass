import { NextResponse } from "next/server";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ jobs: [] });
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_jobs")
    .select("*")
    .eq("hidden", false)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return NextResponse.json({
    jobs: (data ?? []).map((j) => ({
      id: j.id,
      restaurantId: j.restaurant_id,
      restaurantName: j.restaurant_name ?? "",
      title: j.title,
      description: j.description ?? "",
      type: j.job_type ?? "part-time",
      city: j.city ?? "dallas",
      postedAt: j.created_at,
      payRange: j.pay_range ?? "",
      applyUrl: j.apply_url ?? "",
      status: j.status,
      createdAt: j.created_at,
    })),
  });
}
