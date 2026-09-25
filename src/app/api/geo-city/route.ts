import { NextResponse } from "next/server";
import { nearestCity } from "@/lib/listing-map";

/** Closest market from the visitor IP. Vercel sets these headers on the live site. */
export async function GET(req: Request) {
  const lat = Number(req.headers.get("x-vercel-ip-latitude"));
  const lng = Number(req.headers.get("x-vercel-ip-longitude"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ city: null });
  }
  return NextResponse.json({ city: nearestCity(lat, lng) });
}
