"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BusinessAccount,
  BusinessStatus,
  CampaignAudience,
  CampaignChannel,
  CampaignRecord,
  MemberPlanId,
  MemberRecord,
  MemberStatus,
  OpsAdminPublic,
  OpsPermission,
  OpsStatus,
} from "@/lib/ops-types";

export type OpsTab = "connect" | "crm" | "members" | "campaigns" | "admins";

const ACCESS_FLAGS: { id: OpsPermission; label: string }[] = [
  { id: "can_crm", label: "Business CRM" },
  { id: "can_members", label: "Members" },
  { id: "can_campaigns", label: "Campaigns" },
  { id: "can_applications", label: "Restaurant applications" },
  { id: "can_content", label: "Deals, menu, events, jobs, auto-approve" },
  { id: "can_restaurants", label: "Restaurants" },
  { id: "can_feed", label: "Feed moderation" },
  { id: "can_manage_admins", label: "Add and remove admins" },
];

const ADMINS_SQL = `create table if not exists public.ops_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  is_owner boolean not null default false,
  active boolean not null default true,
  can_crm boolean not null default false,
  can_members boolean not null default false,
  can_campaigns boolean not null default false,
  can_applications boolean not null default false,
  can_content boolean not null default false,
  can_restaurants boolean not null default false,
  can_feed boolean not null default false,
  can_manage_admins boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ops_admins_one_owner
  on public.ops_admins (is_owner)
  where is_owner = true;

drop trigger if exists ops_admins_updated_at on public.ops_admins;
create trigger ops_admins_updated_at
before update on public.ops_admins
for each row execute procedure public.set_updated_at();

alter table public.ops_admins enable row level security;`;

const BIZ_STATUSES: { id: BusinessStatus; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "contacting", label: "Contacting" },
  { id: "applied", label: "Applied" },
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "lost", label: "Lost" },
];

export function OpsHub({ tab }: { tab: OpsTab }) {
  const [status, setStatus] = useState<OpsStatus | null>(null);
  const [secret, setSecret] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/ops/status");
    setStatus(await res.json());
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const res = await fetch("/api/ops/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "Could not unlock.");
      return;
    }
    setSecret("");
    setMsg("Ops unlocked for this browser.");
    await refreshStatus();
  }

  if (!status) {
    return <p className="mt-6 text-sm text-muted">Checking Supabase…</p>;
  }

  const ready = status.supabase && status.hasOpsSecret && status.unlocked;

  return (
    <div className="mt-6 space-y-4">
      {tab === "connect" && (
        <ConnectPanel
          status={status}
          secret={secret}
          setSecret={setSecret}
          msg={msg}
          err={err}
          onUnlock={unlock}
        />
      )}
      {tab !== "connect" && !ready && (
        <div className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">Connect Supabase first</h2>
          <p className="mt-2 text-sm text-muted">
            This tab stores live data in your Supabase project. Finish the
            Connect tab (keys + SQL + unlock secret), then come back.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>Supabase keys: {status.supabase ? "yes" : "not set"}</li>
            <li>Admin secret: {status.hasOpsSecret ? "yes" : "not set"}</li>
            <li>Unlocked this browser: {status.unlocked ? "yes" : "no"}</li>
          </ul>
        </div>
      )}
      {ready && tab === "crm" && <CrmPanel />}
      {ready && tab === "members" && <MembersPanel />}
      {ready && tab === "campaigns" && <CampaignsPanel />}
      {ready && tab === "admins" && <AdminsPanel status={status} onRefresh={refreshStatus} />}
    </div>
  );
}

