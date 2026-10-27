"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { authedFetch, getAccessToken } from "./authed";
import { useStore } from "./store";

/**
 * Heart Favorites ("♡ Favorite"), separate from the Will try list (store `favorites`,
 * member_favorites + rewards).
 * - Signed in with a real session: saved to the account (/api/me/loved → member_loved_restaurants).
 * - Signed out / demo users: browser-only (localStorage), as before.
 * - On sign-in, any local hearts are merged into the account once, then cleared locally.
 */
const KEY = "gorditopass-hearts-v1";
const EMPTY: string[] = [];
let localCache: string[] | null = null;
let remote: string[] | null = null; // null = not in account mode
let remoteOwner: string | null = null;
let loading: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function readLocal(): string[] {
  if (localCache) return localCache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    localCache = Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    localCache = [];
  }
  return localCache;
}

function writeLocal(next: string[]) {
  localCache = next;
  try {
    if (next.length) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {}
}

const read = () => remote ?? readLocal();

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      localCache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

async function loadAccount(userId: string) {
  if (loading === userId || remoteOwner === userId) return;
  loading = userId;
  try {
    const token = await getAccessToken();
    if (!token) return; // demo / mock session: stay local
    const local = readLocal();
    const res = local.length
      ? await authedFetch(
          "/api/me/loved",
          { method: "POST", body: JSON.stringify({ restaurantIds: local }) },
          token,
        )
      : await authedFetch("/api/me/loved", {}, token);
    if (!res.ok) return; // e.g. table not migrated yet: keep local fallback
    const data = (await res.json()) as { loved?: string[] };
    remote = Array.isArray(data.loved) ? data.loved : [];
    remoteOwner = userId;
    if (local.length) writeLocal([]);
    emit();
  } catch {
    // network error: keep local fallback
  } finally {
    if (loading === userId) loading = null;
  }
}

export function useHeartFavorites() {
  const { user } = useStore();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId) {
      void loadAccount(userId);
    } else if (remote !== null) {
      remote = null;
      remoteOwner = null;
      emit();
    }
  }, [userId]);

  const hearts = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggleHeart = useCallback((id: string) => {
    if (remote === null) {
      const prev = readLocal();
      writeLocal(prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
      emit();
      return;
    }
    const prev = remote;
    const removing = prev.includes(id);
    remote = removing ? prev.filter((x) => x !== id) : [...prev, id];
    emit();
    void (async () => {
      try {
        const res = removing
          ? await authedFetch(`/api/me/loved?restaurantId=${encodeURIComponent(id)}`, {
              method: "DELETE",
            })
          : await authedFetch("/api/me/loved", {
              method: "POST",
              body: JSON.stringify({ restaurantId: id }),
            });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { loved?: string[] };
        if (remote !== null && Array.isArray(data.loved)) remote = data.loved;
      } catch {
        if (remote !== null) remote = prev; // roll back
      }
      emit();
    })();
  }, []);

  return { hearts, toggleHeart, synced: Boolean(userId) && remote !== null };
}
