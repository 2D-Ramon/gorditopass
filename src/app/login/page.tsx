"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

type Mode = "password" | "magic" | "signup";

/**
 * Recommended auth model (demo):
 * - One person = one email login (never share passwords across seats)
 * - Password or magic link
 * - Multi-seat plans: each seat is a separate account under one billing plan
 * - Business: owner invites staff with their own emails + roles
 */
export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithPassword,
    loginWithMagicLink,
    registerDinerAccount,
    signInDemo,
    accounts,
  } = useStore();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo1234");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function goAccount() {
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="gp-page-title">Sign in</h1>
      <p className="gp-page-sub">
        Each person has their own login. Family seats share a{" "}
        <strong className="text-stone-300">plan</strong>, not a password.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["password", "Email + password"],
            ["magic", "Magic link"],
            ["signup", "Create account"],
          ] as [Mode, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === id
                ? "bg-brand text-white"
                : "bg-elevated text-muted ring-1 ring-border"
            }`}
            onClick={() => {
              setMode(id);
              setErr("");
              setMsg("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "password" && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setErr("");
            const res = loginWithPassword(email, password);
            if (!res.ok) {
              setErr(res.error ?? "Login failed");
              return;
            }
            goAccount();
          }}
        >
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              className="gp-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              required
              type="password"
              className="gp-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <button type="submit" className="gp-btn gp-btn-primary w-full">
            Sign in
          </button>
          <p className="text-xs text-muted">
            Demo default password for membership seats:{" "}
            <code className="text-stone-300">demo1234</code>
          </p>
        </form>
      )}

      {mode === "magic" && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setErr("");
            setMsg("");
            const res = loginWithMagicLink(email);
            if (!res.ok) {
              setErr(res.error ?? "Failed");
              return;
            }
            setMsg("Magic link “sent” (demo) — you’re signed in.");
            goAccount();
          }}
        >
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              className="gp-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <p className="text-xs text-muted">
            Live app: we email a one-time link. Demo signs you in immediately.
          </p>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <button type="submit" className="gp-btn gp-btn-primary w-full">
            Email me a link
          </button>
        </form>
      )}

      {mode === "signup" && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setErr("");
            const res = registerDinerAccount({
              email,
              password,
              firstName,
              lastName,
              phone,
            });
            if (!res.ok) {
              setErr(res.error ?? "Could not create account");
              return;
            }
            goAccount();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              First name
              <input
                required
                className="gp-input mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Last name
              <input
                required
                className="gp-input mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              className="gp-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              className="gp-input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Password (6+)
            <input
              required
              type="password"
              minLength={6}
              className="gp-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <button type="submit" className="gp-btn gp-btn-primary w-full">
            Create diner account
          </button>
        </form>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Quick demo roles
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="gp-btn gp-btn-secondary text-sm"
            onClick={() => {
              signInDemo("diner");
              goAccount();
            }}
          >
            Demo diner
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary text-sm"
            onClick={() => {
              signInDemo("restaurant", "owner");
              goAccount();
            }}
          >
            Demo restaurant owner
          </button>
          <button
            type="button"
            className="gp-btn gp-btn-secondary text-sm"
            onClick={() => {
              signInDemo("admin");
              goAccount();
            }}
          >
            Demo admin
          </button>
        </div>
        {accounts.length > 0 && (
          <p className="mt-4 text-xs text-muted">
            {accounts.length} saved account(s) in this browser. Household seats
            from membership signup can sign in with their email +{" "}
            <code className="text-stone-300">demo1234</code>.
          </p>
        )}
      </div>

      <p className="mt-8 text-sm text-muted">
        <Link href="/membership" className="text-brand underline">
          Get membership
        </Link>{" "}
        · multi-seat intake creates one login per person.
      </p>
    </div>
  );
}
