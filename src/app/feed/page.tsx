"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FEED_POSTS,
  RESTAURANTS,
  cuisineLabel,
} from "@/lib/data";
import { PRESET_GIFS } from "@/lib/presetGifs";
import { canPostInFeed, useStore } from "@/lib/store";
import type { FeedMedia, FeedPost } from "@/lib/types";
import { PlateRating } from "@/components/PlateRating";

const EMOJI_PICKS = ["🔥", "😍", "🌮", "🍕", "👏", "🙌", "😋", "💯", "❤️", "🎉"];

const POST_TEMPLATES: {
  id: string;
  label: string;
  title: string;
  body: string;
}[] = [
  {
    id: "rec",
    label: "Recommendation",
    title: "Must-try spot this week",
    body: "Would go again — food, service, and member value all hit.",
  },
  {
    id: "deal",
    label: "Deal find",
    title: "Hot member deal",
    body: "Redeemed in under a minute. Worth the membership for this alone.",
  },
  {
    id: "review",
    label: "Quick review",
    title: "Plate rate drop",
    body: "Service, food, and member value — solid plates from me.",
  },
  {
    id: "blank",
    label: "Blank (custom)",
    title: "",
    body: "",
  },
];

function sharePost(post: FeedPost) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/feed#${post.id}`
      : "";
  const text = `${post.title}${post.restaurantName ? ` · ${post.restaurantName}` : ""}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    void navigator.share({ title: post.title, text, url }).catch(() => {});
    return;
  }
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(x, "_blank", "noopener,noreferrer");
}

export default function FeedPage() {
  const { city, user, signInDemo, submitPlateReview, moderatedFeedPosts } =
    useStore();
  const hiddenIds = new Set(
    moderatedFeedPosts.filter((p) => p.hidden).map((p) => p.id),
  );
  const seedPosts = FEED_POSTS.filter(
    (p) => p.city === city && !hiddenIds.has(p.id),
  );
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [templateId, setTemplateId] = useState("review");
  const [title, setTitle] = useState(POST_TEMPLATES[2].title);
  const [body, setBody] = useState(POST_TEMPLATES[2].body);
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(seedPosts);
  const [media, setMedia] = useState<FeedMedia[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [formError, setFormError] = useState("");
  const [sharedId, setSharedId] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [dealId, setDealId] = useState("");
  const [plates, setPlates] = useState(5);

  const photoRef = useRef<HTMLInputElement>(null);
  const gifUploadRef = useRef<HTMLInputElement>(null);
  const allowed = canPostInFeed(user);

  const cityRestaurants = useMemo(
    () => RESTAURANTS.filter((r) => r.approved && r.city === city),
    [city],
  );

  const selectedRestaurant = useMemo(
    () => RESTAURANTS.find((r) => r.id === restaurantId),
    [restaurantId],
  );

  const activeDeals = selectedRestaurant?.deals.filter((d) => d.active) ?? [];

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = POST_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
  }

  function onBusinessChange(id: string) {
    setRestaurantId(id);
    setMenuItemId("");
    setDealId("");
    const r = RESTAURANTS.find((x) => x.id === id);
    setCuisine(r?.cuisine ?? "");
  }

  function addFiles(files: FileList | null, kind: FeedMedia["kind"]) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setMedia((m) => [
          ...m,
          { kind, value: String(reader.result), name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function buildReviewBody() {
    const parts: string[] = [];
    if (body.trim()) parts.push(body.trim());
    if (selectedRestaurant) parts.push(`@ ${selectedRestaurant.name}`);
    if (menuItemId && selectedRestaurant) {
      const item = selectedRestaurant.menu.find((m) => m.id === menuItemId);
      if (item) parts.push(`Ordered: ${item.name}`);
    }
    if (dealId && selectedRestaurant) {
      const deal = selectedRestaurant.deals.find((d) => d.id === dealId);
      if (deal) parts.push(`Deal: ${deal.title}`);
    }
    parts.push(`Plate rate: ${plates}/5`);
    return parts.join(" · ");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (mode === "template" && !restaurantId) {
      setFormError("Select a business for template posts / reviews.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setFormError("Title and message are required.");
      return;
    }

    const menuItem = selectedRestaurant?.menu.find((m) => m.id === menuItemId);
    const deal = selectedRestaurant?.deals.find((d) => d.id === dealId);
    const reviewText = buildReviewBody();
    const postId = `local-${Date.now()}`;

    // Every post is a review (with plate rate when business is known)
    if (restaurantId) {
      submitPlateReview({
        restaurantId,
        plates,
        text: reviewText,
        cuisine: selectedRestaurant?.cuisine ?? cuisine ?? undefined,
        menuItemId: menuItem?.id,
        menuItemName: menuItem?.name,
        dealId: deal?.id,
        dealTitle: deal?.title,
        fromFeed: true,
        author: user?.name,
      });
    }

    setLocalPosts((prev) => [
      {
        id: postId,
        city,
        author: user?.name ?? "Member",
        authorId: user?.id,
        authorAvatar: user?.avatarDataUrl,
        title: title.trim(),
        body: reviewText,
        createdAt: new Date().toISOString(),
        media: media.length ? media : undefined,
        isReview: true,
        restaurantId: restaurantId || undefined,
        restaurantName: selectedRestaurant?.name,
        cuisine: selectedRestaurant?.cuisine ?? cuisine ?? undefined,
        menuItemId: menuItem?.id,
        menuItemName: menuItem?.name,
        dealId: deal?.id,
        dealTitle: deal?.title,
        plates: restaurantId ? plates : undefined,
        replies: [],
      },
      ...prev,
    ]);

    setTitle(mode === "template" ? POST_TEMPLATES.find((t) => t.id === templateId)?.title ?? "" : "");
    setBody(mode === "template" ? POST_TEMPLATES.find((t) => t.id === templateId)?.body ?? "" : "");
    setMedia([]);
    setShowEmoji(false);
    setShowGifs(false);
    if (mode === "template") {
      // keep restaurant selected for next review
    } else {
      setRestaurantId("");
      setMenuItemId("");
      setDealId("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="gp-page-title">City feed</h1>
      <p className="gp-page-sub">
        Posts are reviews. Template mode requires a business (and lets you pick
        cuisine, menu item, and promo). Freeform skips the business requirement.
      </p>

      {!allowed ? (
        <div className="mt-6 gp-card gp-card-static space-y-3 p-5">
          <p className="font-semibold">Members & partners only</p>
          <p className="text-sm leading-relaxed text-muted">
            Sign in as an active member or restaurant partner to create posts
            and replies.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/membership" className="gp-btn gp-btn-primary text-sm">
              Get membership
            </Link>
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-sm"
              onClick={() => signInDemo("diner")}
            >
              Demo diner (then join)
            </button>
            <button
              type="button"
              className="gp-btn gp-btn-ghost text-sm"
              onClick={() => signInDemo("restaurant")}
            >
              Demo restaurant
            </button>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 gp-card gp-card-static space-y-3 p-5"
          onSubmit={handleSubmit}
        >
          <p className="text-sm font-semibold">Create a post / review</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 ${
                mode === "template"
                  ? "bg-brand/15 text-orange-200 ring-brand/30"
                  : "text-muted ring-border"
              }`}
              onClick={() => {
                setMode("template");
                applyTemplate(templateId === "blank" ? "review" : templateId);
              }}
            >
              From template
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 ${
                mode === "custom"
                  ? "bg-brand/15 text-orange-200 ring-brand/30"
                  : "text-muted ring-border"
              }`}
              onClick={() => {
                setMode("custom");
                setTemplateId("blank");
                setTitle("");
                setBody("");
              }}
            >
              Write freeform
            </button>
          </div>

          {mode === "template" && (
            <>
              <label className="block text-sm">
                Template
                <select
                  className="gp-input mt-1"
                  value={templateId}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  {POST_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Business name *
                <select
                  required
                  className="gp-input mt-1"
                  value={restaurantId}
                  onChange={(e) => onBusinessChange(e.target.value)}
                >
                  <option value="">Select a restaurant…</option>
                  {cityRestaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Cuisine
                <input
                  className="gp-input mt-1"
                  readOnly
                  value={
                    selectedRestaurant
                      ? cuisineLabel(selectedRestaurant.cuisine)
                      : "Select a business first"
                  }
                />
                <span className="mt-1 block text-xs text-muted">
                  Auto-filled from the restaurant’s cuisine setting.
                </span>
              </label>

              {selectedRestaurant && (
                <>
                  <label className="block text-sm">
                    Menu item
                    <select
                      className="gp-input mt-1"
                      value={menuItemId}
                      onChange={(e) => setMenuItemId(e.target.value)}
                    >
                      <option value="">Optional…</option>
                      {selectedRestaurant.menu.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {activeDeals.length > 0 && (
                    <label className="block text-sm">
                      Promotion
                      <select
                        className="gp-input mt-1"
                        value={dealId}
                        onChange={(e) => setDealId(e.target.value)}
                      >
                        <option value="">
                          {activeDeals.length > 1
                            ? "Select a promotion…"
                            : "Optional…"}
                        </option>
                        {activeDeals.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </>
          )}

          {mode === "custom" && (
            <label className="block text-sm">
              Business (optional in freeform)
              <select
                className="gp-input mt-1"
                value={restaurantId}
                onChange={(e) => onBusinessChange(e.target.value)}
              >
                <option value="">None</option>
                {RESTAURANTS.filter((r) => r.approved && r.city === city).map(
                  (r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          {(mode === "template" || restaurantId) && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Your plate rate *</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlates(n)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                      plates === n
                        ? "bg-brand/20 text-orange-200 ring-brand/40"
                        : "text-muted ring-border"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1.5">
                <PlateRating value={plates} size="sm" />
              </div>
            </div>
          )}

          <input
            className="gp-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="gp-input min-h-[88px]"
            placeholder="What's good in the neighborhood?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {media.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-md border border-border bg-background"
                >
                  {m.kind === "emoji" ? (
                    <span className="flex h-16 w-16 items-center justify-center text-2xl">
                      {m.value}
                    </span>
                  ) : m.kind === "video" ? (
                    <video
                      src={m.value}
                      className="h-16 w-24 object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.value}
                      alt={m.name ?? "attachment"}
                      className="h-16 w-16 object-cover"
                    />
                  )}
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded bg-black/70 px-1 text-[10px]"
                    onClick={() =>
                      setMedia((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files?.length) return;
                const f = files[0];
                const kind: FeedMedia["kind"] = f.type.startsWith("video/")
                  ? "video"
                  : "photo";
                addFiles(files, kind);
                e.target.value = "";
              }}
            />
            <input
              ref={gifUploadRef}
              type="file"
              accept="image/gif,.gif"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files, "gif");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-xs !py-1.5"
              onClick={() => photoRef.current?.click()}
            >
              📷 Photo / video
            </button>
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-xs !py-1.5"
              onClick={() => {
                setShowGifs((v) => !v);
                setShowEmoji(false);
              }}
            >
              GIF
            </button>
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-xs !py-1.5"
              onClick={() => {
                setShowEmoji((v) => !v);
                setShowGifs(false);
              }}
            >
              😊 Emoji
            </button>
            <button
              type="submit"
              className="gp-btn gp-btn-primary ml-auto text-sm"
            >
              Post review
            </button>
          </div>

          {showGifs && (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="mb-2 text-xs font-medium text-muted">
                Pre-loaded GIFs · or{" "}
                <button
                  type="button"
                  className="text-brand underline"
                  onClick={() => gifUploadRef.current?.click()}
                >
                  upload your own
                </button>
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {PRESET_GIFS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    title={g.label}
                    className="overflow-hidden rounded-md ring-1 ring-border transition hover:ring-brand/50"
                    onClick={() => {
                      setMedia((m) => [
                        ...m,
                        { kind: "gif", value: g.value, name: g.label },
                      ]);
                      setShowGifs(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.value}
                      alt={g.label}
                      className="h-14 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {showEmoji && (
            <div className="flex flex-wrap gap-1 rounded-md border border-border bg-background p-2">
              {EMOJI_PICKS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="rounded p-1 text-xl hover:bg-card"
                  onClick={() => {
                    setBody((b) => b + em);
                    setMedia((m) => [...m, { kind: "emoji", value: em }]);
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {formError && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          )}
        </form>
      )}

      <div className="mt-8 space-y-4">
        {localPosts.map((post) => (
          <article
            key={post.id}
            id={post.id}
            className="gp-card gp-card-static p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {post.authorId ? (
                  <Link
                    href={`/u/${post.authorId}`}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs ring-1 ring-border"
                  >
                    {post.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.authorAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      post.author.slice(0, 1)
                    )}
                  </Link>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs ring-1 ring-border">
                    {post.author.slice(0, 1)}
                  </span>
                )}
                <div>
                  {post.authorId ? (
                    <Link
                      href={`/u/${post.authorId}`}
                      className="text-sm font-semibold text-orange-100 hover:underline"
                    >
                      {post.author}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">{post.author}</p>
                  )}
                  <p className="text-[11px] text-muted">
                    {new Date(post.createdAt).toLocaleString()}
                    {post.isReview !== false && (
                      <span className="ml-2 gp-badge !normal-case">Review</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="gp-btn-share !py-1 !text-[11px]"
                onClick={() => {
                  sharePost(post);
                  setSharedId(post.id);
                  setTimeout(() => setSharedId(null), 2000);
                }}
              >
                {sharedId === post.id ? "Shared!" : "Share"}
              </button>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
              {post.title}
            </h2>
            {(post.restaurantName || post.plates != null) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {post.restaurantName && (
                  <Link
                    href={`/restaurants/${post.restaurantId}`}
                    className="font-medium text-orange-200/90 hover:underline"
                  >
                    {post.restaurantName}
                  </Link>
                )}
                {post.cuisine && (
                  <span>· {cuisineLabel(post.cuisine)}</span>
                )}
                {post.menuItemName && <span>· {post.menuItemName}</span>}
                {post.dealTitle && <span>· {post.dealTitle}</span>}
                {post.plates != null && (
                  <span className="inline-flex items-center gap-1">
                    · <PlateRating value={post.plates} size="sm" showNumber />
                  </span>
                )}
              </div>
            )}
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              {post.body}
            </p>
            {post.media && post.media.length > 0 && (
              <MediaGrid media={post.media} />
            )}
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Replies
              </p>
              {post.replies.length === 0 && (
                <p className="text-xs text-muted">No replies yet.</p>
              )}
              {post.replies.map((r) => (
                <div
                  key={r.id}
                  className="flex gap-2 rounded-md bg-background/80 px-3 py-2 text-sm ring-1 ring-border"
                >
                  {r.authorId ? (
                    <Link
                      href={`/u/${r.authorId}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-[10px] ring-1 ring-border"
                    >
                      {r.authorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.authorAvatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        r.author.slice(0, 1)
                      )}
                    </Link>
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] ring-1 ring-border">
                      {r.author.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    {r.authorId ? (
                      <Link
                        href={`/u/${r.authorId}`}
                        className="font-medium text-orange-200/90 hover:underline"
                      >
                        {r.author}
                      </Link>
                    ) : (
                      <span className="font-medium text-orange-200/90">
                        {r.author}
                      </span>
                    )}
                    <span className="text-muted"> · {r.body}</span>
                  </div>
                </div>
              ))}
              {allowed ? (
                <ReplyBox
                  onReply={(text) => {
                    setLocalPosts((prev) =>
                      prev.map((p) =>
                        p.id === post.id
                          ? {
                              ...p,
                              replies: [
                                ...p.replies,
                                {
                                  id: `r-${Date.now()}`,
                                  author: user?.name ?? "Member",
                                  authorId: user?.id,
                                  authorAvatar: user?.avatarDataUrl,
                                  body: text,
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                            }
                          : p,
                      ),
                    );
                  }}
                />
              ) : (
                <p className="text-xs text-muted">
                  Active members and restaurants can reply.
                </p>
              )}
            </div>
          </article>
        ))}
        {localPosts.length === 0 && (
          <p className="text-center text-muted">
            No posts in this city yet. Dallas has starter threads.
          </p>
        )}
      </div>
    </div>
  );
}

function MediaGrid({ media }: { media: FeedMedia[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {media.map((m, i) =>
        m.kind === "emoji" ? (
          <span key={i} className="text-2xl">
            {m.value}
          </span>
        ) : m.kind === "video" ? (
          <video
            key={i}
            src={m.value}
            controls
            className="max-h-48 max-w-full rounded-md ring-1 ring-border"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={m.value}
            alt={m.name ?? "media"}
            className="max-h-48 max-w-full rounded-md object-cover ring-1 ring-border"
          />
        ),
      )}
    </div>
  );
}

function ReplyBox({ onReply }: { onReply: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onReply(text.trim());
        setText("");
      }}
    >
      <input
        className="gp-input !py-2 text-sm"
        placeholder="Write a reply…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="gp-btn gp-btn-secondary text-sm !py-2">
        Reply
      </button>
    </form>
  );
}
