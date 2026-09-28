import { NextResponse } from "next/server";
import { redeemAccessCode } from "@/lib/access-codes";
import { userFromRequest } from "@/lib/market";
import { createOpsClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in first, then enter the code." }, { status: 401 });
  }
  if (profile.role === "restaurant") {
    return NextResponse.json(
      { error: "Sign in with a diner account to use a free access code." },
      { status: 403 },
    );
  }
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  try {
    const result = await redeemAccessCode(createOpsClient(), profile, String(body?.code ?? ""));
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not apply the code." },
      { status: 400 },
    );
  }
}
