-- Rollback for 20261104000000_redact_member_display_names.sql
update public.plate_reviews r set author = b.original
from public._backup_display_names_20261104 b
where b.source = 'plate_reviews' and b.row_id = r.id;
update public.listing_messages m set from_name = b.original
from public._backup_display_names_20261104 b
where b.source = 'listing_messages' and b.row_id = m.id;
drop table if exists public._backup_display_names_20261104;
