"use client";

import { useState } from "react";
import { PLATFORM } from "@/lib/pricing";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("diner");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="gp-page-title">Contact</h1>
      <p className="gp-page-sub">
        Questions before signing up, partnership help, or general support — send
        us a note. Demo form stores nothing on a server.
      </p>

      {sent ? (
        <div className="mt-8 gp-card gp-card-static border-success/30 p-6">
          <p className="font-semibold text-success">Message sent (demo)</p>
          <p className="mt-2 text-sm text-muted">
            We’ll get back to you at {email || "your email"}. For now this is a
            local confirmation only.
          </p>
          <button
            type="button"
            className="gp-btn gp-btn-secondary mt-4 text-sm"
            onClick={() => setSent(false)}
          >
            Send another
          </button>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label className="block text-sm font-medium">
            Name
            <input
              required
              className="gp-input mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <button type="submit" className="gp-btn gp-btn-primary">
            Send message
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-muted">
        Or email{" "}
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
