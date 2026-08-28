import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./supabase";

export const OPS_COOKIE = "gp_ops";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function hasOpsSecret(): boolean {
  return Boolean(process.env.OPS_ADMIN_SECRET);
}

export function signOpsToken(): string {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret) throw new Error("OPS_ADMIN_SECRET is not set.");
  const exp = String(Date.now() + MAX_AGE_SEC * 1000);
  const sig = createHmac("sha256", secret).update(exp).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyOpsToken(token: string | undefined): boolean {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expected = createHmac("sha256", secret).update(exp).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  if (Number(exp) < Date.now()) return false;
  return true;
}

export function secretsMatch(input: string): boolean {
  const secret = process.env.OPS_ADMIN_SECRET;
  if (!secret) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(input);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function requireOps(): Promise<
  { ok: true } | { ok: false; status: number; error: string }
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
  const jar = await cookies();
  if (!verifyOpsToken(jar.get(OPS_COOKIE)?.value)) {
    return {
      ok: false,
      status: 401,
      error: "Unlock ops with your admin secret first.",
    };
  }
  return { ok: true };
}

export { MAX_AGE_SEC };
