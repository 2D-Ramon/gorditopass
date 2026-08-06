"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { REACTION_EMOJIS } from "@/lib/pricing";
import { useStore } from "@/lib/store";

/**
 * Sticky community chat: DMs + groups.
 * Demo stores threads in localStorage; live would use realtime backend.
 */
export default function ChatPage() {
  const {
    user,
    accounts,
    chats,
    createDmChat,
    createGroupChat,
    sendChatMessage,
    reactToChatMessage,
  } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupPick, setGroupPick] = useState<string[]>([]);

  const myChats = useMemo(() => {
    if (!user) return [];
    return chats
      .filter((c) => c.memberIds.includes(user.id))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [chats, user]);

  const active = myChats.find((c) => c.id === activeId) ?? myChats[0] ?? null;

  const otherDiners = useMemo(() => {
    if (!user) return [];
    return accounts.filter(
      (a) => a.role === "diner" && a.id !== user.id && a.email !== user.email,
    );
  }, [accounts, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gp-page-title">Chat</h1>
        <p className="mt-2 text-muted">
          Sign in to message members and join group chats.
        </p>
        <Link href="/login" className="gp-btn gp-btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="gp-page-title">Community chat</h1>
      <p className="gp-page-sub">
        Private DMs and group hangs — keep it friendly, local, and food-first.
        No politics.
      </p>

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
                    </span>
                    <span className="block truncate text-[10px] text-muted">
                      {c.messages[c.messages.length - 1]?.body ?? "New chat"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

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
              New group
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
                }
              }}
            >
              Create group
            </button>
          </div>
        </aside>

        <section className="gp-card gp-card-static flex min-h-[420px] flex-col p-0">
          {active ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="font-semibold">
                  {active.type === "group" ? "👥 " : "💬 "}
                  {active.title}
                </p>
                <p className="text-[11px] text-muted">
                  {active.memberNames.join(" · ")}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {active.messages.map((m) => {
                  const mine = m.authorId === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 ${mine ? "justify-end" : ""}`}
                    >
                      {!mine && m.authorId !== "system" && (
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
                          m.authorId === "system"
                            ? "bg-elevated text-xs text-muted"
                            : mine
                              ? "bg-brand/25 text-orange-50"
                              : "bg-elevated"
                        }`}
                      >
                        {!mine && m.authorId !== "system" && (
                          <Link
                            href={`/u/${m.authorId}`}
                            className="text-[10px] font-semibold text-brand"
                          >
                            {m.authorName}
                          </Link>
                        )}
                        <p className="leading-relaxed">{m.body}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {new Date(m.at).toLocaleString()}
                        </p>
                        {m.authorId !== "system" && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {REACTION_EMOJIS.map((emoji) => {
                              const voters = m.reactions?.[emoji] ?? [];
                              const mine = voters.includes(user.id);
                              if (voters.length === 0 && !mine) {
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
                                    mine
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage(active.id, draft);
                  setDraft("");
                }}
              >
                <input
                  className="gp-input flex-1"
                  placeholder="Say something nice about food…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="gp-btn gp-btn-primary">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">
              Pick a chat or start a DM / group to hang out with food friends.
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            t: "Reactions",
            d: "Tap emoji under a message — 👍 ❤️ 🔥 and more.",
          },
          {
            t: "Foodie groups",
            d: "Create taco Tuesdays, date-night spots, or city food walks.",
          },
          {
            t: "Profiles",
            d: "Tap a name to open their public foodie profile.",
          },
        ].map((x) => (
          <div key={x.t} className="gp-card gp-card-static p-4 text-sm">
            <p className="font-semibold">{x.t}</p>
            <p className="mt-1 text-xs text-muted">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
