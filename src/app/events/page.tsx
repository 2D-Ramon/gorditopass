"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PARTNER_EVENTS } from "@/lib/data";
import { isPartnerContentLive, useStore } from "@/lib/store";
import type { PartnerEvent } from "@/lib/types";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function shareEvent(e: PartnerEvent) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/events#${e.id}`
      : "";
  const text = `${e.title} at ${e.restaurantName} — ${e.date} ${e.time}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    void navigator.share({ title: e.title, text, url }).catch(() => {});
    return;
  }
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(x, "_blank", "noopener,noreferrer");
}

export default function EventsPage() {
  const {
    city,
    partnerEvents,
    user,
    setEventRsvp,
    getEventRsvp,
    getEventRsvpCounts,
  } = useStore();
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [rsvpMsg, setRsvpMsg] = useState("");

  const livePartner = useMemo(
    () => partnerEvents.filter((e) => isPartnerContentLive(e)),
    [partnerEvents],
  );

  const events = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const partnerForCity = livePartner.filter((e) => e.city === city);
    const seedForMonth = PARTNER_EVENTS.filter((e) => {
      if (e.city !== city) return false;
      const d = new Date(e.date + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const seen = new Set<string>();
    const all = [...partnerForCity, ...seedForMonth].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [city, livePartner]);

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">Events</h1>
      <p className="gp-page-sub">
        Partner restaurant events for the month. Reserve tickets, get
        directions, and share with friends.
      </p>
      <p className="mt-2 text-sm text-muted">
        Live partner events for this city · seed demos for {monthLabel}
        {livePartner.length > 0
          ? ` · ${livePartner.filter((e) => e.city === city).length} approved partner event(s)`
          : ""}
      </p>

      {rsvpMsg && (
        <p className="mt-3 text-sm text-brand">{rsvpMsg}</p>
      )}

      <div className="mt-8 space-y-4">
        {events.length === 0 && (
          <p className="text-sm text-muted">
            No events yet for this city. Partner events appear here after admin
            approval.
          </p>
        )}
        {events.map((e) => {
          const address = e.address ?? `${e.restaurantName}, ${e.city}`;
          const ticketHref = e.ticketUrl ?? "#";
          const mine = getEventRsvp(e.id);
          const counts = getEventRsvpCounts(e.id);
          return (
            <article
              key={e.id}
              id={e.id}
              className="gp-card gp-card-static flex flex-col gap-4 p-5 sm:flex-row"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-elevated text-2xl ring-1 ring-border">
                {e.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-brand">
                  {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {e.time}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {e.title}
                </h2>
                <p className="mt-0.5 text-sm text-orange-200/80">
                  <Link
                    href={`/restaurants/${e.restaurantId}`}
                    className="hover:underline"
                  >
                    {e.restaurantName}
                  </Link>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {e.description}
                </p>
                {e.ticketPriceUsd != null && e.ticketPriceUsd > 0 && (
                  <p className="mt-1 text-xs font-medium text-stone-400">
                    From ${e.ticketPriceUsd}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-muted">
                  {counts.interested > 0 && (
                    <span className="mr-3">
                      {counts.interested} interested
                    </span>
                  )}
                  {counts.going > 0 && (
                    <span>{counts.going} going</span>
                  )}
                  {counts.interested === 0 && counts.going === 0 && (
                    <span>Be the first to RSVP</span>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`gp-btn text-xs !py-1.5 ${
                      mine === "interested"
                        ? "gp-btn-primary"
                        : "gp-btn-secondary"
                    }`}
                    onClick={() => {
                      if (!user) {
                        setRsvpMsg("Sign in to mark Interested.");
                        return;
                      }
                      const res = setEventRsvp(e.id, "interested");
                      if (res.ok) {
                        setRsvpMsg(
                          mine === "interested"
                            ? "Removed Interested."
                            : "Marked Interested.",
                        );
                      } else {
                        setRsvpMsg(res.error ?? "Could not update.");
                      }
                    }}
                  >
                    {mine === "interested" ? "✓ Interested" : "Interested"}
                  </button>
                  <button
                    type="button"
                    className={`gp-btn text-xs !py-1.5 ${
                      mine === "going"
                        ? "gp-btn-primary"
                        : "gp-btn-secondary"
                    }`}
                    onClick={() => {
                      if (!user) {
                        setRsvpMsg("Sign in to mark I'll be there.");
                        return;
                      }
                      const res = setEventRsvp(e.id, "going");
                      if (res.ok) {
                        setRsvpMsg(
                          mine === "going"
                            ? "Removed I'll be there."
                            : "You're going — see you there!",
                        );
                      } else {
                        setRsvpMsg(res.error ?? "Could not update.");
                      }
                    }}
                  >
                    {mine === "going" ? "✓ I'll be there" : "I'll be there"}
                  </button>
                  <a
                    href={ticketHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gp-btn gp-btn-primary text-xs !py-1.5"
                  >
                    {e.ticketPriceUsd === 0
                      ? "Reserve free"
                      : "Purchase / reserve tickets"}
                  </a>
                  <a
                    href={mapsUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gp-btn-map"
                  >
                    <span aria-hidden>📍</span> Map
                  </a>
                  <button
                    type="button"
                    className="gp-btn-share"
                    onClick={() => {
                      shareEvent(e);
                      setSharedId(e.id);
                      setTimeout(() => setSharedId(null), 2000);
                    }}
                  >
                    <span aria-hidden>↗</span>{" "}
                    {sharedId === e.id ? "Shared!" : "Share"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
