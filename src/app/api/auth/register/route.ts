import { NextResponse } from "next/server";
import {
  countActiveMembers,
  dinerCapReached,
  upsertDirectoryMember,
} from "@/lib/market";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not connected yet." },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const first_name = String(body?.first_name ?? "").trim();
  const last_name = String(body?.last_name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const role = body?.role === "restaurant" ? "restaurant" : "diner";
  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { error: "Valid email and a password of 8+ characters are required." },
      { status: 400 },
    );
  }
  if (role === "diner") {
    const n = await countActiveMembers();
    if (dinerCapReached(n)) {
      return NextResponse.json(
        { error: "Early access is full for diners right now. Join the waitlist from Membership." },
        { status: 403 },
      );
    }
  }
  const sb = createOpsClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name, phone, role },
  });
  if (error || !data.user) {
    const msg = error?.message ?? "Could not create account.";
    if (/already/i.test(msg)) {
      return NextResponse.json(
        { error: "That email already has an account. Sign in instead." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await sb
    .from("profiles")
    .update({
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      role,
      email_opt_in: Boolean(body?.email_opt_in),
      sms_opt_in: Boolean(body?.sms_opt_in),
    })
    .eq("id", data.user.id);

  if (role === "diner") {
    await upsertDirectoryMember({
      email,
      first_name,
      last_name,
      phone,
      status: "waitlist",
      is_member: false,
      email_opt_in: Boolean(body?.email_opt_in),
      sms_opt_in: Boolean(body?.sms_opt_in),
    });
  }
  return NextResponse.json({ ok: true, email });
}
