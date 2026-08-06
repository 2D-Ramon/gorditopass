"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";

const UPLOAD_LABELS = [
  "Logo",
  "Food photos",
  "Menu",
  "Tax ID",
  "State licensed paperwork",
  "Other",
] as const;

function minStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function ApplyPage() {
  const { submitRestaurantApplication, restaurantApplications } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Dallas");
  const [promo, setPromo] = useState("");
  const [contactName, setContactName] = useState("");
  const [position, setPosition] = useState("owner");
  const [hasAuthority, setHasAuthority] = useState(false);
  const [address, setAddress] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState(minStartDate());
  const [uploads, setUploads] = useState<
    {
      label: string;
      fileName: string;
      sizeBytes?: number;
      mimeType?: string;
      dataUrl?: string;
    }[]
  >([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const minDate = useMemo(() => minStartDate(), []);

  function addUpload(label: string, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploads((prev) => {
        const without = prev.filter((u) => u.label !== label);
        return [
          ...without,
          {
            label,
            fileName: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
            dataUrl: String(reader.result),
          },
        ];
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="gp-page-title">Restaurant apply</h1>
      <p className="gp-page-sub">
        Free to join after approval. Self-serve intake. Planned start must be at
        least 2 weeks out.
      </p>

      {done ? (
        <div className="mt-8 gp-card gp-card-static border-success/30 p-6">
          <p className="font-semibold text-success">
            Application received (demo)
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Admin will approve listings before they go live. You can also open
            the partner dashboard with demo restaurant sign-in.
          </p>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!hasAuthority) {
              setError(
                "Contact must have authority to make these decisions (or provide owner permission later).",
              );
              return;
            }
            if (plannedStartDate < minDate) {
              setError("Planned start date must be at least 2 weeks from today.");
              return;
            }
            submitRestaurantApplication({
              name,
              email,
              city,
              promo,
              contactName,
              position,
              hasAuthority,
              address,
              plannedStartDate,
              uploads,
            });
            setDone(true);
          }}
        >
          <label className="block text-sm font-medium">
            Business name
            <input
              required
              className="gp-input mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Business email
            <input
              required
              type="email"
              className="gp-input mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Contact name
            <input
              required
              className="gp-input mt-1.5"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="block text-sm font-medium">
            Position
            <select
              className="gp-input mt-1.5"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={hasAuthority}
              onChange={(e) => setHasAuthority(e.target.checked)}
            />
            <span>
              I have authority to make these decisions for this business (owners
              and authorized managers only). Managers must be able to provide
              owner permission if requested.
            </span>
          </label>
          <label className="block text-sm font-medium">
            Address
            <input
              required
              className="gp-input mt-1.5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, ZIP"
            />
          </label>
          <label className="block text-sm font-medium">
            City
            <input
              className="gp-input mt-1.5"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Planned start date
            <input
              required
              type="date"
              min={minDate}
              className="gp-input mt-1.5"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
            />
            <span className="mt-1 block text-xs font-normal text-muted">
              Must be at least 2 weeks from today (earliest: {minDate}).
            </span>
          </label>
          <label className="block text-sm font-medium">
            First promotion idea
            <textarea
              className="gp-input mt-1.5 min-h-[80px]"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="e.g. Free fries with entrée, or 20% off member plates"
            />
          </label>

          <div className="rounded-lg border border-border bg-elevated/50 p-4">
            <p className="text-sm font-semibold">Uploads</p>
            <p className="mt-1 text-xs text-muted">
              Demo stores file names only (not uploaded to a server).
            </p>
            <div className="mt-3 space-y-3">
              {UPLOAD_LABELS.map((label) => (
                <label key={label} className="block text-sm">
                  <span className="text-muted">{label}</span>
                  <input
                    type="file"
                    accept={
                      label.includes("photo") || label === "Logo"
                        ? "image/*"
                        : "image/*,.pdf,.doc,.docx"
                    }
                    className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-200"
                    onChange={(e) => addUpload(label, e.target.files?.[0])}
                  />
                  {uploads.find((u) => u.label === label) && (
                    <span className="mt-0.5 block text-xs text-success">
                      ✓ {uploads.find((u) => u.label === label)?.fileName}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Suggestion: free item(s) or minimum 20% off. Keep an offer ~2 weeks
            to measure success.
          </p>
          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button type="submit" className="gp-btn gp-btn-primary w-full sm:w-auto">
            Submit application
          </button>
        </form>
      )}

      {restaurantApplications.length > 0 && (
        <p className="mt-6 text-xs text-muted">
          Local demo queue: {restaurantApplications.length} application(s)
          stored in this browser.
        </p>
      )}
    </div>
  );
}
