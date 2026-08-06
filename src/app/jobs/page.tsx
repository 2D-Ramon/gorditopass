"use client";

import Link from "next/link";
import { useMemo } from "react";
import { JOB_POSTINGS } from "@/lib/data";
import { isPartnerContentLive, useStore } from "@/lib/store";

export default function JobsPage() {
  const { city, partnerJobs } = useStore();

  const jobs = useMemo(
    () =>
      [
        ...partnerJobs.filter((j) => isPartnerContentLive(j)),
        ...JOB_POSTINGS,
      ]
        .filter((j) => j.city === city)
        .sort((a, b) => b.postedAt.localeCompare(a.postedAt)),
    [city, partnerJobs],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">Jobs</h1>
      <p className="gp-page-sub">
        Openings from partner restaurants. Apply on the business’s own
        application site.
      </p>

      <div className="mt-8 space-y-4">
        {jobs.map((j) => {
          const applyHref =
            j.applyUrl ??
            `https://example.com/careers/${j.restaurantId}/${j.id}`;
          return (
            <article key={j.id} className="gp-card gp-card-static p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {j.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-orange-200/80">
                    <Link
                      href={`/restaurants/${j.restaurantId}`}
                      className="hover:underline"
                    >
                      {j.restaurantName}
                    </Link>
                  </p>
                </div>
                <span className="gp-badge !normal-case">{j.type}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {j.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                {j.payRange && (
                  <span className="font-medium text-stone-300">{j.payRange}</span>
                )}
                <span>
                  Posted{" "}
                  {new Date(j.postedAt + "T12:00:00").toLocaleDateString()}
                </span>
              </div>
              <div className="mt-4">
                <a
                  href={applyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gp-btn gp-btn-primary text-sm"
                >
                  Apply on business site
                </a>
              </div>
            </article>
          );
        })}
        {jobs.length === 0 && (
          <p className="text-center text-muted">
            No job postings in this city yet. Dallas has demo listings.
          </p>
        )}
      </div>

      <p className="mt-10 text-sm text-muted">
        Partner restaurants: create job posts from the{" "}
        <Link href="/restaurant/dashboard" className="text-brand underline">
          partner dashboard
        </Link>
        .
      </p>
    </div>
  );
}
