"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PartnerDesk,
  type PartnerDeskTab,
} from "@/components/partner/PartnerDesk";
import { RESTAURANTS, cityLabel, cuisineLabel } from "@/lib/data";
import type { InsightsPayload } from "@/lib/partner-insights";

type DeskTab = PartnerDeskTab;

type Upload = {
  label?: string;
  fileName?: string;
  dataUrl?: string;
  mimeType?: string;
};

type Concept = {
  id?: string;
  conceptName?: string;
  businessType?: string;
  businessTypeOther?: string;
  cuisineOrTheme?: string;
  locationCount?: number;
  cities?: string;
  notes?: string;
};

type ApiRestaurant = InsightsPayload & {
  openStatus: string;
  hours: string;
  typicalWeeklyTickets: number | null;
  googleMapsUrl: string;
  dealsLive: { id: string; title: string; soldOut: boolean; active: boolean }[];
  menuLive: { id: string; name: string; soldOut: boolean }[];
  messages: {
    id: string;
    from_role: string;
    from_name: string;
    body: string;
    created_at: string;
  }[];
  reviews: {
    id: string;
    author: string;
    plates: number;
    text: string;
    createdAt: string;
    dealTitle?: string;
    reply: { body: string; at: string } | null;
  }[];
  reports: {
    id: string;
    code: string;
    note: string;
    memberName: string;
    createdAt: string;
  }[];
  redemptionCount: number;
  listing: {
    id: string;
    name: string;
    emoji: string;
    cuisine: string;
    city: string;
    neighborhood: string;
    address: string;
    hours: string;
    story: string;
    tagline: string;
    approved: boolean;
    banned: boolean;
    ownerEmail: string;
    openStatus: string;
    phone: string;
  };
  applications: Record<string, unknown>[];
  staff: { email: string; name: string; role: string; phone: string; active: boolean }[];
  promotions: {
    id: string;
    title: string;
    description: string;
    type: string;
    value: number | null;
    regularPriceUsd: number | null;
    status: string;
    active: boolean;
    hidden: boolean;
    soldOut: boolean;
  }[];
  menu: {
    id: string;
    name: string;
    description: string;
    category: string;
    priceUsd: number;
    status: string;
    active: boolean;
    hidden: boolean;
    soldOut: boolean;
  }[];
  events: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    address: string;
    status: string;
    hidden: boolean;
  }[];
  jobs: {
    id: string;
    title: string;
    description: string;
    type: string;
    payRange: string;
    applyUrl: string;
    status: string;
    hidden: boolean;
  }[];
};

const TABS: { id: DeskTab | "signup" | "story" | "deals" | "menu" | "events" | "jobs" | "staff"; label: string }[] =
  [
    { id: "signup", label: "Signup" },
    { id: "home", label: "This week" },
    { id: "members", label: "My members" },
    { id: "log", label: "Scan log" },
    { id: "inbox", label: "Inbox" },
    { id: "reviews", label: "Reviews" },
    { id: "hours", label: "Hours & tent" },
    { id: "story", label: "Our story" },
    { id: "deals", label: "Promotions" },
    { id: "menu", label: "Menu" },
    { id: "events", label: "Events" },
    { id: "jobs", label: "Jobs" },
    { id: "staff", label: "Staff" },
  ];

const DESK = new Set<string>(["home", "members", "log", "inbox", "reviews", "hours"]);

const SKIP_PAYLOAD = new Set([
  "name",
  "email",
  "city",
  "promo",
  "contactName",
  "contact_name",
  "phone",
  "email_opt_in",
  "sms_opt_in",
  "emailOptIn",
  "smsOptIn",
  "position",
  "address",
  "cuisine",
  "primaryCuisine",
  "concepts",
  "uploads",
  "plannedStartDate",
  "hasAuthority",
  "businessType",
  "businessTypeOther",
  "ownershipType",
  "ownershipTypeOther",
  "totalLocations",
  "agreedToTerms",
  "agreed_to_terms",
]);

