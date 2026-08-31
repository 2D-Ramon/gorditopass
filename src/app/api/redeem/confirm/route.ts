import { NextResponse } from "next/server";
import { POINT_ACTIONS } from "@/lib/pricing";
import { addPoints, userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const staff = await userFromRequest(req);
  if (!staff || staff.role !== "restaurant") {
    return NextResponse.json(
      { error: "Sign in as restaurant staff to confirm." },
      { status: 401 },
    );
  }
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = String(body?.code ?? "").replace(/\D/g, "");
  if (code.length !== 6) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
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
  if (staff.restaurant_id && row.restaurant_id !== staff.restaurant_id) {
    return NextResponse.json(
      { error: "This code is for a different restaurant." },
      { status: 403 },
    );
  }
  if (row.status === "used") {
    return NextResponse.json({ error: "This code was already used." }, { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now() || row.status === "expired") {
    await sb.from("redeem_codes").update({ status: "expired" }).eq("id", row.id);
    return NextResponse.json({ error: "Code expired. Ask the member to refresh." }, { status: 400 });
  }
  const { data: updated } = await sb
    .from("redeem_codes")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
      used_by: staff.id,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!updated) {
    return NextResponse.json({ error: "This code was already used." }, { status: 400 });
  }
  await addPoints(row.member_id, POINT_ACTIONS.redeem.points, POINT_ACTIONS.redeem.label);
  return NextResponse.json({
    ok: true,
    dealId: row.deal_id,
    memberId: row.member_id,
  });
}
