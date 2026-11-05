import { NextResponse } from "next/server";
import { ensureProfileReferralCode, userFromRequest } from "@/lib/market";
import { memberSnapshot, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

const NAME_MAX = 80;
const PHONE_MAX = 30;
const ADDRESS_MAX = 300;
const FAVORITE_MAX = 120;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Empty OK; otherwise optional +, digits, spaces, (), ., - ; at least 7 digits. */
const PHONE_RE = /^\+?[\d\s().-]{7,30}$/;

function trimStr(value: unknown): string {
  return String(value ?? "").trim();
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseOptionalText(
  raw: unknown,
  opts: { max: number; label: string },
): { ok: true; value: string | null } | { ok: false; error: string } {
  const text = trimStr(raw);
  if (text.length > opts.max) {
    return { ok: false, error: `${opts.label} must be at most ${opts.max} characters.` };
  }
  return { ok: true, value: text.length ? text : null };
}

export async function GET(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const withCode = await ensureProfileReferralCode(profile);
  const bundle = await memberSnapshot(withCode);
  return NextResponse.json(bundle);
}

export async function PATCH(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthday?: string;
    homeAddress?: string;
    favoriteRestaurant?: string;
    favoriteFoodType?: string;
  } | null;
  if (!body || typeof body !== "object") {
    return bad("Invalid body.");
  }

  const updates: Record<string, string | null> = {};

  if (body.avatarUrl !== undefined) {
    const avatarUrl = trimStr(body.avatarUrl);
    if (!avatarUrl) return bad("avatarUrl required.");
    if (!avatarUrl.startsWith("https://") && !avatarUrl.startsWith("data:image/")) {
      return bad("Invalid avatar URL.");
    }
    if (avatarUrl.length > 2000) return bad("avatarUrl too long.");
    updates.avatar_url = avatarUrl;
  }

  if (body.firstName !== undefined) {
    const parsed = parseOptionalText(body.firstName, { max: NAME_MAX, label: "First name" });
    if (!parsed.ok) return bad(parsed.error);
    updates.first_name = parsed.value;
  }
  if (body.lastName !== undefined) {
    const parsed = parseOptionalText(body.lastName, { max: NAME_MAX, label: "Last name" });
    if (!parsed.ok) return bad(parsed.error);
    updates.last_name = parsed.value;
  }
  if (body.phone !== undefined) {
    const phone = trimStr(body.phone);
    if (phone.length > PHONE_MAX) return bad(`Phone must be at most ${PHONE_MAX} characters.`);
    if (phone) {
      const digits = phone.replace(/\D/g, "");
      if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15) {
        return bad("Invalid phone format.");
      }
    }
    updates.phone = phone || null;
  }
  if (body.birthday !== undefined) {
    const birthday = trimStr(body.birthday);
    if (birthday) {
      if (!DATE_RE.test(birthday)) {
        return bad("Birthday must be YYYY-MM-DD.");
      }
      const t = Date.parse(`${birthday}T00:00:00Z`);
      if (Number.isNaN(t)) return bad("Invalid birthday date.");
      const year = Number(birthday.slice(0, 4));
      if (year < 1900 || year > new Date().getUTCFullYear()) {
        return bad("Birthday year out of range.");
      }
    }
    updates.birthday = birthday || null;
  }
  if (body.homeAddress !== undefined) {
    const parsed = parseOptionalText(body.homeAddress, {
      max: ADDRESS_MAX,
      label: "Home address",
    });
    if (!parsed.ok) return bad(parsed.error);
    updates.home_address = parsed.value;
  }
  if (body.favoriteRestaurant !== undefined) {
    const parsed = parseOptionalText(body.favoriteRestaurant, {
      max: FAVORITE_MAX,
      label: "Favorite restaurant",
    });
    if (!parsed.ok) return bad(parsed.error);
    updates.favorite_restaurant = parsed.value;
  }
  if (body.favoriteFoodType !== undefined) {
    const parsed = parseOptionalText(body.favoriteFoodType, {
      max: FAVORITE_MAX,
      label: "Favorite food type",
    });
    if (!parsed.ok) return bad(parsed.error);
    updates.favorite_food_type = parsed.value;
  }

  if (Object.keys(updates).length === 0) {
    return bad("No profile fields to update.");
  }

  const sb = createOpsClient();
  const { error } = await sb.from("profiles").update(updates).eq("id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const bundle = await snapshotAfter(profile.id);
  return NextResponse.json(bundle);
}
