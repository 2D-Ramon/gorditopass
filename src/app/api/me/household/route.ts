import { NextResponse } from "next/server";
import { MAX_FAMILY_SEATS } from "@/lib/pricing";
import { loadProfile, userFromRequest } from "@/lib/market";
import { recomputeMember, snapshotAfter } from "@/lib/member-state";
import { createOpsClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    homeAddress?: string;
  } | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  const sb = createOpsClient();
  const { count } = await sb
    .from("household_seats")
    .select("id", { count: "exact", head: true })
    .eq("primary_member_id", profile.id);
  const seats = Math.max(profile.family_seats ?? 1, count ?? 0);
  if (seats >= MAX_FAMILY_SEATS) {
    return NextResponse.json(
      { error: `Max ${MAX_FAMILY_SEATS} seats on a plan.` },
      { status: 400 },
    );
  }
  const { error } = await sb.from("household_seats").insert({
    primary_member_id: profile.id,
    email,
    first_name: String(body?.firstName ?? "").trim() || null,
    last_name: String(body?.lastName ?? "").trim() || null,
    phone: String(body?.phone ?? "").trim() || null,
    birthday: body?.birthday || null,
    home_address: String(body?.homeAddress ?? "").trim() || null,
    is_primary: false,
  });
  if (error) {
    return NextResponse.json(
      { error: error.message.includes("unique") ? "That email already has a seat." : "Could not add seat. Run member_activity.sql in Supabase." },
      { status: 400 },
    );
  }
  const nextSeats = Math.min(MAX_FAMILY_SEATS, seats + 1);
  await sb.from("profiles").update({ family_seats: nextSeats }).eq("id", profile.id);
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json({ ok: true, ...bundle });
}

export async function DELETE(req: Request) {
  const profile = await userFromRequest(req);
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing seat." }, { status: 400 });
  const sb = createOpsClient();
  const { data: seat } = await sb
    .from("household_seats")
    .select("*")
    .eq("id", id)
    .eq("primary_member_id", profile.id)
    .maybeSingle();
  if (!seat) return NextResponse.json({ error: "Seat not found." }, { status: 404 });
  if (seat.is_primary) {
    return NextResponse.json({ error: "Cannot remove the primary billing seat." }, { status: 400 });
  }
  await sb.from("household_seats").delete().eq("id", id);
  const fresh = await loadProfile(profile.id);
  const next = Math.max(1, (fresh?.family_seats ?? 1) - 1);
  await sb.from("profiles").update({ family_seats: next }).eq("id", profile.id);
  const newBadges = await recomputeMember(profile.id);
  const bundle = await snapshotAfter(profile.id, { newBadges });
  return NextResponse.json({ ok: true, ...bundle });
}
