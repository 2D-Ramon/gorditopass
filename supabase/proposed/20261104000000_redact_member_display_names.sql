-- NOT APPLIED TO PROD. Requires review before running.
-- Why: public.plate_reviews has a public SELECT policy (reviews_public_read), and its
-- `author` column was historically written as "First Last" or, with no name, the member's
-- EMAIL. listing_messages.from_name (diner rows) was written as "First Last". Restaurants
-- (and, for reviews, anyone with the anon key) can read these. App code now writes
-- "First L." going forward and redacts on partner/public API output; this migration
-- redacts the legacy stored values. Originals are backed up for rollback.
-- Rollback: supabase/proposed/20261104000000_redact_member_display_names.down.sql

create table if not exists public._backup_display_names_20261104 (
  source text not null,
  row_id uuid not null,
  original text,
  primary key (source, row_id)
);
alter table public._backup_display_names_20261104 enable row level security;
-- service role only (no client policies)

insert into public._backup_display_names_20261104 (source, row_id, original)
select 'plate_reviews', id, author from public.plate_reviews where author is not null
on conflict do nothing;
insert into public._backup_display_names_20261104 (source, row_id, original)
select 'listing_messages', id, from_name from public.listing_messages
where from_role = 'diner' and from_name is not null
on conflict do nothing;

update public.plate_reviews r
set author = case
  when p.first_name is not null and btrim(p.first_name) <> '' then
    split_part(btrim(p.first_name), ' ', 1) ||
    coalesce(' ' || upper(left(nullif(btrim(p.last_name), ''), 1)) || '.', '')
  else 'Member' end
from public.profiles p
where p.id = r.member_id;
update public.plate_reviews set author = 'Member' where author like '%@%';

update public.listing_messages m
set from_name = case
  when p.first_name is not null and btrim(p.first_name) <> '' then
    split_part(btrim(p.first_name), ' ', 1) ||
    coalesce(' ' || upper(left(nullif(btrim(p.last_name), ''), 1)) || '.', '')
  else 'Member' end
from public.profiles p
where p.id = m.member_id and m.from_role = 'diner';
update public.listing_messages set from_name = 'Member'
where from_role = 'diner' and from_name like '%@%';
