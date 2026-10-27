-- Remove Will try scoring: "Favorite a restaurant" (+5) points and the "Explorer"
-- ("Favorite 3 restaurants") badge. member_favorites and Will try are untouched.
-- NOT applied anywhere yet. Run once against prod when publishing (idempotent:
-- the ledger rows it keys on are deleted, so a re-run is a no-op).
begin;

-- 1) Reverse points. Balance is clamped at 0 because some members may have spent them.
with fav as (
  select member_id, sum(points)::int as pts
  from public.reward_ledger
  where note = 'Favorite a restaurant'
  group by member_id
)
update public.profiles p
set reward_points          = greatest(0, coalesce(p.reward_points, 0) - fav.pts),
    reward_points_lifetime = greatest(0, coalesce(p.reward_points_lifetime, 0) - fav.pts)
from fav
where p.id = fav.member_id;

-- 2) Drop the ledger entries so history matches the new totals.
delete from public.reward_ledger where note = 'Favorite a restaurant';

-- 3) Revoke the badge.
update public.profiles
set badges = array_remove(badges, 'explorer')
where 'explorer' = any(badges);

commit;
