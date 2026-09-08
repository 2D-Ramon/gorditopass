import { NextResponse } from "next/server";
import { requireManagers, requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const sb = createOpsClient();
  const { data: reviews } = await sb
    .from("plate_reviews")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(80);
  const ids = (reviews ?? []).map((r) => r.id);
  const { data: replies } = ids.length
    ? await sb.from("plate_review_replies").select("*").in("review_id", ids)
    : { data: [] };
  const replyMap = new Map((replies ?? []).map((r) => [r.review_id, r]));
  return NextResponse.json({
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      author: r.author ?? "Member",
      plates: r.plates,
      text: r.body ?? "",
      createdAt: r.created_at,
      dealTitle: r.deal_title,
      reply: replyMap.get(r.id)
        ? {
            body: replyMap.get(r.id)!.body,
            at: replyMap.get(r.id)!.created_at,
          }
        : null,
    })),
  });
}

export async function POST(req: Request) {
  const { profile, error } = await requirePartner(req);
  if (error || !profile) return error!;
  const blocked = requireManagers(profile);
  if (blocked) return blocked;
  const body = (await req.json().catch(() => null)) as {
    reviewId?: string;
    body?: string;
  } | null;
  const reviewId = String(body?.reviewId ?? "").trim();
  const text = String(body?.body ?? "").trim();
  if (!reviewId || text.length < 2) {
    return NextResponse.json({ error: "Write a short reply." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { data: review } = await sb
    .from("plate_reviews")
    .select("id, restaurant_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review || review.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "The restaurant";
  const { error: err } = await sb.from("plate_review_replies").insert({
    review_id: reviewId,
    restaurant_id: profile.restaurant_id,
    body: text.slice(0, 600),
    author_name: name,
  });
  if (err) {
    return NextResponse.json(
      { error: "Could not save reply. Run partner_ops.sql in Supabase." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
