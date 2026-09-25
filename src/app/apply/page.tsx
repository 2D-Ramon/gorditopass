"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { APPLY_CUISINE_OPTIONS, CITIES } from "@/lib/data";
import { BUSINESS_TYPES, OWNERSHIP_TYPES } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type {
  ApplicationConcept,
  BusinessTypeId,
  CityId,
  Cuisine,
  OwnershipTypeId,
} from "@/lib/types";

const DOC_ACCEPT = "image/*,.pdf,.doc,.docx";

const UPLOADS = [
  { label: "Logo", required: true, accept: "image/*" },
  { label: "Menu", required: true, accept: DOC_ACCEPT },
  {
    label: "Health department license (tied to the kitchen address)",
    required: true,
    accept: DOC_ACCEPT,
  },
  { label: "EIN", required: true, accept: DOC_ACCEPT },
  { label: "State sales tax permit", required: true, accept: DOC_ACCEPT },
  {
    label: "Owner/manager food handler certification",
    required: true,
    accept: DOC_ACCEPT,
  },
  {
    label: "Owner state issued ID/passport",
    required: true,
    accept: DOC_ACCEPT,
  },
  {
    label: "Legal business name documentation",
    required: true,
    accept: DOC_ACCEPT,
  },
] as const;

const POSITIONS = [
  { value: "manager", label: "Manager" },
  { value: "owner", label: "Owner" },
];

function emptyConcept(): ApplicationConcept {
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conceptName: "",
    businessType: "restaurant",
    cuisineOrTheme: "american",
    locationCount: 1,
    cities: "",
    notes: "",
  };
}

function MarketSelect({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (city: CityId) => void;
  required?: boolean;
}) {
  return (
    <select
      required={required}
      className="gp-input mt-1.5"
      value={value}
      onChange={(e) => onChange(e.target.value as CityId)}
    >
      <option value="" disabled>
        Select city / market
      </option>
      {CITIES.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {!c.live ? " (coming later)" : ""}
        </option>
      ))}
    </select>
  );
}

function minStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function ApplyPage() {
  const { submitRestaurantApplication } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [city, setCity] = useState<CityId | "">("");
  const [promo, setPromo] = useState("");
  const [contactName, setContactName] = useState("");
  const [position, setPosition] = useState("");
  const [hasAuthority, setHasAuthority] = useState(false);
  const [address, setAddress] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState(minStartDate());
  const [businessType, setBusinessType] = useState<BusinessTypeId | "">("");
  const [businessTypeOther, setBusinessTypeOther] = useState("");
  const [primaryCuisine, setPrimaryCuisine] = useState<Cuisine | "">("");
  const [ownershipType, setOwnershipType] = useState<OwnershipTypeId | "">("");
  const [ownershipTypeOther, setOwnershipTypeOther] = useState("");
  const [totalLocations, setTotalLocations] = useState(1);
  const [multiConcept, setMultiConcept] = useState(false);
  const [concepts, setConcepts] = useState<ApplicationConcept[]>([
    emptyConcept(),
  ]);
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

  function hasUpload(label: string) {
    return uploads.some(
      (u) => u.label === label && Boolean(u.fileName || u.dataUrl),
    );
  }

  const conceptLocationSum = useMemo(
    () => concepts.reduce((s, c) => s + (Number(c.locationCount) || 0), 0),
    [concepts],
  );

  function updateConcept(
    id: string,
    patch: Partial<ApplicationConcept>,
  ) {
    setConcepts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }

  async function addUpload(label: string, file: File | undefined) {
    if (!file) return;
    const isPhoto =
      file.type.startsWith("image/") && file.type !== "image/gif"
        ? "apply"
        : file.type === "image/gif"
          ? "gif"
          : "apply";
    try {
      const { uploadFiles } = await import("@/lib/upload-client");
      const [uploaded] = await uploadFiles([file], isPhoto);
      setUploads((prev) => {
        const without = prev.filter((u) => u.label !== label);
        return [
          ...without,
          {
            label,
            fileName: uploaded?.fileName || file.name,
            sizeBytes: uploaded?.bytes ?? file.size,
            mimeType: uploaded?.contentType || file.type,
            dataUrl: uploaded?.url,
          },
        ];
      });
    } catch {
      setUploads((prev) => {
        const without = prev.filter((u) => u.label !== label);
        return [
          ...without,
          {
            label,
            fileName: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
          },
        ];
      });
    }
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
            Application received
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We’ll review before you go live. After approval, open the partner
            dashboard and create a login with this same email.
          </p>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (!name.trim()) {
              setError("Business name is required.");
              return;
            }
            if (!ownershipType) {
              setError("Select an ownership structure.");
              return;
            }
            if (ownershipType === "other" && !ownershipTypeOther.trim()) {
              setError("Please describe ownership type (Other).");
              return;
            }
            if (totalLocations < 1) {
              setError("Enter at least 1 location.");
              return;
            }
            if (!multiConcept && !businessType) {
              setError("Select a business type.");
              return;
            }
            if (!multiConcept && !primaryCuisine) {
              setError("Select a cuisine.");
              return;
            }
            if (businessType === "other" && !businessTypeOther.trim()) {
              setError("Please describe your business type (Other).");
              return;
            }
            if (!email.trim()) {
              setError("Business email is required.");
              return;
            }
            if (!contactName.trim()) {
              setError("Contact name is required.");
              return;
            }
            if (!position) {
              setError("Select a position.");
              return;
            }
            if (!phone.trim()) {
              setError("Phone number is required.");
              return;
            }
            if (!agreedToTerms) {
              setError("Agree to the terms to submit your application.");
              return;
            }
            if (!address.trim()) {
              setError("Full address is required.");
              return;
            }
            if (!city) {
              setError(
                "Select the city or market you are in, or the closest one.",
              );
              return;
            }
            for (const item of UPLOADS) {
              if (!hasUpload(item.label)) {
                setError(`Please upload: ${item.label}.`);
                return;
              }
            }
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
            if (multiConcept) {
              if (concepts.length < 1) {
                setError("Add at least one concept.");
                return;
              }
              for (const c of concepts) {
                if (!c.conceptName.trim() || c.locationCount < 1) {
                  setError(
                    "Each concept needs a name and at least 1 location.",
                  );
                  return;
                }
                if (!c.cities) {
                  setError(
                    `Select a city / market for concept “${c.conceptName || "unnamed"}”.`,
                  );
                  return;
                }
                if (c.businessType === "other" && !c.businessTypeOther?.trim()) {
                  setError(
                    `Describe business type for concept “${c.conceptName || "unnamed"}”.`,
                  );
                  return;
                }
              }
              if (conceptLocationSum !== totalLocations) {
                setError(
                  `Concept locations (${conceptLocationSum}) must equal total locations (${totalLocations}).`,
                );
                return;
              }
            }
            submitRestaurantApplication({
              name,
              email,
              city,
              promo,
              contactName,
              phone: phone.trim() || undefined,
              emailOptIn,
              smsOptIn,
              position,
              hasAuthority,
              address,
              plannedStartDate,
              businessType: multiConcept
                ? undefined
                : (businessType as BusinessTypeId),
              businessTypeOther:
                !multiConcept && businessType === "other"
                  ? businessTypeOther.trim()
                  : undefined,
              ownershipType: ownershipType as OwnershipTypeId,
              ownershipTypeOther:
                ownershipType === "other"
                  ? ownershipTypeOther.trim()
                  : undefined,
              totalLocations,
              concepts: multiConcept
                ? concepts.map((c) => ({
                    ...c,
                    conceptName: c.conceptName.trim(),
                    cuisineOrTheme: c.cuisineOrTheme || "other",
                    cities: c.cities?.trim(),
                  }))
                : [
                    {
                      id: "primary",
                      conceptName: name.trim(),
                      businessType: businessType as BusinessTypeId,
                      businessTypeOther:
                        businessType === "other"
                          ? businessTypeOther.trim()
                          : undefined,
                      cuisineOrTheme: primaryCuisine || "other",
                      locationCount: totalLocations,
                      cities: city,
                    },
                  ],
              uploads,
            });
            const live = await fetch("/api/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                city,
                promo,
                contactName,
                phone: phone.trim(),
                email_opt_in: emailOptIn,
                sms_opt_in: smsOptIn,
                position,
                address,
                cuisine: primaryCuisine,
                primaryCuisine,
                concepts: multiConcept ? concepts : undefined,
                uploads,
              }),
            });
            if (!live.ok) {
              const data = await live.json().catch(() => ({}));
              if (data.error) setError(data.error);
            }
            setDone(true);
          }}
        >
          <label className="block text-sm font-medium">
            Business name *
            <input
              required
              className="gp-input mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Ownership structure *
            <select
              required
              className="gp-input mt-1.5"
              value={ownershipType}
              onChange={(e) =>
                setOwnershipType(e.target.value as OwnershipTypeId)
              }
            >
              <option value="" disabled>
                Select ownership
              </option>
              {OWNERSHIP_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {ownershipType === "other" && (
            <label className="block text-sm font-medium">
              Describe ownership *
              <input
                required
                className="gp-input mt-1.5"
                value={ownershipTypeOther}
                onChange={(e) => setOwnershipTypeOther(e.target.value)}
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Total number of locations *
            <input
              required
              type="number"
              min={1}
              max={500}
              className="gp-input mt-1.5 max-w-[8rem]"
              value={totalLocations}
              onChange={(e) =>
                setTotalLocations(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <span className="mt-1 block text-xs text-muted">
              All locations under your ownership / management group.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={multiConcept}
              onChange={(e) => {
                setMultiConcept(e.target.checked);
                if (e.target.checked && concepts.length === 0) {
                  setConcepts([emptyConcept()]);
                }
              }}
            />
            <span>
              We operate <strong className="text-stone-300">more than one concept</strong>{" "}
              (e.g. Mexican + Italian + BBQ under one group). Uncheck if every
              location is the same brand / type.
            </span>
          </label>

          {!multiConcept ? (
            <>
              <label className="block text-sm font-medium">
                Business type *
                <select
                  required
                  className="gp-input mt-1.5"
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessTypeId)
                  }
                >
                  <option value="" disabled>
                    Select business type
                  </option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {businessType === "other" && (
                <label className="block text-sm font-medium">
                  Describe business type *
                  <input
                    required
                    className="gp-input mt-1.5"
                    value={businessTypeOther}
                    onChange={(e) => setBusinessTypeOther(e.target.value)}
                    placeholder="e.g. ghost kitchen, food hall stall…"
                  />
                </label>
              )}
              <label className="block text-sm font-medium">
                Cuisine *
                <select
                  required
                  className="gp-input mt-1.5"
                  value={primaryCuisine}
                  onChange={(e) =>
                    setPrimaryCuisine(e.target.value as Cuisine)
                  }
                >
                  <option value="" disabled>
                    Select cuisine
                  </option>
                  {APPLY_CUISINE_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted">
                  Same list as explore / partner profiles so approval maps into
                  the system cleanly.
                </span>
              </label>
            </>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-elevated/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Concept breakdown</p>
                  <p className="text-xs text-muted">
                    One card per brand / concept. Locations must total{" "}
                    <strong className="text-stone-300">{totalLocations}</strong>
                    {conceptLocationSum !== totalLocations && (
                      <span className="text-amber-200">
                        {" "}
                        (currently {conceptLocationSum})
                      </span>
                    )}
                    .
                  </p>
                </div>
                <button
                  type="button"
                  className="gp-btn gp-btn-secondary text-xs !py-1.5"
                  onClick={() => setConcepts((prev) => [...prev, emptyConcept()])}
                >
                  + Add concept
                </button>
              </div>
              {concepts.map((c, idx) => (
                <div
                  key={c.id}
                  className="space-y-2 rounded-md border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Concept {idx + 1}
                    </p>
                    {concepts.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-red-300"
                        onClick={() =>
                          setConcepts((prev) =>
                            prev.filter((x) => x.id !== c.id),
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="block text-sm">
                    Concept / brand name *
                    <input
                      required
                      className="gp-input mt-1"
                      value={c.conceptName}
                      onChange={(e) =>
                        updateConcept(c.id, { conceptName: e.target.value })
                      }
                      placeholder="e.g. Casa Arepa"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-sm">
                      Business type *
                      <select
                        className="gp-input mt-1"
                        value={c.businessType}
                        onChange={(e) =>
                          updateConcept(c.id, {
                            businessType: e.target.value as BusinessTypeId,
                          })
                        }
                      >
                        {BUSINESS_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      # of locations *
                      <input
                        required
                        type="number"
                        min={1}
                        className="gp-input mt-1"
                        value={c.locationCount}
                        onChange={(e) =>
                          updateConcept(c.id, {
                            locationCount: Math.max(
                              1,
                              Number(e.target.value) || 1,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                  {c.businessType === "other" && (
                    <label className="block text-sm">
                      Describe type *
                      <input
                        required
                        className="gp-input mt-1"
                        value={c.businessTypeOther ?? ""}
                        onChange={(e) =>
                          updateConcept(c.id, {
                            businessTypeOther: e.target.value,
                          })
                        }
                      />
                    </label>
                  )}
                  <label className="block text-sm">
                    Cuisine *
                    <select
                      required
                      className="gp-input mt-1"
                      value={c.cuisineOrTheme || "american"}
                      onChange={(e) =>
                        updateConcept(c.id, {
                          cuisineOrTheme: e.target.value,
                        })
                      }
                    >
                      {APPLY_CUISINE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    City / market *
                    <MarketSelect
                      required
                      value={c.cities ?? ""}
                      onChange={(next) => updateConcept(c.id, { cities: next })}
                    />
                    <span className="mt-1 block text-xs text-muted">
                      The market this concept is in, or the closest one.
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          <label className="block text-sm font-medium">
            Business email *
            <input
              required
              type="email"
              className="gp-input mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Phone *
            <input
              required
              type="tel"
              className="gp-input mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(555) 555-5555"
            />
          </label>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
            />
            <span>Email me partner updates (unsubscribe anytime)</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
            />
            <span>
              Text me partner updates (US). Msg/data rates may apply. Opt out
              by replying STOP.
            </span>
          </label>
          <p className="text-xs leading-relaxed text-muted">
            We will never sell your information. It is only used for
            promotions, updated terms, and offers.
          </p>
          <div className="flex items-start gap-2.5 text-sm leading-relaxed">
            <input
              id="apply-terms"
              type="checkbox"
              className="mt-1"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
              <label htmlFor="apply-terms">I agree to the </label>
              <Link href="/legal/terms" className="text-brand underline">
                terms
              </Link>
            </span>
          </div>
          <label className="block text-sm font-medium">
            Contact name *
            <input
              required
              className="gp-input mt-1.5"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="block text-sm font-medium">
            Position *
            <select
              required
              className="gp-input mt-1.5"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="" disabled>
                Select position
              </option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
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
            Full Address *
            <input
              required
              className="gp-input mt-1.5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, ZIP"
            />
          </label>
          <label className="block text-sm font-medium">
            City / market *
            <MarketSelect
              required
              value={city}
              onChange={setCity}
            />
            <span className="mt-1 block text-xs font-normal text-muted">
              The city you are in, or the closest market.
            </span>
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
            <span className="mt-1 block text-xs font-normal text-muted">
              If not sure, we can discuss this to help with ideas. Suggestion:
              free item(s) or minimum 20% off. Keep an offer ~2 weeks to
              measure success.
            </span>
          </label>

          <div className="rounded-lg border border-border bg-elevated/50 p-4">
            <p className="text-sm font-semibold">Uploads</p>
            <p className="mt-1 text-xs text-muted">
              All items are required to submit application. Documents must be
              clear, complete, unexpired, and match the info you enter. Food
              photos can be added later from the partner dashboard. Documents
              (PDF) upload as-is, up to 8 MB.
            </p>
            <div className="mt-3 space-y-3">
              {UPLOADS.map((item) => (
                <label key={item.label} className="block text-sm">
                  <span className="text-muted">
                    {item.label}
                    {item.required ? " *" : ""}
                  </span>
                  <input
                    type="file"
                    required={item.required && !hasUpload(item.label)}
                    accept={item.accept}
                    className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-200"
                    onChange={(e) =>
                      void addUpload(item.label, e.target.files?.[0])
                    }
                  />
                  {uploads.find((u) => u.label === item.label) && (
                    <span className="mt-0.5 block text-xs text-success">
                      ✓ {uploads.find((u) => u.label === item.label)?.fileName}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

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


    </div>
  );
}
