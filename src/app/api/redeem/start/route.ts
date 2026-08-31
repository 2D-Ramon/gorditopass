import { NextResponse } from "next/server";
import { getDeal } from "@/lib/data";
import { estimateDealValue } from "@/lib/deal-value";
import { userFromRequest } from "@/lib/market";
import { SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { createOpsClient } from "@/lib/supabase";

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.is_member) {
    return NextResponse.json(
      { error: "Active membership required to redeem. Sign in with your member email." },
      { status: 401 },
    );
  }
  const body = (await req.json().catch(() => null)) as { dealId?: string } | null;
  const dealId = body?.dealId;
  if (!dealId) return NextResponse.json({ error: "Missing deal." }, { status: 400 });
  const sb = createOpsClient();
  let { data: deal } = await sb
    .from("listing_deals")
    .select("*")
    .eq("id", dealId)
    .eq("hidden", false)
    .maybeSingle();

  if (!deal) {
    const seed = getDeal(dealId);
    if (!seed || !seed.deal.active) {
      return NextResponse.json({ error: "This deal is not live." }, { status: 404 });
    }
    await sb.from("listings").upsert(
      {
        id: seed.restaurant.id,
        name: seed.restaurant.name,
        slug: seed.restaurant.slug,
        city: seed.restaurant.city,
        neighborhood: seed.restaurant.neighborhood,
        cuisine: seed.restaurant.cuisine,
        tagline: seed.restaurant.tagline,
        story: seed.restaurant.story,
        hours: seed.restaurant.hours,
        address: seed.restaurant.address,
        lat: seed.restaurant.lat,
        lng: seed.restaurant.lng,
        emoji: seed.restaurant.emoji,
        accent: seed.restaurant.accent,
        approved: true,
        banned: false,
      },
      { onConflict: "id" },
    );
    await sb.from("listing_deals").upsert(
      {
        id: seed.deal.id,
        restaurant_id: seed.deal.restaurantId,
        title: seed.deal.title,
        description: seed.deal.description,
        type: seed.deal.type,
        value: seed.deal.value,
        active: true,
        hidden: false,
        status: "approved",
      },
      { onConflict: "id" },
    );
    deal = {
      id: seed.deal.id,
      restaurant_id: seed.deal.restaurantId,
      title: seed.deal.title,
      type: seed.deal.type,
      value: seed.deal.value,
      regular_price_usd: seed.restaurant.menu[0]?.priceUsd ?? null,
      active: true,
    };
    const { data: pinRow } = await sb
      .from("listing_staff")
      .select("name")
      .eq("restaurant_id", seed.deal.restaurantId)
      .eq("email", SCAN_PIN_EMAIL)
      .maybeSingle();
    if (!pinRow) {
      await sb.from("listing_staff").upsert(
        {
          restaurant_id: seed.deal.restaurantId,
          email: SCAN_PIN_EMAIL,
          name: "1234",
          staff_role: "employee",
          active: true,
        },
        { onConflict: "restaurant_id,email" },
      );
    }
  }

  if (deal.active === false) {
    return NextResponse.json({ error: "This deal is not live." }, { status: 404 });
  }

  await sb
    .from("redeem_codes")
    .update({ status: "expired" })
    .eq("member_id", profile.id)
    .eq("deal_id", deal.id)
    .eq("status", "pending");

  const value = estimateDealValue({
    type: deal.type,
    value: deal.value,
    regular_price_usd: deal.regular_price_usd,
  });
  const expires = new Date(Date.now() + 60_000).toISOString();
  let code = sixDigit();
  for (let i = 0; i < 8; i++) {
    const row = {
      code,
      deal_id: deal.id,
      restaurant_id: deal.restaurant_id,
      member_id: profile.id,
      status: "pending",
      expires_at: expires,
    };
    let { error } = await sb.from("redeem_codes").insert({
      ...row,
      savings_usd: value.savingsUsd,
      revenue_usd: value.revenueUsd,
      deal_title: deal.title,
    });
    if (error) {
      ({ error } = await sb.from("redeem_codes").insert(row));
    }
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
  return NextResponse.json(
    { error: "Could not issue a code. Try again." },
    { status: 500 },
  );
}
