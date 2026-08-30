import { NextResponse } from "next/server";
import { requireOps } from "@/lib/ops-auth";
import type { OpsPermission } from "@/lib/ops-types";
import { createOpsClient } from "@/lib/supabase";

export async function withOps(permission?: OpsPermission) {
  const gate = await requireOps(permission);
  if (!gate.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: gate.error },
        { status: gate.status },
      ),
    };
  }
  return {
    ok: true as const,
    supabase: createOpsClient(),
    admin: gate.admin,
  };
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
