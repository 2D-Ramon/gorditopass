export type ScanEvent = {
  at: string;
  dealId: string;
  dealTitle: string;
  memberId: string;
  firstName: string;
  lastInitial: string;
  staffName: string;
  revenueUsd: number;
};

export type CompletenessInput = {
  hours: string;
  address: string;
  story: string;
  liveDeals: number;
  menuItems: number;
  photos: number;
  openStatus: string;
};

export type MemberRow = {
  memberId: string;
  firstName: string;
  lastInitial: string;
  visits: number;
  lastVisit: string;
  lastDeal: string;
  pattern: "new" | "regular" | "lapsed";
};

export type DealRow = {
  dealId: string;
  title: string;
  thisWeek: number;
  lastWeek: number;
  revenueThisWeek: number;
};

export type InsightsPayload = {
  thisWeek: { scans: number; revenue: number; newMembers: number; repeats: number };
  lastWeek: { scans: number; revenue: number; newMembers: number; repeats: number };
  deals: DealRow[];
  members: MemberRow[];
  busyHours: { hour: number; count: number }[];
  busyDays: { day: string; count: number }[];
  completeness: { score: number; missing: string[] };
  suggestion: string;
  benchmark: { you: number; cityAvg: number; cityLabel: string };
  memberShare: { visits: number; typicalTickets: number | null; note: string };
  scans: ScanEvent[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function startOfWeek(ts: number) {
  const d = new Date(ts);
  const offset = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

function inRange(iso: string, start: number, end: number) {
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}

function displayName(first: string, lastInitial: string) {
  const f = first.trim() || "Member";
  return lastInitial ? `${f} ${lastInitial}.` : f;
}

export function completenessOf(listing: CompletenessInput) {
  const missing: string[] = [];
  let score = 0;
  if (listing.hours.trim()) score += 15;
  else missing.push("Add hours");
  if (listing.address.trim()) score += 10;
  else missing.push("Add address");
  if (listing.story.trim().length >= 40) score += 15;
  else missing.push("Write a short story (40+ characters)");
  if (listing.liveDeals >= 1) score += 20;
  else missing.push("Publish a live member deal");
  if (listing.menuItems >= 3) score += 15;
  else missing.push("Add at least 3 menu items");
  if (listing.photos >= 3) score += 15;
  else missing.push("Add 3 food photos");
  if (listing.openStatus !== "closed") score += 10;
  else missing.push("You're marked closed");
  return { score, missing };
}

export function suggestDeal(input: {
  cuisine: string;
  liveDealCount: number;
  topCityDeal?: string;
  weekday: number;
  repeats: number;
  scansThisWeek: number;
}) {
  if (input.liveDealCount === 0) {
    return "Publish one exclusive member deal (free item or 20%+ off) and keep it live at least two weeks.";
  }
  if (input.scansThisWeek === 0) {
    return "You have a live deal but no scans this week. Print the window QR and have hosts mention GorditoPass at the stand.";
  }
  if (input.repeats === 0 && input.scansThisWeek >= 3) {
    return "Most visits are first-timers. Keep this week's offer another 7 days so they have a reason to come back.";
  }
  if (input.weekday === 1 || input.weekday === 2) {
    return "Tue–Thu is slow for many Dallas kitchens. A weekday app or lunch member deal often fills the gap.";
  }
  if (/mexican|texmex|latin/.test(input.cuisine) && input.weekday >= 4) {
    return "Weekend Mexican spots often win with a chips/salsa or taco combo that's member-only.";
  }
  if (input.topCityDeal) {
    return `Nearby spots are getting scans on “${input.topCityDeal}.” Run something in that shape — still exclusive to members.`;
  }
  return "Keep the current offer two weeks so you can measure it. Add a second weekday deal if Fridays are already slammed.";
}

export function buildInsights(input: {
  scans: ScanEvent[];
  deals: { id: string; title: string }[];
  listing: CompletenessInput & { cuisine: string; typicalWeeklyTickets: number | null };
  cityScansThisWeek: number;
  cityRestaurantsWithScans: number;
  cityTopDeal?: string;
  now?: number;
}): InsightsPayload {
  const now = input.now ?? Date.now();
  const week0 = startOfWeek(now);
  const week1 = week0 - 7 * 24 * 60 * 60 * 1000;
  const thisScans = input.scans.filter((s) => inRange(s.at, week0, week0 + 7 * 86400000));
  const lastScans = input.scans.filter((s) => inRange(s.at, week1, week0));

  function weekStats(rows: ScanEvent[], weekStart: number) {
    const byMember = new Map<string, number>();
    for (const s of rows) {
      byMember.set(s.memberId, (byMember.get(s.memberId) ?? 0) + 1);
    }
    let newMembers = 0;
    let repeats = 0;
    for (const id of byMember.keys()) {
      const all = input.scans.filter((s) => s.memberId === id);
      const first = all.sort((a, b) => a.at.localeCompare(b.at))[0];
      if (first && new Date(first.at).getTime() >= weekStart) newMembers += 1;
      if (all.length >= 2) repeats += 1;
    }
    return {
      scans: rows.length,
      revenue: rows.reduce((s, r) => s + (r.revenueUsd || 0), 0),
      newMembers,
      repeats,
    };
  }

  const thisWeek = weekStats(thisScans, week0);
  const lastWeek = weekStats(lastScans, week1);

  const dealIds = new Set(input.deals.map((d) => d.id));
  for (const s of input.scans) dealIds.add(s.dealId);
  const deals: DealRow[] = [...dealIds].map((id) => {
    const title =
      input.deals.find((d) => d.id === id)?.title ||
      input.scans.find((s) => s.dealId === id)?.dealTitle ||
      id;
    const tw = thisScans.filter((s) => s.dealId === id);
    const lw = lastScans.filter((s) => s.dealId === id);
    return {
      dealId: id,
      title,
      thisWeek: tw.length,
      lastWeek: lw.length,
      revenueThisWeek: tw.reduce((s, r) => s + (r.revenueUsd || 0), 0),
    };
  }).sort((a, b) => b.thisWeek - a.thisWeek);

  const byMember = new Map<string, ScanEvent[]>();
  for (const s of input.scans) {
    const list = byMember.get(s.memberId) ?? [];
    list.push(s);
    byMember.set(s.memberId, list);
  }
  const members: MemberRow[] = [...byMember.entries()]
    .map(([memberId, rows]) => {
      const sorted = [...rows].sort((a, b) => b.at.localeCompare(a.at));
      const last = sorted[0];
      const days = (now - new Date(last.at).getTime()) / 86400000;
      const visits = rows.length;
      let pattern: MemberRow["pattern"] = "new";
      if (visits >= 2 && days <= 21) pattern = "regular";
      else if (days > 21) pattern = "lapsed";
      return {
        memberId,
        firstName: last.firstName,
        lastInitial: last.lastInitial,
        visits,
        lastVisit: last.at,
        lastDeal: last.dealTitle,
        pattern,
      };
    })
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));

  const hourCount = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  const dayCount = DAY_NAMES.map((day) => ({ day, count: 0 }));
  for (const s of input.scans) {
    const d = new Date(s.at);
    hourCount[d.getHours()].count += 1;
    dayCount[d.getDay()].count += 1;
  }

  const completeness = completenessOf(input.listing);
  const suggestion = suggestDeal({
    cuisine: input.listing.cuisine,
    liveDealCount: input.listing.liveDeals,
    topCityDeal: input.cityTopDeal,
    weekday: new Date(now).getDay(),
    repeats: thisWeek.repeats,
    scansThisWeek: thisWeek.scans,
  });

  const cityAvg =
    input.cityRestaurantsWithScans > 0
      ? input.cityScansThisWeek / input.cityRestaurantsWithScans
      : 0;

  const typical = input.listing.typicalWeeklyTickets;
  const memberShare = {
    visits: thisWeek.scans,
    typicalTickets: typical,
    note:
      typical && typical > 0
        ? `About ${Math.min(99, Math.round((thisWeek.scans / typical) * 100))}% of a ${typical}-ticket week would be Gordito members. Walk-ins are not in this app.`
        : "We only count member scans. Add your typical weekly tickets under Hours to estimate share vs walk-ins.",
  };

  return {
    thisWeek,
    lastWeek,
    deals,
    members,
    busyHours: hourCount,
    busyDays: dayCount,
    completeness,
    suggestion,
    benchmark: {
      you: thisWeek.scans,
      cityAvg: Math.round(cityAvg * 10) / 10,
      cityLabel: "other live spots in your city this week",
    },
    memberShare,
    scans: [...input.scans].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80),
  };
}

export function memberLabel(row: MemberRow) {
  return displayName(row.firstName, row.lastInitial);
}
