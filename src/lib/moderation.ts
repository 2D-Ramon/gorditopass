import type { SupabaseClient } from "@supabase/supabase-js";

export const WARNING_NOTE = "Warning from GorditoPass";
export const DELETED_NOTE = "Account deleted";
export const SUSPEND_CLEARED = "Suspension cleared";
const REMOVED_FEED_EMAIL = "feed-removed@gorditopass.internal";

export type SuspendScope = "redeem" | "social" | "all";

export type MemberSuspension = {
  until: string;
  scope: SuspendScope;
};

const SCOPES: SuspendScope[] = ["redeem", "social", "all"];
export const SUSPEND_DAYS = [1, 3, 7, 14, 30] as const;

export function suspensionNote(untilIso: string, scope: SuspendScope) {
  return `Suspension|${untilIso}|${scope}`;
}

export function parseModeration(
  rows: { note?: string | null; created_at?: string | null }[],
): { deleted: boolean; suspension: MemberSuspension | null } {
  const sorted = [...rows].sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
  );
  let deleted = false;
  let suspension: MemberSuspension | null = null;
  let sawSuspend = false;
  for (const row of sorted) {
    const note = row.note ?? "";
    if (note === DELETED_NOTE) deleted = true;
    if (sawSuspend) continue;
    if (note === SUSPEND_CLEARED) {
      sawSuspend = true;
      continue;
    }
    if (note.startsWith("Suspension|")) {
      sawSuspend = true;
      const [, until, scope] = note.split("|");
      if (
        until &&
        SCOPES.includes(scope as SuspendScope) &&
        new Date(until).getTime() > Date.now()
      ) {
        suspension = { until, scope: scope as SuspendScope };
      }
    }
  }
  return { deleted, suspension };
}

export function suspensionBlocks(
  suspension: MemberSuspension | null | undefined,
  area: "redeem" | "social",
) {
  if (!suspension) return false;
  if (new Date(suspension.until).getTime() <= Date.now()) return false;
  return suspension.scope === "all" || suspension.scope === area;
}

export async function loadMemberModeration(sb: SupabaseClient, memberId: string) {
  const { data } = await sb
    .from("reward_ledger")
    .select("note, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(40);
  return parseModeration(data ?? []);
}

export async function moderationBlock(
  sb: SupabaseClient,
  memberId: string,
  area: "redeem" | "social",
): Promise<string | null> {
  const mod = await loadMemberModeration(sb, memberId);
  if (mod.deleted) return "This account has been deleted.";
  if (suspensionBlocks(mod.suspension, area)) {
    const until = mod.suspension!.until.slice(0, 10);
    const what =
      area === "redeem" ? "redeeming" : "messaging, reviews, and chat";
    return `This account is suspended from ${what} until ${until}.`;
  }
  return null;
}

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
