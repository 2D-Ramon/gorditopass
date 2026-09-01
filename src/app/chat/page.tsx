"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { REACTION_EMOJIS } from "@/lib/pricing";
import { useStore } from "@/lib/store";

/**
 * Sticky community chat: DMs + public groups (never private).
 * Groups can invite members and share a join link.
 */
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading chat…</div>
      }
    >
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const search = useSearchParams();
  const {
    user,
    accounts,
    chats,
    createDmChat,
    createGroupChat,
    inviteToGroupChat,
    joinGroupChat,
    sendChatMessage,
    reactToChatMessage,
  } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupPick, setGroupPick] = useState<string[]>([]);
  const [invitePick, setInvitePick] = useState<string[]>([]);
  const [flash, setFlash] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Open shared group link: /chat?group=chat-g-…
  useEffect(() => {
    const gid = search.get("group");
    if (!gid || !user) return;
    const res = joinGroupChat(gid);
    if (res.ok) {
      setActiveId(gid);
      setFlash("Joined public group from share link.");
    } else if (res.error) {
      setFlash(res.error);
    }
  }, [search, user, joinGroupChat]);

  const myChats = useMemo(() => {
    if (!user) return [];
    return chats
      .filter((c) => c.memberIds.includes(user.id))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [chats, user]);

  // Public groups you’re not in yet (discover / join)
  const publicGroups = useMemo(() => {
    if (!user) return [];
    return chats.filter(
      (c) =>
        c.type === "group" &&
        c.isPublic !== false &&
        !c.memberIds.includes(user.id),
    );
  }, [chats, user]);

  const active = myChats.find((c) => c.id === activeId) ?? myChats[0] ?? null;

  const otherDiners = useMemo(() => {
    if (!user) return [];
    return accounts.filter(
      (a) => a.role === "diner" && a.id !== user.id && a.email !== user.email,
    );
  }, [accounts, user]);

  const inviteCandidates = useMemo(() => {
    if (!active || active.type !== "group") return [];
    return otherDiners.filter((a) => !active.memberIds.includes(a.id));
  }, [active, otherDiners]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gp-page-title">Chat</h1>
        <p className="mt-2 text-muted">
          Sign in to message members and join public group chats.
        </p>
        <Link href="/login" className="gp-btn gp-btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  async function shareGroup(chatId: string, title: string) {
    const url = `${window.location.origin}/chat?group=${encodeURIComponent(chatId)}`;
    const text = `Join “${title}” on GorditoPass (public group chat).`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setFlash("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setFlash("Group link copied.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setFlash("Group link copied.");
      } catch {
        setFlash(url);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="gp-page-title">Community chat</h1>
      <p className="gp-page-sub">
        Private DMs stay 1:1. Group chats are always public — invite members or
        share the link. Keep it friendly, local, and food-first. No politics.
      </p>

      {flash && (
        <p className="mt-3 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-orange-100">
          {flash}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <div className="gp-card gp-card-static p-3">
            <p className="text-xs font-semibold uppercase text-muted">
              Your chats
            </p>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {myChats.length === 0 && (
                <li className="text-xs text-muted">No chats yet — start one.</li>
              )}
              {myChats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      active?.id === c.id
                        ? "bg-brand/20 text-orange-100"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="font-medium">
                      {c.type === "group" ? "👥 " : "💬 "}
                      {c.title}
                      {c.type === "group" && (
                        <span className="ml-1 text-[9px] font-normal uppercase text-brand">
                          public
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[10px] text-muted">
                      {[...c.messages]
                        .reverse()
                        .find((m) => m.authorId !== "system")?.body ??
                        "No messages yet"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {publicGroups.length > 0 && (
            <div className="gp-card gp-card-static p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                Public groups to join
              </p>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
                {publicGroups.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="text-left text-brand underline"
                      onClick={() => {
                        const res = joinGroupChat(c.id);
                        if (res.ok) {
                          setActiveId(c.id);
                          setFlash(`Joined “${c.title}”.`);
                        } else {
                          setFlash(res.error ?? "Could not join.");
                        }
                      }}
                    >
                      {c.title}
                    </button>
                    <span className="ml-1 text-[10px] text-muted">
                      · {c.memberIds.length} members
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="gp-card gp-card-static p-3">
            <p className="text-xs font-semibold uppercase text-muted">
              Start a DM
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
              {otherDiners.length === 0 && (
                <li className="text-xs text-muted">
                  Other member accounts appear after signup / seats.
                </li>
              )}
              {otherDiners.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="text-brand underline"
                    onClick={() => {
                      const id = createDmChat(a.id, a.name);
                      setActiveId(id);
                    }}
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="gp-card gp-card-static p-3">
            <p className="text-xs font-semibold uppercase text-muted">
              New public group
            </p>
            <p className="mt-1 text-[10px] text-muted">
              Groups can’t be private. Invite members or share the link.
            </p>
            <input
              className="gp-input mt-2 text-sm"
              placeholder="Group name"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
            />
            <div className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs">
              {otherDiners.map((a) => (
                <label key={a.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={groupPick.includes(a.id)}
                    onChange={(e) => {
                      setGroupPick((prev) =>
                        e.target.checked
                          ? [...prev, a.id]
                          : prev.filter((x) => x !== a.id),
                      );
                    }}
                  />
                  {a.name}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="gp-btn gp-btn-primary mt-2 w-full text-xs"
              onClick={() => {
                const names = otherDiners
                  .filter((a) => groupPick.includes(a.id))
                  .map((a) => a.name);
                const id = createGroupChat(groupTitle, groupPick, names);
                if (id) {
                  setActiveId(id);
                  setGroupTitle("");
                  setGroupPick([]);
                  setFlash("Public group created.");
                }
              }}
            >
              Create public group
            </button>
          </div>
        </aside>

        <section className="gp-card gp-card-static flex min-h-[420px] flex-col p-0">
          {active ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {active.type === "group" ? "👥 " : "💬 "}
                      {active.title}
                      {active.type === "group" && (
                        <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                          Public
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted">
                      {active.memberNames.join(" · ")}
                    </p>
                  </div>
                  {active.type === "group" && (
                    <button
                      type="button"
                      className="gp-btn gp-btn-secondary text-xs !py-1.5"
                      onClick={() => shareGroup(active.id, active.title)}
                    >
                      Share group
                    </button>
                  )}
                </div>

                {active.type === "group" && (
                  <div className="mt-3 rounded-md border border-border bg-elevated/40 p-2">
                    <p className="text-[10px] font-semibold uppercase text-muted">
                      Invite members
                    </p>
                    {inviteCandidates.length === 0 ? (
                      <p className="mt-1 text-[11px] text-muted">
                        No more members to invite (or none signed up yet).
                      </p>
                    ) : (
                      <>
                        <div className="mt-1 max-h-20 space-y-1 overflow-y-auto text-xs">
                          {inviteCandidates.map((a) => (
                            <label
                              key={a.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={invitePick.includes(a.id)}
                                onChange={(e) => {
                                  setInvitePick((prev) =>
                                    e.target.checked
                                      ? [...prev, a.id]
                                      : prev.filter((x) => x !== a.id),
                                  );
                                }}
                              />
                              {a.name}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="gp-btn gp-btn-primary mt-2 text-[11px] !py-1"
                          onClick={() => {
                            const names = inviteCandidates
                              .filter((a) => invitePick.includes(a.id))
                              .map((a) => a.name);
                            const res = inviteToGroupChat(
                              active.id,
                              invitePick,
                              names,
                            );
                            setFlash(
                              res.ok
                                ? "Invites sent."
                                : res.error ?? "Could not invite.",
                            );
                            if (res.ok) setInvitePick([]);
                          }}
                        >
                          Invite selected
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {active.messages
                  .filter((m) => m.authorId !== "system")
                  .map((m) => {
                  const mine = m.authorId === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 ${mine ? "justify-end" : ""}`}
                    >
                      {!mine && (
                        <Link
                          href={`/u/${m.authorId}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs ring-1 ring-border"
                        >
                          {m.authorAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.authorAvatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            m.authorName.slice(0, 1)
                          )}
                        </Link>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-brand/25 text-orange-50"
                            : "bg-elevated"
                        }`}
                      >
                        {!mine && (
                          <Link
                            href={`/u/${m.authorId}`}
                            className="text-[10px] font-semibold text-brand"
                          >
                            {m.authorName}
                          </Link>
                        )}
                        {m.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.imageUrl}
                            alt=""
                            className="mb-2 max-h-56 w-full rounded-lg object-cover"
                          />
                        )}
                        {m.body && <p className="leading-relaxed">{m.body}</p>}
                        <p className="mt-0.5 text-[10px] text-muted">
                          {new Date(m.at).toLocaleString()}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {REACTION_EMOJIS.map((emoji) => {
                            const voters = m.reactions?.[emoji] ?? [];
                            const mineR = voters.includes(user.id);
                            if (voters.length === 0 && !mineR) {
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  title={`React ${emoji}`}
                                  className="rounded px-1 text-[11px] opacity-40 hover:opacity-100"
                                  onClick={() =>
                                    reactToChatMessage(
                                      active.id,
                                      m.id,
                                      emoji,
                                    )
                                  }
                                >
                                  {emoji}
                                </button>
                              );
                            }
                            if (voters.length === 0) return null;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={`rounded-full px-1.5 py-0.5 text-[11px] ring-1 ${
                                  mineR
                                    ? "bg-brand/20 ring-brand/40"
                                    : "bg-background/60 ring-border"
                                }`}
                                onClick={() =>
                                  reactToChatMessage(active.id, m.id, emoji)
                                }
                              >
                                {emoji} {voters.length}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim() && !pendingImage) return;
                  sendChatMessage(active.id, draft, pendingImage ?? undefined);
                  setDraft("");
                  setPendingImage(null);
                }}
              >
                {pendingImage && (
                  <div className="relative mb-2 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImage}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
                    />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded bg-black/70 px-1 text-[10px]"
                      onClick={() => setPendingImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setPhotoBusy(true);
                      void import("@/lib/upload-client")
                        .then(({ uploadImageUrls }) =>
                          uploadImageUrls([file], "chat"),
                        )
                        .then(([url]) => {
                          if (url) setPendingImage(url);
                        })
                        .catch((err: unknown) => {
                          setFlash(
                            err instanceof Error ? err.message : "Photo failed.",
                          );
                        })
                        .finally(() => setPhotoBusy(false));
                    }}
                  />
                  <button
                    type="button"
                    className="gp-btn gp-btn-ghost text-sm"
                    disabled={photoBusy}
                    onClick={() => photoRef.current?.click()}
                  >
                    {photoBusy ? "…" : "📷"}
                  </button>
                  <input
                    className="gp-input flex-1 text-sm"
                    placeholder="Message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" className="gp-btn gp-btn-primary text-sm">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">
              Start a DM or create a public group to chat.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
