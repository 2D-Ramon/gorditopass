/** Marker left on a wiped listing so the public seed cannot bring it back. */
export const DELETED_LISTING_TAGLINE = "__gordito_deleted__";

export type RestaurantAccountState = "active" | "paused";

export function isDeletedListing(row: { tagline?: string | null } | null | undefined) {
  return row?.tagline === DELETED_LISTING_TAGLINE;
}

/** Active is on the public site. Paused stays in the database and in both dashboards. */
export function restaurantAccountState(row: {
  approved?: boolean | null;
  banned?: boolean | null;
}): RestaurantAccountState {
  if (row.approved === false || row.banned === true) return "paused";
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
