"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("diner");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="gp-page-title">Contact</h1>
      <p className="gp-page-sub">
        Questions before joining, restaurant partnership, or help with an
        account — we read every note.
      </p>

      {sent ? (
        <div className="mt-8 gp-card gp-card-static border-success/30 p-6">
          <p className="font-semibold text-success">Thanks — we have it</p>
          <p className="mt-2 text-sm text-muted">
            We’ll reply to {email || "your email"}. Most notes get an answer
            within one business day.
          </p>
          <Link href="/faq" className="gp-btn gp-btn-secondary mt-4 text-sm">
            Browse FAQ while you wait
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            setBusy(true);
            try {
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role, message }),
              });
              const data = (await res.json().catch(() => ({}))) as {
                delivered?: boolean;
                error?: string;
              };
              if (!res.ok && data.error) {
                setErr(data.error);
                return;
              }
              if (data.delivered) {
                setSent(true);
                return;
              }
              const subject = encodeURIComponent(`GorditoPass (${role}): ${name}`);
              const body = encodeURIComponent(
                `From: ${name} <${email}>\nI am a: ${role}\n\n${message}`,
              );
              window.location.href = `mailto:${PLATFORM.supportEmail}?subject=${subject}&body=${body}`;
              setSent(true);
            } catch {
              setErr("Could not send. Email us directly using the link below.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm font-medium">
            Name
            <input
              required
              className="gp-input mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              className="gp-input mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium">
            I am a…
            <select
              className="gp-input mt-1.5"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="diner">Diner / member</option>
              <option value="restaurant">Restaurant / business</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Message
            <textarea
              required
              className="gp-input mt-1.5 min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
            />
          </label>
          {err && <p className="text-sm text-red-300">{err}</p>}
          <button type="submit" className="gp-btn gp-btn-primary" disabled={busy}>
            {busy ? "Sending…" : "Send message"}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-muted">
        Prefer email?{" "}
        <a
          href={`mailto:${PLATFORM.supportEmail}`}
          className="text-brand underline"
        >
          {PLATFORM.supportEmail}
        </a>
      </p>
    </div>
  );
}
