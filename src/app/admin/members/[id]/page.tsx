"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RESTAURANTS, cityLabel } from "@/lib/data";
import type { LiveMemberBundle } from "@/lib/types";

type Post = {
  id: string;
  title: string;
  body: string;
  city: string;
  created_at: string;
  restaurant_name: string | null;
};

type Account = LiveMemberBundle & {
  banned: boolean;
  posts: Post[];
};

export default function AdminMemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Account | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    setErr("");
    setData(null);
    void fetch(`/api/ops/diners/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancel) return;
        if (!res.ok) {
          setErr(json.error ?? "Could not open this member.");
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancel) setErr("Could not open this member.");
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin?tab=members" className="text-sm text-brand underline">
          Back to members
        </Link>
        <p className="mt-4 text-sm text-muted">{err}</p>
        <p className="mt-2 text-sm">
          <Link href="/admin" className="text-brand underline">
            Sign in on the admin dashboard
          </Link>{" "}
          if this page did not open. It uses the Members permission.
        </p>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">
        Loading this member…
      </div>
    );
  }

  const user = data.user;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin?tab=members" className="text-sm text-brand underline">
        Back to members
      </Link>
      <h1 className="gp-page-title mt-3">{name}</h1>
      <p className="gp-page-sub">
        {user.email}
        {user.city ? ` · ${cityLabel(user.city)}` : ""} ·{" "}
        {user.accountDeleted
          ? "Deleted — history kept"
          : data.banned
            ? "Banned"
            : user.isMember
              ? "Active member"
              : "Not a member"}
        {user.suspension &&
        new Date(user.suspension.until).getTime() > Date.now()
          ? ` · Suspended until ${user.suspension.until.slice(0, 10)} (${user.suspension.scope})`
          : ""}
        {user.planId ? ` · ${user.planId}` : ""}
      </p>
      <p className="mt-2 text-sm text-muted">
        Read only. This is the same account the member sees, including warnings.
      </p>

      <section className="mt-6 gp-card gp-card-static p-5">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Field label="Phone">{user.phone}</Field>
          <Field label="Birthday">{user.birthday}</Field>
          <Field label="Address">{user.homeAddress}</Field>
          <Field label="Warnings">{String(data.warningCount ?? user.warningCount ?? 0)}</Field>
          <Field label="Points">{String(user.rewardPoints ?? 0)}</Field>
          <Field label="Lifetime points">{String(user.rewardPointsLifetime ?? 0)}</Field>
          <Field label="Rewards claimed">{String(user.rewardsClaimed ?? 0)}</Field>
          <Field label="Savings this year">
            {data.savingsYtd != null ? `$${data.savingsYtd.toFixed(0)}` : ""}
          </Field>
          <Field label="Renews">{user.membershipRenewsAt}</Field>
          <Field label="Referral code">{user.referralCode}</Field>
        </dl>
      </section>

      <List
        title="Visits"
        empty="No member visits yet."
        rows={(data.redemptions ?? []).map((r) => ({
          id: `${r.code}-${r.at}`,
          title: r.restaurantName || r.dealId,
          meta: new Date(r.at).toLocaleString(),
          body: r.savingsUsd ? `Saved $${r.savingsUsd.toFixed(0)}` : "",
        }))}
      />
      <List
        title="Reviews"
        empty="No reviews yet."
        rows={(data.reviews ?? []).map((r) => ({
          id: r.id,
          title: `${r.plates} plates`,
          meta: r.createdAt,
          body: r.text,
        }))}
      />
      <List
        title="Favorites"
        empty="No favorites yet."
        rows={(data.favorites ?? []).map((rid) => ({
          id: rid,
          title: RESTAURANTS.find((r) => r.id === rid)?.name || rid,
          meta: "",
          body: "",
        }))}
      />
      <List
        title="Household"
        empty="No extra seats."
        rows={(data.household ?? []).map((s) => ({
          id: s.id,
          title: [s.firstName, s.lastName].filter(Boolean).join(" ") || s.email,
          meta: s.email,
          body: [s.phone, s.homeAddress].filter(Boolean).join(" · "),
        }))}
      />
      <List
        title="Feed comments"
        empty="No feed comments."
        rows={(data.posts ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          meta: [p.city, p.restaurant_name, p.created_at ? new Date(p.created_at).toLocaleString() : ""]
            .filter(Boolean)
            .join(" · "),
          body: p.body,
        }))}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children?: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase text-muted">{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function List({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { id: string; title: string; meta: string; body: string }[];
}) {
  return (
    <section className="mt-4 gp-card gp-card-static p-5">
      <h2 className="font-semibold">{title}</h2>
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
