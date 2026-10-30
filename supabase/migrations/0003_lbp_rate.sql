-- Dollar prices are what the till charges; the lira figure beside them is
-- converted. Lebanon's rate moves, so it lives in the database where the owner
-- can change it in Settings, not baked into the build.
--
-- 90,000 is the rate the restaurant already prints on its own offer photos
-- (1,800,000 L.L. on a $20.00 dish). Run once in the Supabase SQL editor.
alter table restaurants
  add column if not exists lbp_rate numeric(12,2) not null default 90000;
