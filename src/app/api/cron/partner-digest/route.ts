import { NextResponse } from "next/server";
import { startOfWeek } from "@/lib/partner-insights";
import { createOpsClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const sb = createOpsClient();
  const week0 = startOfWeek(Date.now());
  const weekStart = new Date(week0).toISOString().slice(0, 10);
  const { data: listings } = await sb
    .from("listings")
    .select("id, name, owner_email, city")
    .eq("approved", true)
    .eq("banned", false);
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://gorditopass.vercel.app";
  const from =
    process.env.RESEND_FROM?.trim() || "GorditoPass <beth.t@example.com>";
  const resend = process.env.RESEND_API_KEY?.trim();
  let sent = 0;
  for (const listing of listings ?? []) {
    const { data: codes } = await sb
      .from("redeem_codes")
      .select("member_id, deal_title, used_at")
      .eq("restaurant_id", listing.id)
      .eq("status", "used")
      .gte("used_at", new Date(week0).toISOString());
    const scans = codes?.length ?? 0;
    const byMember = new Map<string, number>();
    const dealCount = new Map<string, number>();
    for (const c of codes ?? []) {
      byMember.set(c.member_id, (byMember.get(c.member_id) ?? 0) + 1);
      const t = c.deal_title || "Deal";
      dealCount.set(t, (dealCount.get(t) ?? 0) + 1);
    }
    const repeats = [...byMember.values()].filter((n) => n >= 2).length;
    const newMembers = [...byMember.entries()].filter(([, n]) => n === 1).length;
    const topDeal = [...dealCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    await sb.from("partner_digests").upsert(
      {
        restaurant_id: listing.id,
        week_start: weekStart,
        scans,
        repeats,
        new_members: newMembers,
        top_deal: topDeal,
        sent_at: new Date().toISOString(),
      },
      { onConflict: "restaurant_id,week_start" },
    );
    const email = listing.owner_email?.trim();
    if (!email || !resend) continue;
    const html = `
      <p>Hi — here's ${listing.name}'s GorditoPass week.</p>
      <p><strong>${scans}</strong> member scans · <strong>${repeats}</strong> repeats ·
      <strong>${newMembers}</strong> first-timers${topDeal ? ` · top offer: ${topDeal}` : ""}.</p>
      <p>
        <a href="${site}/restaurant/dashboard?tab=home">Open deal scoreboard</a>
        ·
        <a href="${site}/restaurant/dashboard?tab=members">Open my members</a>
      </p>
      <p>This email is a recap only. Asking members back by text is an optional paid add-on.</p>
    `;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${listing.name}: ${scans} Gordito visits this week`,
        html,
      }),
    });
    if (res.ok) sent += 1;
  }
  return NextResponse.json({
    ok: true,
    restaurants: listings?.length ?? 0,
    emailed: sent,
  });
}
