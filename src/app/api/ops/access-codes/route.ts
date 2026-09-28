import { NextResponse } from "next/server";
import { createAccessCode, listAccessCodes, type AccessCodeKind } from "@/lib/access-codes";
import { jsonError, withOps } from "../_util";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  try {
    const codes = await listAccessCodes(gate.supabase);
    return NextResponse.json({ codes });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not load codes.");
  }
}

export async function POST(req: Request) {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as {
    kind?: AccessCodeKind;
    label?: string;
    maxUses?: number;
    accessDays?: number;
    redeemUntil?: string;
  } | null;
  const kind = body?.kind;
  if (kind !== "individual" && kind !== "limited" && kind !== "promo") {
    return jsonError("Choose one person, a set number, or a promotion.");
  }
  if (kind === "limited" && (!body?.maxUses || body.maxUses < 2)) {
    return jsonError("Enter how many people can use this code.");
  }
  if (kind !== "promo" && (!body?.accessDays || body.accessDays < 1)) {
    return jsonError("Enter how many days of free access each person gets.");
  }
  if (kind === "promo" && !body?.redeemUntil) {
    return jsonError("Pick the date this promotion ends.");
  }
  const redeemUntil = body?.redeemUntil
    ? new Date(`${body.redeemUntil}T23:59:59`).toISOString()
    : null;
  if (redeemUntil && new Date(redeemUntil).getTime() < Date.now()) {
    return jsonError("That end date is already past.");
  }
  try {
    const code = await createAccessCode(gate.supabase, {
      kind,
      label: body?.label,
      maxUses: kind === "limited" ? Number(body?.maxUses) : null,
      accessDays: kind === "promo" ? null : Number(body?.accessDays),
      redeemUntil: kind === "promo" ? redeemUntil : null,
    });
    return NextResponse.json({ code });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not create the code.", 500);
  }
}
