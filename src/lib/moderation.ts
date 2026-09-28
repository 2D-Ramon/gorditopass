import type { SupabaseClient } from "@supabase/supabase-js";

export const WARNING_NOTE = "Warning from GorditoPass";
const REMOVED_FEED_EMAIL = "feed-removed@gorditopass.internal";

export async function warningCounts(
  sb: SupabaseClient,
  memberIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!memberIds.length) return counts;
  const { data } = await sb
    .from("reward_ledger")
    .select("member_id")
    .eq("note", WARNING_NOTE)
    .in("member_id", memberIds);
  for (const row of data ?? []) {
    const id = String(row.member_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function loadRemovedFeedIds(sb: SupabaseClient): Promise<string[]> {
  const { data } = await sb
    .from("members")
    .select("notes")
    .eq("email", REMOVED_FEED_EMAIL)
    .maybeSingle();
  if (!data?.notes) return [];
  try {
    const parsed = JSON.parse(String(data.notes));
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export async function rememberRemovedFeedId(sb: SupabaseClient, id: string) {
  const ids = await loadRemovedFeedIds(sb);
  if (!ids.includes(id)) ids.push(id);
  const notes = JSON.stringify(ids);
  const { data } = await sb
    .from("members")
    .select("id")
    .eq("email", REMOVED_FEED_EMAIL)
    .maybeSingle();
  if (data?.id) {
    await sb.from("members").update({ notes }).eq("id", data.id);
    return;
  }
  await sb.from("members").insert({
    email: REMOVED_FEED_EMAIL,
    first_name: "Removed",
    last_name: "feed",
    status: "cancelled",
    is_member: false,
    notes,
  });
}

export function isRemovedFeedTombstone(email: string | null | undefined) {
  return String(email ?? "").toLowerCase() === REMOVED_FEED_EMAIL;
}
