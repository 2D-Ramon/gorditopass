import { NextResponse } from "next/server";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ posts: [] });
  }
  const city = new URL(req.url).searchParams.get("city") || "dallas";
  const sb = createOpsClient();
  const { data, error } = await sb
    .from("city_posts")
    .select("*")
    .eq("city", city)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) return NextResponse.json({ posts: [] });
  const memberIds = [...new Set((data ?? []).map((p) => p.member_id))];
  const { data: profiles } = memberIds.length
    ? await sb
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", memberIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null; email: string }[] };
  const names = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
    ]),
  );
  return NextResponse.json({
    posts: (data ?? []).map((p) => ({
      id: p.id,
      city: p.city,
      author: names.get(p.member_id) ?? "Member",
      authorId: p.member_id,
      title: p.title,
      body: p.body,
      createdAt: p.created_at,
      restaurantId: p.restaurant_id,
      restaurantName: p.restaurant_name,
      plates: p.plates,
      isReview: Boolean(p.plates),
    })),
  });
}
