-- Migration 12: a rider holds one delivery at a time.
--
-- Decided by the owner: a rider with an unfinished delivery gets no new offers and cannot accept
-- another. Without it a rider could grab several orders from far-apart stores and serve none of
-- them in time.
--
-- The guarantee is a unique index, not a check inside accept_delivery(): two taps at the same moment
-- (or two phones signed in as the same rider) cannot both slip through a check-then-update, because
-- the database refuses the second row itself. The function only turns that refusal into a clear
-- error code, and list_delivery_offers() hides offers the rider could not accept anyway.
--
-- "Unfinished" means the rider has the order and it has not been delivered or called off. When the
-- store cancels an order a rider is carrying, the order leaves this set and the rider is free again.

create unique index orders_one_active_delivery_per_rider
  on public.orders (rider_id)
  where rider_id is not null and status in ('accepted', 'preparing', 'ready', 'picked_up');

-- ---------------------------------------------------------------------------------------------
-- list_delivery_offers: unchanged except that a rider with an unfinished delivery gets no rows.
-- ---------------------------------------------------------------------------------------------
create or replace function public.list_delivery_offers()
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
    and not exists (
      select 1
      from public.orders mine
      where mine.rider_id = r.user_id
        and mine.status in ('accepted', 'preparing', 'ready', 'picked_up')
    )
  order by extensions.st_distance(r.location, s.location), o.created_at
  limit 50;
$$;

-- ---------------------------------------------------------------------------------------------
-- accept_delivery: unchanged except that the unique index above may refuse the claim, which is
-- reported as 'already_delivering'.
-- Errors: not_authenticated, rider_not_available (not approved / not online), delivery_unavailable
-- (already taken, cancelled, or out of range), already_delivering (the rider has an unfinished
-- delivery).
-- ---------------------------------------------------------------------------------------------
create or replace function public.accept_delivery(p_order_id bigint)
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

  begin
    update public.orders o
    set rider_id = v_user_id
    from public.stores s
    where o.id = p_order_id
      and s.id = o.store_id
      and o.rider_id is null
      and o.status in ('accepted', 'preparing', 'ready')
      and extensions.st_dwithin(s.location, v_location, v_radius_m)
    returning o.id, o.status into v_claimed, v_status;
  exception
    when unique_violation then
      raise exception 'already_delivering';
  end;

  if v_claimed is null then
    raise exception 'delivery_unavailable';
  end if;

  insert into public.order_events (order_id, event_type, status, actor_id)
  values (v_claimed, 'rider_assigned', v_status, v_user_id);
end;
$$;
