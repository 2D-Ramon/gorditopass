"use client";

import { StoreProvider } from "@/lib/store";
import { AuthSync } from "./AuthSync";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AuthSync />
      {children}
    </StoreProvider>
  );
}
