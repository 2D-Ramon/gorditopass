"use client";

import { useState } from "react";

export default function StaffScanPage() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Staff scan</h1>
      <p className="mt-2 text-sm text-muted">
        You do not need to sign in. The member stays logged in on their phone.
        Enter their 6-digit code and this restaurant’s staff PIN.
      </p>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg("");
          setOk(false);
          setBusy(true);
          try {
            const res = await fetch("/api/redeem/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, pin }),
            });
            const data = await res.json();
            if (!res.ok) {
              setMsg(data.error ?? "Could not confirm.");
              return;
            }
            setOk(true);
            setMsg("Accepted. Honor the deal on the POS.");
            setCode("");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          Member code
          <input
            required
            inputMode="numeric"
            maxLength={6}
            className="gp-input mt-1 font-mono tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
          />
        </label>
        <label className="block text-sm">
          Staff PIN
          <input
            required
            inputMode="numeric"
            maxLength={6}
            type="password"
            className="gp-input mt-1 font-mono tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="4–6 digits"
          />
        </label>
        <button type="submit" className="gp-btn gp-btn-primary w-full" disabled={busy}>
          {busy ? "Checking…" : "Confirm redeem"}
        </button>
        {msg && (
          <p className={`text-sm ${ok ? "text-success" : "text-red-300"}`}>{msg}</p>
        )}
      </form>
    </div>
  );
}
