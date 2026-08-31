import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.is_member) {
    return NextResponse.json(
      { error: "Active membership required to redeem." },
      { status: 401 },
    );
  }
  const body = (await req.json().catch(() => null)) as { dealId?: string } | null;
  const dealId = body?.dealId;
  if (!dealId) return NextResponse.json({ error: "Missing deal." }, { status: 400 });
  const sb = createOpsClient();
  const { data: deal } = await sb
    .from("listing_deals")
    .select("*")
    .eq("id", dealId)
    .eq("active", true)
    .eq("hidden", false)
    .maybeSingle();
  if (!deal) {
    return NextResponse.json({ error: "This deal is not live." }, { status: 404 });
  }
  const expires = new Date(Date.now() + 60_000).toISOString();
  let code = sixDigit();
  for (let i = 0; i < 6; i++) {
    const { error } = await sb.from("redeem_codes").insert({
      code,
      deal_id: deal.id,
      restaurant_id: deal.restaurant_id,
      member_id: profile.id,
      status: "pending",
      expires_at: expires,
    });
    if (!error) {
      return NextResponse.json({
        code,
        expiresAt: expires,
        dealTitle: deal.title,
        restaurantId: deal.restaurant_id,
      });
    }
    code = sixDigit();
  }
  return NextResponse.json({ error: "Could not issue a code. Try again." }, { status: 500 });
}
