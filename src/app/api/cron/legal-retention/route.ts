import { NextResponse } from "next/server";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";
import { cronAuthorized } from "@/lib/legal";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/legal-retention  (Vercel cron, monthly; Bearer CRON_SECRET required)
 * Calls public.purge_expired_legal_records(): deletes legal records only when they are
 * older than 3 years AND the user's termination was more than 1 year ago (and not a member).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, skipped: "supabase" });
  const { data, error } = await createOpsClient().rpc("purge_expired_legal_records");
  if (error) return NextResponse.json({ error: "Purge failed." }, { status: 500 });
  return NextResponse.json({ ok: true, purged: data });
}
