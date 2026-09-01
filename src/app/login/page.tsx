"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { isLocalDemoHost } from "@/lib/public-site";
import { useStore } from "@/lib/store";

type Mode = "password" | "magic";

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
    signInDemo,
    accounts,
  } = useStore();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [localDemo, setLocalDemo] = useState(false);
  useEffect(() => setLocalDemo(isLocalDemoHost()), []);

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
        <Link
          href="/membership"
          className="rounded-full bg-elevated px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-border transition hover:text-white"
        >
          Create account
        </Link>
      </div>

      {mode === "password" && (
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            const sb = createBrowserClient();
            if (sb) {
              const { error } = await sb.auth.signInWithPassword({
                email,
                password,
              });
              if (error) {
                setErr(error.message);
                return;
              }
              goAccount();
              return;
            }
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
            Use the email and password from membership or partner invite.
          </p>
        </form>
      )}

      {mode === "magic" && (
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            setMsg("");
            const sb = createBrowserClient();
            if (sb) {
              const { error } = await sb.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/account` },
              });
              if (error) {
                setErr(error.message);
                return;
              }
              setMsg("Check your email for a sign-in link.");
              return;
            }
            const res = loginWithMagicLink(email);
            if (!res.ok) {
              setErr(res.error ?? "Failed");
              return;
            }
            setMsg("Check your email for a sign-in link.");
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
            We’ll email a one-time sign-in link. Check spam if it doesn’t arrive.
          </p>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <button type="submit" className="gp-btn gp-btn-primary w-full">
            Email me a link
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-muted">
        Can’t get in?{" "}
        <Link href="/contact" className="text-brand underline">
          Contact support
        </Link>{" "}
        or see the{" "}
        <Link href="/faq" className="text-brand underline">
          FAQ
        </Link>
        .
      </p>

      {localDemo && (
      <div className="mt-10 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Local demo roles
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
      )}

      <p className="mt-8 text-sm text-muted">
        <Link href="/membership" className="text-brand underline">
          Get membership
        </Link>{" "}
        · multi-seat intake creates one login per person.
      </p>
    </div>
  );
}
