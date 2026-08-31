import { NextResponse } from "next/server";
import { profileToUser, userFromRequest } from "@/lib/market";

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: profileToUser(profile) });
}
