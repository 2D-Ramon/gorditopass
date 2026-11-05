import { NextResponse } from "next/server";
import { asCity } from "@/lib/listing-map";
import { requirePartner } from "@/app/api/partner/_guard";
import { createOpsClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const { profile, error: guardError } = await requirePartner(req);
  if (!profile) return guardError!;
  const sb = createOpsClient();
  const { data } = await sb
    .from("listing_jobs")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: Request) {
  const { profile, error: guardError } = await requirePartner(req);
  if (!profile) return guardError!;
  if (profile.staff_role === "employee") {
    return NextResponse.json({ error: "Employees cannot manage jobs." }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const sb = createOpsClient();
  const id = `job-${profile.restaurant_id}-${Date.now()}`;
  const { data: listing } = await sb
    .from("listings")
    .select("name, city")
    .eq("id", profile.restaurant_id)
    .maybeSingle();
  const { error } = await sb.from("listing_jobs").insert({
    id,
    restaurant_id: profile.restaurant_id,
    restaurant_name: listing?.name ?? "",
    title,
    description: String(body?.description ?? "").trim(),
    job_type: body?.type || "part-time",
    city: asCity(body?.city || listing?.city || profile.city || "dallas"),
    pay_range: body?.payRange || null,
    apply_url: body?.applyUrl || null,
    status: "pending",
    hidden: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, status: "pending" });
}
