import { NextResponse } from "next/server";
import { FEED_POSTS } from "@/lib/data";
import {
  loadRemovedFeedIds,
  warningCounts,
} from "@/lib/moderation";
import { jsonError, withOps } from "../_util";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await withOps("can_feed");
  if (!gate.ok) return gate.response;
  const sb = gate.supabase;
  const removed = new Set(await loadRemovedFeedIds(sb));
  const { data: posts, error } = await sb
    .from("city_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return jsonError(error.message, 500);

  const memberIds = [
    ...new Set((posts ?? []).map((p) => String(p.member_id)).filter(Boolean)),
  ];
  const [{ data: profiles }, counts] = await Promise.all([
    memberIds.length
      ? sb
          .from("profiles")
          .select("id, first_name, last_name, email, banned")
          .in("id", memberIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null; email: string; banned: boolean }[] }),
    warningCounts(sb, memberIds),
  ]);
  const people = new Map((profiles ?? []).map((p) => [p.id, p]));

  const live = (posts ?? [])
    .filter((p) => !removed.has(String(p.id)))
    .map((p) => {
      const person = people.get(p.member_id);
      const name = person
        ? [person.first_name, person.last_name].filter(Boolean).join(" ") || person.email
        : "Member";
      return {
        id: String(p.id),
        title: String(p.title ?? ""),
        body: String(p.body ?? ""),
        city: String(p.city ?? ""),
        author: name,
        memberId: String(p.member_id),
        createdAt: String(p.created_at ?? ""),
        warningCount: counts.get(String(p.member_id)) ?? 0,
        banned: Boolean(person?.banned),
        source: "live" as const,
      };
    });

  const seed = FEED_POSTS.filter((p) => !removed.has(p.id)).map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    city: p.city,
    author: p.author,
    memberId: "",
    createdAt: p.createdAt,
    warningCount: 0,
    banned: false,
    source: "seed" as const,
  }));

  return NextResponse.json({ posts: [...live, ...seed] });
}
