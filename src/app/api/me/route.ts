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

type Field =
  | "avatarUrl"
  | "firstName"
  | "lastName"
  | "phone"
  | "birthday"
  | "homeAddress"
  | "favoriteRestaurant"
  | "favoriteFoodType";

function bad(message: string, field?: Field, status = 400) {
  return NextResponse.json(
    field ? { error: message, field } : { error: message },
    { status },
  );
}

function asString(
  raw: unknown,
  field: Field,
  label: string,
): { ok: true; value: string } | { ok: false; response: NextResponse } {
  if (typeof raw !== "string") {
    return {
      ok: false,
      response: bad(`${label} must be a string.`, field),
    };
  }
  return { ok: true, value: raw };
}

function parseOptionalText(
  raw: unknown,
  opts: { max: number; label: string; field: Field },
):
  | { ok: true; value: string | null }
  | { ok: false; response: NextResponse } {
  const checked = asString(raw, opts.field, opts.label);
  if (!checked.ok) return checked;
  const text = checked.value.trim();
  if (text.length > opts.max) {
    return {
      ok: false,
      response: bad(
        `${opts.label} must be at most ${opts.max} characters.`,
        opts.field,
      ),
    };
  }
  return { ok: true, value: text.length ? text : null };
}

/** True only for a real Gregorian calendar day (rejects 2001-02-30, etc.). */
function isRealCalendarDate(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false;
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  const d = Number(ymd.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function todayUtcYmd(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: Request) {
  try {
    const profile = await userFromRequest(req);
    if (!profile) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const withCode = await ensureProfileReferralCode(profile);
    const bundle = await memberSnapshot(withCode);
    return NextResponse.json(bundle);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const profile = await userFromRequest(req);
    if (!profile) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return bad("Invalid body.");
    }

    const updates: Record<string, string | null> = {};

    if (body.avatarUrl !== undefined) {
      const checked = asString(body.avatarUrl, "avatarUrl", "Avatar URL");
      if (!checked.ok) return checked.response;
      const avatarUrl = checked.value.trim();
      if (!avatarUrl) return bad("avatarUrl required.", "avatarUrl");
      if (
        !avatarUrl.startsWith("https://") &&
        !avatarUrl.startsWith("data:image/")
      ) {
        return bad("Invalid avatar URL.", "avatarUrl");
      }
      if (avatarUrl.length > 2000) {
        return bad("avatarUrl too long.", "avatarUrl");
      }
      updates.avatar_url = avatarUrl;
    }

    if (body.firstName !== undefined) {
      if (body.firstName === null) {
        return bad("First name is required.", "firstName");
      }
      const checked = asString(body.firstName, "firstName", "First name");
      if (!checked.ok) return checked.response;
      const text = checked.value.trim();
      if (!text) return bad("First name is required.", "firstName");
      if (text.length > NAME_MAX) {
        return bad(
          `First name must be at most ${NAME_MAX} characters.`,
          "firstName",
        );
      }
      updates.first_name = text;
    }
    if (body.lastName !== undefined) {
      const parsed = parseOptionalText(body.lastName, {
        max: NAME_MAX,
        label: "Last name",
        field: "lastName",
      });
      if (!parsed.ok) return parsed.response;
      updates.last_name = parsed.value;
    }
    if (body.phone !== undefined) {
      const checked = asString(body.phone, "phone", "Phone");
      if (!checked.ok) return checked.response;
      const phone = checked.value.trim();
      if (phone.length > PHONE_MAX) {
        return bad(`Phone must be at most ${PHONE_MAX} characters.`, "phone");
      }
      if (phone) {
        const digits = phone.replace(/\D/g, "");
        if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15) {
          return bad("Invalid phone format.", "phone");
        }
      }
      updates.phone = phone || null;
    }
    if (body.birthday !== undefined) {
      const checked = asString(body.birthday, "birthday", "Birthday");
      if (!checked.ok) return checked.response;
      const birthday = checked.value.trim();
      if (birthday) {
        if (!DATE_RE.test(birthday)) {
          return bad("Birthday must be YYYY-MM-DD.", "birthday");
        }
        if (!isRealCalendarDate(birthday)) {
          return bad("Invalid birthday date.", "birthday");
        }
        const year = Number(birthday.slice(0, 4));
        if (year < 1900) {
          return bad("Birthday year out of range.", "birthday");
        }
        if (birthday > todayUtcYmd()) {
          return bad("Birthday cannot be in the future.", "birthday");
        }
      }
      updates.birthday = birthday || null;
    }
    if (body.homeAddress !== undefined) {
      const parsed = parseOptionalText(body.homeAddress, {
        max: ADDRESS_MAX,
        label: "Home address",
        field: "homeAddress",
      });
      if (!parsed.ok) return parsed.response;
      updates.home_address = parsed.value;
    }
    if (body.favoriteRestaurant !== undefined) {
      const parsed = parseOptionalText(body.favoriteRestaurant, {
        max: FAVORITE_MAX,
        label: "Favorite restaurant",
        field: "favoriteRestaurant",
      });
      if (!parsed.ok) return parsed.response;
      updates.favorite_restaurant = parsed.value;
    }
    if (body.favoriteFoodType !== undefined) {
      const parsed = parseOptionalText(body.favoriteFoodType, {
        max: FAVORITE_MAX,
        label: "Favorite food type",
        field: "favoriteFoodType",
      });
      if (!parsed.ok) return parsed.response;
      updates.favorite_food_type = parsed.value;
    }

    if (Object.keys(updates).length === 0) {
      return bad("No profile fields to update.");
    }

    const sb = createOpsClient();
    const { error } = await sb.from("profiles").update(updates).eq("id", profile.id);
    if (error) {
      return NextResponse.json(
        { error: "Could not save profile." },
        { status: 500 },
      );
    }
    const bundle = await snapshotAfter(profile.id);
    return NextResponse.json(bundle);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
