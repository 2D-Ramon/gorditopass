import { NextResponse } from "next/server";
import { userFromRequest, type ProfileRow } from "@/lib/market";
import { canManagePartnerContent } from "@/lib/types";

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
