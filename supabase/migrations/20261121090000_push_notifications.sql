-- Migration 13: push notifications.
--
-- Three pieces, all deciding WHO is told WHAT (the owner's rules); sending is done elsewhere:
--   1. push_tokens: which phones belong to which signed-in person, and the language each phone uses.
--   2. notifications: a queue of "tell this person about this order" rows. A trigger on order_events
--      fills it, so the rules below apply to every way an order can change, whatever the app does.
--   3. app_settings.rider_position_max_age_minutes: how fresh a rider's position must be to be alerted.
-- The Edge Function `send-push` (supabase/functions) reads the queue and sends through Expo's push
-- service. Nothing here talks to the network, so everything below is covered by the database tests.
--
-- Who is told what (decided with the owner):
--   store     new order
--   customer  accepted, declined, ready, picked up, delivered, cancelled (not for their own cancel)
--   rider     a new delivery nearby, and the store cancelling their delivery
-- Nobody is told about small steps such as "being prepared".

-- ---------------------------------------------------------------------------------------------
-- How fresh a rider's position must be for a "new delivery nearby" alert. Riders only report their
-- position while their app is open, so an old position means "probably not looking".
-- ---------------------------------------------------------------------------------------------
alter table public.app_settings
  add column rider_position_max_age_minutes integer not null default 5
    check (rider_position_max_age_minutes > 0);

-- ---------------------------------------------------------------------------------------------
-- push_tokens: one row per phone. A token is unique: if another person signs in on the same phone,
-- the token moves to them, so a phone never keeps receiving the previous person's notifications.
-- Clients have no direct access; register_push_token() and unregister_push_token() are the API.
-- ---------------------------------------------------------------------------------------------
create table public.push_tokens (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique check (token ~ '^Expo(nent)?PushToken\[[^\]]{1,200}\]$'),
  platform text not null check (platform in ('android', 'ios')),
  -- The language the phone is using right now. The person's profile language is only what they
  -- chose at sign-up, while the phone follows the language switch, so the phone is asked.
  language text not null default 'en' check (language in ('en', 'ur')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_tokens is
  'Expo push tokens of signed-in phones, with the phone''s language. Written only by register_push_token().';

create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function private.set_updated_at();

alter table public.push_tokens enable row level security;
-- No policies and no grants for clients: tokens are never read back by the app.
revoke all on table public.push_tokens from anon, authenticated;
grant all on public.push_tokens to service_role;

-- register_push_token: remember (or move to the caller) this phone's token.
-- Errors: not_authenticated, invalid_token, invalid_request.
create function public.register_push_token(
  p_token text,
  p_platform text,
  p_language text default 'en'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Technical guard: a person rarely has more than a couple of phones. Older tokens are dropped.
  c_max_tokens constant integer := 10;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[^\]]{1,200}\]$' then
    raise exception 'invalid_token';
  end if;

  if p_platform is null or p_platform not in ('android', 'ios') then
    raise exception 'invalid_request';
  end if;

  insert into public.push_tokens (user_id, token, platform, language)
  values (
    v_user_id,
    p_token,
    p_platform,
    case when p_language in ('en', 'ur') then p_language else 'en' end
  )
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        language = excluded.language;

  delete from public.push_tokens
  where user_id = v_user_id
    and id not in (
      select id from public.push_tokens
      where user_id = v_user_id
      order by updated_at desc, id desc
      limit c_max_tokens
    );
end;
$$;

revoke all on function public.register_push_token(text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.register_push_token(text, text, text)
  to authenticated, service_role;

-- unregister_push_token: stop notifying this phone for the caller (done just before sign-out).
-- Only the caller's own token can be removed.
create function public.unregister_push_token(p_token text)
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

  delete from public.push_tokens where token = p_token and user_id = v_user_id;
end;
$$;

revoke all on function public.unregister_push_token(text)
  from public, anon, authenticated, service_role;
grant execute on function public.unregister_push_token(text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- notifications: the queue. A row means "tell this person this about this order". It holds no text:
-- the sender writes the message from `kind` in the language of each of the person's phones, and
-- the order number and store name travel in `params`. It never holds an address or a phone number.
-- ---------------------------------------------------------------------------------------------
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'order_placed', 'order_accepted', 'order_rejected', 'order_ready', 'order_picked_up',
    'order_delivered', 'order_cancelled', 'delivery_available', 'delivery_cancelled'
  )),
  order_id bigint not null references public.orders (id) on delete cascade,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  -- Set by the sender once every phone has been handed to Expo (or the person has no phone).
  sent_at timestamptz,
  attempts integer not null default 0,
  -- When a sender last took this row (see claim_notifications). Stops two senders sending it twice.
  claimed_at timestamptz,
  last_error text check (char_length(last_error) <= 500),
  -- The same news is never queued twice for the same person and order.
  unique (user_id, kind, order_id)
);

comment on table public.notifications is
  'Queue of push notifications, filled by a trigger on order_events and drained by the send-push Edge Function.';

create index notifications_order_id_idx on public.notifications (order_id);
-- The sender only looks at what is still waiting.
create index notifications_pending_idx on public.notifications (id) where sent_at is null;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant all on public.notifications to service_role;

-- ---------------------------------------------------------------------------------------------
-- claim_notifications: how a sender takes work. Accepting one order alerts several riders at once,
-- so several sender runs can start together; each must get different rows. `skip locked` hands each
-- row to exactly one of them. A claim counts as an attempt (so a sender that crashes cannot make a
-- row retry forever) and expires after two minutes, when another run may take it again. After three
-- attempts a row is left alone. Only the service role (the Edge Function) may call this.
-- ---------------------------------------------------------------------------------------------
create function public.claim_notifications(p_limit integer default 50)
returns table (id bigint, user_id uuid, kind text, params jsonb, attempts integer)
language sql
set search_path = ''
as $$
  update public.notifications n
  set attempts = n.attempts + 1,
      claimed_at = now()
  where n.id in (
    select c.id
    from public.notifications c
    where c.sent_at is null
      and c.attempts < 3
      and (c.claimed_at is null or c.claimed_at < now() - interval '2 minutes')
    order by c.id
    limit greatest(1, least(coalesce(p_limit, 50), 100))
    for update skip locked
  )
  returning n.id, n.user_id, n.kind, n.params, n.attempts;
$$;

revoke all on function public.claim_notifications(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_notifications(integer) to service_role;

-- ---------------------------------------------------------------------------------------------
-- The rules. One helper queues a row; the trigger decides who gets one.
-- ---------------------------------------------------------------------------------------------
create function private.queue_notification(
  p_user_id uuid,
  p_kind text,
  p_order_id bigint,
  p_store_name text
)
returns void
language sql
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, order_id, params)
  values (
    p_user_id,
    p_kind,
    p_order_id,
    jsonb_build_object('order_id', p_order_id, 'store_name', p_store_name)
  )
  on conflict (user_id, kind, order_id) do nothing;
$$;

revoke all on function private.queue_notification(uuid, text, bigint, text) from public, anon, authenticated;

create function private.queue_order_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_store_owner uuid;
begin
  -- Only status changes tell a story. "A rider accepted" is not one of the owner's chosen events.
  if new.event_type <> 'status_changed' then
    return new;
  end if;

  select * into v_order from public.orders where id = new.order_id;
  select owner_id into v_store_owner from public.stores where id = v_order.store_id;

  -- Nobody is told about what they did themselves (a customer cancelling their own order).
  case new.status
    when 'placed' then
      if v_store_owner is distinct from new.actor_id then
        perform private.queue_notification(v_store_owner, 'order_placed', v_order.id, v_order.store_name);
      end if;

    when 'accepted' then
      if v_order.customer_id is distinct from new.actor_id then
        perform private.queue_notification(v_order.customer_id, 'order_accepted', v_order.id, v_order.store_name);
      end if;

      -- A delivery is offered to approved, online riders who are free, close enough to the store, and
      -- whose position is recent. Same range and "one at a time" rules as list_delivery_offers().
      insert into public.notifications (user_id, kind, order_id, params)
      select
        r.user_id,
        'delivery_available',
        v_order.id,
        jsonb_build_object('order_id', v_order.id, 'store_name', v_order.store_name)
      from public.stores s
      cross join public.app_settings a
      join public.riders r
        on r.status = 'approved'
       and r.is_online
       and r.location is not null
       and r.location_updated_at > now() - make_interval(mins => a.rider_position_max_age_minutes)
       and extensions.st_dwithin(s.location, r.location, a.rider_offer_radius_km * 1000)
      where s.id = v_order.store_id
        and v_order.rider_id is null
        and not exists (
          select 1
          from public.orders mine
          where mine.rider_id = r.user_id
            and mine.status in ('accepted', 'preparing', 'ready', 'picked_up')
        )
      on conflict (user_id, kind, order_id) do nothing;

    when 'rejected' then
      perform private.queue_notification(v_order.customer_id, 'order_rejected', v_order.id, v_order.store_name);

    when 'ready' then
      perform private.queue_notification(v_order.customer_id, 'order_ready', v_order.id, v_order.store_name);

    when 'picked_up' then
      perform private.queue_notification(v_order.customer_id, 'order_picked_up', v_order.id, v_order.store_name);

    when 'delivered' then
      perform private.queue_notification(v_order.customer_id, 'order_delivered', v_order.id, v_order.store_name);

    when 'cancelled' then
      if v_order.customer_id is distinct from new.actor_id then
        perform private.queue_notification(v_order.customer_id, 'order_cancelled', v_order.id, v_order.store_name);
      end if;
      if v_order.rider_id is not null then
        perform private.queue_notification(v_order.rider_id, 'delivery_cancelled', v_order.id, v_order.store_name);
      end if;

    else
      -- preparing: nobody is told.
      null;
  end case;

  return new;
end;
$$;

revoke all on function private.queue_order_notifications() from public, anon, authenticated;

create trigger order_events_queue_notifications
  after insert on public.order_events
  for each row execute function private.queue_order_notifications();
