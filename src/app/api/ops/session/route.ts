import { NextResponse } from "next/server";
import {
  MAX_AGE_SEC,
  OPS_COOKIE,
  hasOpsSecret,
  secretsMatch,
  signOpsToken,
} from "@/lib/ops-auth";

export async function POST(req: Request) {
  if (!hasOpsSecret()) {
    return NextResponse.json(
      { error: "Set OPS_ADMIN_SECRET in your environment first." },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => null)) as { secret?: string } | null;
  const secret = body?.secret?.trim() ?? "";
  if (!secretsMatch(secret)) {
    return NextResponse.json({ error: "That secret does not match." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, signOpsToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
