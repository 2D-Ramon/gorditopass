import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpsAdminPublic, OpsPermission } from "./ops-types";

export const OPS_PERMISSIONS: { id: OpsPermission; label: string }[] = [
  { id: "can_crm", label: "Business CRM" },
  { id: "can_members", label: "Members" },
  { id: "can_campaigns", label: "Campaigns" },
  { id: "can_applications", label: "Restaurant applications" },
  { id: "can_content", label: "Deals, menu, events, jobs, auto-approve" },
  { id: "can_restaurants", label: "Restaurants" },
  { id: "can_feed", label: "Feed moderation" },
  { id: "can_manage_admins", label: "Add and remove admins" },
];

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== test.length) return false;
  return timingSafeEqual(expected, test);
}

export function toPublicAdmin(row: Record<string, unknown>): OpsAdminPublic {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    is_owner: Boolean(row.is_owner),
    active: row.active !== false,
    can_crm: Boolean(row.can_crm),
    can_members: Boolean(row.can_members),
    can_campaigns: Boolean(row.can_campaigns),
    can_applications: Boolean(row.can_applications),
    can_content: Boolean(row.can_content),
    can_restaurants: Boolean(row.can_restaurants),
    can_feed: Boolean(row.can_feed),
    can_manage_admins: Boolean(row.can_manage_admins),
    created_at: String(row.created_at ?? ""),
  };
}

export function adminHas(
  admin: OpsAdminPublic | null,
  permission?: OpsPermission,
): boolean {
  if (!permission) return true;
  if (!admin) return false;
  if (admin.is_owner) return true;
  return Boolean(admin[permission]);
}

export async function loadAdminsTable(supabase: SupabaseClient): Promise<{
  ok: boolean;
  missing: boolean;
  error?: string;
}> {
  const { error } = await supabase.from("ops_admins").select("id").limit(1);
  if (!error) return { ok: true, missing: false };
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return { ok: false, missing: true };
  }
  return { ok: false, missing: false, error: error.message };
}

export async function loadAdminById(
  supabase: SupabaseClient,
  id: string,
): Promise<OpsAdminPublic | null> {
  const { data, error } = await supabase
    .from("ops_admins")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return toPublicAdmin(data);
}

export async function loadOwner(
  supabase: SupabaseClient,
): Promise<OpsAdminPublic | null> {
  const { data, error } = await supabase
    .from("ops_admins")
    .select("*")
    .eq("is_owner", true)
    .maybeSingle();
  if (error || !data) return null;
  return toPublicAdmin(data);
}

export const ALL_ACCESS = {
  can_crm: true,
  can_members: true,
  can_campaigns: true,
  can_applications: true,
  can_content: true,
  can_restaurants: true,
  can_feed: true,
  can_manage_admins: true,
} as const;
