-- Al Qaysr menu database. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ admins
-- Only accounts listed here may write. Add the owner after creating their
-- user in Authentication -> Users.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from admins a where a.user_id = auth.uid()) $$;

-- -------------------------------------------------------------- restaurant
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Al Qaysr',
  tagline text,
  description text,
  established text,
  badges text[] not null default '{}',
  currency text not null default '$',
  phone text,
  whatsapp text,
  email text,
  address text,
  opening_hours text,
  maps_query text,
  maps_url text,
  instagram_url text,
  facebook_url text,
  logo_url text,
  hero_image_url text,
  hero_images text[] not null default '{}',
  menu_images jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  "group" text not null default 'Food',
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------- menu items
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  description_generated boolean not null default false,
  image_url text,
  image_shared boolean not null default false,
  is_available boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_recommended boolean not null default false,
  is_spicy boolean not null default false,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_category_idx on menu_items (category_id);

-- ------------------------------------------------------- price per menu
-- A dish can cost a different amount dine-in vs take away, so the price
-- lives on the menu row, not on the dish.
do $$ begin
  create type menu_type as enum ('TAKE_AWAY', 'TABLES');
exception when duplicate_object then null;
end $$;

create table if not exists menu_item_prices (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  menu_type menu_type not null,
  price numeric(10,2) not null check (price >= 0),
  unique (menu_item_id, menu_type)
);

create index if not exists prices_type_idx on menu_item_prices (menu_type);

-- ------------------------------------------------------------------ touch
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists categories_touch on categories;
create trigger categories_touch before update on categories
  for each row execute function touch_updated_at();
drop trigger if exists menu_items_touch on menu_items;
create trigger menu_items_touch before update on menu_items
  for each row execute function touch_updated_at();
drop trigger if exists restaurants_touch on restaurants;
create trigger restaurants_touch before update on restaurants
  for each row execute function touch_updated_at();

-- -------------------------------------------------------------------- RLS
alter table admins enable row level security;
alter table restaurants enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table menu_item_prices enable row level security;

drop policy if exists admins_read on admins;
create policy admins_read on admins for select using (is_admin());

drop policy if exists restaurant_read on restaurants;
create policy restaurant_read on restaurants for select using (true);
drop policy if exists restaurant_write on restaurants;
create policy restaurant_write on restaurants for all using (is_admin()) with check (is_admin());

drop policy if exists categories_read on categories;
create policy categories_read on categories for select using (true);
drop policy if exists categories_write on categories;
create policy categories_write on categories for all using (is_admin()) with check (is_admin());

drop policy if exists items_read on menu_items;
create policy items_read on menu_items for select using (true);
drop policy if exists items_write on menu_items;
create policy items_write on menu_items for all using (is_admin()) with check (is_admin());

drop policy if exists prices_read on menu_item_prices;
create policy prices_read on menu_item_prices for select using (true);
drop policy if exists prices_write on menu_item_prices;
create policy prices_write on menu_item_prices for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do nothing;

drop policy if exists menu_images_read on storage.objects;
create policy menu_images_read on storage.objects for select using (bucket_id = 'menu');
drop policy if exists menu_images_write on storage.objects;
create policy menu_images_write on storage.objects
  for all using (bucket_id = 'menu' and public.is_admin())
  with check (bucket_id = 'menu' and public.is_admin());
