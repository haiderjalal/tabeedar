-- Migration 4 of 8: a store's catalog (categories and products).
--
-- Visibility rule used by both tables: you can see a store's catalog if you can see the store.
-- The policies below ask "does this store exist for me?", which reuses the stores policy
-- (active stores, or your own) instead of repeating it.

-- ---------------------------------------------------------------------------------------------
-- categories: how a store groups its products ("Dairy", "Snacks").
-- ---------------------------------------------------------------------------------------------
create table public.categories (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Target for the composite foreign key on products: a product's category must belong to the
  -- same store as the product, and the database (not app code) guarantees it.
  unique (id, store_id)
);

comment on table public.categories is 'Product groups within one store.';

-- Names are unique per store, ignoring case ("Dairy" and "dairy" are the same category).
create unique index categories_store_name_key on public.categories (store_id, lower(name));
create index categories_store_sort_idx on public.categories (store_id, sort_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select, delete on public.categories to authenticated;
grant insert (store_id, name, sort_order) on public.categories to authenticated;
grant update (name, sort_order) on public.categories to authenticated;
grant all on public.categories to service_role;

create policy categories_select_visible_store on public.categories
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = categories.store_id));

create policy categories_insert_own_store on public.categories
  for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = categories.store_id and s.owner_id = (select auth.uid())
  ));

create policy categories_update_own_store on public.categories
  for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = categories.store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = categories.store_id and s.owner_id = (select auth.uid())
  ));

create policy categories_delete_own_store on public.categories
  for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = categories.store_id and s.owner_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------------------------
-- products: items a store sells.
-- Deleting a product is a real delete: past orders keep their own copy of the name and price
-- (order_items), so history is unaffected.
-- ---------------------------------------------------------------------------------------------
create table public.products (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  category_id bigint,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text check (char_length(description) <= 1000),
  -- Pakistani rupees. numeric, never float, so money arithmetic is exact.
  price numeric(12, 2) not null check (price >= 0),
  image_url text check (char_length(image_url) <= 500),
  -- The store's "out of stock" switch. Unavailable products stay visible but cannot be ordered.
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Composite key = same-store guarantee. Deleting a category un-categorises its products
  -- (only category_id is cleared, never store_id).
  foreign key (category_id, store_id)
    references public.categories (id, store_id)
    on delete set null (category_id)
);

comment on table public.products is
  'Items sold by a store. Orders copy name and price at order time, so edits never change past orders.';

-- Serves the store page (all products of a store, grouped by category) and the composite foreign key.
create index products_store_category_idx on public.products (store_id, category_id, sort_order);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

alter table public.products enable row level security;

revoke all on table public.products from anon, authenticated;
grant select, delete on public.products to authenticated;
grant insert (
  store_id, category_id, name, description, price, image_url, is_available, sort_order
) on public.products to authenticated;
-- `store_id` is absent: a product can never be moved to another store.
grant update (
  category_id, name, description, price, image_url, is_available, sort_order
) on public.products to authenticated;
grant all on public.products to service_role;

create policy products_select_visible_store on public.products
  for select to authenticated
  using (exists (select 1 from public.stores s where s.id = products.store_id));

create policy products_insert_own_store on public.products
  for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.owner_id = (select auth.uid())
  ));

create policy products_update_own_store on public.products
  for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.owner_id = (select auth.uid())
  ));

create policy products_delete_own_store on public.products
  for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.owner_id = (select auth.uid())
  ));
