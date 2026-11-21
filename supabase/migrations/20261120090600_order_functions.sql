-- Migration 7 of 8: placing orders and moving them through their lifecycle.
--
-- Why functions instead of plain inserts/updates: the app runs on the customer's phone and talks to
-- the database directly, so it cannot be trusted with prices, fees or status changes. These
-- functions recompute everything from the database and check who is asking.
--
-- Conventions used by every function below:
--  * SECURITY DEFINER lets them write to tables clients have no write access to. That also means
--    row-level security is bypassed inside them, so each one checks auth.uid() and the caller's
--    relationship to the order itself.
--  * `set search_path = ''` and fully-qualified names stop a malicious schema from hijacking them.
--  * EXECUTE is granted to signed-in users only (`anon` and PUBLIC are revoked).
--  * Failures raise a short machine-readable code (e.g. 'store_unavailable'). The app turns these
--    into translated messages; they are listed in docs/database.md.

-- ---------------------------------------------------------------------------------------------
-- Delivery fee. One formula, used by both the checkout preview and place_order, so the price the
-- customer sees is the price they pay.
--   fee = distance in km x rate per km, rounded UP to a whole rupee. No minimum.
-- Integer metres keep the arithmetic exact (2000 m x 35 / 1000 = 70, never 70.0000001).
-- ---------------------------------------------------------------------------------------------
create function private.delivery_fee_for(p_distance_m integer, p_fee_per_km numeric)
returns numeric
language sql
immutable
parallel safe
set search_path = ''
as $$
  select ceil((p_distance_m::numeric * p_fee_per_km) / 1000);
$$;

revoke all on function private.delivery_fee_for(integer, numeric) from public, anon;
grant execute on function private.delivery_fee_for(integer, numeric) to authenticated, service_role;

-- Checkout preview: distance and fee from a store to a point. Runs with the caller's rights, so it
-- only answers for stores the caller can see. Returns no row for an unknown store or bad coordinates.
create function public.quote_delivery_fee(
  p_store_id bigint,
  p_latitude double precision,
  p_longitude double precision
)
returns table (distance_m integer, delivery_fee numeric)
language sql
stable
set search_path = ''
as $$
  select
    d.distance_m,
    private.delivery_fee_for(d.distance_m, a.delivery_fee_per_km)
  from public.stores s
  cross join public.app_settings a
  cross join lateral (
    select round(extensions.st_distance(
      s.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ))::integer as distance_m
  ) d
  where s.id = p_store_id
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180;
$$;

revoke all on function public.quote_delivery_fee(bigint, double precision, double precision)
  from public, anon, authenticated, service_role;
grant execute on function public.quote_delivery_fee(bigint, double precision, double precision)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Pricing helper for place_order: turns the client's [{product_id, quantity}] into priced lines.
-- Only products that belong to the store AND are available come back, so anything missing from the
-- result is invalid. The client's own prices are never read.
-- ---------------------------------------------------------------------------------------------
create function private.price_order_lines(p_store_id bigint, p_items jsonb)
returns table (product_id bigint, product_name text, unit_price numeric, quantity integer)
language sql
stable
set search_path = ''
as $$
  select p.id, p.name, p.price, l.quantity::integer
  from (
    -- The same product listed twice becomes one line.
    select x.product_id, sum(x.quantity) as quantity
    from jsonb_to_recordset(p_items) as x(product_id bigint, quantity integer)
    group by x.product_id
  ) l
  join public.products p
    on p.id = l.product_id
   and p.store_id = p_store_id
   and p.is_available;
$$;

