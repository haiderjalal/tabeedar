-- Migration 5 of 8: riders.
--
-- A rider signs up (role = 'rider'), registers here as 'pending', and cannot do anything until the
-- owner flips `status` to 'approved' in the dashboard. Going online and reporting position happens
-- through public.set_rider_presence() (a later migration), never by editing this table directly.

create table public.riders (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete restrict,
  status public.rider_status not null default 'pending',
  is_online boolean not null default false,
  -- Last reported position. Used to decide which deliveries this rider is offered.
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
        then extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    end
  ) stored,
  location_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An online rider always has a known position, otherwise the radius check cannot work.
  constraint riders_online_needs_location
    check (not is_online or (latitude is not null and longitude is not null))
);

comment on table public.riders is
  'Delivery riders. Start as pending; only approved riders can go online and accept deliveries.';

-- Only online riders are searched by position, so index only those rows.
create index riders_online_location_idx on public.riders using gist (location) where is_online;

create trigger riders_set_updated_at
  before update on public.riders
  for each row execute function private.set_updated_at();

alter table public.riders enable row level security;

revoke all on table public.riders from anon, authenticated;
grant select on public.riders to authenticated;
-- Registration only. `status` is absent so nobody can approve themselves, and there is no update
-- grant at all: presence goes through set_rider_presence(), which checks approval.
grant insert (user_id) on public.riders to authenticated;
grant all on public.riders to service_role;

create policy riders_select_own on public.riders
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy riders_insert_own on public.riders
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.has_role('rider')));
