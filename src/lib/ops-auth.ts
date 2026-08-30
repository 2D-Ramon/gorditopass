import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { adminHas, loadAdminById, loadAdminsTable, loadOwner } from "./ops-admins";
import type { OpsAdminPublic, OpsPermission } from "./ops-types";
import { createOpsClient, isSupabaseConfigured } from "./supabase";

export const OPS_COOKIE = "gp_ops";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function hasOpsSecret(): boolean {
  return Boolean(process.env.OPS_ADMIN_SECRET);
}

export function signOpsToken(adminId?: string | null): string {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret) throw new Error("OPS_ADMIN_SECRET is not set.");
  const exp = String(Date.now() + MAX_AGE_SEC * 1000);
  const payload = adminId ? `${exp}.${adminId}` : exp;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function parseOpsToken(
  token: string | undefined,
): { exp: number; adminId: string | null } | null {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2 && parts.length !== 3) return null;
  const exp = parts[0];
  const adminId = parts.length === 3 ? parts[1] : null;
  const sig = parts[parts.length - 1];
  const payload = parts.length === 3 ? `${exp}.${adminId}` : exp;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return { exp: Number(exp), adminId };
}

export function verifyOpsToken(token: string | undefined): boolean {
  return parseOpsToken(token) !== null;
}

export function secretsMatch(input: string): boolean {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(input);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export async function readOpsSession(): Promise<{
  unlocked: boolean;
  admin: OpsAdminPublic | null;
  needsAdminTable: boolean;
  hasOwner: boolean;
}> {
  const empty = {
    unlocked: false,
    admin: null as OpsAdminPublic | null,
    needsAdminTable: false,
    hasOwner: false,
  };
  if (!isSupabaseConfigured() || !hasOpsSecret()) return empty;
  const jar = await cookies();
  const parsed = parseOpsToken(jar.get(OPS_COOKIE)?.value);
  if (!parsed) return empty;

  try {
    const supabase = createOpsClient();
    const table = await loadAdminsTable(supabase);
    if (table.missing) {
      return { ...empty, unlocked: true, needsAdminTable: true };
    }
    const owner = await loadOwner(supabase);
    const admin = parsed.adminId
      ? await loadAdminById(supabase, parsed.adminId)
      : null;
    return {
      unlocked: Boolean(admin) || (!owner && parsed.exp > Date.now()),
      admin,
      needsAdminTable: false,
      hasOwner: Boolean(owner),
    };
  } catch {
    return { ...empty, unlocked: true };
  }
}

export async function requireOps(permission?: OpsPermission): Promise<
  | { ok: true; admin: OpsAdminPublic | null }
  | { ok: false; status: number; error: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "Supabase is not connected yet. Add the keys, then unlock ops.",
    };
  }
  if (!hasOpsSecret()) {
    return {
      ok: false,
      status: 503,
      error: "Set OPS_ADMIN_SECRET in your environment.",
    };
  }
  const session = await readOpsSession();
  if (session.needsAdminTable && !permission) {
    if (!session.unlocked) {
      return {
        ok: false,
        status: 401,
        error: "Unlock ops with your admin secret first.",
      };
    }
    return { ok: true, admin: null };
  }
  if (session.hasOwner) {
    if (!session.admin) {
      return {
        ok: false,
        status: 401,
        error: "Sign in with your admin email and password.",
      };
    }
    if (!adminHas(session.admin, permission)) {
      return {
        ok: false,
        status: 403,
        error: "You do not have access to this area.",
      };
    }
    return { ok: true, admin: session.admin };
  }
  if (!session.unlocked) {
    return {
      ok: false,
      status: 401,
      error: "Unlock ops with your admin secret first.",
    };
  }
  return { ok: true, admin: null };
}

export { MAX_AGE_SEC };
