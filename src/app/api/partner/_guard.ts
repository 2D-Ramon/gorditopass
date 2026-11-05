import { NextResponse } from "next/server";
import { userFromRequest, type ProfileRow } from "@/lib/market";
import { SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { createOpsClient } from "@/lib/supabase";
import { canManagePartnerContent } from "@/lib/types";

/**
 * True when the profile (by its server-side email, tied to the user id) has an
 * ACTIVE listing_staff row for its restaurant_id. A deactivated staff row
 * revokes partner access even if profiles.role/restaurant_id still say partner.
 */
export async function hasActiveStaffRow(
  profile: Pick<ProfileRow, "email" | "restaurant_id"> | null | undefined,
): Promise<boolean> {
  const email = String(profile?.email ?? "").trim().toLowerCase();
  const rid = profile?.restaurant_id;
  if (!email || !rid || email === SCAN_PIN_EMAIL) return false;
  const sb = createOpsClient();
  const { data, error } = await sb
    .from("listing_staff")
    .select("id")
    .eq("restaurant_id", rid)
    .ilike("email", email)
    .eq("active", true)
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

export async function requirePartner(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return {
      profile: null as ProfileRow | null,
      error: NextResponse.json(
        { error: "Partner sign-in required." },
        { status: 401 },
      ),
    };
  }
  if (!(await hasActiveStaffRow(profile))) {
    return {
      profile: null as ProfileRow | null,
      error: NextResponse.json(
        { error: "Your access to this restaurant is not active." },
        { status: 403 },
      ),
    };
  }
  return { profile, error: null as NextResponse | null };
}

export function requireManagers(profile: ProfileRow) {
  if (!canManagePartnerContent(profile.staff_role ?? "owner")) {
    return NextResponse.json(
      { error: "Owner, manager, or marketing only." },
      { status: 403 },
    );
  }
  return null;
}
