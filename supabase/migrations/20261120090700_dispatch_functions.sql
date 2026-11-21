-- Migration 8 of 8: rider dispatch.
--
-- The flow, once a store accepts an order:
--   1. Approved, online riders within the offer radius (5 km by default) of the store see it in
--      list_delivery_offers() and get a push notification (added later).
--   2. The first rider to call accept_delivery() gets it; everyone else is told it is gone.
-- Same conventions as the previous migration (SECURITY DEFINER, empty search_path, short error codes).

-- ---------------------------------------------------------------------------------------------
-- set_rider_presence: go online/offline and report position. Also used as the periodic location
-- ping while online. Errors: not_authenticated, location_required, invalid_location,
-- rider_not_approved.
-- ---------------------------------------------------------------------------------------------
create function public.set_rider_presence(
  p_is_online boolean,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_is_online is null then
    raise exception 'invalid_request';
  end if;

  if p_is_online and (p_latitude is null or p_longitude is null) then
    raise exception 'location_required';
  end if;

  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'invalid_location';
  end if;

  -- Going offline without a position keeps the last known one.
  update public.riders
  set is_online = p_is_online,
      latitude = coalesce(p_latitude, latitude),
      longitude = coalesce(p_longitude, longitude),
      location_updated_at = case when p_latitude is null then location_updated_at else now() end
  where user_id = v_user_id
    and status = 'approved';

  if not found then
    raise exception 'rider_not_approved';
  end if;
end;
$$;

revoke all on function public.set_rider_presence(boolean, double precision, double precision)
  from public, anon, authenticated, service_role;
grant execute on function public.set_rider_presence(boolean, double precision, double precision)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- list_delivery_offers: deliveries the calling rider could accept right now.
-- PRIVACY: this deliberately returns only what a rider needs to decide: the pickup point and the
-- drop-off area. The customer's name, phone and exact address are revealed only after accepting
-- (through the orders policy). Riders who are not approved and online simply get no rows.
-- ---------------------------------------------------------------------------------------------
create function public.list_delivery_offers()
returns table (
  order_id bigint,
  status public.order_status,
  store_id bigint,
  store_name text,
  pickup_address text,
  pickup_latitude double precision,
  pickup_longitude double precision,
  dropoff_area text,
  dropoff_city text,
  rider_to_store_m integer,
  store_to_dropoff_m integer,
  delivery_fee numeric,
  total numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.status,
    s.id,
    s.name,
    s.address_line,
    s.latitude,
    s.longitude,
    o.area,
    o.city,
    round(extensions.st_distance(r.location, s.location))::integer,
    o.distance_m,
    o.delivery_fee,
    o.total,
    o.created_at
  from public.riders r
  cross join public.app_settings a
  -- Stores within the offer radius of the rider (uses the spatial index on stores).
  join public.stores s
    on extensions.st_dwithin(s.location, r.location, a.rider_offer_radius_km * 1000)
  join public.orders o
    on o.store_id = s.id
   and o.rider_id is null
   and o.status in ('accepted', 'preparing', 'ready')
  where r.user_id = (select auth.uid())
    and r.status = 'approved'
    and r.is_online
    and r.location is not null
  order by extensions.st_distance(r.location, s.location), o.created_at
  limit 50;
$$;

revoke all on function public.list_delivery_offers() from public, anon, authenticated, service_role;
grant execute on function public.list_delivery_offers() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- accept_delivery: first rider wins.
-- The whole claim is ONE update with its conditions in the WHERE clause. If two riders accept at the
-- same moment, Postgres makes the second wait for the first, then re-checks `rider_id is null`,
-- finds it taken and updates nothing. No app-side locking, no race.
-- Errors: not_authenticated, rider_not_available (not approved / not online), delivery_unavailable
-- (already taken, cancelled, or out of range).
-- ---------------------------------------------------------------------------------------------
create function public.accept_delivery(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id  uuid := (select auth.uid());
  v_location extensions.geography;
  v_radius_m double precision;
  v_status   public.order_status;
  v_claimed  bigint;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select r.location into v_location
  from public.riders r
  where r.user_id = v_user_id
    and r.status = 'approved'
    and r.is_online
    and r.location is not null;
  if v_location is null then
    raise exception 'rider_not_available';
  end if;

  select rider_offer_radius_km * 1000 into v_radius_m from public.app_settings;

  update public.orders o
  set rider_id = v_user_id
  from public.stores s
  where o.id = p_order_id
    and s.id = o.store_id
    and o.rider_id is null
    and o.status in ('accepted', 'preparing', 'ready')
    and extensions.st_dwithin(s.location, v_location, v_radius_m)
  returning o.id, o.status into v_claimed, v_status;

  if v_claimed is null then
    raise exception 'delivery_unavailable';
  end if;

  insert into public.order_events (order_id, event_type, status, actor_id)
  values (v_claimed, 'rider_assigned', v_status, v_user_id);
end;
$$;

revoke all on function public.accept_delivery(bigint) from public, anon, authenticated, service_role;
grant execute on function public.accept_delivery(bigint) to authenticated, service_role;
