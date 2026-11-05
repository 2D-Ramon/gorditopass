import { blockAutomatedCatalogRead, catalogJson } from "@/lib/bot-guard";
import { asCity } from "@/lib/listing-map";
import { loadRemovedFeedIds } from "@/lib/moderation";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";
import { partnerSafeName } from "@/lib/partner-privacy";

export async function GET(req: Request) {
  const blocked = await blockAutomatedCatalogRead();
  if (blocked) return blocked;
  if (!isSupabaseConfigured()) {
    return catalogJson({ posts: [] });
  }
  const city = asCity(new URL(req.url).searchParams.get("city") || "dallas");
  const sb = createOpsClient();
  const removedSeedIds = await loadRemovedFeedIds(sb);
  const { data, error } = await sb
    .from("city_posts")
    .select("*")
    .eq("city", city)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) return catalogJson({ posts: [], removedSeedIds });
  const memberIds = [...new Set((data ?? []).map((p) => p.member_id))];
  const { data: profiles } = memberIds.length
    ? await sb
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", memberIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };
  const names = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      partnerSafeName(p.first_name, p.last_name),
    ]),
  );
  return catalogJson({
    removedSeedIds,
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
