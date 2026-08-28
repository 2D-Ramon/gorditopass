import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OPS_COOKIE,
  hasOpsSecret,
  verifyOpsToken,
} from "@/lib/ops-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    hasOpsSecret: hasOpsSecret(),
    unlocked: verifyOpsToken(jar.get(OPS_COOKIE)?.value),
  });
}
