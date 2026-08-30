import { NextResponse } from "next/server";
import { hasOpsSecret, readOpsSession } from "@/lib/ops-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const session = await readOpsSession();
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    hasOpsSecret: hasOpsSecret(),
    unlocked: session.unlocked,
    needsAdminTable: session.needsAdminTable,
    hasOwner: session.hasOwner,
    me: session.admin,
  });
}
