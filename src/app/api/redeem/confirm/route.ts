import { hasActiveStaffRow } from "@/app/api/partner/_guard";
import { NextResponse } from "next/server";
import { POINT_ACTIONS } from "@/lib/pricing";
import { addPoints, unlockRedeemBadges, userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";
import { partnerFirstName } from "@/lib/partner-privacy";

export async function POST(req: Request) {
  const staff = await userFromRequest(req);
  const body = (await req.json().catch(() => null)) as {
    code?: string;
    pin?: string;
  } | null;
  const code = String(body?.code ?? "").replace(/\D/g, "");
  const pin = String(body?.pin ?? "").replace(/\D/g, "");
  if (code.length !== 6) {
    return NextResponse.json(
      { error: "Enter the 6-digit code." },
      { status: 400 },
    );
  }
  const sb = createOpsClient();
  const { data: row } = await sb
    .from("redeem_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: "Code not found." }, { status: 404 });
  }
  if (pin) {
    const { data: pinRow } = await sb
      .from("listing_staff")
      .select("name")
      .eq("restaurant_id", row.restaurant_id)
      .eq("email", "__scan_pin__")
      .eq("active", true)
      .maybeSingle();
    if (!pinRow || pinRow.name !== pin) {
      return NextResponse.json({ error: "Wrong staff PIN." }, { status: 403 });
    }
  } else {
    if (!staff || staff.role !== "restaurant") {
      return NextResponse.json(
        {
          error:
            "Enter the staff PIN on /scan, or sign in as restaurant staff.",
        },
        { status: 401 },
      );
    }
    // Signed-in staff may confirm only for their own restaurant, and only
    // while they hold an ACTIVE listing_staff row for it.
    const restaurantId = staff.restaurant_id;
    if (!restaurantId || !(await hasActiveStaffRow(staff))) {
      return NextResponse.json(
        { error: "Your access to this restaurant is not active." },
        { status: 403 },
      );
    }
    if (row.restaurant_id !== restaurantId) {
      return NextResponse.json(
        { error: "This code is for a different restaurant." },
        { status: 403 },
      );
    }
  }
  if (row.status === "used") {
    return NextResponse.json(
      { error: "This code was already used." },
      { status: 400 },
    );
  }
  if (
    new Date(row.expires_at).getTime() < Date.now() ||
    row.status === "expired"
  ) {
    await sb
      .from("redeem_codes")
      .update({ status: "expired" })
      .eq("id", row.id);
    return NextResponse.json(
      { error: "Code expired. Ask the member to refresh." },
      { status: 400 },
    );
  }
  const { data: updated } = await sb
    .from("redeem_codes")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
      used_by: staff?.id ?? null,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!updated) {
    return NextResponse.json(
      { error: "This code was already used." },
      { status: 400 },
    );
  }
  const { count: prior } = await sb
    .from("redeem_codes")
    .select("id", { count: "exact", head: true })
    .eq("member_id", row.member_id)
    .eq("status", "used");
  const pts =
    (prior ?? 0) <= 1
      ? POINT_ACTIONS.first_redeem.points
      : POINT_ACTIONS.redeem.points;
  const note =
    (prior ?? 0) <= 1
      ? POINT_ACTIONS.first_redeem.label
      : POINT_ACTIONS.redeem.label;
  await addPoints(row.member_id, pts, note);
  const newBadges = await unlockRedeemBadges(row.member_id);
  const [{ data: member }, { data: listing }] = await Promise.all([
    sb
      .from("profiles")
      .select("first_name")
      .eq("id", row.member_id)
      .maybeSingle(),
    sb
      .from("listings")
      .select("id, name, address, google_maps_url")
      .eq("id", row.restaurant_id)
      .maybeSingle(),
  ]);
  // Returned to restaurant staff: first name only, never derived from email.
  const firstName = partnerFirstName(member?.first_name);
  const maps =
    listing?.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${listing?.name ?? ""} ${listing?.address ?? ""}`.trim(),
    )}`;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://gorditopass.vercel.app";
  return NextResponse.json({
    ok: true,
    dealId: row.deal_id,
    memberId: row.member_id,
    points: pts,
    newBadges,
    reviewPrompt: {
      firstName,
      dealTitle: row.deal_title || "tonight's deal",
      rateUrl: `${site}/restaurants/${row.restaurant_id}#rate`,
      googleUrl: maps,
    },
  });
}
