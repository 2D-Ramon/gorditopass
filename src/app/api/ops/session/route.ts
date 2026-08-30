import { NextResponse } from "next/server";
import {
  cookieOptions,
  hasOpsSecret,
  OPS_COOKIE,
  secretsMatch,
  signOpsToken,
} from "@/lib/ops-auth";
import {
  ALL_ACCESS,
  hashPassword,
  loadAdminsTable,
  loadOwner,
  toPublicAdmin,
  verifyPassword,
} from "@/lib/ops-admins";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

type Body = {
  action?: string;
  secret?: string;
  email?: string;
  password?: string;
  name?: string;
};

function setSession(res: NextResponse, adminId?: string | null) {
  res.cookies.set(OPS_COOKIE, signOpsToken(adminId), cookieOptions());
  return res;
}

export async function POST(req: Request) {
  if (!hasOpsSecret()) {
    return NextResponse.json(
      { error: "Set OPS_ADMIN_SECRET in your environment first." },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  const name = body?.name?.trim() ?? "";
  const secret = body?.secret?.trim() ?? "";
  const creatingOwner =
    body?.action === "create_owner" ||
    Boolean(secret && name && email && password);

  if (creatingOwner && isSupabaseConfigured()) {
    if (!secretsMatch(secret)) {
      return NextResponse.json(
        { error: "That secret does not match." },
        { status: 401 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    const supabase = createOpsClient();
    const table = await loadAdminsTable(supabase);
    if (table.missing) {
      return NextResponse.json(
        { error: "Run supabase/admins.sql in the SQL editor first." },
        { status: 503 },
      );
    }
    const owner = await loadOwner(supabase);
    if (owner) {
      return NextResponse.json(
        { error: "An owner admin already exists. Sign in with email instead." },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from("ops_admins")
      .insert({
        email,
        name,
        password_hash: hashPassword(password),
        is_owner: true,
        active: true,
        ...ALL_ACCESS,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "That email is already an admin." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const admin = toPublicAdmin(data);
    const res = NextResponse.json({ ok: true, admin });
    return setSession(res, admin.id);
  }

  if (email && password && !secret && isSupabaseConfigured()) {
    const supabase = createOpsClient();
    const table = await loadAdminsTable(supabase);
    if (table.missing) {
      return NextResponse.json(
        { error: "Run supabase/admins.sql in the SQL editor first." },
        { status: 503 },
      );
    }
    const { data, error } = await supabase
      .from("ops_admins")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();
    if (error || !data || !verifyPassword(password, String(data.password_hash))) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }
    const admin = toPublicAdmin(data);
    const res = NextResponse.json({ ok: true, admin });
    return setSession(res, admin.id);
  }

  if (secret) {
    if (!secretsMatch(secret)) {
      return NextResponse.json(
        { error: "That secret does not match." },
        { status: 401 },
      );
    }
    if (isSupabaseConfigured()) {
      const supabase = createOpsClient();
      const table = await loadAdminsTable(supabase);
      if (!table.missing) {
        const owner = await loadOwner(supabase);
        if (owner) {
          return NextResponse.json(
            {
              error:
                "Owner account is set. Sign in with your admin email and password.",
            },
            { status: 401 },
          );
        }
      }
    }
    const res = NextResponse.json({ ok: true });
    return setSession(res, null);
  }

  return NextResponse.json(
    { error: "Enter email and password, or the ops secret." },
    { status: 400 },
  );
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
