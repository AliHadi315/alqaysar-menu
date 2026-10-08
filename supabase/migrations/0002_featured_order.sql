-- Guest favourites are an ordered list, not just a set: the owner decides what
-- shows first on the homepage. Run once in the Supabase SQL editor.
--
-- Everything starts at 0 and falls back to display_order, so no dish moves
-- until the owner reorders the list in the admin panel.
alter table menu_items
  add column if not exists featured_order int not null default 0;
