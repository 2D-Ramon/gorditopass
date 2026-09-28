import { NextResponse } from "next/server";
import { parseModeration } from "@/lib/moderation";
import { jsonError, withOps } from "../_util";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await withOps("can_members");
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, phone, city, is_member, plan_id, banned, email_opt_in, sms_opt_in, created_at",
    )
    .eq("role", "diner")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  const ids = (data ?? []).map((row) => row.id);
  const notes = ids.length
    ? await gate.supabase
        .from("reward_ledger")
        .select("member_id, note, created_at")
        .in("member_id", ids)
        .order("created_at", { ascending: false })
        .limit(1000)
    : { data: [] as { member_id: string; note: string | null; created_at: string }[] };
  const byMember = new Map<string, { note: string | null; created_at: string }[]>();
  for (const row of notes.data ?? []) {
    const list = byMember.get(row.member_id) ?? [];
    list.push(row);
    byMember.set(row.member_id, list);
  }
  return NextResponse.json({
    diners: (data ?? []).map((row) => {
      const mod = parseModeration(byMember.get(row.id) ?? []);
      return {
        ...row,
        deleted: mod.deleted,
        suspensionUntil: mod.suspension?.until ?? null,
        suspensionScope: mod.suspension?.scope ?? null,
      };
    }),
  });
}
