-- Photo URLs stored in Cloudflare R2. Paste into SQL Editor → Run
-- after market.sql + member_activity.sql. Safe to re-run.

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.listing_deals
  add column if not exists image_urls text[] not null default '{}';

alter table public.listing_menu
  add column if not exists image_urls text[] not null default '{}';

do $$ begin
  alter table public.listing_events
    add column if not exists image_urls text[] not null default '{}';
exception when undefined_table then null;
end $$;

do $$ begin
  alter table public.listing_jobs
    add column if not exists image_urls text[] not null default '{}';
exception when undefined_table then null;
end $$;

do $$ begin
  alter table public.city_posts
    add column if not exists media jsonb not null default '[]';
exception when undefined_table then null;
end $$;

notify pgrst, 'reload schema';
