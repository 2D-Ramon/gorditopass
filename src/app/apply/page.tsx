"use client";

import { useMemo, useState } from "react";
import { APPLY_CUISINE_OPTIONS } from "@/lib/data";
import { BUSINESS_TYPES, OWNERSHIP_TYPES } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type {
  ApplicationConcept,
  BusinessTypeId,
  Cuisine,
  OwnershipTypeId,
} from "@/lib/types";

const UPLOAD_LABELS = [
  "Food photos",
  "Logo",
  "Menu",
  "Other",
  "State licensed paperwork",
  "Tax ID",
] as const;

const POSITIONS = [
  { value: "manager", label: "Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "owner", label: "Owner" },
  { value: "other", label: "Other" },
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
  const [businessType, setBusinessType] = useState<BusinessTypeId>("restaurant");
  const [businessTypeOther, setBusinessTypeOther] = useState("");
  const [primaryCuisine, setPrimaryCuisine] = useState<Cuisine>("american");
  const [ownershipType, setOwnershipType] =
    useState<OwnershipTypeId>("independently_owned");
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
            if (businessType === "other" && !businessTypeOther.trim()) {
              setError("Please describe your business type (Other).");
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
              position,
              hasAuthority,
              address,
              plannedStartDate,
              businessType: multiConcept ? undefined : businessType,
              businessTypeOther:
                !multiConcept && businessType === "other"
                  ? businessTypeOther.trim()
                  : undefined,
              ownershipType,
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
                      businessType,
                      businessTypeOther:
                        businessType === "other"
                          ? businessTypeOther.trim()
                          : undefined,
                      cuisineOrTheme: primaryCuisine,
                      locationCount: totalLocations,
                      cities: city,
                    },
                  ],
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
            Ownership structure
            <select
              className="gp-input mt-1.5"
              value={ownershipType}
              onChange={(e) =>
                setOwnershipType(e.target.value as OwnershipTypeId)
              }
            >
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
                Business type
                <select
                  className="gp-input mt-1.5"
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessTypeId)
                  }
                >
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
                    Cities / markets (optional)
                    <input
                      className="gp-input mt-1"
                      value={c.cities ?? ""}
                      onChange={(e) =>
                        updateConcept(c.id, { cities: e.target.value })
                      }
                      placeholder="Dallas, Fort Worth"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

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
            Full Address
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
