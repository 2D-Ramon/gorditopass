import { NextResponse } from "next/server";
import { hasOpsSecret, readOpsSession } from "@/lib/ops-auth";
import { isR2Configured } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const session = await readOpsSession();
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    r2: isR2Configured(),
    hasOpsSecret: hasOpsSecret(),
    unlocked: session.unlocked,
    needsAdminTable: session.needsAdminTable,
    hasOwner: session.hasOwner,
    me: session.admin,
  });
}
