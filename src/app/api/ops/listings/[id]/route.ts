import { NextResponse } from "next/server";
import { asCity, CITY_CENTERS } from "@/lib/listing-map";
import { jsonError, withOps } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await withOps("can_restaurants");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};
  if (typeof body?.approved === "boolean") patch.approved = body.approved;
  if (typeof body?.banned === "boolean") patch.banned = body.banned;
  if (typeof body?.hidden === "boolean") patch.hidden = body.hidden;
  if (typeof body?.city === "string" && body.city.trim()) {
    const city = asCity(body.city);
    patch.city = city;
    if (body.lat == null && body.lng == null) {
      patch.lat = CITY_CENTERS[city].lat;
      patch.lng = CITY_CENTERS[city].lng;
    }
  }
  if (typeof body?.lat === "number") patch.lat = body.lat;
  if (typeof body?.lng === "number") patch.lng = body.lng;
  if (Object.keys(patch).length === 0) {
    return jsonError("Nothing to update.");
  }
  const { error } = await gate.supabase.from("listings").update(patch).eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
