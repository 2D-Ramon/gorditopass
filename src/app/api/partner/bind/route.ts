import { NextResponse } from "next/server";
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
  const requestedId = String(body?.restaurantId ?? "").trim();
  const role =
    (body?.staffRole as string) || profile.staff_role || "owner";
  const email = profile.email.toLowerCase();
  const sb = createOpsClient();

  async function listingExists(id: string) {
    if (!id) return "";
    const { data } = await sb.from("listings").select("id").eq("id", id).maybeSingle();
    return data?.id ?? "";
  }

  let listingId = await listingExists(requestedId || profile.restaurant_id || "");
  if (!listingId) {
    const { data: owned } = await sb
      .from("listings")
      .select("id")
      .eq("owner_email", email)
      .maybeSingle();
    listingId = owned?.id ?? "";
  }
  if (!listingId) {
    const { data: staff } = await sb
      .from("listing_staff")
      .select("restaurant_id")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();
    listingId = staff?.restaurant_id ?? "";
  }
  if (!listingId) {
    return NextResponse.json(
      {
        error:
          "No approved restaurant is linked to this email. Apply first, wait for approval, then sign in with the same email.",
      },
      { status: 400 },
    );
  }

  await sb.from("listing_staff").upsert(
    {
      restaurant_id: listingId,
      email,
      name:
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        email,
      staff_role: role,
      active: true,
    },
    { onConflict: "restaurant_id,email" },
  );
  await sb
    .from("profiles")
    .update({
      role: "restaurant",
      restaurant_id: listingId,
      staff_role: role,
    })
    .eq("id", profile.id);

  const { data: pinRow } = await sb
    .from("listing_staff")
    .select("name")
    .eq("restaurant_id", listingId)
    .eq("email", SCAN_PIN_EMAIL)
    .maybeSingle();
  let pin = pinRow?.name ?? "";
  if (!/^\d{4,6}$/.test(pin)) {
    pin = randomStaffPin();
    await sb.from("listing_staff").upsert(
      {
        restaurant_id: listingId,
        email: SCAN_PIN_EMAIL,
        name: pin,
        staff_role: "employee",
        active: true,
      },
      { onConflict: "restaurant_id,email" },
    );
  }
  return NextResponse.json({ ok: true, restaurantId: listingId, staffPin: pin });
}
