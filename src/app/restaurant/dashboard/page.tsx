"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RESTAURANTS } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import {
  canManagePartnerContent,
  type CityId,
  type DealType,
  type StaffRole,
} from "@/lib/types";

type Tab = "scan" | "deal" | "menu" | "event" | "job";

function ExpireFields({
  enabled,
  date,
  onEnabled,
  onDate,
}: {
  enabled: boolean;
  date: string;
  onEnabled: (v: boolean) => void;
  onDate: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated/40 p-3">
      <label className="flex items-center justify-between gap-2 text-sm">
        <span>Auto-expire on a date</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabled(e.target.checked)}
        />
      </label>
      {enabled && (
        <label className="mt-2 block text-sm">
          Expiration date
          <input
            type="date"
            required={enabled}
            className="gp-input mt-1 max-w-[12rem]"
            value={date}
            onChange={(e) => onDate(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}

function readImages(files: FileList | null): Promise<string[]> {
  if (!files?.length) return Promise.resolve([]);
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export default function RestaurantDashboardPage() {
  const {
    user,
    signInDemo,
    redemptions,
    partnerDeals,
    partnerMenuItems,
    partnerEvents,
    partnerJobs,
    addPartnerDeal,
    addPartnerMenuItem,
    addPartnerEvent,
    addPartnerJob,
    updatePartnerDeal,
    updatePartnerMenuItem,
    updatePartnerEvent,
    updatePartnerJob,
    deletePartnerDeal,
    deletePartnerMenuItem,
    deletePartnerEvent,
    deletePartnerJob,
    partnerRevenueWeek,
    partnerRevenueMonth,
    partnerRevenueYtd,
    partnerRedemptionCount,
  } = useStore();
  const restaurant = RESTAURANTS[0];
  const [tab, setTab] = useState<Tab>("scan");
  const [scanCode, setScanCode] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [flash, setFlash] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Deal form
  const [dealTitle, setDealTitle] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [dealType, setDealType] = useState<DealType>("free_item");
  const [dealValue, setDealValue] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [dealImages, setDealImages] = useState<string[]>([]);
  const [dealExpireOn, setDealExpireOn] = useState(false);
  const [dealExpiresAt, setDealExpiresAt] = useState("");

  // Menu form
  const [menuName, setMenuName] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCat, setMenuCat] = useState("Mains");
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [menuExpireOn, setMenuExpireOn] = useState(false);
  const [menuExpiresAt, setMenuExpiresAt] = useState("");

  // Event form
  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evAddress, setEvAddress] = useState(restaurant.address);
  const [evTicketUrl, setEvTicketUrl] = useState("");
  const [evTicketPrice, setEvTicketPrice] = useState("0");
  const [evEmoji, setEvEmoji] = useState("🎉");
  const [evExpireOn, setEvExpireOn] = useState(false);
  const [evExpiresAt, setEvExpiresAt] = useState("");

  // Job form
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobType, setJobType] = useState<
    "full-time" | "part-time" | "seasonal" | "gig"
  >("part-time");
  const [jobPay, setJobPay] = useState("");
  const [jobApplyUrl, setJobApplyUrl] = useState("");
  const [jobExpireOn, setJobExpireOn] = useState(false);
  const [jobExpiresAt, setJobExpiresAt] = useState("");

  const canManage = canManagePartnerContent(user?.staffRole);

  const myRedeems = useMemo(
    () =>
      redemptions.filter(
        (r) =>
          r.restaurantId === restaurant.id ||
          partnerDeals.some((d) => d.id === r.dealId) ||
          restaurant.deals.some((d) => d.id === r.dealId),
      ),
    [redemptions, partnerDeals, restaurant],
  );

  const myDeals = partnerDeals.filter((d) => d.restaurantId === restaurant.id);
  const myMenu = partnerMenuItems.filter(
    (m) => m.restaurantId === restaurant.id,
  );
  const myEvents = partnerEvents.filter(
    (e) => e.restaurantId === restaurant.id,
  );
  const myJobs = partnerJobs.filter((j) => j.restaurantId === restaurant.id);

  function toast(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  }

  function estimatedSavingsPreview(): string | null {
    const reg = Number(regularPrice);
    if (!reg || reg <= 0) return null;
    // Free item & BOGO: member saves the full regularly priced item
    if (dealType === "free_item" || dealType === "bogo") {
      return `~$${reg.toFixed(2)} saved`;
    }
    if (dealType === "percent_off" && dealValue) {
      return `~$${((reg * Number(dealValue)) / 100).toFixed(2)} saved`;
    }
    if (dealType === "fixed_price" && dealValue) {
      return `~$${Math.max(0, reg - Number(dealValue)).toFixed(2)} saved`;
    }
    return null;
  }

  if (!user || user.role !== "restaurant") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Partner dashboard</h1>
        <p className="mt-2 text-muted">
          Sign in as a restaurant partner to continue. Demo roles control which
          tabs you can use.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {(
            [
              ["owner", "Owner (full access)"],
              ["manager", "Manager (full access)"],
              ["marketing", "Marketing (full access)"],
              ["employee", "Employee (redeem scan only)"],
            ] as [StaffRole, string][]
          ).map(([role, label]) => (
            <button
              key={role}
              type="button"
              className="gp-btn gp-btn-secondary"
              onClick={() => signInDemo("restaurant", role)}
            >
              Demo · {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const allTabs: { id: Tab; label: string; managersOnly: boolean }[] = [
    { id: "scan", label: "Redeem scan", managersOnly: false },
    { id: "deal", label: "Promotions", managersOnly: true },
    { id: "menu", label: "Menu items", managersOnly: true },
    { id: "event", label: "Events", managersOnly: true },
    { id: "job", label: "Jobs", managersOnly: true },
  ];
  const tabs = allTabs.filter((t) => !t.managersOnly || canManage);

  // If employee somehow on a locked tab, force scan
  const activeTab =
    !canManage && tab !== "scan" ? "scan" : tabs.some((t) => t.id === tab) ? tab : "scan";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">Partner dashboard</h1>
      <p className="gp-page-sub">
        Demo bound to <strong className="text-stone-300">{restaurant.name}</strong>
        . Signed in as{" "}
        <strong className="text-stone-300">{user.staffRole ?? "owner"}</strong>
        {!canManage && " — redeem scan only"}.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="gp-card gp-card-static p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Rev · week
          </p>
          <p className="mt-1 text-lg font-bold text-success">
            ${partnerRevenueWeek.toFixed(0)}
          </p>
        </div>
        <div className="gp-card gp-card-static p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Rev · month
          </p>
          <p className="mt-1 text-lg font-bold text-success">
            ${partnerRevenueMonth.toFixed(0)}
          </p>
        </div>
        <div className="gp-card gp-card-static p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Rev · YTD
          </p>
          <p className="mt-1 text-lg font-bold text-success">
            ${partnerRevenueYtd.toFixed(0)}
          </p>
        </div>
        <div className="gp-card gp-card-static p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Redemptions
          </p>
          <p className="mt-1 text-lg font-bold text-brand-gold">
            {partnerRedemptionCount}
          </p>
        </div>
      </div>

      {flash && (
        <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {flash}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === t.id
                ? "bg-brand/15 text-orange-200 ring-1 ring-brand/30"
                : "text-muted hover:bg-card hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!canManage && (
        <p className="mt-3 text-xs text-muted">
          Content tabs (deals, menu, events, jobs) are limited to owner, manager,
          and marketing. Employees can redeem only.
        </p>
      )}

      {activeTab === "scan" && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Staff redeem scan</h2>
          <p className="text-sm text-muted">
            Enter the 6-digit code from the member’s phone. Available to all
            employees.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="gp-input max-w-[10rem] font-mono tracking-widest"
              maxLength={6}
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
            <button
              type="button"
              className="gp-btn gp-btn-primary text-sm"
              onClick={() => {
                if (scanCode.length === 6) {
                  setScanMsg(
                    `Code ${scanCode} accepted (demo). Honor deal on POS.`,
                  );
                  setScanCode("");
                } else {
                  setScanMsg("Enter a 6-digit code.");
                }
              }}
            >
              Confirm
            </button>
          </div>
          {scanMsg && <p className="mt-2 text-sm text-brand-mint">{scanMsg}</p>}
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Redemption report</h3>
            <p className="text-2xl font-bold text-brand-gold">
              {myRedeems.length}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {myRedeems.slice(0, 10).map((r) => (
                <li key={r.at + r.code}>
                  {r.dealId} · saved ${r.savingsUsd.toFixed(2)} · rev $
                  {(r.revenueUsd ?? 0).toFixed(2)} · {r.code}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {activeTab === "deal" && canManage && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">
            {editId && tab === "deal" ? "Edit promotion" : "Promotions"}
          </h2>
          <p className="text-sm text-muted">
            Create and manage member promotions. Submissions go to admin unless
            auto-approved. Optional auto-expire date.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dealTitle.trim() || !regularPrice) return;
              const expire = {
                expireEnabled: dealExpireOn,
                expiresAt: dealExpireOn ? dealExpiresAt || null : null,
              };
              if (editId && tab === "deal") {
                updatePartnerDeal(editId, {
                  title: dealTitle.trim(),
                  description: dealDesc.trim() || "Member deal",
                  type: dealType,
                  value:
                    dealType === "percent_off" || dealType === "fixed_price"
                      ? Number(dealValue) || null
                      : null,
                  regularPriceUsd: Number(regularPrice) || 0,
                  imageDataUrls: dealImages.length ? dealImages : undefined,
                  ...expire,
                });
                setEditId(null);
                toast("Promotion updated.");
              } else {
                const res = addPartnerDeal({
                  restaurantId: restaurant.id,
                  title: dealTitle.trim(),
                  description: dealDesc.trim() || "Member deal",
                  type: dealType,
                  value:
                    dealType === "percent_off" || dealType === "fixed_price"
                      ? Number(dealValue) || null
                      : null,
                  regularPriceUsd: Number(regularPrice) || 0,
                  imageDataUrls: dealImages.length ? dealImages : undefined,
                  ...expire,
                });
                toast(
                  res.aiFlagged
                    ? "Promotion flagged by AI for admin review."
                    : res.status === "approved"
                      ? "Promotion auto-approved and live."
                      : "Promotion submitted — pending admin approval.",
                );
              }
              setDealTitle("");
              setDealDesc("");
              setDealValue("");
              setRegularPrice("");
              setDealImages([]);
              setDealExpireOn(false);
              setDealExpiresAt("");
            }}
          >
            <label className="block text-sm">
              Title *
              <input
                required
                className="gp-input mt-1"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="e.g. Free fries with entrée"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                className="gp-input mt-1 min-h-[70px]"
                value={dealDesc}
                onChange={(e) => setDealDesc(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Deal type
              <select
                className="gp-input mt-1"
                value={dealType}
                onChange={(e) => setDealType(e.target.value as DealType)}
              >
                <option value="free_item">Free item</option>
                <option value="percent_off">Percent off</option>
                <option value="bogo">BOGO</option>
                <option value="fixed_price">Fixed price</option>
              </select>
            </label>
            <label className="block text-sm">
              Regularly priced ($) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="gp-input mt-1 max-w-[10rem]"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="e.g. 12.00"
              />
              <span className="mt-1 block text-xs text-muted">
                Full price of one item before the deal. Free item & BOGO save
                this full amount; percent/fixed use it for est. savings.
              </span>
            </label>
            {(dealType === "percent_off" || dealType === "fixed_price") && (
              <label className="block text-sm">
                Deal value ({dealType === "percent_off" ? "%" : "$ member price"})
                <input
                  className="gp-input mt-1 max-w-[8rem]"
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                />
              </label>
            )}
            {estimatedSavingsPreview() && (
              <p className="text-sm font-medium text-success">
                Est. member savings: {estimatedSavingsPreview()}
              </p>
            )}
            <ExpireFields
              enabled={dealExpireOn}
              date={dealExpiresAt}
              onEnabled={setDealExpireOn}
              onDate={setDealExpiresAt}
            />
            <label className="block text-sm">
              Photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-200"
                onChange={async (e) => {
                  const imgs = await readImages(e.target.files);
                  setDealImages((prev) => [...prev, ...imgs]);
                  e.target.value = "";
                }}
              />
            </label>
            {dealImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dealImages.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-14 w-14 rounded-md object-cover ring-1 ring-border"
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="gp-btn gp-btn-primary text-sm">
                {editId && tab === "deal" ? "Save changes" : "Submit promotion"}
              </button>
              {editId && tab === "deal" && (
                <button
                  type="button"
                  className="gp-btn gp-btn-ghost text-sm"
                  onClick={() => {
                    setEditId(null);
                    setDealTitle("");
                    setDealDesc("");
                    setDealImages([]);
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
          <h3 className="mt-6 text-sm font-semibold">Your promotions</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {myDeals.length === 0 && (
              <li className="text-muted">No promotions yet.</li>
            )}
            {myDeals.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-elevated/40 px-3 py-2"
              >
                {d.imageDataUrls?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageDataUrls[0]}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-orange-100">{d.title}</p>
                  <p className="text-xs text-muted">
                    {d.status ?? "pending"}
                    {d.aiFlagged ? " · AI flagged" : ""}
                    {d.expireEnabled && d.expiresAt
                      ? ` · expires ${d.expiresAt}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-brand"
                  onClick={() => {
                    setEditId(d.id);
                    setDealTitle(d.title);
                    setDealDesc(d.description);
                    setDealType(d.type);
                    setDealValue(d.value != null ? String(d.value) : "");
                    setRegularPrice(
                      d.regularPriceUsd != null ? String(d.regularPriceUsd) : "",
                    );
                    setDealImages(d.imageDataUrls ?? []);
                    setDealExpireOn(Boolean(d.expireEnabled));
                    setDealExpiresAt(d.expiresAt ?? "");
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => {
                    if (confirm("Remove this promotion?")) {
                      deletePartnerDeal(d.id);
                      toast("Promotion removed.");
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "menu" && canManage && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Add menu item</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!menuName.trim()) return;
              const expire = {
                expireEnabled: menuExpireOn,
                expiresAt: menuExpireOn ? menuExpiresAt || null : null,
              };
              if (editId && tab === "menu") {
                updatePartnerMenuItem(editId, {
                  name: menuName.trim(),
                  description: menuDesc.trim(),
                  priceUsd: Number(menuPrice) || 0,
                  category: menuCat.trim() || "Mains",
                  imageDataUrls: menuImages.length ? menuImages : undefined,
                  ...expire,
                });
                setEditId(null);
                toast("Menu item updated.");
              } else {
                const res = addPartnerMenuItem({
                  restaurantId: restaurant.id,
                  name: menuName.trim(),
                  description: menuDesc.trim(),
                  priceUsd: Number(menuPrice) || 0,
                  category: menuCat.trim() || "Mains",
                  imageDataUrls: menuImages.length ? menuImages : undefined,
                  ...expire,
                });
                toast(
                  res.aiFlagged
                    ? "Menu item flagged by AI for admin review."
                    : res.status === "approved"
                      ? "Menu item auto-approved and live."
                      : "Menu item submitted — pending admin approval.",
                );
              }
              setMenuName("");
              setMenuDesc("");
              setMenuPrice("");
              setMenuImages([]);
              setMenuExpireOn(false);
              setMenuExpiresAt("");
            }}
          >
            <label className="block text-sm">
              Item name *
              <input
                required
                className="gp-input mt-1"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Description
              <input
                className="gp-input mt-1"
                value={menuDesc}
                onChange={(e) => setMenuDesc(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Price (USD) *
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="gp-input mt-1"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Category
                <select
                  className="gp-input mt-1"
                  value={menuCat}
                  onChange={(e) => setMenuCat(e.target.value)}
                >
                  {MENU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-200"
                onChange={async (e) => {
                  const imgs = await readImages(e.target.files);
                  setMenuImages((prev) => [...prev, ...imgs]);
                  e.target.value = "";
                }}
              />
            </label>
            <ExpireFields
              enabled={menuExpireOn}
              date={menuExpiresAt}
              onEnabled={setMenuExpireOn}
              onDate={setMenuExpiresAt}
            />
            {menuImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {menuImages.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-14 w-14 rounded-md object-cover ring-1 ring-border"
                  />
                ))}
              </div>
            )}
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              {editId && tab === "menu" ? "Save menu item" : "Add to menu"}
            </button>
          </form>
          <h3 className="mt-6 text-sm font-semibold">Your menu items</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {myMenu.length === 0 && (
              <li className="text-muted">No menu items yet.</li>
            )}
            {myMenu.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                {m.imageDataUrls?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageDataUrls[0]}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.name} · ${m.priceUsd.toFixed(2)} · {m.category}
                  </p>
                  <p className="text-xs text-muted">
                    {m.status ?? "pending"}
                    {m.expireEnabled && m.expiresAt
                      ? ` · expires ${m.expiresAt}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-brand"
                  onClick={() => {
                    setEditId(m.id);
                    setMenuName(m.name);
                    setMenuDesc(m.description);
                    setMenuPrice(String(m.priceUsd));
                    setMenuCat(m.category);
                    setMenuImages(m.imageDataUrls ?? []);
                    setMenuExpireOn(Boolean(m.expireEnabled));
                    setMenuExpiresAt(m.expiresAt ?? "");
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => {
                    if (confirm("Remove menu item?")) {
                      deletePartnerMenuItem(m.id);
                      toast("Menu item removed.");
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "event" && canManage && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Create an event</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!evTitle.trim() || !evDate.trim()) return;
              const expire = {
                expireEnabled: evExpireOn,
                expiresAt: evExpireOn ? evExpiresAt || null : null,
              };
              if (editId && tab === "event") {
                updatePartnerEvent(editId, {
                  title: evTitle.trim(),
                  description: evDesc.trim(),
                  date: evDate,
                  time: evTime || "TBA",
                  address: evAddress,
                  ticketUrl: evTicketUrl.trim() || undefined,
                  ticketPriceUsd: Number(evTicketPrice) || 0,
                  emoji: evEmoji || "🎉",
                  ...expire,
                });
                setEditId(null);
                toast("Event updated.");
              } else {
                const res = addPartnerEvent({
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                  title: evTitle.trim(),
                  description: evDesc.trim(),
                  date: evDate,
                  time: evTime || "TBA",
                  city: restaurant.city as CityId,
                  emoji: evEmoji || "🎉",
                  address: evAddress,
                  ticketUrl:
                    evTicketUrl.trim() ||
                    `https://example.com/tickets/${restaurant.id}`,
                  ticketPriceUsd: Number(evTicketPrice) || 0,
                  ...expire,
                });
                toast(
                  res.aiFlagged
                    ? "Event flagged by AI for admin review."
                    : res.status === "approved"
                      ? "Event auto-approved and live."
                      : "Event submitted — pending admin approval.",
                );
              }
              setEvTitle("");
              setEvDesc("");
              setEvDate("");
              setEvTime("");
              setEvExpireOn(false);
              setEvExpiresAt("");
            }}
          >
            <label className="block text-sm">
              Event title *
              <input
                required
                className="gp-input mt-1"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                className="gp-input mt-1 min-h-[70px]"
                value={evDesc}
                onChange={(e) => setEvDesc(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Date *
                <input
                  required
                  type="date"
                  className="gp-input mt-1"
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Time
                <input
                  className="gp-input mt-1"
                  value={evTime}
                  onChange={(e) => setEvTime(e.target.value)}
                  placeholder="6:00 PM - 9:00 PM"
                />
              </label>
            </div>
            <label className="block text-sm">
              Venue address
              <input
                className="gp-input mt-1"
                value={evAddress}
                onChange={(e) => setEvAddress(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Ticket / reserve URL
              <input
                type="url"
                className="gp-input mt-1"
                value={evTicketUrl}
                onChange={(e) => setEvTicketUrl(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Ticket price (0 = free)
                <input
                  type="number"
                  min="0"
                  className="gp-input mt-1"
                  value={evTicketPrice}
                  onChange={(e) => setEvTicketPrice(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Emoji
                <input
                  className="gp-input mt-1 max-w-[5rem]"
                  value={evEmoji}
                  onChange={(e) => setEvEmoji(e.target.value)}
                />
              </label>
            </div>
            <ExpireFields
              enabled={evExpireOn}
              date={evExpiresAt}
              onEnabled={setEvExpireOn}
              onDate={setEvExpiresAt}
            />
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              {editId && tab === "event" ? "Save event" : "Submit event"}
            </button>
          </form>
          <h3 className="mt-6 text-sm font-semibold">Your events</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {myEvents.length === 0 && (
              <li className="text-muted">No events yet.</li>
            )}
            {myEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {ev.emoji} {ev.title} · {ev.date}
                  </p>
                  <p className="text-xs text-muted">
                    {ev.status ?? "pending"}
                    {ev.expireEnabled && ev.expiresAt
                      ? ` · expires ${ev.expiresAt}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-brand"
                  onClick={() => {
                    setEditId(ev.id);
                    setEvTitle(ev.title);
                    setEvDesc(ev.description);
                    setEvDate(ev.date);
                    setEvTime(ev.time);
                    setEvAddress(ev.address ?? "");
                    setEvTicketUrl(ev.ticketUrl ?? "");
                    setEvTicketPrice(String(ev.ticketPriceUsd ?? 0));
                    setEvEmoji(ev.emoji);
                    setEvExpireOn(Boolean(ev.expireEnabled));
                    setEvExpiresAt(ev.expiresAt ?? "");
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => {
                    if (confirm("Remove event?")) {
                      deletePartnerEvent(ev.id);
                      toast("Event removed.");
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "job" && canManage && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Jobs</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!jobTitle.trim() || !jobApplyUrl.trim()) return;
              const expire = {
                expireEnabled: jobExpireOn,
                expiresAt: jobExpireOn ? jobExpiresAt || null : null,
              };
              if (editId && tab === "job") {
                updatePartnerJob(editId, {
                  title: jobTitle.trim(),
                  description: jobDesc.trim(),
                  type: jobType,
                  payRange: jobPay.trim() || undefined,
                  applyUrl: jobApplyUrl.trim(),
                  ...expire,
                });
                setEditId(null);
                toast("Job updated.");
              } else {
                const res = addPartnerJob({
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                  title: jobTitle.trim(),
                  description: jobDesc.trim(),
                  type: jobType,
                  city: restaurant.city as CityId,
                  payRange: jobPay.trim() || undefined,
                  applyUrl: jobApplyUrl.trim(),
                  ...expire,
                });
                toast(
                  res.aiFlagged
                    ? "Job flagged by AI for admin review."
                    : res.status === "approved"
                      ? "Job auto-approved and live."
                      : "Job submitted — pending admin approval.",
                );
              }
              setJobTitle("");
              setJobDesc("");
              setJobPay("");
              setJobApplyUrl("");
              setJobExpireOn(false);
              setJobExpiresAt("");
            }}
          >
            <label className="block text-sm">
              Job title *
              <input
                required
                className="gp-input mt-1"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                className="gp-input mt-1 min-h-[70px]"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Type
                <select
                  className="gp-input mt-1"
                  value={jobType}
                  onChange={(e) =>
                    setJobType(
                      e.target.value as
                        | "full-time"
                        | "part-time"
                        | "seasonal"
                        | "gig",
                    )
                  }
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="gig">Gig</option>
                </select>
              </label>
              <label className="block text-sm">
                Pay range
                <input
                  className="gp-input mt-1"
                  value={jobPay}
                  onChange={(e) => setJobPay(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              Application website URL *
              <input
                required
                type="url"
                className="gp-input mt-1"
                value={jobApplyUrl}
                onChange={(e) => setJobApplyUrl(e.target.value)}
              />
            </label>
            <ExpireFields
              enabled={jobExpireOn}
              date={jobExpiresAt}
              onEnabled={setJobExpireOn}
              onDate={setJobExpiresAt}
            />
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              {editId && tab === "job" ? "Save job" : "Submit job"}
            </button>
          </form>
          <h3 className="mt-6 text-sm font-semibold">Your jobs</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {myJobs.length === 0 && (
              <li className="text-muted">No jobs yet.</li>
            )}
            {myJobs.map((j) => (
              <li
                key={j.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {j.title} · {j.type}
                  </p>
                  <p className="text-xs text-muted">
                    {j.status ?? "pending"}
                    {j.expireEnabled && j.expiresAt
                      ? ` · expires ${j.expiresAt}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-brand"
                  onClick={() => {
                    setEditId(j.id);
                    setJobTitle(j.title);
                    setJobDesc(j.description);
                    setJobType(j.type);
                    setJobPay(j.payRange ?? "");
                    setJobApplyUrl(j.applyUrl ?? "");
                    setJobExpireOn(Boolean(j.expireEnabled));
                    setJobExpiresAt(j.expiresAt ?? "");
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => {
                    if (confirm("Remove job?")) {
                      deletePartnerJob(j.id);
                      toast("Job removed.");
                    }
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={`/restaurants/${restaurant.id}`}
        className="mt-6 inline-block text-sm text-brand hover:underline"
      >
        View public profile →
      </Link>
      <Link
        href="/account"
        className="mt-2 ml-4 inline-block text-sm text-muted hover:text-white"
      >
        Business account →
      </Link>
    </div>
  );
}
