"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Passports live under Account → Passports tab */
export default function PassportsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account?tab=passports");
  }, [router]);
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted">
      Opening passports in your account…
    </div>
  );
}
