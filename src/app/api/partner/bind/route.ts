import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { randomStaffPin, SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { createOpsClient } from "@/lib/supabase";

/**
 * Binds the signed-in user to a restaurant listing.
 *
 * Authorization (server-side only; the client-sent staffRole is ignored):
 *  - the caller's verified auth email equals the listing's owner_email, or
 *  - the caller's email has an approved partner application for the listing.
 * Either grants the "owner" role. A caller with an ACTIVE listing_staff
 * row for the listing may also re-bind (role unchanged). Inactive rows: 403.
 * Either grants the "owner" role. There is no server-side staff invite flow
 * yet (staff invites in the app are local-demo only, and the shared scan PIN
 * is not a per-person invite), so every other caller gets 403.
 */
export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: string;
  } | null;
  const requestedId = String(body?.restaurantId ?? "").trim();
  const sb = createOpsClient();

  // Verified email comes from the auth user (not a client field).
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const { data: authData } = await sb.auth.getUser(token);
  const authUser = authData?.user;
  const email = String(authUser?.email ?? "")
    .trim()
    .toLowerCase();
  const verified = Boolean(
    authUser && (authUser.email_confirmed_at || authUser.confirmed_at),
  );
  if (!email || !verified || authUser?.id !== profile.id) {
    return NextResponse.json(
      { error: "Verify your email before linking a restaurant." },
      { status: 403 },
    );
  }

  const authorized = new Set<string>();
  const { data: owned } = await sb
    .from("listings")
    .select("id, owner_email")
    .ilike("owner_email", email);
  for (const row of owned ?? []) {
    if (
      String(row.owner_email ?? "")
        .trim()
        .toLowerCase() === email
    ) {
      authorized.add(row.id);
    }
  }
  const { data: apps } = await sb
    .from("partner_applications")
    .select("listing_id, email, status")
    .eq("status", "approved")
    .ilike("email", email);
  for (const app of apps ?? []) {
    if (
      app.listing_id &&
      String(app.email ?? "")
        .trim()
        .toLowerCase() === email
    ) {
      authorized.add(String(app.listing_id));
    }
  }

  // Established partners: an ACTIVE listing_staff row for the caller's
  // confirmed email also authorizes (re-sign-in), keeping that row's role.
  // listing_staff has no user_id column; the email is the verified auth email.
  const activeStaff = new Map<string, string>();
  const { data: staffRows } = await sb
    .from("listing_staff")
    .select("restaurant_id, email, staff_role, active")
    .ilike("email", email);
  for (const r of staffRows ?? []) {
    if (
      r.active === true &&
      String(r.email ?? "")
        .trim()
        .toLowerCase() === email
    ) {
      activeStaff.set(String(r.restaurant_id), String(r.staff_role ?? ""));
    }
  }
  const candidates = new Set<string>([...authorized, ...activeStaff.keys()]);

  let listingId = "";
  if (requestedId) {
    listingId = candidates.has(requestedId) ? requestedId : "";
  } else if (profile.restaurant_id && candidates.has(profile.restaurant_id)) {
    listingId = profile.restaurant_id;
  } else if (candidates.size === 1) {
    listingId = [...candidates][0];
  }
  if (!listingId) {
    return NextResponse.json(
      {
        error:
          "This email is not the approved owner of that restaurant. Apply first, wait for approval, then sign in with the same email.",
      },
      { status: 403 },
    );
  }
  const { data: listing } = await sb
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 403 },
    );
  }

  // Never re-activate a deactivated staff row: an owner/ops deactivation is
  // final for this route, even if owner_email or an application still match.
  const { data: existingRows } = await sb
    .from("listing_staff")
    .select("id, active")
    .eq("restaurant_id", listingId)
    .ilike("email", email);
  const existing = (existingRows ?? [])[0] as
    { id: string; active: boolean | null } | undefined;
  if (existing && existing.active !== true) {
    return NextResponse.json(
      {
        error:
          "Your access to this restaurant was deactivated. Contact the owner or support.",
      },
      { status: 403 },
    );
  }

  if (!authorized.has(listingId)) {
    // Active staff re-sign-in: success, role unchanged, row untouched.
    const staffRole = activeStaff.get(listingId) || "employee";
    await sb
      .from("profiles")
      .update({
        role: "restaurant",
        restaurant_id: listingId,
        staff_role: staffRole,
      })
      .eq("id", profile.id);
    const { data: pinRow } = await sb
      .from("listing_staff")
      .select("name")
      .eq("restaurant_id", listingId)
      .eq("email", SCAN_PIN_EMAIL)
      .eq("active", true)
      .maybeSingle();
    return NextResponse.json({
      ok: true,
      restaurantId: listingId,
      staffRole,
      staffPin: staffRole === "employee" ? null : (pinRow?.name ?? null),
    });
  }

  const role = "owner";
  if (!existing)
    await sb.from("listing_staff").upsert(
      {
        restaurant_id: listingId,
        email,
        name:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          "Owner",
        staff_role: role,
        active: true,
      },
      { onConflict: "restaurant_id,email", ignoreDuplicates: true },
    );
  else {
    // Active row already: keep it active, align its role with the bind (never touches `active`).
    await sb
      .from("listing_staff")
      .update({ staff_role: role })
      .eq("id", existing.id);
  }
  await sb
    .from("profiles")
    .update({ role: "restaurant", restaurant_id: listingId, staff_role: role })
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
  return NextResponse.json({
    ok: true,
    restaurantId: listingId,
    staffPin: pin,
  });
}
