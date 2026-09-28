import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SCAN_PIN_EMAIL } from "@/lib/staff-pin";
import { loadRestaurantInsights } from "@/lib/load-restaurant-insights";
import { jsonError, withOps } from "../../_util";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function literalIlike(value: string) {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

async function rows(
  sb: SupabaseClient,
  table: string,
  restaurantId: string,
) {
  const { data, error } = await sb
    .from(table)
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) return [] as Record<string, unknown>[];
  return (data ?? []) as Record<string, unknown>[];
}

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const sb = gate.supabase;
  const loaded = await loadRestaurantInsights(sb, id);
  const listing = loaded.listing;
  if (!listing) return jsonError("Restaurant not found.", 404);

  const ownerEmail = String(listing.owner_email ?? "").trim();
  const name = String(listing.name ?? "").trim();
  const emptyApps = Promise.resolve({
    data: [] as Record<string, unknown>[],
    error: null,
  });

  const [byListing, byEmail, byName, staffRows, profiles, events, jobs, messages, reviewRows, reports, countRes] =
    await Promise.all([
      sb.from("partner_applications").select("*").eq("listing_id", id),
      ownerEmail
        ? sb.from("partner_applications").select("*").ilike("email", literalIlike(ownerEmail))
        : emptyApps,
      name
        ? sb.from("partner_applications").select("*").ilike("name", literalIlike(name))
        : emptyApps,
      rows(sb, "listing_staff", id),
      sb
        .from("profiles")
        .select("email, first_name, last_name, phone, staff_role, role")
        .eq("restaurant_id", id),
      rows(sb, "listing_events", id),
      rows(sb, "listing_jobs", id),
      rows(sb, "listing_messages", id),
      rows(sb, "plate_reviews", id),
      rows(sb, "redeem_reports", id),
      sb
        .from("redeem_codes")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id)
        .eq("status", "used"),
    ]);

  function appRows(res: { data: unknown[] | null; error: unknown }) {
    if (res.error || !res.data) return [] as Record<string, unknown>[];
    return res.data as Record<string, unknown>[];
  }
  const linked = appRows(byListing);
  const emailed = appRows(byEmail);
  const named = appRows(byName);
  const applications = (linked.length ? linked : emailed.length ? emailed : named).sort(
    (a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
  );

  const staff = new Map<
    string,
    { email: string; name: string; role: string; phone: string; active: boolean }
  >();
  for (const row of staffRows) {
    const email = String(row.email ?? "").trim();
    if (!email || email === SCAN_PIN_EMAIL) continue;
    staff.set(email.toLowerCase(), {
      email,
      name: String(row.name ?? email),
      role: String(row.staff_role ?? "employee"),
      phone: "",
      active: row.active !== false,
    });
  }
  for (const p of profiles.error ? [] : (profiles.data ?? [])) {
    const email = String(p.email ?? "").trim();
    if (!email || email === SCAN_PIN_EMAIL) continue;
    const prev = staff.get(email.toLowerCase());
    const full = [p.first_name, p.last_name].filter(Boolean).join(" ");
    staff.set(email.toLowerCase(), {
      email,
      name: full || prev?.name || email,
      role: String(p.staff_role || prev?.role || "staff"),
      phone: String(p.phone ?? prev?.phone ?? ""),
      active: prev?.active ?? true,
    });
  }

  const reviewIds = reviewRows.map((r) => String(r.id));
  const replyRes = reviewIds.length
    ? await sb.from("plate_review_replies").select("*").in("review_id", reviewIds)
    : { data: [], error: null };
  const replyMap = new Map(
    (replyRes.error ? [] : (replyRes.data ?? [])).map((r) => [String(r.review_id), r]),
  );

  return NextResponse.json({
    ...loaded.insights,
    messages: messages.map((m) => ({
      id: String(m.id),
      from_role: String(m.from_role ?? ""),
      from_name: String(m.from_name ?? ""),
      body: String(m.body ?? ""),
      created_at: String(m.created_at ?? ""),
    })),
    reviews: reviewRows.map((r) => {
      const reply = replyMap.get(String(r.id));
      return {
        id: String(r.id),
        author: String(r.author ?? "Member"),
        plates: Number(r.plates ?? 0),
        text: String(r.body ?? ""),
        createdAt: String(r.created_at ?? ""),
        dealTitle: r.deal_title ? String(r.deal_title) : undefined,
        reply: reply
          ? { body: String(reply.body ?? ""), at: String(reply.created_at ?? "") }
          : null,
      };
    }),
    reports: reports.map((r) => ({
      id: String(r.id),
      code: String(r.code ?? ""),
      note: String(r.note ?? ""),
      memberName: String(r.member_name ?? ""),
      createdAt: String(r.created_at ?? ""),
    })),
    redemptionCount: countRes.count ?? loaded.insights.scans.length,
    listing: {
      id: String(listing.id),
      name: String(listing.name ?? ""),
      emoji: String(listing.emoji ?? "🍽️"),
      cuisine: String(listing.cuisine ?? ""),
      city: String(listing.city ?? ""),
      neighborhood: String(listing.neighborhood ?? ""),
      address: String(listing.address ?? ""),
      hours: String(listing.hours ?? ""),
      story: String(listing.story ?? ""),
      tagline: String(listing.tagline ?? ""),
      approved: listing.approved !== false && listing.banned !== true,
      banned: listing.banned === true,
      ownerEmail: ownerEmail,
      openStatus: String(listing.open_status ?? "hours"),
      phone: String(listing.phone ?? ""),
    },
    applications,
    staff: [...staff.values()],
    promotions: loaded.deals.map((d) => ({
      id: String(d.id),
      title: String(d.title ?? ""),
      description: String(d.description ?? ""),
      type: String(d.type ?? ""),
      value: d.value == null ? null : Number(d.value),
      regularPriceUsd: d.regular_price_usd == null ? null : Number(d.regular_price_usd),
      status: String(d.status ?? ""),
      active: d.active !== false,
      hidden: d.hidden === true,
      soldOut: d.sold_out === true,
    })),
    menu: loaded.menu.map((m) => ({
      id: String(m.id),
      name: String(m.name ?? ""),
      description: String(m.description ?? ""),
      category: String(m.category ?? ""),
      priceUsd: Number(m.price_usd ?? 0),
      status: String(m.status ?? ""),
      active: m.active !== false,
      hidden: m.hidden === true,
      soldOut: m.sold_out === true,
    })),
    events: events.map((e) => ({
      id: String(e.id),
      title: String(e.title ?? ""),
      description: String(e.description ?? ""),
      date: String(e.event_date ?? ""),
      time: String(e.event_time ?? ""),
      address: String(e.address ?? ""),
      status: String(e.status ?? ""),
      hidden: e.hidden === true,
    })),
    jobs: jobs.map((j) => ({
      id: String(j.id),
      title: String(j.title ?? ""),
      description: String(j.description ?? ""),
      type: String(j.job_type ?? ""),
      payRange: String(j.pay_range ?? ""),
      applyUrl: String(j.apply_url ?? ""),
      status: String(j.status ?? ""),
      hidden: j.hidden === true,
    })),
  });
}
