"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import type { LiveMemberBundle } from "@/lib/types";

export function AuthSync() {
  const { hydrateFromServer, signOut, user } = useStore();

  useEffect(() => {
    const sb = createBrowserClient();
    if (!sb) return;

    async function applySession(accessToken: string | undefined) {
      if (!accessToken) return;
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as LiveMemberBundle & { user?: LiveMemberBundle["user"] | null };
      if (data.user) hydrateFromServer(data.user, data);
    }

    void sb.auth.getSession().then(({ data }) => {
      void applySession(data.session?.access_token);
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (user?.role !== "admin") signOut();
        return;
      }
      void applySession(session?.access_token);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrateFromServer, signOut, user?.role]);

  return null;
}
