import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile?.restaurant_id || profile.role !== "restaurant") {
    return NextResponse.json({ error: "Partner sign-in required." }, { status: 401 });
  }
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot edit Our story." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { story?: string } | null;
  const sb = createOpsClient();
  const { error } = await sb
    .from("listings")
    .update({ story: String(body?.story ?? "").trim() })
    .eq("id", profile.restaurant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
