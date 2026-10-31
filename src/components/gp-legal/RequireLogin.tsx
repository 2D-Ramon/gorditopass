"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/authed";
import { safeNext } from "@/lib/safe-next";

/** Client-side gate: Supabase sessions live in the browser, so the check runs here. */
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    void getAccessToken().then((t) => {
      if (!live) return;
      if (t) setOk(true);
      else {
        const next = safeNext(pathname + (typeof window !== "undefined" ? window.location.search : ""), "/");
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    });
    return () => {
      live = false;
    };
  }, [pathname, router]);
  if (!ok) return <div className="mx-auto max-w-xl px-4 py-10 text-stone-300">Checking your sign-in…</div>;
  return <>{children}</>;
}
