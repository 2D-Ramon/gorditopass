import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in to message the restaurant." }, { status: 401 });
  }
  if (profile.role === "restaurant") {
    return NextResponse.json({ error: "Staff should use the partner inbox." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: string;
    body?: string;
  } | null;
  const restaurantId = String(body?.restaurantId ?? "").trim();
  const text = String(body?.body ?? "").trim();
  if (!restaurantId || text.length < 1) {
    return NextResponse.json({ error: "Write a short message." }, { status: 400 });
  }
  const sb = createOpsClient();
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
  const { error } = await sb.from("listing_messages").insert({
    restaurant_id: restaurantId,
    member_id: profile.id,
    from_role: "diner",
    from_name: name,
    body: text.slice(0, 1000),
  });
  if (error) {
    return NextResponse.json(
      { error: "Could not send. The restaurant inbox may not be set up yet." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
