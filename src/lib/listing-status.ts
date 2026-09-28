/** Marker left on a wiped listing so the public seed cannot bring it back. */
export const DELETED_LISTING_TAGLINE = "__gordito_deleted__";

export type RestaurantAccountState = "active" | "paused" | "deactivated";

export function isDeletedListing(row: { tagline?: string | null } | null | undefined) {
  return row?.tagline === DELETED_LISTING_TAGLINE;
}

/** Active is on the site. Paused and deactivated stay in the database. */
export function restaurantAccountState(row: {
  approved?: boolean | null;
  banned?: boolean | null;
}): RestaurantAccountState {
  if (row.approved === false) return "deactivated";
  if (row.banned === true) return "paused";
  return "active";
}

export function isLiveListing(
  row:
    | {
        approved?: boolean | null;
        banned?: boolean | null;
        tagline?: string | null;
      }
    | null
    | undefined,
) {
  if (!row || isDeletedListing(row)) return false;
  return row.approved !== false && row.banned !== true;
}
