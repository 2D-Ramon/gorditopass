import { isCityId, nearestCity } from "./listing-map";
import type { CityId } from "./types";

function grantedCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  const query = navigator.permissions?.query?.bind(navigator.permissions);
  if (!query) return Promise.resolve(null);
  return query({ name: "geolocation" })
    .then(
      (status) =>
        new Promise<{ lat: number; lng: number } | null>((resolve) => {
          if (status.state !== "granted") {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            () => resolve(null),
            { maximumAge: 60 * 60 * 1000, timeout: 4000 },
          );
        }),
    )
    .catch(() => null);
}

/** Nearest market for this visit. Does not prompt for location permission. */
export async function detectVisitorCity(): Promise<CityId | null> {
  try {
    const res = await fetch("/api/geo-city");
    if (res.ok) {
      const data = (await res.json()) as { city?: string | null };
      if (isCityId(data.city)) return data.city;
    }
  } catch {
    /* IP lookup is optional */
  }
  const coords = await grantedCoords();
  if (!coords) return null;
  return nearestCity(coords.lat, coords.lng);
}
