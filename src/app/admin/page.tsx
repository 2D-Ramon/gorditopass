"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FEED_POSTS, RESTAURANTS } from "@/lib/data";
import { PLATFORM } from "@/lib/pricing";
import { useStore } from "@/lib/store";

type AdminTab = "apps" | "deals" | "restaurants" | "feed";

export default function AdminPage() {
  const {
    user,
    signInDemo,
    restaurantApplications,
    redemptions,
    partnerDeals,
    setApplicationStatus,
    setPartnerDealStatus,
    setRestaurantApproved,
    isRestaurantApproved,
    hideFeedPost,
    unhideFeedPost,
    moderatedFeedPosts,
    resetDemoData,
  } = useStore();
  const [tab, setTab] = useState<AdminTab>("apps");

  const pendingApps = useMemo(
    () => restaurantApplications.filter((a) => (a.status ?? "pending") === "pending"),
    [restaurantApplications],
  );
  const pendingDeals = useMemo(
    () => partnerDeals.filter((d) => (d.status ?? "pending") === "pending"),
    [partnerDeals],
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
          Approve restaurants & deals, moderate the city feed. Early caps:{" "}
          {PLATFORM.earlyCapDiners} diners / {PLATFORM.earlyCapBusinesses}{" "}
          businesses.
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
    { id: "apps", label: "Applications", count: pendingApps.length },
    { id: "deals", label: "Deals", count: pendingDeals.length },
    { id: "restaurants", label: "Restaurants" },
    { id: "feed", label: "Feed" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">Admin queue</h1>
      <p className="gp-page-sub">
        Approve partner applications & deals, toggle live restaurants, hide feed
        posts. Demo state is stored in this browser.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Live restaurants</p>
          <p className="text-2xl font-bold">
            {RESTAURANTS.filter((r) => isRestaurantApproved(r.id)).length}
          </p>
        </div>
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Pending apps</p>
          <p className="text-2xl font-bold text-brand">{pendingApps.length}</p>
        </div>
        <div className="gp-card gp-card-static p-4">
          <p className="text-xs text-muted">Pending deals</p>
          <p className="text-2xl font-bold text-brand">{pendingDeals.length}</p>
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

      {tab === "apps" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Restaurant applications</h2>
          {restaurantApplications.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              None yet.{" "}
              <Link href="/apply" className="text-brand underline">
                Submit one on /apply
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
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold tracking-tight">
                          {a.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Submitted {new Date(a.at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`gp-badge !normal-case ${
                          status === "approved"
                            ? "!bg-success/15 !text-success !border-success/30"
                            : status === "rejected"
                              ? "!bg-red-500/10 !text-red-300 !border-red-500/30"
                              : ""
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Business email
                        </dt>
                        <dd className="text-stone-200">{a.email}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Contact name
                        </dt>
                        <dd className="text-stone-200">
                          {a.contactName || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Position
                        </dt>
                        <dd className="text-stone-200 capitalize">
                          {a.position || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Authority to decide
                        </dt>
                        <dd className="text-stone-200">
                          {a.hasAuthority === true
                            ? "Yes"
                            : a.hasAuthority === false
                              ? "No"
                              : "—"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Address
                        </dt>
                        <dd className="text-stone-200">
                          {a.address || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          City
                        </dt>
                        <dd className="text-stone-200">{a.city || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Planned start
                        </dt>
                        <dd className="text-stone-200">
                          {a.plannedStartDate || "—"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          First promotion idea
                        </dt>
                        <dd className="text-stone-300">
                          {a.promo?.trim() || "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Uploads ({uploads.length})
                      </p>
                      {uploads.length === 0 ? (
                        <p className="mt-1 text-xs text-muted">
                          No files attached on this application.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {uploads.map((u) => (
                            <li
                              key={`${u.label}-${u.fileName}`}
                              className="rounded-md border border-border bg-elevated/40 px-3 py-2 text-xs"
                            >
                              <p className="font-medium text-stone-200">
                                {u.label}
                              </p>
                              <p className="text-muted">
                                {u.fileName}
                                {u.sizeBytes != null
                                  ? ` · ${(u.sizeBytes / 1024).toFixed(1)} KB`
                                  : ""}
                                {u.mimeType ? ` · ${u.mimeType}` : ""}
                              </p>
                              {u.dataUrl && u.mimeType?.startsWith("image/") && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={u.dataUrl}
                                  alt={u.label}
                                  className="mt-2 max-h-32 rounded-md object-contain ring-1 ring-border"
                                />
                              )}
                              {u.dataUrl && !u.mimeType?.startsWith("image/") && (
                                <a
                                  href={u.dataUrl}
                                  download={u.fileName}
                                  className="mt-1 inline-block text-brand underline"
                                >
                                  Download file
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-[10px] text-muted">
                        Demo stores file names + image previews in this browser.
                        Live version will store files in secure cloud storage
                        with full admin preview/download.
                      </p>
                    </div>

                    {status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
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
          <h2 className="font-semibold">Partner deals awaiting approval</h2>
          <p className="mt-1 text-sm text-muted">
            New deals from the partner dashboard start as pending.
          </p>
          {partnerDeals.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No partner-created deals yet. Create one from the{" "}
              <Link
                href="/restaurant/dashboard"
                className="text-brand underline"
              >
                partner dashboard
              </Link>{" "}
              (owner login).
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {partnerDeals.map((d) => {
                const status = d.status ?? "pending";
                const rest = RESTAURANTS.find((r) => r.id === d.restaurantId);
                return (
                  <li
                    key={d.id}
                    className="rounded-lg border border-border bg-background/50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-muted">
                          {rest?.name ?? d.restaurantId} · {d.type}
                          {d.regularPriceUsd != null &&
                            ` · reg $${d.regularPriceUsd}`}
                        </p>
                        <p className="mt-1 text-xs text-stone-400">
                          {d.description}
                        </p>
                      </div>
                      <span className="gp-badge !normal-case">{status}</span>
                    </div>
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
                          className="gp-btn gp-btn-ghost text-xs !py-1.5 ring-1 ring-border"
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

      {tab === "restaurants" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Live restaurant directory</h2>
          <p className="mt-1 text-sm text-muted">
            Toggle visibility on Explore. Seed partners start approved.
          </p>
          <ul className="mt-4 space-y-2">
            {RESTAURANTS.map((r) => {
              const live = isRestaurantApproved(r.id);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-3 py-2"
                >
                  <span className="text-sm">
                    {r.emoji} {r.name}{" "}
                    <span className="text-xs text-muted">
                      · {r.neighborhood}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={`gp-btn text-xs !py-1.5 ${
                      live ? "gp-btn-secondary" : "gp-btn-primary"
                    }`}
                    onClick={() => setRestaurantApproved(r.id, !live)}
                  >
                    {live ? "Unpublish" : "Approve / publish"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === "feed" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">City feed moderation</h2>
          <p className="mt-1 text-sm text-muted">
            Hide spam or policy-violating posts (no political content).
          </p>
          <ul className="mt-4 space-y-3">
            {feedQueue.map((p) => (
              <li
                key={p.id}
                className={`rounded-lg border border-border p-3 ${
                  p.hidden ? "opacity-50" : "bg-background/50"
                }`}
              >
                <p className="text-xs text-muted">
                  {p.author} · {p.city} ·{" "}
                  {new Date(p.createdAt).toLocaleString()}
                  {p.hidden && (
                    <span className="ml-2 text-red-300">· hidden</span>
                  )}
                </p>
                <p className="mt-1 font-medium">{p.title}</p>
                <p className="mt-1 text-sm text-stone-400">{p.body}</p>
                <div className="mt-2">
                  {p.hidden ? (
                    <button
                      type="button"
                      className="gp-btn gp-btn-secondary text-xs !py-1.5"
                      onClick={() => unhideFeedPost(p.id)}
                    >
                      Restore post
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="gp-btn gp-btn-secondary text-xs !py-1.5"
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
                      Hide post
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <button
          type="button"
          className="gp-btn gp-btn-ghost text-sm text-red-300 ring-1 ring-red-500/30"
          onClick={() => {
            if (
              confirm(
                "Reset all demo data in this browser (accounts, apps, deals, redemptions)?",
              )
            ) {
              resetDemoData();
            }
          }}
        >
          Reset demo data
        </button>
      </div>
    </div>
  );
}
