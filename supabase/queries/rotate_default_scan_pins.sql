-- OPTIONAL, run manually (not a migration): prod had 2 scan-PIN rows still on the old
-- hardcoded default "1234" created by /api/redeem/start. Rotate them to random 4-digit PINs
-- and tell those restaurants their new PIN (GET /api/partner/pin shows it to owners).
update public.listing_staff
   set name = lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
 where email = '__scan_pin__' and name = '1234';