function payloadOf(app: Record<string, unknown>) {
  const raw = app.payload;
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function text(v: unknown) {
  if (v == null || v === "") return "";
  return String(v);
}

function yesNo(v: unknown) {
  if (v === true || v === "true" || v === "yes") return "Yes";
  if (v === false || v === "false" || v === "no") return "No";
  return "—";
}

function moneySince(
  scans: { at: string; revenueUsd: number }[],
  sinceMs: number,
) {
  const now = Date.now();
  return scans.reduce((sum, s) => {
    const t = new Date(s.at).getTime();
    if (now - t > sinceMs) return sum;
    return sum + (s.revenueUsd || 0);
  }, 0);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase text-muted">{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

export default function AdminRestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<ApiRestaurant | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("signup");

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    setErr("");
    setData(null);
    void fetch(`/api/ops/restaurants/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancel) return;
        if (!res.ok) {
          setErr(json.error ?? "Could not open this restaurant.");
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancel) setErr("Could not open this restaurant.");
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  const published = RESTAURANTS.find((r) => r.id === id);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const ytdMs = Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime();
  const rev = useMemo(() => {
    const scans = data?.scans ?? [];
    return {
      week: moneySince(scans, weekMs),
      month: moneySince(scans, monthMs),
      ytd: moneySince(scans, ytdMs),
    };
  }, [data?.scans, weekMs, monthMs, ytdMs]);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin?tab=restaurants" className="text-sm text-brand underline">
          Back to restaurants
        </Link>
        <p className="mt-4 text-sm text-muted">{err}</p>
        <p className="mt-2 text-sm">
          <Link href="/admin" className="text-brand underline">
            Sign in on the admin dashboard
          </Link>{" "}
          if this page did not open. It uses that same login.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">
        Loading this restaurant…
      </div>
    );
  }

  const listing = data.listing;
  const story = listing.story || published?.story || "";
  const menuSource = data.menu.length
    ? "dashboard"
    : published?.menu.length
      ? "public"
      : "none";
  const dealSource = data.promotions.length
    ? "dashboard"
    : published?.deals.length
      ? "public"
      : "none";
  const deskTab: DeskTab = DESK.has(tab) ? (tab as DeskTab) : "home";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin?tab=restaurants" className="text-sm text-brand underline">
        Back to restaurants
      </Link>
      <h1 className="gp-page-title mt-3">
        {listing.emoji} {listing.name}
      </h1>
      <p className="gp-page-sub">
        {cuisineLabel(listing.cuisine) || "Cuisine not set"}
        {listing.neighborhood ? ` · ${listing.neighborhood}` : ""} ·{" "}
        {listing.city ? cityLabel(listing.city) : "City not set"} ·{" "}
        {listing.approved ? "Listed" : "Unlisted"}
        {listing.ownerEmail ? ` · ${listing.ownerEmail}` : ""}
      </p>
      <p className="mt-2 text-sm text-muted">
        Read only. These are the signup answers and the same scan numbers the
        restaurant sees. Nothing here changes their dashboard.
      </p>
      <p className="mt-2 text-sm">
        <Link href={`/restaurants/${listing.id}`} className="text-brand underline">
          Public listing
        </Link>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Rev · week" value={`$${rev.week.toFixed(0)}`} />
        <Stat label="Rev · month" value={`$${rev.month.toFixed(0)}`} />
        <Stat label="Rev · YTD" value={`$${rev.ytd.toFixed(0)}`} />
        <Stat label="Redemptions" value={String(data.redemptionCount)} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Confirmed member scans. Ticket totals are estimated from deal values,
        not POS sales — same source as the partner desk.
      </p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-brand/15 text-orange-200 ring-1 ring-brand/30"
                : "text-muted hover:bg-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "signup" && (
        <section className="mt-6 space-y-4">
          {data.applications.length === 0 ? (
            <div className="gp-card gp-card-static p-5 text-sm text-muted">
              No signup application on file. This listing was added directly, so
              there is no application form to show. Address, hours, and story
              are on the other tabs.
            </div>
          ) : (
            data.applications.map((app) => (
              <ApplicationCard key={String(app.id)} app={app} />
            ))
          )}
          <div className="gp-card gp-card-static p-5">
            <h2 className="font-semibold">Listing on file</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Field label="Address">{listing.address}</Field>
              <Field label="Phone">{listing.phone}</Field>
              <Field label="Hours">{listing.hours}</Field>
              <Field label="Owner email">{listing.ownerEmail}</Field>
              <Field label="Tagline">{listing.tagline}</Field>
              <Field label="Open status">{listing.openStatus}</Field>
            </dl>
          </div>
        </section>
      )}

      {data && (
        <div className={DESK.has(tab) ? "" : "hidden"}>
          <PartnerDesk
            tab={deskTab}
            restaurantId={listing.id}
            restaurantName={listing.name}
            address={listing.address}
            readOnly
            seed={data}
          />
        </div>
      )}

      {tab === "story" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Our story</h2>
          {listing.tagline && <p className="mt-2 text-sm text-stone-300">{listing.tagline}</p>}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {story || "No story saved."}
          </p>
        </section>
      )}

      {tab === "deals" && (
        <ContentList
          title="Promotions"
          empty="No promotions saved."
          note={
            dealSource === "public"
              ? "Nothing is saved in the partner dashboard yet. This is what the public listing shows."
              : ""
          }
          rows={
            dealSource === "dashboard"
              ? data.promotions.map((d) => ({
                  id: d.id,
                  title: d.title,
                  meta: [
                    d.type,
                    d.value != null ? `value ${d.value}` : "",
                    d.regularPriceUsd != null ? `regular $${d.regularPriceUsd}` : "",
                    d.status,
                    d.soldOut ? "sold out" : "",
                    d.hidden ? "hidden" : "",
                    d.active ? "" : "inactive",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  body: d.description,
                }))
              : (published?.deals ?? []).map((d) => ({
                  id: d.id,
                  title: d.title,
                  meta: [
                    d.type,
                    d.value != null ? `value ${d.value}` : "",
                    d.active ? "active" : "inactive",
                  ].join(" · "),
                  body: d.description,
                }))
          }
        />
      )}

      {tab === "menu" && (
        <ContentList
          title="Menu"
          empty="No menu items saved."
          note={
            menuSource === "public"
              ? "Nothing is saved in the partner dashboard yet. This is the menu on the public restaurant page."
              : ""
          }
          rows={
            menuSource === "dashboard"
              ? data.menu.map((m) => ({
                  id: m.id,
                  title: m.name,
                  meta: [
                    m.category,
                    m.priceUsd > 0 ? `$${m.priceUsd.toFixed(2)}` : "No price entered",
                    m.status,
                    m.soldOut ? "sold out" : "",
                    m.hidden ? "hidden" : "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  body: m.description,
                }))
              : (published?.menu ?? []).map((m) => ({
                  id: m.id,
                  title: m.name,
                  meta: [
                    m.category,
                    m.priceUsd > 0
                      ? `$${m.priceUsd.toFixed(2)}`
                      : "No price entered · public page says Ask the restaurant",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  body: m.description,
                }))
          }
        />
      )}

      {tab === "events" && (
        <ContentList
          title="Events"
          empty="No events saved."
          rows={data.events.map((e) => ({
            id: e.id,
            title: e.title,
            meta: [e.date, e.time, e.status, e.hidden ? "hidden" : "", e.address]
              .filter(Boolean)
              .join(" · "),
            body: e.description,
          }))}
        />
      )}

      {tab === "jobs" && (
        <ContentList
          title="Jobs"
          empty="No job openings saved."
          rows={data.jobs.map((j) => ({
            id: j.id,
            title: j.title,
            meta: [j.type, j.payRange, j.status, j.hidden ? "hidden" : ""]
              .filter(Boolean)
              .join(" · "),
            body: [j.description, j.applyUrl].filter(Boolean).join("\n"),
          }))}
        />
      )}

      {tab === "staff" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Staff logins</h2>
          {data.staff.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No staff logins are tied to this restaurant.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {data.staff.map((s) => (
                <li key={s.email} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    <strong>{s.name}</strong>
                    <span className="ml-2 text-xs text-muted">{s.role}</span>
                    {!s.active && (
                      <span className="ml-2 text-xs text-red-300">inactive</span>
                    )}
                  </span>
                  <span className="text-muted">
                    {s.email}
                    {s.phone ? ` · ${s.phone}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="gp-card gp-card-static p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-success">{value}</p>
    </div>
  );
}

function ContentList({
  title,
  empty,
  note,
  rows,
}: {
  title: string;
  empty: string;
  note?: string;
  rows: { id: string; title: string; meta: string; body: string }[];
}) {
  return (
    <section className="mt-6 gp-card gp-card-static p-5">
      <h2 className="font-semibold">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="border-b border-border pb-3">
              <p className="font-medium">{row.title}</p>
              {row.meta && <p className="text-xs text-muted">{row.meta}</p>}
              {row.body && <p className="mt-1 whitespace-pre-wrap text-stone-300">{row.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ApplicationCard({ app }: { app: Record<string, unknown> }) {
  const payload = payloadOf(app);
  const concepts = Array.isArray(payload.concepts) ? (payload.concepts as Concept[]) : [];
  const uploads = Array.isArray(payload.uploads) ? (payload.uploads as Upload[]) : [];
  const extras = Object.entries(payload).filter(([key, value]) => {
    if (SKIP_PAYLOAD.has(key)) return false;
    return ["string", "number", "boolean"].includes(typeof value);
  });
  const phone = text(payload.phone);
  const emailOpt = payload.email_opt_in ?? payload.emailOptIn;
  const smsOpt = payload.sms_opt_in ?? payload.smsOptIn;

  return (
    <article className="gp-card gp-card-static p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Signup application</h2>
        <span className="gp-badge !normal-case">{text(app.status) || "pending"}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {text(app.created_at)
          ? `Submitted ${new Date(String(app.created_at)).toLocaleString()}`
          : ""}
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Field label="Business">{text(app.name)}</Field>
        <Field label="Email">{text(app.email)}</Field>
        <Field label="Contact">
          {text(app.contact_name) || text(payload.contactName) || "—"} (
          {text(app.position) || "—"})
        </Field>
        <Field label="Phone">{phone}</Field>
        <Field label="Address">
          {[text(app.address), text(app.city) ? cityLabel(text(app.city)) : ""]
            .filter(Boolean)
            .join(" · ")}
        </Field>
        <Field label="Planned start">{text(payload.plannedStartDate)}</Field>
        <Field label="Authority to sign">{yesNo(payload.hasAuthority)}</Field>
        <Field label="Business type">
          {[text(payload.businessType), text(payload.businessTypeOther)]
            .filter(Boolean)
            .join(" · ")}
        </Field>
        <Field label="Ownership">
          {[text(payload.ownershipType), text(payload.ownershipTypeOther)]
            .filter(Boolean)
            .join(" · ")}
        </Field>
        <Field label="Locations">{text(payload.totalLocations)}</Field>
        <Field label="Cuisine">
          {text(payload.primaryCuisine || payload.cuisine)
            ? cuisineLabel(text(payload.primaryCuisine || payload.cuisine))
            : ""}
        </Field>
        <Field label="Email updates">{yesNo(emailOpt)}</Field>
        <Field label="Text updates">{yesNo(smsOpt)}</Field>
        <Field label="Agreed to terms">
          {payload.agreedToTerms == null && payload.agreed_to_terms == null
            ? ""
            : yesNo(payload.agreedToTerms ?? payload.agreed_to_terms)}
        </Field>
        <div className="sm:col-span-2">
          <dt className="text-[10px] uppercase text-muted">Promo idea</dt>
          <dd className="whitespace-pre-wrap">{text(app.promo) || "—"}</dd>
        </div>
      </dl>

      {concepts.length > 0 && (
        <div className="mt-3 rounded-md border border-border bg-elevated/40 p-3">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Concepts ({concepts.length})
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {concepts.map((c, i) => (
              <li key={c.id || i}>
                <strong>{c.conceptName || "Concept"}</strong>
                {c.businessType ? ` · ${c.businessType}` : ""}
                {c.businessTypeOther ? ` (${c.businessTypeOther})` : ""}
                {c.locationCount != null ? ` · ${c.locationCount} loc` : ""}
                {c.cuisineOrTheme ? ` · ${cuisineLabel(c.cuisineOrTheme)}` : ""}
                {c.cities ? ` · ${cityLabel(c.cities)}` : ""}
                {c.notes ? ` · ${c.notes}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] font-semibold uppercase text-muted">
        Uploads ({uploads.length})
      </p>
      {uploads.length === 0 ? (
        <p className="text-xs text-muted">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {uploads.map((u, i) => (
            <li
              key={`${u.label}-${u.fileName}-${i}`}
              className="flex items-start gap-3 rounded-md border border-border px-2 py-2 text-xs"
            >
              {u.dataUrl && (u.mimeType?.startsWith("image/") || u.dataUrl.startsWith("data:image")) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.dataUrl} alt="" className="h-14 w-14 rounded object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded bg-elevated text-lg">
                  File
                </span>
              )}
              <div>
                <p className="font-medium">{u.label || "Upload"}</p>
                <p className="text-muted">{u.fileName || "file"}</p>
                {u.dataUrl && (
                  <a
                    href={u.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand underline"
                  >
                    Open
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {extras.length > 0 && (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {extras.map(([key, value]) => (
            <Field key={key} label={key}>
              {typeof value === "boolean" ? yesNo(value) : text(value)}
            </Field>
          ))}
        </dl>
      )}
    </article>
  );
}
