import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/data";
import { userFromRequest } from "@/lib/market";
import { randomStaffPin, SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: string;
    staffRole?: string;
  } | null;
  const restaurantId = String(body?.restaurantId ?? "").trim();
  const seed = getRestaurant(restaurantId);
  if (!seed) {
    return NextResponse.json({ error: "Unknown restaurant." }, { status: 400 });
  }
  const role = (body?.staffRole as string) || "owner";
  const sb = createOpsClient();
  await sb.from("listings").upsert(
    {
      id: seed.id,
      name: seed.name,
      slug: seed.slug,
      city: seed.city,
      neighborhood: seed.neighborhood,
      cuisine: seed.cuisine,
      tagline: seed.tagline,
      story: seed.story,
      hours: seed.hours,
      address: seed.address,
      lat: seed.lat,
      lng: seed.lng,
      emoji: seed.emoji,
      accent: seed.accent,
      approved: true,
      banned: false,
      owner_email: role === "owner" ? profile.email : undefined,
    },
    { onConflict: "id" },
  );
  await sb.from("listing_staff").upsert(
    {
      restaurant_id: seed.id,
      email: profile.email,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email,
      staff_role: role,
      active: true,
    },
    { onConflict: "restaurant_id,email" },
  );
  await sb
    .from("profiles")
    .update({
      role: "restaurant",
      restaurant_id: seed.id,
      staff_role: role,
    })
    .eq("id", profile.id);

  const { data: pinRow } = await sb
    .from("listing_staff")
    .select("name")
    .eq("restaurant_id", seed.id)
    .eq("email", SCAN_PIN_EMAIL)
    .maybeSingle();
  let pin = pinRow?.name ?? "";
  if (!/^\d{4,6}$/.test(pin)) {
    pin = randomStaffPin();
    await sb.from("listing_staff").upsert(
      {
        restaurant_id: seed.id,
        email: SCAN_PIN_EMAIL,
        name: pin,
        staff_role: "employee",
        active: true,
      },
      { onConflict: "restaurant_id,email" },
    );
  }
  return NextResponse.json({ ok: true, restaurantId: seed.id, staffPin: pin });
}
