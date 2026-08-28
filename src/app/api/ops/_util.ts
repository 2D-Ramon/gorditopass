import { NextResponse } from "next/server";
import { requireOps } from "@/lib/ops-auth";
import { createOpsClient } from "@/lib/supabase";

export async function withOps() {
  const gate = await requireOps();
  if (!gate.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: gate.error },
        { status: gate.status },
      ),
    };
  }
  return { ok: true as const, supabase: createOpsClient() };
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
