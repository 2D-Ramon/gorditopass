import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertDirectoryMember } from "@/lib/market";

const STORE_EMAIL = "access-codes@gorditopass.internal";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type AccessCodeKind = "individual" | "limited" | "promo";

export type AccessCodeUse = {
  profileId: string;
  email: string;
  usedAt: string;
  accessUntil: string;
};

export type AccessCode = {
  id: string;
  code: string;
  label: string;
  kind: AccessCodeKind;
  maxUses: number | null;
  accessDays: number | null;
  redeemUntil: string | null;
  active: boolean;
  createdAt: string;
  uses: AccessCodeUse[];
};

function parseCodes(notes: string | null): AccessCode[] {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes);
    return Array.isArray(parsed) ? (parsed as AccessCode[]) : [];
  } catch {
    return [];
  }
}

export function isAccessCodeStore(email: string | null | undefined) {
  return String(email ?? "").toLowerCase() === STORE_EMAIL;
}

async function readStore(sb: SupabaseClient): Promise<{ id: string; notes: string; codes: AccessCode[] }> {
  const { data } = await sb
    .from("members")
    .select("id, notes")
    .eq("email", STORE_EMAIL)
    .maybeSingle();
  if (data?.id) {
    if (data.notes == null) {
      await sb.from("members").update({ notes: "[]" }).eq("id", data.id).is("notes", null);
      return { id: data.id, notes: "[]", codes: [] };
    }
    const notes = String(data.notes);
    return { id: data.id, notes, codes: parseCodes(notes) };
  }
  const { data: created, error } = await sb
    .from("members")
    .insert({
      email: STORE_EMAIL,
      first_name: "Access",
      last_name: "codes",
      status: "cancelled",
      is_member: false,
      notes: "[]",
    })
    .select("id, notes")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not store access codes.");
  return { id: created.id, notes: "[]", codes: [] };
}

async function writeStore(
  sb: SupabaseClient,
  id: string,
  previousNotes: string,
  codes: AccessCode[],
) {
  const notes = JSON.stringify(codes);
  const { data, error } = await sb
    .from("members")
    .update({ notes })
    .eq("id", id)
    .eq("notes", previousNotes)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export function makeAccessCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let body = "";
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  return `GP-${body}`;
}

export async function listAccessCodes(sb: SupabaseClient) {
  const store = await readStore(sb);
  return store.codes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAccessCode(
  sb: SupabaseClient,
  input: {
    kind: AccessCodeKind;
    label?: string;
    maxUses?: number | null;
    accessDays?: number | null;
    redeemUntil?: string | null;
  },
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const store = await readStore(sb);
    const code = makeAccessCode();
    const row: AccessCode = {
      id: crypto.randomUUID(),
      code,
      label: (input.label ?? "").trim(),
      kind: input.kind,
      maxUses:
        input.kind === "individual"
          ? 1
          : input.kind === "limited"
            ? Math.max(1, Number(input.maxUses) || 1)
            : null,
      accessDays:
        input.kind === "promo" ? null : Math.max(1, Number(input.accessDays) || 30),
      redeemUntil: input.redeemUntil || null,
      active: true,
      createdAt: new Date().toISOString(),
      uses: [],
    };
    const saved = await writeStore(sb, store.id, store.notes, [row, ...store.codes]);
    if (saved) return row;
  }
  throw new Error("Could not save the code. Try again.");
}

export async function setAccessCodeActive(sb: SupabaseClient, id: string, active: boolean) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const store = await readStore(sb);
    const codes = store.codes.map((c) => (c.id === id ? { ...c, active } : c));
    const saved = await writeStore(sb, store.id, store.notes, codes);
    if (saved) return codes.find((c) => c.id === id) ?? null;
  }
  throw new Error("Could not update the code. Try again.");
}

function codeOpen(code: AccessCode, now: number) {
  if (!code.active) return "This code is turned off.";
  if (code.redeemUntil && new Date(code.redeemUntil).getTime() < now) {
    return "This code has expired.";
  }
  if (code.maxUses != null && code.uses.length >= code.maxUses) {
    return "This code has already been used.";
  }
  return "";
}

export async function redeemAccessCode(
  sb: SupabaseClient,
  profile: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    city?: string | null;
    plan_id?: string | null;
    membership_renews_at?: string | null;
    banned?: boolean;
  },
  rawCode: string,
) {
  if (profile.banned) throw new Error("This account is closed.");
  const wanted = rawCode.trim().toUpperCase();
  if (!wanted) throw new Error("Enter a code.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const store = await readStore(sb);
    const code = store.codes.find((c) => c.code.toUpperCase() === wanted);
    if (!code) throw new Error("That code was not found.");
    const blocked = codeOpen(code, Date.now());
    if (blocked) throw new Error(blocked);
    if (code.uses.some((u) => u.profileId === profile.id)) {
      throw new Error("This account already used that code.");
    }
    const now = new Date();
    let until: Date;
    if (code.kind === "promo") {
      until = new Date(code.redeemUntil || now.toISOString());
    } else {
      const current = profile.membership_renews_at
        ? new Date(profile.membership_renews_at)
        : null;
      const base = current && current.getTime() > now.getTime() ? current : now;
      until = new Date(base);
      until.setDate(until.getDate() + (code.accessDays ?? 30));
    }
    if (until.getTime() <= now.getTime()) {
      throw new Error("This code has expired.");
    }
    const use: AccessCodeUse = {
      profileId: profile.id,
      email: profile.email,
      usedAt: now.toISOString(),
      accessUntil: until.toISOString(),
    };
    const codes = store.codes.map((c) =>
      c.id === code.id ? { ...c, uses: [...c.uses, use] } : c,
    );
    const saved = await writeStore(sb, store.id, store.notes, codes);
    if (!saved) continue;

    const days = code.accessDays ?? 30;
    const planId =
      profile.plan_id ||
      (code.kind === "promo"
        ? "monthly"
        : days >= 300
          ? "annual"
          : days >= 150
            ? "six_month"
            : "monthly");
    const patch: {
      is_member: boolean;
      plan_id: string;
      membership_renews_at: string;
      membership_activated_at?: string;
    } = {
      is_member: true,
      plan_id: planId,
      membership_renews_at: until.toISOString(),
    };
    if (!profile.membership_renews_at) patch.membership_activated_at = now.toISOString();
    const { error } = await sb.from("profiles").update(patch).eq("id", profile.id);
    if (error) throw new Error(error.message);
    await upsertDirectoryMember({
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      city: profile.city,
      plan_id: planId,
      is_member: true,
      status: "active",
    });
    return { code: code.code, accessUntil: until.toISOString(), kind: code.kind };
  }
  throw new Error("Could not apply the code. Try again.");
}
