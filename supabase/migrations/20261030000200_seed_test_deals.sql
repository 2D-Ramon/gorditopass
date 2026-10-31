-- Seed the 7 app-catalog deals into listing_deals (test data: all parent listings are is_test=true,
-- so `delete from public.listings where is_test;` cascades these away). Idempotent. NOT applied.
insert into public.listing_deals (id, restaurant_id, title, description, type, value, member_only, excludes_alcohol, active, hidden, status)
select v.* from (values
  ('sr-20', 'sakura-ramen', '20% off ramen bowl', 'Member percent off one bowl.', 'percent_off', 20::numeric, true, true, true, false, 'approved'),
  ('bn-bogo-spring', 'bangkok-night', 'BOGO spring rolls', 'Buy one app, get one free for members.', 'bogo', null::numeric, true, true, true, false, 'approved'),
  ('sp-free-naan', 'spice-route', 'Free garlic naan', 'With any curry entrée for members.', 'free_item', null::numeric, true, true, true, false, 'approved'),
  ('ob-25', 'olive-branch', '25% off mezze plate', 'Member percent off the mezze.', 'percent_off', 25::numeric, true, true, true, false, 'approved'),
  ('pb-free-dessert', 'petit-bistro', 'Free dessert', 'With any entrée for members.', 'free_item', null::numeric, true, true, true, false, 'approved'),
  ('ij-free-plantain', 'island-jerk', 'Free fried plantains', 'With any jerk plate for members.', 'free_item', null::numeric, true, true, true, false, 'approved'),
  ('esn-25', 'el-sabor-nuevo', '25% off first taco order', 'Member percent off taco combos.', 'percent_off', 25::numeric, true, true, true, false, 'approved')
) as v(id, restaurant_id, title, description, type, value, member_only, excludes_alcohol, active, hidden, status)
join public.listings l on l.id = v.restaurant_id and l.is_test
on conflict (id) do nothing;
