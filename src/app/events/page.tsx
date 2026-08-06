"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PARTNER_EVENTS } from "@/lib/data";
import { useStore } from "@/lib/store";
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
  const { city, partnerEvents } = useStore();
  const [sharedId, setSharedId] = useState<string | null>(null);

  const events = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const all = [...partnerEvents, ...PARTNER_EVENTS];
    return all
      .filter((e) => {
        if (e.city !== city) return false;
        const d = new Date(e.date + "T12:00:00");
        return (
          (d.getMonth() === month && d.getFullYear() === year) ||
          (d.getMonth() === 7 && d.getFullYear() === 2026)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [city, partnerEvents]);

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
        Showing · {monthLabel} (plus demo seed)
      </p>

      <div className="mt-8 space-y-4">
        {events.map((e) => {
          const address = e.address ?? `${e.restaurantName}, ${e.city}`;
          const ticketHref = e.ticketUrl ?? "#";
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
                <div className="mt-4 flex flex-wrap gap-2">
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
        {events.length === 0 && (
          <p className="text-center text-muted">
            No partner events this month in this city yet.
          </p>
        )}
      </div>
    </div>
  );
}
