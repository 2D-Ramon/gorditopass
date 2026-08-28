"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OpsHub, type OpsTab } from "./OpsHub";
import { cuisineLabel, FEED_POSTS, RESTAURANTS } from "@/lib/data";
import { PLATFORM } from "@/lib/pricing";
import { useStore } from "@/lib/store";

type AdminTab =
  | OpsTab
  | "apps"
  | "deals"
  | "menu"
  | "events"
  | "jobs"
  | "restaurants"
  | "auto"
  | "feed";

function Thumbs({ urls }: { urls?: string[] }) {
  if (!urls?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {urls.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
        />
      ))}
    </div>
  );
}

function AiBadge({
  flagged,
  reasons,
}: {
  flagged?: boolean;
  reasons?: string[];
}) {
  if (!flagged) return null;
  return (
    <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-100">
      <p className="font-semibold">AI flag — review first</p>
      {(reasons ?? []).map((r) => (
        <p key={r} className="text-amber-200/80">
          · {r}
        </p>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const {
    user,
    signInDemo,
    restaurantApplications,
    redemptions,
    partnerDeals,
    partnerMenuItems,
    partnerEvents,
    partnerJobs,
    setApplicationStatus,
    setPartnerDealStatus,
    setPartnerMenuStatus,
    setPartnerEventStatus,
    setPartnerJobStatus,
    setRestaurantApproved,
    isRestaurantApproved,
    hideFeedPost,
    unhideFeedPost,
    moderatedFeedPosts,
    resetDemoData,
    getAutoApprove,
    setAutoApprove,
  } = useStore();
  const [tab, setTab] = useState<AdminTab>("connect");
  const [autoBiz, setAutoBiz] = useState(RESTAURANTS[0]?.id ?? "mi-tierra");

  const pendingApps = useMemo(
    () =>
      restaurantApplications.filter(
        (a) => (a.status ?? "pending") === "pending",
      ),
    [restaurantApplications],
  );
  const pendingDeals = useMemo(
    () => partnerDeals.filter((d) => (d.status ?? "pending") === "pending"),
    [partnerDeals],
  );
  const pendingMenu = useMemo(
    () =>
      partnerMenuItems.filter((m) => (m.status ?? "pending") === "pending"),
    [partnerMenuItems],
  );
  const pendingEvents = useMemo(
    () => partnerEvents.filter((e) => (e.status ?? "pending") === "pending"),
    [partnerEvents],
  );
  const pendingJobs = useMemo(
    () => partnerJobs.filter((j) => (j.status ?? "pending") === "pending"),
    [partnerJobs],
  );
  const flaggedCount = useMemo(
    () =>
      [
        ...partnerDeals,
        ...partnerMenuItems,
        ...partnerEvents,
        ...partnerJobs,
      ].filter(
        (x) => x.aiFlagged && (x.status ?? "pending") === "pending",
      ).length,
    [partnerDeals, partnerMenuItems, partnerEvents, partnerJobs],
  );

  const feedQueue = useMemo(() => {
    const seed = FEED_POSTS.map((p) => ({
      id: p.id,
      city: p.city,
      author: p.author,
      title: p.title,
      body: p.body,
      createdAt: p.createdAt,
    }));
    const hiddenMap = new Map(moderatedFeedPosts.map((p) => [p.id, p]));
    return seed.map((p) => {
      const mod = hiddenMap.get(p.id);
      return { ...p, hidden: mod?.hidden ?? false };
    });
  }, [moderatedFeedPosts]);

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gp-page-title">Admin</h1>
        <p className="mt-2 text-muted">
          Approve applications, deals, menu, events, jobs · auto-approve · AI
          flags. Caps: {PLATFORM.earlyCapDiners} diners /{" "}
          {PLATFORM.earlyCapBusinesses} businesses.
        </p>
        <button
          type="button"
          className="gp-btn gp-btn-primary mt-6"
          onClick={() => signInDemo("admin")}
        >
          Demo admin sign-in
        </button>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: "connect", label: "Connect" },
    { id: "crm", label: "Business CRM" },
    { id: "members", label: "Members" },
    { id: "campaigns", label: "Campaigns" },
    { id: "apps", label: "Applications", count: pendingApps.length },
    { id: "deals", label: "Deals", count: pendingDeals.length },
    { id: "menu", label: "Menu", count: pendingMenu.length },
    { id: "events", label: "Events", count: pendingEvents.length },
    { id: "jobs", label: "Jobs", count: pendingJobs.length },
    { id: "auto", label: "Auto-approve" },
    { id: "restaurants", label: "Restaurants" },
    { id: "feed", label: "Feed" },
  ];

  const auto = getAutoApprove(autoBiz);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="gp-page-title">Admin</h1>
      <p className="gp-page-sub">
        Business CRM, member records, and campaigns live in your Supabase
        project. Application review below is still this-browser demo until
        those queues move over.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Live restaurants</p>
          <p className="text-2xl font-bold">
            {RESTAURANTS.filter((r) => isRestaurantApproved(r.id)).length}
          </p>
        </div>
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Pending content</p>
          <p className="text-2xl font-bold text-brand">
            {pendingDeals.length +
              pendingMenu.length +
              pendingEvents.length +
              pendingJobs.length}
          </p>
        </div>
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">AI flagged</p>
          <p className="text-2xl font-bold text-amber-300">{flaggedCount}</p>
        </div>
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Redemptions</p>
          <p className="text-2xl font-bold">{redemptions.length}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
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
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/20 px-1.5 text-[10px] font-bold text-orange-200">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {(tab === "connect" ||
        tab === "crm" ||
        tab === "members" ||
        tab === "campaigns") && <OpsHub tab={tab} />}

      {tab === "apps" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Restaurant applications</h2>
          {restaurantApplications.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              None yet.{" "}
              <Link href="/apply" className="text-brand underline">
                Submit on /apply
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {restaurantApplications.map((a) => {
                const id = a.id ?? a.at + a.email;
                const status = a.status ?? "pending";
                const uploads = a.uploads ?? [];
                return (
                  <li
                    key={id}
                    className="rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-lg font-semibold">{a.name}</p>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Email
                        </dt>
                        <dd>{a.email}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Contact
                        </dt>
                        <dd>
                          {a.contactName || "—"} ({a.position || "—"})
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase text-muted">
                          Address
                        </dt>
                        <dd>
                          {a.address || "—"} · {a.city || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Start
                        </dt>
                        <dd>{a.plannedStartDate || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Authority
                        </dt>
                        <dd>{a.hasAuthority ? "Yes" : "No / —"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Business type
                        </dt>
                        <dd>
                          {a.businessType || "—"}
                          {a.businessTypeOther
                            ? ` (${a.businessTypeOther})`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Ownership
                        </dt>
                        <dd>
                          {a.ownershipType || "—"}
                          {a.ownershipTypeOther
                            ? ` (${a.ownershipTypeOther})`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-muted">
                          Locations
                        </dt>
                        <dd>{a.totalLocations ?? "—"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase text-muted">
                          Promo idea
                        </dt>
                        <dd className="text-muted">{a.promo || "—"}</dd>
                      </div>
                    </dl>
                    {a.concepts && a.concepts.length > 0 && (
                      <div className="mt-3 rounded-md border border-border bg-elevated/40 p-3">
                        <p className="text-[10px] font-semibold uppercase text-muted">
                          Concepts ({a.concepts.length})
                        </p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {a.concepts.map((c) => (
                            <li key={c.id}>
                              <strong>{c.conceptName}</strong> ·{" "}
                              {c.businessType}
                              {c.businessTypeOther
                                ? ` (${c.businessTypeOther})`
                                : ""}{" "}
                              · {c.locationCount} loc
                              {c.cuisineOrTheme
                                ? ` · ${cuisineLabel(c.cuisineOrTheme)}`
                                : ""}
                              {c.cities ? ` · ${c.cities}` : ""}
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
                        {uploads.map((u) => (
                          <li
                            key={`${u.label}-${u.fileName}`}
                            className="flex items-start gap-3 rounded-md border border-border px-2 py-2 text-xs"
                          >
                            {u.dataUrl && u.mimeType?.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.dataUrl}
                                alt=""
                                className="h-14 w-14 rounded object-cover"
                              />
                            ) : (
                              <span className="flex h-14 w-14 items-center justify-center rounded bg-elevated text-lg">
                                📄
                              </span>
                            )}
                            <div>
                              <p className="font-medium">{u.label}</p>
                              <p className="text-muted">{u.fileName}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary text-xs !py-1.5"
                          onClick={() => setApplicationStatus(id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="gp-btn gp-btn-secondary text-xs !py-1.5"
                          onClick={() => setApplicationStatus(id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "deals" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Deals for approval</h2>
          {partnerDeals.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No partner deals yet. Create from{" "}
              <Link href="/restaurant/dashboard" className="text-brand underline">
                partner dashboard
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerDeals.map((d) => {
                const rest = RESTAURANTS.find((r) => r.id === d.restaurantId);
                const status = d.status ?? "pending";
                return (
                  <li
                    key={d.id}
                    className="rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-muted">
                          {rest?.name ?? d.restaurantId} · {d.type}
                          {d.regularPriceUsd != null &&
                            ` · reg $${d.regularPriceUsd}`}
                          {d.value != null && ` · value ${d.value}`}
                        </p>
                        <p className="mt-1 text-sm text-stone-400">
                          {d.description}
                        </p>
                      </div>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
                    <Thumbs urls={d.imageDataUrls} />
                    <AiBadge flagged={d.aiFlagged} reasons={d.aiReasons} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== "approved" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary text-xs !py-1.5"
                          onClick={() => setPartnerDealStatus(d.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-secondary text-xs !py-1.5"
                          onClick={() => setPartnerDealStatus(d.id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                      {status === "approved" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-ghost text-xs !py-1.5"
                          onClick={() => setPartnerDealStatus(d.id, "pending")}
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "menu" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Menu items for approval</h2>
          {partnerMenuItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No partner menu items yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerMenuItems.map((m) => {
                const rest = RESTAURANTS.find((r) => r.id === m.restaurantId);
                const status = m.status ?? "pending";
                return (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted">
                          {rest?.name} · {m.category} · $
                          {m.priceUsd.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-stone-400">
                          {m.description}
                        </p>
                      </div>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
                    <Thumbs urls={m.imageDataUrls} />
                    <AiBadge flagged={m.aiFlagged} reasons={m.aiReasons} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== "approved" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary text-xs !py-1.5"
                          onClick={() => setPartnerMenuStatus(m.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-secondary text-xs !py-1.5"
                          onClick={() => setPartnerMenuStatus(m.id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "events" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Events for approval</h2>
          {partnerEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No partner events yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerEvents.map((e) => {
                const status = e.status ?? "pending";
                return (
                  <li
                    key={e.id}
                    className="rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {e.emoji} {e.title}
                        </p>
                        <p className="text-xs text-muted">
                          {e.restaurantName} · {e.date} {e.time}
                        </p>
                        <p className="mt-1 text-sm text-stone-400">
                          {e.description}
                        </p>
                        {e.address && (
                          <p className="text-xs text-muted">{e.address}</p>
                        )}
                      </div>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
                    <Thumbs urls={e.imageDataUrls} />
                    <AiBadge flagged={e.aiFlagged} reasons={e.aiReasons} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== "approved" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary text-xs !py-1.5"
                          onClick={() => setPartnerEventStatus(e.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-secondary text-xs !py-1.5"
                          onClick={() => setPartnerEventStatus(e.id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "jobs" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Jobs for approval</h2>
          {partnerJobs.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No partner jobs yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerJobs.map((j) => {
                const status = j.status ?? "pending";
                return (
                  <li
                    key={j.id}
                    className="rounded-lg border border-border bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium">{j.title}</p>
                        <p className="text-xs text-muted">
                          {j.restaurantName} · {j.type}
                          {j.payRange ? ` · ${j.payRange}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-stone-400">
                          {j.description}
                        </p>
                        {j.applyUrl && (
                          <p className="mt-1 text-xs text-brand break-all">
                            {j.applyUrl}
                          </p>
                        )}
                      </div>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
                    <Thumbs urls={j.imageDataUrls} />
                    <AiBadge flagged={j.aiFlagged} reasons={j.aiReasons} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== "approved" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary text-xs !py-1.5"
                          onClick={() => setPartnerJobStatus(j.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          type="button"
                          className="gp-btn gp-btn-secondary text-xs !py-1.5"
                          onClick={() => setPartnerJobStatus(j.id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "auto" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Auto-approve settings</h2>
          <p className="mt-1 text-sm text-muted">
            Per business and content type. AI-flagged items always stay pending
            for human review, even if auto-approve is on.
          </p>
          <label className="mt-4 block text-sm">
            Business
            <select
              className="gp-input mt-1"
              value={autoBiz}
              onChange={(e) => setAutoBiz(e.target.value)}
            >
              {RESTAURANTS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 space-y-3">
            {(
              [
                ["deal", "Deals"],
                ["menu", "Menu items"],
                ["event", "Events"],
                ["job", "Jobs"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>Auto-approve {label}</span>
                <input
                  type="checkbox"
                  checked={auto[key]}
                  onChange={(e) =>
                    setAutoApprove(autoBiz, { [key]: e.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === "restaurants" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Live restaurants</h2>
          <ul className="mt-4 space-y-2">
            {RESTAURANTS.map((r) => {
              const live = isRestaurantApproved(r.id);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {r.emoji} {r.name}
                    <span className="ml-2 text-xs text-muted">{r.cuisine}</span>
                  </span>
                  <button
                    type="button"
                    className={`gp-btn text-xs !py-1.5 ${
                      live ? "gp-btn-secondary" : "gp-btn-primary"
                    }`}
                    onClick={() => setRestaurantApproved(r.id, !live)}
                  >
                    {live ? "Unlist" : "List live"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "feed" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Feed moderation</h2>
          <ul className="mt-4 space-y-2">
            {feedQueue.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {p.title}{" "}
                  {p.hidden && (
                    <span className="text-xs text-red-300">(hidden)</span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {p.author} · {p.city}
                </p>
                <p className="mt-1 text-muted">{p.body}</p>
                <div className="mt-2">
                  {p.hidden ? (
                    <button
                      type="button"
                      className="text-xs text-brand"
                      onClick={() => unhideFeedPost(p.id)}
                    >
                      Unhide
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-red-300"
                      onClick={() =>
                        hideFeedPost({
                          id: p.id,
                          city: p.city,
                          author: p.author,
                          title: p.title,
                          body: p.body,
                          createdAt: p.createdAt,
                        })
                      }
                    >
                      Hide
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        className="mt-8 text-xs text-red-300/80"
        onClick={() => {
          if (confirm("Reset all demo data?")) resetDemoData();
        }}
      >
        Reset demo data
      </button>
    </div>
  );
}
