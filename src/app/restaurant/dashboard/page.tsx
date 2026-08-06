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

  // Deal form
  const [dealTitle, setDealTitle] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [dealType, setDealType] = useState<DealType>("free_item");
  const [dealValue, setDealValue] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [dealImages, setDealImages] = useState<string[]>([]);

  // Menu form
  const [menuName, setMenuName] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCat, setMenuCat] = useState("Mains");
  const [menuImages, setMenuImages] = useState<string[]>([]);

  // Event form
  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evAddress, setEvAddress] = useState(restaurant.address);
  const [evTicketUrl, setEvTicketUrl] = useState("");
  const [evTicketPrice, setEvTicketPrice] = useState("0");
  const [evEmoji, setEvEmoji] = useState("🎉");

  // Job form
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobType, setJobType] = useState<
    "full-time" | "part-time" | "seasonal" | "gig"
  >("part-time");
  const [jobPay, setJobPay] = useState("");
  const [jobApplyUrl, setJobApplyUrl] = useState("");

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
    { id: "deal", label: "New deal", managersOnly: true },
    { id: "menu", label: "Menu item", managersOnly: true },
    { id: "event", label: "Event", managersOnly: true },
    { id: "job", label: "Job", managersOnly: true },
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
          <h2 className="font-semibold">Create a deal</h2>
          <p className="text-sm text-muted">
            Set regular price so member savings and partner revenue can be
            calculated. New deals go to the admin queue for approval before
            they go live.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dealTitle.trim() || !regularPrice) return;
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
              });
              setDealTitle("");
              setDealDesc("");
              setDealValue("");
              setRegularPrice("");
              setDealImages([]);
              toast(
                res.aiFlagged
                  ? "Deal flagged by AI for admin review (possible policy issue)."
                  : res.status === "approved"
                    ? "Deal auto-approved and live."
                    : "Deal submitted — pending admin approval.",
              );
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
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Publish deal
            </button>
          </form>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {restaurant.deals.map((d) => (
              <li key={d.id}>
                {d.title} <span className="text-xs">(seed)</span>
              </li>
            ))}
            {myDeals.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-orange-200/90">
                {d.imageDataUrls?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageDataUrls[0]}
                    alt=""
                    className="h-8 w-8 rounded object-cover ring-1 ring-border"
                  />
                )}
                <span>
                  {d.title}
                  {d.regularPriceUsd != null && (
                    <span className="text-xs text-muted">
                      {" "}
                      · reg ${d.regularPriceUsd}
                    </span>
                  )}{" "}
                  <span className="text-xs">
                    ({d.status ?? "pending"}
                    {d.aiFlagged ? " · AI flagged" : ""} · yours)
                  </span>
                </span>
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
              const res = addPartnerMenuItem({
                restaurantId: restaurant.id,
                name: menuName.trim(),
                description: menuDesc.trim(),
                priceUsd: Number(menuPrice) || 0,
                category: menuCat.trim() || "Mains",
                imageDataUrls: menuImages.length ? menuImages : undefined,
              });
              setMenuName("");
              setMenuDesc("");
              setMenuPrice("");
              setMenuImages([]);
              toast(
                res.aiFlagged
                  ? "Menu item flagged by AI for admin review."
                  : res.status === "approved"
                    ? "Menu item auto-approved and live."
                    : "Menu item submitted — pending admin approval.",
              );
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
              Add to menu
            </button>
          </form>
          {myMenu.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {myMenu.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2">
                  {m.imageDataUrls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageDataUrls[0]}
                      alt=""
                      className="h-8 w-8 rounded object-cover ring-1 ring-border"
                    />
                  )}
                  <span>
                    {m.name} · ${m.priceUsd.toFixed(2)} · {m.category}{" "}
                    <span className="text-xs">
                      ({m.status ?? "pending"}
                      {m.aiFlagged ? " · AI flagged" : ""})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
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
              });
              setEvTitle("");
              setEvDesc("");
              setEvDate("");
              setEvTime("");
              toast(
                res.aiFlagged
                  ? "Event flagged by AI for admin review."
                  : res.status === "approved"
                    ? "Event auto-approved and live."
                    : "Event submitted — pending admin approval.",
              );
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
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Publish event
            </button>
          </form>
          {myEvents.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {myEvents.map((ev) => (
                <li key={ev.id}>
                  {ev.emoji} {ev.title} · {ev.date}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === "job" && canManage && (
        <section className="mt-6 gp-card gp-card-static p-5">
          <h2 className="font-semibold">Post a job</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!jobTitle.trim() || !jobApplyUrl.trim()) return;
              const res = addPartnerJob({
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                title: jobTitle.trim(),
                description: jobDesc.trim(),
                type: jobType,
                city: restaurant.city as CityId,
                payRange: jobPay.trim() || undefined,
                applyUrl: jobApplyUrl.trim(),
              });
              setJobTitle("");
              setJobDesc("");
              setJobPay("");
              setJobApplyUrl("");
              toast(
                res.aiFlagged
                  ? "Job flagged by AI for admin review."
                  : res.status === "approved"
                    ? "Job auto-approved and live."
                    : "Job submitted — pending admin approval.",
              );
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
            <button type="submit" className="gp-btn gp-btn-primary text-sm">
              Post job
            </button>
          </form>
          {myJobs.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {myJobs.map((j) => (
                <li key={j.id}>
                  {j.title} · {j.type}
                </li>
              ))}
            </ul>
          )}
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
