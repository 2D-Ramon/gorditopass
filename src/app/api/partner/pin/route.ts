import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Restaurant sign-in required." }, { status: 401 });
  }
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_staff")
    .select("name")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("email", SCAN_PIN_EMAIL)
    .maybeSingle();
  return NextResponse.json({ pin: data?.name ?? null });
}

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Restaurant sign-in required." }, { status: 401 });
  }
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot change the staff PIN." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { pin?: string } | null;
  const pin = String(body?.pin ?? "").replace(/\D/g, "");
  if (pin.length < 4 || pin.length > 6) {
    return NextResponse.json({ error: "PIN must be 4–6 digits." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { error } = await sb.from("listing_staff").upsert(
    {
      restaurant_id: profile.restaurant_id,
      email: SCAN_PIN_EMAIL,
      name: pin,
      staff_role: "employee",
      active: true,
    },
    { onConflict: "restaurant_id,email" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pin });
}
