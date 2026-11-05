"use client";

import { useEffect, useState } from "react";
import {
  mergeCatalog,
  type LiveListingRow,
} from "./listing-map";
import type { Restaurant } from "./types";

export function useLiveCatalog() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() =>
    mergeCatalog(null),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stop = false;
    void fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { restaurants?: LiveListingRow[]; hidden?: string[] } | null) => {
          if (stop || !data) {
            if (!stop) setReady(true);
            return;
          }
          setRestaurants(mergeCatalog(data.restaurants ?? [], data.hidden ?? []));
          setReady(true);
        },
      )
      .catch(() => {
        if (!stop) setReady(true);
      });
    return () => {
      stop = true;
    };
  }, []);

  return { restaurants, ready };
}
