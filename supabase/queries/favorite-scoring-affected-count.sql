-- READ-ONLY: affected accounts before running 20261027000000_remove_favorite_scoring.sql
select
  (select count(distinct member_id) from public.reward_ledger where note = 'Favorite a restaurant') as members_with_fav_points,
  (select coalesce(sum(points),0) from public.reward_ledger where note = 'Favorite a restaurant') as total_fav_points,
  (select count(*) from public.profiles where 'explorer' = any(badges)) as members_with_explorer_badge,
  (select count(*) from public.profiles p
     where coalesce(p.reward_points,0) < (select coalesce(sum(points),0) from public.reward_ledger l
                                          where l.member_id = p.id and l.note = 'Favorite a restaurant')) as members_who_would_clamp_to_0,
  (select count(*) from public.profiles p
     where 'explorer' = any(p.badges)
        or exists (select 1 from public.reward_ledger l where l.member_id = p.id and l.note = 'Favorite a restaurant')) as total_affected_accounts;
