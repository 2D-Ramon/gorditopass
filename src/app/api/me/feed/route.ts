import { NextResponse } from "next/server";
import { POINT_ACTIONS } from "@/lib/pricing";
import { addPoints, userFromRequest } from "@/lib/market";
import { recomputeMember, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    body?: string;
    city?: string;
    restaurantId?: string;
    restaurantName?: string;
    plates?: number;
    media?: { kind?: string; value?: string; name?: string }[];
  } | null;
  const title = String(body?.title ?? "").trim();
  const text = String(body?.body ?? "").trim();
  if (!title || !text) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }
  const sb = createOpsClient();
  const post = {
    member_id: profile.id,
    city: body?.city || profile.city || "dallas",
    title,
    body: text,
    restaurant_id: body?.restaurantId || null,
    restaurant_name: body?.restaurantName || null,
    plates: body?.plates ? Math.min(5, Math.max(1, Math.round(body.plates))) : null,
    media: Array.isArray(body?.media) ? body.media.slice(0, 8) : [],
  };
  let { error } = await sb.from("city_posts").insert(post);
  if (error && /media/i.test(error.message)) {
    const { media: _media, ...without } = post;
    void _media;
    ({ error } = await sb.from("city_posts").insert(without));
  }
  if (error) {
    return NextResponse.json(
      { error: "Could not publish. Run member_activity.sql in Supabase." },
      { status: 500 },
    );
  }
  await addPoints(profile.id, POINT_ACTIONS.feed_post.points, POINT_ACTIONS.feed_post.label);
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json(bundle);
}
