"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * MOCK: heart Favorites, separate from the Will try list (store `favorites`).
 * Browser-only for now (localStorage), not synced to the account.
 */
const KEY = "gorditopass-hearts-v1";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useHeartFavorites() {
  const hearts = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggleHeart = useCallback((id: string) => {
    const prev = read();
    cache = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {}
    listeners.forEach((fn) => fn());
  }, []);
  return { hearts, toggleHeart };
}
