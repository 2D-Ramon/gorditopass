import { createOpsClient } from "./supabase";
import type { CityId, MembershipPlanId, MockUser, StaffRole } from "./types";
import { MEMBERSHIP_PLANS, PLATFORM } from "./pricing";
export async function userFromRequest(req: Request): Promise<ProfileRow | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) return null;
  const sb = createOpsClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  const profile = await loadProfile(data.user.id);
  if (profile?.banned) return null;
  return profile;
}

export type ProfileRow = {
  id: string;
  email: string;
  role: MockUser["role"];
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  birthday: string | null;
  home_address: string | null;
  restaurant_id: string | null;
  staff_role: StaffRole | null;
  is_member: boolean;
  plan_id: string | null;
  family_seats: number;
  membership_activated_at: string | null;
  membership_renews_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  reward_points: number;
  reward_points_lifetime: number;
  rewards_claimed: number;
  banned: boolean;
};

export function profileToUser(p: ProfileRow): MockUser {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;
  const stillMember =
    p.is_member &&
    (!p.membership_renews_at || new Date(p.membership_renews_at).getTime() > Date.now());
  return {
    id: p.id,
    name,
    email: p.email,
    role: p.banned ? "diner" : p.role,
    city: (p.city as CityId) || "dallas",
    isMember: p.banned ? false : stillMember,
    planId: (p.plan_id as MembershipPlanId) || null,
    familySeats: p.family_seats || 1,
    maxFamilySeats: 6,
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    phone: p.phone ?? "",
    birthday: p.birthday ?? "",
    homeAddress: p.home_address ?? "",
    staffRole: p.staff_role ?? undefined,
    restaurantId: p.restaurant_id ?? undefined,
    rewardPoints: p.reward_points ?? 0,
    rewardPointsLifetime: p.reward_points_lifetime ?? 0,
    rewardsClaimed: p.rewards_claimed ?? 0,
    isPlanPrimary: true,
    membershipActivatedAt: p.membership_activated_at ?? undefined,
    membershipRenewsAt: p.membership_renews_at ?? undefined,
  };
}

export async function loadProfile(id: string): Promise<ProfileRow | null> {
  const sb = createOpsClient();
  const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  return data as ProfileRow | null;
}

export async function loadProfileByEmail(email: string): Promise<ProfileRow | null> {
  const sb = createOpsClient();
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data as ProfileRow | null;
}

export async function countActiveMembers(): Promise<number> {
  const sb = createOpsClient();
  const { count } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_member", true)
    .eq("banned", false);
  return count ?? 0;
}

export async function countLiveListings(): Promise<number> {
  const sb = createOpsClient();
  const { count } = await sb
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("approved", true)
    .eq("banned", false);
  return count ?? 0;
}

export function dinerCapReached(n: number) {
  return n >= PLATFORM.earlyCapDiners;
}

export function bizCapReached(n: number) {
  return n >= PLATFORM.earlyCapBusinesses;
}

export function planRenewsAt(planId: string, from = new Date()): string {
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  const months = plan?.months ?? 1;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export async function upsertDirectoryMember(input: {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  plan_id?: string | null;
  is_member?: boolean;
  status?: string;
  email_opt_in?: boolean;
  sms_opt_in?: boolean;
  birthday?: string | null;
  home_address?: string | null;
}) {
  const sb = createOpsClient();
  const email = input.email.trim().toLowerCase();
  const { data: existing } = await sb
    .from("members")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  const row = {
    email,
    first_name: input.first_name ?? null,
    last_name: input.last_name ?? null,
    phone: input.phone ?? null,
    city: input.city ?? "dallas",
    plan_id: input.plan_id ?? null,
    is_member: Boolean(input.is_member),
    status: input.status ?? (input.is_member ? "active" : "waitlist"),
    email_opt_in: Boolean(input.email_opt_in),
    sms_opt_in: Boolean(input.sms_opt_in),
    birthday: input.birthday || null,
    home_address: input.home_address ?? null,
  };
  if (existing?.id) {
    await sb.from("members").update(row).eq("id", existing.id);
  } else {
    await sb.from("members").insert(row);
  }
}

export async function addPoints(
  memberId: string,
  points: number,
  note: string,
) {
  if (!points) return;
  const sb = createOpsClient();
  const p = await loadProfile(memberId);
  if (!p) return;
  await sb
    .from("profiles")
    .update({
      reward_points: (p.reward_points ?? 0) + points,
      reward_points_lifetime: (p.reward_points_lifetime ?? 0) + points,
    })
    .eq("id", memberId);
  await sb.from("reward_ledger").insert({ member_id: memberId, points, note });
}