revoke all on function private.price_order_lines(bigint, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- place_order: the only way an order comes into existence.
--   p_items: [{ "product_id": 12, "quantity": 2 }, ...]
--   p_idempotency_key: a UUID the app creates once per checkout attempt. Calling again with the
--     same key returns the existing order instead of creating another.
-- Returns the order id. Errors: not_authenticated, not_a_customer, invalid_request, invalid_items,
-- invalid_location, store_unavailable, product_unavailable.
-- ---------------------------------------------------------------------------------------------
create function public.place_order(
  p_store_id bigint,
  p_items jsonb,
  p_recipient_name text,
  p_recipient_phone text,
  p_address_line text,
  p_area text,
  p_city text,
  p_instructions text,
  p_latitude double precision,
  p_longitude double precision,
  p_notes text,
  p_idempotency_key uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Technical guards against absurd requests, not business rules.
  c_max_lines    constant integer := 100;
  c_max_quantity constant integer := 1000;

  v_user_id     uuid := (select auth.uid());
  v_store       public.stores%rowtype;
  v_settings    public.app_settings%rowtype;
  v_lines       jsonb;
  v_requested   integer;
  v_priced      integer;
  v_subtotal    numeric(12, 2);
  v_distance_m  integer;
  v_order_id    bigint;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_idempotency_key is null then
    raise exception 'invalid_request';
  end if;

  -- A retry of an order that already went through must succeed even if the store has since
  -- closed, so this check comes before every other rule.
  select id into v_order_id
  from public.orders
  where customer_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    return v_order_id;
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id and role = 'customer') then
    raise exception 'not_a_customer';
  end if;

  if p_latitude is null or p_longitude is null
     or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'invalid_location';
  end if;

  -- Shape of the cart: a non-empty array of {product_id, quantity} objects with sane quantities.
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and c_max_lines
     or exists (select 1 from jsonb_array_elements(p_items) e where jsonb_typeof(e) <> 'object')
     or exists (
       select 1
       from jsonb_to_recordset(p_items) as x(product_id bigint, quantity integer)
       where x.product_id is null or x.quantity is null or x.quantity not between 1 and c_max_quantity
     ) then
    raise exception 'invalid_items';
  end if;

  select * into v_store
  from public.stores
  where id = p_store_id and status = 'active';
  if not found or not v_store.is_open then
    raise exception 'store_unavailable';
  end if;

  -- Price every line from the database once, then reuse that single snapshot for both the subtotal
  -- and the stored items, so a price edit mid-checkout cannot make them disagree.
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into v_lines
  from private.price_order_lines(p_store_id, p_items) l;

  select count(distinct x.product_id) into v_requested
  from jsonb_to_recordset(p_items) as x(product_id bigint, quantity integer);

  select count(*), coalesce(sum(x.unit_price * x.quantity), 0) into v_priced, v_subtotal
  from jsonb_to_recordset(v_lines)
    as x(product_id bigint, product_name text, unit_price numeric, quantity integer);

  -- Fewer priced lines than requested products means some product is unknown, belongs to another
  -- store, or is out of stock.
  if v_priced <> v_requested then
    raise exception 'product_unavailable';
  end if;

  select * into v_settings from public.app_settings;

  v_distance_m := round(extensions.st_distance(
    v_store.location,
    extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
  ))::integer;

  insert into public.orders (
    customer_id, store_id, idempotency_key, store_name,
    recipient_name, recipient_phone, address_line, area, city, instructions,
    latitude, longitude, notes,
    subtotal, distance_m, fee_per_km, delivery_fee
  )
  values (
    v_user_id, v_store.id, p_idempotency_key, v_store.name,
    trim(p_recipient_name), trim(p_recipient_phone), trim(p_address_line),
    nullif(trim(p_area), ''), trim(p_city), nullif(trim(p_instructions), ''),
    p_latitude, p_longitude, nullif(trim(p_notes), ''),
    v_subtotal, v_distance_m, v_settings.delivery_fee_per_km,
    private.delivery_fee_for(v_distance_m, v_settings.delivery_fee_per_km)
  )
  on conflict (customer_id, idempotency_key) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- Two requests with the same key raced and the other one won. Return its order.
    select id into v_order_id
    from public.orders
    where customer_id = v_user_id and idempotency_key = p_idempotency_key;
    return v_order_id;
  end if;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order_id, x.product_id, x.product_name, x.unit_price, x.quantity
  from jsonb_to_recordset(v_lines)
    as x(product_id bigint, product_name text, unit_price numeric, quantity integer);

  insert into public.order_events (order_id, event_type, status, actor_id)
  values (v_order_id, 'status_changed', 'placed', v_user_id);

  return v_order_id;
end;
$$;

revoke all on function public.place_order(
  bigint, jsonb, text, text, text, text, text, text, double precision, double precision, text, uuid
) from public, anon, authenticated, service_role;
grant execute on function public.place_order(
  bigint, jsonb, text, text, text, text, text, text, double precision, double precision, text, uuid
) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Status changes. The table below the function is the whole rulebook: who may move an order from
-- which status to which. Anything not listed is refused.
-- ---------------------------------------------------------------------------------------------
create function private.order_transition_allowed(
  p_actor text,
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_actor
    when 'store' then (p_from::text, p_to::text) in (
      ('placed', 'accepted'), ('placed', 'rejected'),
      ('accepted', 'preparing'), ('accepted', 'ready'), ('preparing', 'ready'),
      -- A store can still call an order off until the rider has the goods.
      ('accepted', 'cancelled'), ('preparing', 'cancelled'), ('ready', 'cancelled')
    )
    -- A customer can only cancel before the store has responded.
    when 'customer' then (p_from::text, p_to::text) = ('placed', 'cancelled')
    when 'rider' then (p_from::text, p_to::text) in (
      ('ready', 'picked_up'), ('picked_up', 'delivered')
    )
    else false
  end;
$$;

revoke all on function private.order_transition_allowed(text, public.order_status, public.order_status)
  from public, anon, authenticated;

-- update_order_status: the store, customer or rider on an order moves it forward.
-- Errors: not_authenticated, order_not_found (also returned to people not involved in the order,
-- so its existence is not revealed), invalid_transition.
create function public.update_order_status(
  p_order_id bigint,
  p_status public.order_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order   public.orders%rowtype;
  v_actor   text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Lock the row, but only if the caller is part of the order. Locking first and checking later
  -- would let anyone stall other people's orders. The lock also serialises this with accept_delivery.
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
    and (
      o.customer_id = v_user_id
      or o.rider_id = v_user_id
      or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = v_user_id)
    )
  for update of o;

  if not found then
    raise exception 'order_not_found';
  end if;

  v_actor := case
    when v_order.customer_id = v_user_id then 'customer'
    when v_order.rider_id = v_user_id then 'rider'
    else 'store'
  end;

  if not private.order_transition_allowed(v_actor, v_order.status, p_status) then
    raise exception 'invalid_transition';
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_events (order_id, event_type, status, actor_id, note)
  values (p_order_id, 'status_changed', p_status, v_user_id, nullif(left(trim(p_note), 500), ''));
end;
$$;

revoke all on function public.update_order_status(bigint, public.order_status, text)
  from public, anon, authenticated, service_role;
grant execute on function public.update_order_status(bigint, public.order_status, text)
  to authenticated, service_role;
