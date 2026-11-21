-- Migration 3 of 8: customers' saved addresses and stores.
--
-- Coordinates are stored as plain latitude/longitude (easy for the app to read and write) plus a
-- generated PostGIS `location` column (what the distance queries and spatial indexes use).
-- Tip for app code: select columns explicitly instead of `*`, because `location` comes back as
-- an opaque hex string.

-- ---------------------------------------------------------------------------------------------
-- addresses: a customer's address book. Orders copy the address they use (snapshot), so editing
-- or deleting a saved address never changes an old order.
-- ---------------------------------------------------------------------------------------------
create table public.addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 40),
  -- Optional: set when this address is for someone else ("Mum's house").
  recipient_name text check (char_length(trim(recipient_name)) between 1 and 120),
  recipient_phone public.phone_number,
  address_line text not null check (char_length(trim(address_line)) between 1 and 300),
  area text check (char_length(area) <= 120),
  city text not null check (char_length(trim(city)) between 1 and 80),
  instructions text check (char_length(instructions) <= 300),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.addresses is
  'A customer''s saved delivery addresses. Orders store their own copy of the address used.';

create index addresses_user_id_idx on public.addresses (user_id);

-- At most one default address per customer...
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

-- ...and the app can simply set is_default = true on one address: this trigger clears the old one.
create function private.unset_other_default_addresses()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id and is_default and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function private.unset_other_default_addresses();

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function private.set_updated_at();

alter table public.addresses enable row level security;

revoke all on table public.addresses from anon, authenticated;
grant select, delete on public.addresses to authenticated;
-- `user_id` is not in these lists: it is filled in by the database and can never be reassigned.
grant insert (
  label, recipient_name, recipient_phone, address_line, area, city, instructions,
  latitude, longitude, is_default
) on public.addresses to authenticated;
grant update (
  label, recipient_name, recipient_phone, address_line, area, city, instructions,
  latitude, longitude, is_default
) on public.addresses to authenticated;
grant all on public.addresses to service_role;

create policy addresses_select_own on public.addresses
  for select to authenticated using (user_id = (select auth.uid()));
create policy addresses_insert_own on public.addresses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy addresses_update_own on public.addresses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy addresses_delete_own on public.addresses
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- stores: a shop that sells products. Stores sign themselves up and are visible immediately.
-- ---------------------------------------------------------------------------------------------
create table public.stores (
  id bigint generated always as identity primary key,
  -- RESTRICT: removing a user who owns a store must be a deliberate step, never a silent cascade
  -- that wipes order history.
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text check (char_length(description) <= 1000),
  phone public.phone_number,
  address_line text not null check (char_length(trim(address_line)) between 1 and 300),
  area text check (char_length(area) <= 120),
  city text not null check (char_length(trim(city)) between 1 and 80),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  -- Paths in Supabase Storage (bucket policies arrive with the store area).
  logo_url text check (char_length(logo_url) <= 500),
  cover_url text check (char_length(cover_url) <= 500),
  -- The owner's "open / closed" switch. A closed store stays visible but cannot take orders.
  is_open boolean not null default true,
  -- Only the platform owner changes this (dashboard); store owners cannot grant themselves anything.
  status public.store_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.stores is
  'A shop that sells products. Visible to all signed-in users while status = active; editable only by its owner.';

create index stores_owner_id_idx on public.stores (owner_id);
-- Powers "stores near me" and the rider offer radius.
create index stores_location_idx on public.stores using gist (location);

create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function private.set_updated_at();

alter table public.stores enable row level security;

revoke all on table public.stores from anon, authenticated;
grant select on public.stores to authenticated;
-- `owner_id` and `status` are intentionally absent: a store cannot change its owner or
-- un-suspend itself.
grant insert (
  name, description, phone, address_line, area, city, latitude, longitude, logo_url, cover_url
) on public.stores to authenticated;
grant update (
  name, description, phone, address_line, area, city, latitude, longitude, logo_url, cover_url,
  is_open
) on public.stores to authenticated;
grant all on public.stores to service_role;

create policy stores_select_visible on public.stores
  for select to authenticated
  using (status = 'active' or owner_id = (select auth.uid()));

create policy stores_insert_own on public.stores
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.has_role('store')));

create policy stores_update_own on public.stores
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
