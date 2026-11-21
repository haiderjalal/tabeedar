-- Migration 2 of 8: user profiles and platform settings.

-- ---------------------------------------------------------------------------------------------
-- profiles: one row per signed-up user, created automatically (see trigger below).
-- ---------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text check (char_length(full_name) between 1 and 120),
  phone public.phone_number,
  language public.language_code not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per signed-up user. `role` picks which area of the app they land in; it is set at sign-up and cannot be changed by the user.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Creates the profile when a user signs up.
-- SECURITY: `raw_user_meta_data` is chosen by the person signing up, so it is never trusted for
-- anything privileged. Here it can only pick between the three self-service roles, and a store or
-- rider account still has no power until its own row exists (riders also need approval).
-- IMPORTANT: if this trigger raises an error, sign-up fails. So bad input is dropped, not rejected.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role     public.app_role := 'customer';
  v_language public.language_code := 'en';
  v_name     text := left(nullif(trim(v_meta ->> 'full_name'), ''), 120);
  v_phone    text := nullif(trim(v_meta ->> 'phone'), '');
begin
  if v_meta ->> 'role' in ('store', 'rider') then
    v_role := (v_meta ->> 'role')::public.app_role;
  end if;

  if v_meta ->> 'language' in ('en', 'ur') then
    v_language := (v_meta ->> 'language')::public.language_code;
  end if;

  -- Same pattern as the phone_number domain; an invalid number is ignored instead of failing sign-up.
  if v_phone is not null and v_phone !~ '^\+?[0-9]{7,15}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, role, full_name, phone, language)
  values (new.id, v_role, v_name, v_phone, v_language);

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Used by row-level security policies to ask "is the caller a store / rider / customer?".
-- Runs with the caller's rights: a user can always read their own profile row, which is enough.
create function private.has_role(p_role public.app_role)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = p_role
  );
$$;

revoke all on function private.has_role(public.app_role) from public, anon;
grant execute on function private.has_role(public.app_role) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- profiles: access rules
-- Nothing is reachable until granted. Users read their own row and may edit only the three
-- harmless columns; `role` is not editable. (Order participants can also see a rider's profile;
-- that policy is added in the orders migration because it depends on the orders table.)
-- ---------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, language) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- app_settings: the numbers the owner may want to change without shipping a new app version.
-- A single row (enforced by the boolean primary key). Edit it in the Supabase dashboard.
-- ---------------------------------------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),
  -- Rs per km of straight-line distance from the store to the delivery address.
  delivery_fee_per_km numeric(8, 2) not null default 35 check (delivery_fee_per_km >= 0),
  -- A delivery is only offered to riders within this distance of the store.
  rider_offer_radius_km numeric(6, 2) not null default 5 check (rider_offer_radius_km > 0),
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Single-row table of business settings (delivery fee per km, rider offer radius). Edited in the dashboard, read by the app.';

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function private.set_updated_at();

insert into public.app_settings default values;

alter table public.app_settings enable row level security;

revoke all on table public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

-- Signed-in users may read the settings (the checkout screen shows the per-km rate); nobody but
-- the dashboard can change them.
create policy app_settings_select_all on public.app_settings
  for select to authenticated
  using (true);
