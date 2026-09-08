"use client";

import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/authed";
import type { InsightsPayload, MemberRow } from "@/lib/partner-insights";
import { memberLabel } from "@/lib/partner-insights";

type Extra = {
  openStatus: string;
  hours: string;
  typicalWeeklyTickets: number | null;
  googleMapsUrl: string;
  dealsLive: { id: string; title: string; soldOut: boolean; active: boolean }[];
  menuLive: { id: string; name: string; soldOut: boolean }[];
};

type InboxMsg = {
  id: string;
  from_role: string;
  from_name: string;
  body: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  author: string;
  plates: number;
  text: string;
  createdAt: string;
  dealTitle?: string;
  reply: { body: string; at: string } | null;
};

export type PartnerDeskTab =
  | "home"
  | "members"
  | "log"
  | "inbox"
  | "reviews"
  | "hours";

export function PartnerDesk({
  tab,
  restaurantId,
  restaurantName,
  address,
}: {
  tab: PartnerDeskTab;
  restaurantId: string;
  restaurantName: string;
  address: string;
}) {
  const [data, setData] = useState<(InsightsPayload & Extra) | null>(null);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [inbox, setInbox] = useState<InboxMsg[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [reportNote, setReportNote] = useState("");
  const [reportCode, setReportCode] = useState("");
  const [hours, setHours] = useState("");
  const [openStatus, setOpenStatus] = useState("hours");
  const [tickets, setTickets] = useState("");
  const [maps, setMaps] = useState("");

  const load = useCallback(async () => {
    setErr("");
    const res = await authedFetch("/api/partner/insights");
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error ?? "Could not load insights. Run partner_ops.sql in Supabase.");
      return;
    }
    setData(json);
    setHours(json.hours ?? "");
    setOpenStatus(json.openStatus ?? "hours");
    setTickets(
      json.typicalWeeklyTickets == null ? "" : String(json.typicalWeeklyTickets),
    );
    setMaps(json.googleMapsUrl ?? "");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== "inbox") return;
    void authedFetch("/api/partner/inbox")
      .then((r) => r.json())
      .then((j) => setInbox(j.messages ?? []))
      .catch(() => {});
  }, [tab]);

  useEffect(() => {
    if (tab !== "reviews") return;
    void authedFetch("/api/partner/reviews")
      .then((r) => r.json())
      .then((j) => setReviews(j.reviews ?? []))
      .catch(() => {});
  }, [tab]);

  async function post(path: string, body: unknown) {
    const res = await authedFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlash(json.error ?? "Could not save.");
      return false;
    }
    setFlash("Saved.");
    return true;
  }

  const site =
    typeof window !== "undefined" ? window.location.origin : "https://gorditopass.vercel.app";
  const listingUrl = `${site}/restaurants/${restaurantId}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(listingUrl)}`;

  if (err) {
    return (
      <section className="mt-6 gp-card gp-card-static p-5 text-sm text-muted">
        {err}
      </section>
    );
  }
  if (!data) {
    return (
      <section className="mt-6 text-sm text-muted">Loading partner home…</section>
    );
  }

  const delta = data.thisWeek.scans - data.lastWeek.scans;

  return (
    <div className="mt-6 space-y-4">
      {flash && (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {flash}
        </p>
      )}

      {tab === "home" && (
        <>
          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">This week vs last week</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Scans this week" value={String(data.thisWeek.scans)} />
              <Stat
                label="vs last week"
                value={`${delta >= 0 ? "+" : ""}${delta}`}
              />
              <Stat label="First-timers" value={String(data.thisWeek.newMembers)} />
              <Stat label="Repeats" value={String(data.thisWeek.repeats)} />
            </div>
            <p className="mt-3 text-sm text-muted">
              Last week: {data.lastWeek.scans} scans · {data.lastWeek.repeats}{" "}
              repeats. Member ticket $ {data.thisWeek.revenue.toFixed(0)} estimated
              from deal values — not POS sales.
            </p>
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">Deal scoreboard</h2>
            {data.deals.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No scans on deals yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.deals.map((d) => (
                  <li key={d.dealId} className="flex justify-between gap-3">
                    <span>{d.title}</span>
                    <span className="text-muted">
                      {d.thisWeek} this week · {d.lastWeek} last week
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">Suggested next deal</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              {data.suggestion}
            </p>
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">
              Listing completeness · {data.completeness.score}/100
            </h2>
            {data.completeness.missing.length === 0 ? (
              <p className="mt-2 text-sm text-success">Listing looks complete.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {data.completeness.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="gp-card gp-card-static p-5">
              <h2 className="font-semibold">Busy hours</h2>
              <Bars
                items={data.busyHours
                  .filter((h) => h.count > 0)
                  .map((h) => ({
                    label: `${h.hour}:00`,
                    count: h.count,
                  }))}
              />
            </div>
            <div className="gp-card gp-card-static p-5">
              <h2 className="font-semibold">Busy days</h2>
              <Bars
                items={data.busyDays.map((d) => ({
                  label: d.day,
                  count: d.count,
                }))}
              />
            </div>
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">City benchmark</h2>
            <p className="mt-2 text-sm text-stone-300">
              You had <strong>{data.benchmark.you}</strong> member scans this
              week. Average among {data.benchmark.cityLabel} with at least one
              scan: <strong>{data.benchmark.cityAvg}</strong>. Names of other
              restaurants are not shown.
            </p>
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">Member vs walk-in</h2>
            <p className="mt-2 text-sm text-stone-300">{data.memberShare.note}</p>
          </section>

          <section className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">Repeat regulars</h2>
            <p className="mt-1 text-sm text-muted">
              Two or more visits here, last visit within 21 days. First name
              only — no text or email from this screen.
            </p>
            {data.members.filter((m) => m.pattern === "regular").length === 0 ? (
              <p className="mt-2 text-sm text-muted">No regulars yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {data.members
                  .filter((m) => m.pattern === "regular")
                  .map((m) => (
                    <MemberItem key={m.memberId} row={m} />
                  ))}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === "members" && (
        <section className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">My members</h2>
          <p className="mt-1 text-sm text-muted">
            People who redeemed a deal here. First name and last initial only —
            no phone, email, or send-message control. Reaching them by text is
            a later paid add-on.
          </p>
          <p className="mt-2 text-sm">
            Regulars (2+ visits, last 21 days):{" "}
            <strong>
              {data.members.filter((m) => m.pattern === "regular").length}
            </strong>
          </p>
          {data.members.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No member scans yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.members.map((m) => (
                <MemberItem key={m.memberId} row={m} />
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "log" && (
        <section className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">Who scanned what</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.scans.length === 0 && (
              <li className="text-muted">No confirmed redemptions yet.</li>
            )}
            {data.scans.map((s, i) => (
              <li key={`${s.at}-${i}`} className="flex justify-between gap-3">
                <span>
                  {s.firstName}
                  {s.lastInitial ? ` ${s.lastInitial}.` : ""} · {s.dealTitle}
                </span>
                <span className="text-muted">
                  {s.staffName} · {new Date(s.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <form
            className="mt-6 space-y-2 border-t border-border pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await post("/api/partner/reports", {
                  code: reportCode,
                  note: reportNote,
                })
              ) {
                setReportNote("");
                setReportCode("");
              }
            }}
          >
            <h3 className="text-sm font-semibold">Report a bad redeem</h3>
            <p className="text-xs text-muted">
              Screenshot, reused code, wrong table — tell us. Floor staff can
              also do this from Redeem scan.
            </p>
            <input
              className="gp-input max-w-[10rem] font-mono"
              placeholder="Code (optional)"
              value={reportCode}
              onChange={(e) => setReportCode(e.target.value.replace(/\D/g, ""))}
            />
            <textarea
              className="gp-input min-h-[4.5rem]"
              required
              placeholder="What looked wrong?"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
            />
            <button type="submit" className="gp-btn gp-btn-secondary text-sm">
              Send report
            </button>
          </form>
        </section>
      )}

      {tab === "inbox" && (
        <section className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">Inbox</h2>
          <p className="text-sm text-muted">
            Members can message you from your public listing. This is not SMS.
          </p>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
            {inbox.length === 0 && (
              <li className="text-muted">No messages yet.</li>
            )}
            {inbox.map((m) => (
              <li key={m.id}>
                <span className="text-muted">
                  {m.from_role === "staff" ? "You" : m.from_name} ·{" "}
                  {new Date(m.created_at).toLocaleString()}
                </span>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await post("/api/partner/inbox", { body: msg })) {
                setMsg("");
                const j = await (await authedFetch("/api/partner/inbox")).json();
                setInbox(j.messages ?? []);
              }
            }}
          >
            <textarea
              className="gp-input min-h-[4rem]"
              placeholder="Reply as the restaurant…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Send reply
            </button>
          </form>
        </section>
      )}

      {tab === "reviews" && (
        <section className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">Plates & replies</h2>
          <ul className="mt-3 space-y-4">
            {reviews.length === 0 && (
              <li className="text-sm text-muted">No plate ratings yet.</li>
            )}
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-3">
                <p className="text-sm">
                  <strong>{r.author}</strong> · {r.plates} plates
                  {r.dealTitle ? ` · ${r.dealTitle}` : ""}
                </p>
                <p className="text-sm text-stone-300">{r.text}</p>
                {r.reply ? (
                  <p className="mt-1 text-sm text-brand-mint">
                    Your reply: {r.reply.body}
                  </p>
                ) : (
                  <form
                    className="mt-2 flex flex-col gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await post("/api/partner/reviews", {
                          reviewId: r.id,
                          body: reply[r.id],
                        })
                      ) {
                        const j = await (
                          await authedFetch("/api/partner/reviews")
                        ).json();
                        setReviews(j.reviews ?? []);
                      }
                    }}
                  >
                    <input
                      className="gp-input"
                      placeholder="Public thank-you…"
                      value={reply[r.id] ?? ""}
                      onChange={(e) =>
                        setReply((p) => ({ ...p, [r.id]: e.target.value }))
                      }
                    />
                    <button type="submit" className="gp-btn gp-btn-secondary text-sm">
                      Reply
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "hours" && (
        <>
          <section className="gp-card gp-card-static p-5 no-print">
            <h2 className="font-semibold">Open / closed / hours</h2>
            <form
              className="mt-3 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await post("/api/partner/hours", {
                  hours,
                  openStatus,
                  typicalWeeklyTickets: tickets ? Number(tickets) : null,
                  googleMapsUrl: maps,
                });
                void load();
              }}
            >
              <label className="block text-sm">
                Status
                <select
                  className="gp-input mt-1"
                  value={openStatus}
                  onChange={(e) => setOpenStatus(e.target.value)}
                >
                  <option value="hours">Follow posted hours</option>
                  <option value="open">Open now (override)</option>
                  <option value="closed">Closed now</option>
                </select>
              </label>
              <label className="block text-sm">
                Hours
                <input
                  className="gp-input mt-1"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Tue–Sun 11am–9pm"
                />
              </label>
              <label className="block text-sm">
                Typical tickets per week (optional)
                <input
                  className="gp-input mt-1 max-w-[10rem]"
                  type="number"
                  min={0}
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Google Maps URL (for review prompt)
                <input
                  className="gp-input mt-1"
                  value={maps}
                  onChange={(e) => setMaps(e.target.value)}
                  placeholder="https://maps.google.com/…"
                />
              </label>
              <button type="submit" className="gp-btn gp-btn-primary text-sm">
                Save hours
              </button>
            </form>
          </section>

          <section className="gp-card gp-card-static p-5 no-print">
            <h2 className="font-semibold">Sold out / pause tonight</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(data.dealsLive ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span>Deal · {d.title}</span>
                  <button
                    type="button"
                    className="gp-btn gp-btn-secondary !py-1 text-xs"
                    onClick={async () => {
                      await post("/api/partner/sold-out", {
                        kind: "deal",
                        id: d.id,
                        soldOut: !d.soldOut,
                      });
                      void load();
                    }}
                  >
                    {d.soldOut ? "Back on" : "86 / pause"}
                  </button>
                </li>
              ))}
              {(data.menuLive ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span>Menu · {m.name}</span>
                  <button
                    type="button"
                    className="gp-btn gp-btn-secondary !py-1 text-xs"
                    onClick={async () => {
                      await post("/api/partner/sold-out", {
                        kind: "menu",
                        id: m.id,
                        soldOut: !m.soldOut,
                      });
                      void load();
                    }}
                  >
                    {m.soldOut ? "Back on" : "86"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="gp-card gp-card-static p-5 print-tent print:border-0 print:shadow-none">
            <h2 className="font-semibold no-print">Window QR / table tent</h2>
            <p className="mt-1 text-sm text-muted no-print">
              Print and put at the host stand. Members open GorditoPass and show
              their code; you scan it.
            </p>
            <div className="mt-4 text-center">
              <p className="text-xl font-bold">{restaurantName}</p>
              <p className="text-sm text-muted">GorditoPass members: show your pass</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR to listing" className="mx-auto mt-3 h-44 w-44 bg-white p-2" />
              <p className="mt-2 text-xs">{listingUrl}</p>
              <p className="text-xs text-muted">{address}</p>
            </div>
            <button
              type="button"
              className="gp-btn gp-btn-secondary mt-4 text-sm no-print"
              onClick={() => window.print()}
            >
              Print tent
            </button>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-elevated/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function Bars({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.some((i) => i.count)) {
    return <p className="mt-2 text-sm text-muted">Not enough scans yet.</p>;
  }
  return (
    <ul className="mt-3 space-y-1">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-xs">
          <span className="w-10 shrink-0 text-muted">{i.label}</span>
          <span
            className="h-2 rounded-full bg-brand/70"
            style={{ width: `${(i.count / max) * 70}%` }}
          />
          <span>{i.count}</span>
        </li>
      ))}
    </ul>
  );
}

function MemberItem({ row }: { row: MemberRow }) {
  const label =
    row.pattern === "regular"
      ? "Regular"
      : row.pattern === "lapsed"
        ? "Lapsed"
        : "New";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
      <span>
        <strong>{memberLabel(row)}</strong>
        <span className="ml-2 text-xs text-muted">{label}</span>
      </span>
      <span className="text-muted">
        {row.visits} visit{row.visits === 1 ? "" : "s"} · {row.lastDeal} ·{" "}
        {new Date(row.lastVisit).toLocaleDateString()}
      </span>
    </li>
  );
}
