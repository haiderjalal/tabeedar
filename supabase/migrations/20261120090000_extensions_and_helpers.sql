-- Migration 1 of 8: extensions, shared types and helper objects.
-- Everything else builds on these. Overview of the whole schema: docs/database.md

-- PostGIS gives us the `geography` type for the delivery-fee distance and the rider offer radius.
-- Supabase recommends keeping extensions out of `public`, so they live in `extensions`.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

-- Helper functions that must NOT be callable from the app live in `private`.
-- The Data API only exposes `public`, so nothing in here becomes an RPC endpoint.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Enumerations. Enums (rather than free text) keep status values controlled, and they show up as
-- string unions in the generated TypeScript types.
-- ---------------------------------------------------------------------------------------------

-- The three areas of the app a person can sign up for. There is deliberately no admin role:
-- admin work (approving riders, suspending stores) is done in the Supabase dashboard.
create type public.app_role as enum ('customer', 'store', 'rider');

create type public.language_code as enum ('en', 'ur');

-- 'suspended' lets the owner of the platform switch a store off without deleting its history.
create type public.store_status as enum ('active', 'suspended');

-- Riders carry customers' cash, so they start as 'pending' until approved.
create type public.rider_status as enum ('pending', 'approved', 'suspended');

-- Lifecycle of an order. Who may move an order between statuses is enforced in
-- public.update_order_status(); the app never writes this column directly.
--   placed -> accepted | rejected          (store decides)
--   accepted -> preparing -> ready         (store works on it; a rider can claim it from 'accepted')
--   ready -> picked_up -> delivered        (rider)
--   cancelled                              (customer while 'placed', store until pickup)
create type public.order_status as enum (
  'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'rejected', 'cancelled'
);

-- What happened to an order, for the timeline shown to customers and stores.
create type public.order_event_type as enum ('status_changed', 'rider_assigned');

-- Cash on delivery is the only method for now. Having the column means online payment can be
-- added later with `alter type ... add value` and no change to the orders table.
create type public.payment_method as enum ('cod');

-- ---------------------------------------------------------------------------------------------
-- Shared building blocks
-- ---------------------------------------------------------------------------------------------

-- Digits with an optional leading '+', 7 to 15 long. Deliberately country-agnostic; the app
-- normalises what the user types before it gets here.
create domain public.phone_number as text
  constraint phone_number_format check (value ~ '^\+?[0-9]{7,15}$');

-- Keeps `updated_at` honest. The database sets it so a client clock can never be trusted.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