function ConnectPanel({
  status,
  secret,
  setSecret,
  msg,
  err,
  onUnlock,
}: {
  status: OpsStatus;
  secret: string;
  setSecret: (v: string) => void;
  msg: string;
  err: string;
  onUnlock: (e: React.FormEvent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="gp-card gp-card-static p-5">
        <h2 className="font-semibold">Connection</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <StatusRow ok={status.supabase} label="Supabase URL + service key" />
          <StatusRow ok={status.hasOpsSecret} label="OPS_ADMIN_SECRET" />
          <StatusRow ok={status.unlocked} label="This browser unlocked" />
          <StatusRow ok={!status.needsAdminTable} label="Admins table in Supabase" />
          <StatusRow ok={status.hasOwner} label="Owner admin account" />
          <StatusRow
            ok={Boolean(status.me)}
            label={status.me ? `Signed in as ${status.me.email}` : "Admin email sign-in"}
          />
        </ul>
        {status.supabase && status.hasOpsSecret && !status.unlocked && (
          <form className="mt-4 space-y-3" onSubmit={onUnlock}>
            <label className="block text-sm">
              Unlock with your ops secret
              <input
                type="password"
                className="gp-input mt-1"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Unlock
            </button>
          </form>
        )}
        {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      </div>
      {status.needsAdminTable && (
        <div className="gp-card gp-card-static p-5">
          <h2 className="font-semibold">One more SQL script</h2>
          <p className="mt-2 text-sm text-muted">
            In Supabase → SQL Editor, paste this, click Run (the destructive
            warning is OK), then refresh this page.
          </p>
          <textarea
            readOnly
            className="gp-input mt-3 min-h-[10rem] font-mono text-xs"
            value={ADMINS_SQL}
          />
        </div>
      )}
      {status.unlocked && !status.needsAdminTable && !status.hasOwner && (
        <OwnerSetupForm />
      )}
      <div className="gp-card gp-card-static p-5 text-sm leading-relaxed text-muted">
        <h2 className="font-semibold text-white">Setup checklist</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Create a free project at{" "}
            <a
              className="text-brand underline"
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              supabase.com/dashboard
            </a>
            .
          </li>
          <li>
            Project Settings → API: copy Project URL, anon key, and service
            role key.
          </li>
          <li>
            Put them in <code className="text-stone-300">web/.env.local</code>{" "}
            (and in Vercel → Environment Variables for the live site).
          </li>
          <li>
            SQL Editor → paste <code className="text-stone-300">supabase/schema.sql</code>{" "}
            → Run.
          </li>
          <li>
            Restart the app, come back here, unlock with{" "}
            <code className="text-stone-300">OPS_ADMIN_SECRET</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}

function OwnerSetupForm() {
  const [form, setForm] = useState({
    secret: "",
    name: "",
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const res = await fetch("/api/ops/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, action: "create_owner" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Could not create owner.");
      return;
    }
    setMsg("Owner account created. Use this email and password next time.");
    window.location.reload();
  }

  return (
    <form className="gp-card gp-card-static space-y-3 p-5" onSubmit={submit}>
      <h2 className="font-semibold">Create your owner login</h2>
      <p className="text-sm text-muted">
        This is you — the main admin. You cannot be removed. Other admins will
        sign in with their own email and password.
      </p>
      <label className="block text-sm">
        Ops secret (same as unlock)
        <input
          required
          type="password"
          className="gp-input mt-1"
          value={form.secret}
          onChange={(e) => setForm({ ...form, secret: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Your name
        <input
          required
          className="gp-input mt-1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          className="gp-input mt-1"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Password (8+)
        <input
          required
          minLength={8}
          type="password"
          className="gp-input mt-1"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      <button type="submit" className="gp-btn gp-btn-primary text-sm">
        Save owner account
      </button>
      {msg && <p className="text-sm text-success">{msg}</p>}
      {err && <p className="text-sm text-red-300">{err}</p>}
    </form>
  );
}

function emptyFlags(): Record<OpsPermission, boolean> {
  return {
    can_crm: true,
    can_members: true,
    can_campaigns: false,
    can_applications: false,
    can_content: false,
    can_restaurants: false,
    can_feed: false,
    can_manage_admins: false,
  };
}

function AdminsPanel({
  status,
  onRefresh,
}: {
  status: OpsStatus;
  onRefresh: () => Promise<void>;
}) {
  const [rows, setRows] = useState<OpsAdminPublic[]>([]);
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    ...emptyFlags(),
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/ops/admins");
    const data = await res.json();
    if (res.ok) setRows(data.admins ?? []);
    else setFlash(data.error ?? "Could not load admins.");
  }, []);

  useEffect(() => {
    if (status.hasOwner) void load();
  }, [load, status.hasOwner]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setFlash("");
    const res = await fetch("/api/ops/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not add admin.");
      return;
    }
    setForm({ name: "", email: "", password: "", ...emptyFlags() });
    setFlash(`Added ${data.admin.email}. They sign in on /admin with that email.`);
    await load();
    await onRefresh();
  }

  async function setFlag(id: string, key: OpsPermission, value: boolean) {
    await fetch(`/api/ops/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    await load();
  }

  async function remove(admin: OpsAdminPublic) {
    if (!confirm(`Remove access for ${admin.email}?`)) return;
    const res = await fetch(`/api/ops/admins/${admin.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not remove.");
      return;
    }
    setFlash(`Removed ${admin.email}.`);
    await load();
  }

  if (!status.hasOwner) {
    return (
      <div className="gp-card gp-card-static p-5">
        <h2 className="font-semibold">Admins</h2>
        <p className="mt-2 text-sm text-muted">
          Finish Connect first: run the admins SQL if needed, then create your
          owner login. After that you can add other admins here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form className="gp-card gp-card-static space-y-3 p-5" onSubmit={add}>
        <h2 className="font-semibold">Add admin</h2>
        <p className="text-sm text-muted">
          They get their own email and password. Check only the areas they
          should see.
        </p>
        <label className="block text-sm">
          Name
          <input
            required
            className="gp-input mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            className="gp-input mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Temporary password (8+)
          <input
            required
            minLength={8}
            type="password"
            className="gp-input mt-1"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Access</legend>
          {ACCESS_FLAGS.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form[f.id]}
                onChange={(e) => setForm({ ...form, [f.id]: e.target.checked })}
              />
              {f.label}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="gp-btn gp-btn-primary text-sm">
          Create admin login
        </button>
        {flash && <p className="text-sm text-stone-300">{flash}</p>}
      </form>
      <div className="gp-card gp-card-static p-5">
        <h2 className="font-semibold">People with access</h2>
        <ul className="mt-3 space-y-3">
          {rows.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border bg-background/50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {a.name}
                    {a.is_owner ? " · owner" : ""}
                    {status.me?.id === a.id ? " · you" : ""}
                  </p>
                  <p className="text-xs text-muted">{a.email}</p>
                </div>
                {!a.is_owner && status.me?.id !== a.id && (
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:underline"
                    onClick={() => void remove(a)}
                  >
                    Remove access
                  </button>
                )}
              </div>
              {a.is_owner ? (
                <p className="mt-2 text-xs text-muted">
                  Owner has access to every area and cannot be removed.
                </p>
              ) : (
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {ACCESS_FLAGS.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={a[f.id]}
                        onChange={(e) =>
                          void setFlag(a.id, f.id, e.target.checked)
                        }
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-success" : "text-brand-gold"}>
        {ok ? "●" : "○"}
      </span>
      {label}
    </li>
  );
}

function CrmPanel() {
  const [rows, setRows] = useState<BusinessAccount[]>([]);
  const [filter, setFilter] = useState<BusinessStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");
  const emptyForm = {
    name: "",
    status: "lead" as BusinessStatus,
    city: "dallas",
    neighborhood: "",
    cuisine: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
    source: "",
    next_follow_up: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const res = await fetch("/api/ops/businesses");
    const data = await res.json();
    if (res.ok) setRows(data.businesses ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );
  const current = rows.find((r) => r.id === selected) ?? null;

  async function saveNew(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/ops/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not save.");
      return;
    }
    setForm(emptyForm);
    setFlash("Business saved.");
    await load();
    setSelected(data.business.id);
  }

  async function patch(id: string, patch: Partial<BusinessAccount>) {
    const res = await fetch(`/api/ops/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await load();
  }

  async function addNote(id: string) {
    if (!note.trim()) return;
    const res = await fetch(`/api/ops/businesses/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note }),
    });
    if (res.ok) {
      setNote("");
      await load();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <form className="gp-card gp-card-static space-y-3 p-5" onSubmit={saveNew}>
          <h2 className="font-semibold">Add business</h2>
          <label className="block text-sm">
            Name *
            <input
              required
              className="gp-input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Status
              <select
                className="gp-input mt-1"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as BusinessStatus })
                }
              >
                {BIZ_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              City
              <input
                className="gp-input mt-1"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm">
            Contact name
            <input
              className="gp-input mt-1"
              value={form.contact_name}
              onChange={(e) =>
                setForm({ ...form, contact_name: e.target.value })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Email
              <input
                type="email"
                className="gp-input mt-1"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Phone
              <input
                className="gp-input mt-1"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
              />
            </label>
          </div>
          <button type="submit" className="gp-btn gp-btn-primary text-sm">
            Save to CRM
          </button>
          {flash && <p className="text-sm text-success">{flash}</p>}
        </form>
      </div>
      <div className="gp-card gp-card-static p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Pipeline ({visible.length})</h2>
          <select
            className="gp-input max-w-[10rem] text-sm"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as BusinessStatus | "all")
            }
          >
            <option value="all">All statuses</option>
            {BIZ_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
          {visible.length === 0 && (
            <li className="text-sm text-muted">No businesses yet.</li>
          )}
          {visible.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setSelected(b.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selected === b.id
                    ? "border-brand/40 bg-brand/10"
                    : "border-border bg-background/50"
                }`}
              >
                <span className="font-medium">{b.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {b.status} · {b.contact_name || "no contact"} ·{" "}
                  {b.city || "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {current && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <p className="font-semibold">{current.name}</p>
            <label className="block text-sm">
              Status
              <select
                className="gp-input mt-1"
                value={current.status}
                onChange={(e) =>
                  void patch(current.id, {
                    status: e.target.value as BusinessStatus,
                  })
                }
              >
                {BIZ_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted">
              {current.contact_email || "no email"} ·{" "}
              {current.contact_phone || "no phone"}
            </p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Activity
              </p>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
                {(current.business_notes ?? []).length === 0 && (
                  <li>No notes yet.</li>
                )}
                {(current.business_notes ?? [])
                  .slice()
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((n) => (
                    <li key={n.id}>
                      {new Date(n.created_at).toLocaleString()} — {n.body}
                    </li>
                  ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  className="gp-input text-sm"
                  placeholder="Add a follow-up note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  type="button"
                  className="gp-btn gp-btn-secondary text-sm"
                  onClick={() => void addNote(current.id)}
                >
                  Add
                </button>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-red-300 hover:underline"
              onClick={() => {
                if (!confirm(`Remove ${current.name} from the CRM?`)) return;
                void fetch(`/api/ops/businesses/${current.id}`, {
                  method: "DELETE",
                }).then(() => {
                  setSelected(null);
                  void load();
                });
              }}
            >
              Remove from CRM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MembersPanel() {
  const [rows, setRows] = useState<MemberRecord[]>([]);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "dallas",
    plan_id: "" as "" | MemberPlanId,
    status: "waitlist" as MemberStatus,
    is_member: false,
    email_opt_in: true,
    sms_opt_in: false,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/ops/members");
    const data = await res.json();
    if (res.ok) setRows(data.members ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = rows.filter((m) => {
    const hay = `${m.first_name} ${m.last_name} ${m.email} ${m.phone}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setFlash("");
    const res = await fetch("/api/ops/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        plan_id: form.plan_id || null,
        is_member: form.status === "active" || form.is_member,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not save.");
      return;
    }
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      city: "dallas",
      plan_id: "",
      status: "waitlist",
      is_member: false,
      email_opt_in: true,
      sms_opt_in: false,
    });
    setFlash("Member saved.");
    await load();
  }

  async function toggle(
    id: string,
    patch: Partial<Pick<MemberRecord, "email_opt_in" | "sms_opt_in" | "status">>,
  ) {
    await fetch(`/api/ops/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <form className="gp-card gp-card-static grid gap-3 p-5 sm:grid-cols-2" onSubmit={add}>
        <h2 className="font-semibold sm:col-span-2">Add member</h2>
        <label className="block text-sm">
          First name
          <input
            className="gp-input mt-1"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Last name
          <input
            className="gp-input mt-1"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Email *
          <input
            required
            type="email"
            className="gp-input mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            className="gp-input mt-1"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Status
          <select
            className="gp-input mt-1"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as MemberStatus })
            }
          >
            <option value="waitlist">Waitlist</option>
            <option value="active">Active member</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block text-sm">
          Plan
          <select
            className="gp-input mt-1"
            value={form.plan_id}
            onChange={(e) =>
              setForm({ ...form, plan_id: e.target.value as MemberPlanId | "" })
            }
          >
            <option value="">None</option>
            <option value="monthly">Monthly</option>
            <option value="six_month">6 months</option>
            <option value="annual">Annual</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.email_opt_in}
            onChange={(e) =>
              setForm({ ...form, email_opt_in: e.target.checked })
            }
          />
          Email opt-in
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.sms_opt_in}
            onChange={(e) => setForm({ ...form, sms_opt_in: e.target.checked })}
          />
          SMS opt-in
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="gp-btn gp-btn-primary text-sm">
            Save member
          </button>
          {flash && <p className="mt-2 text-sm text-success">{flash}</p>}
        </div>
      </form>
      <div className="gp-card gp-card-static p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Directory ({visible.length})</h2>
          <input
            className="gp-input max-w-xs text-sm"
            placeholder="Search name, email, phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Person</th>
                <th>Status</th>
                <th>Email</th>
                <th>SMS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-2">
                    <p className="font-medium">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") ||
                        m.email}
                    </p>
                    <p className="text-xs text-muted">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ""}
                    </p>
                  </td>
                  <td className="text-xs">{m.status}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={m.email_opt_in}
                      onChange={(e) =>
                        void toggle(m.id, { email_opt_in: e.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={m.sms_opt_in}
                      onChange={(e) =>
                        void toggle(m.id, { sms_opt_in: e.target.checked })
                      }
                    />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="text-xs text-red-300 hover:underline"
                      onClick={() => {
                        if (!confirm(`Remove ${m.email}?`)) return;
                        void fetch(`/api/ops/members/${m.id}`, {
                          method: "DELETE",
                        }).then(() => load());
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="mt-3 text-sm text-muted">No members match.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignsPanel() {
  const [rows, setRows] = useState<CampaignRecord[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({
    name: "",
    channel: "email" as CampaignChannel,
    audience: "members_opted_in" as CampaignAudience,
    subject: "",
    body: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/ops/campaigns");
    const data = await res.json();
    if (res.ok) setRows(data.campaigns ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetch(
        `/api/ops/audience?channel=${form.channel}&audience=${form.audience}`,
      )
        .then((r) => r.json())
        .then((d) => setCount(typeof d.count === "number" ? d.count : null));
    }, 200);
    return () => clearTimeout(t);
  }, [form.channel, form.audience]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFlash("");
    const res = await fetch("/api/ops/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not save.");
      return;
    }
    setForm({ ...form, name: "", subject: "", body: "" });
    setFlash("Draft saved.");
    await load();
  }

  async function queue(id: string) {
    const res = await fetch(`/api/ops/campaigns/${id}/send`, { method: "POST" });
    const data = await res.json();
    setFlash(data.note ?? data.error ?? "Queued.");
    await load();
  }

  return (
    <div className="space-y-4">
      <form className="gp-card gp-card-static space-y-3 p-5" onSubmit={create}>
        <h2 className="font-semibold">New campaign</h2>
        <p className="text-sm text-muted">
          Audience is built from your member and business lists (opt-in only
          where required). Delivery pipes for actual send come next.
        </p>
        <label className="block text-sm">
          Name
          <input
            required
            className="gp-input mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Channel
            <select
              className="gp-input mt-1"
              value={form.channel}
              onChange={(e) =>
                setForm({ ...form, channel: e.target.value as CampaignChannel })
              }
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </label>
          <label className="block text-sm">
            Audience
            <select
              className="gp-input mt-1"
              value={form.audience}
              onChange={(e) =>
                setForm({
                  ...form,
                  audience: e.target.value as CampaignAudience,
                })
              }
            >
              <option value="members_opted_in">Opted-in members</option>
              <option value="waitlist">Waitlist</option>
              <option value="all_members">All members</option>
              <option value="businesses">Business contacts</option>
            </select>
          </label>
        </div>
        {form.channel === "email" && (
          <label className="block text-sm">
            Subject
            <input
              className="gp-input mt-1"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </label>
        )}
        <label className="block text-sm">
          Message
          <textarea
            required
            className="gp-input mt-1 min-h-[120px]"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </label>
        <p className="text-xs text-muted">
          Estimated recipients: {count === null ? "…" : count}
        </p>
        <button type="submit" className="gp-btn gp-btn-primary text-sm">
          Save draft
        </button>
        {flash && <p className="text-sm text-stone-300">{flash}</p>}
      </form>
      <div className="gp-card gp-card-static p-5">
        <h2 className="font-semibold">Campaigns</h2>
        <ul className="mt-3 space-y-2">
          {rows.length === 0 && (
            <li className="text-sm text-muted">No campaigns yet.</li>
          )}
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.channel} · {c.audience} · {c.status}
                  {c.recipient_count ? ` · ${c.recipient_count} people` : ""}
                </p>
              </div>
              {c.status === "draft" && (
                <button
                  type="button"
                  className="gp-btn gp-btn-secondary text-xs !py-1.5"
                  onClick={() => void queue(c.id)}
                >
                  Build send list
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
