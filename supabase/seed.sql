-- DEVELOPMENT SEED DATA. Never run this against production.
--
-- Creates a small demo marketplace in Islamabad so the app has something to show:
-- two stores with products, one customer with an address, and one approved rider.
-- It runs automatically on `supabase db reset` (local), or paste it into the SQL editor of a
-- throwaway hosted project.
--
-- Demo logins (all share one password, set below): store.a@demo.tabeedar.test,
-- store.b@demo.tabeedar.test, customer@demo.tabeedar.test, rider@demo.tabeedar.test
--
-- NOTE: this writes into Supabase's own `auth` tables, whose layout is owned by Supabase. It follows
-- the usual seeding pattern, but if a future Supabase version changes those tables, create the demo
-- users through the sign-up screen instead and keep only the store/product part of this file.

do $seed$
declare
  c_password   constant text := 'Demo-Passw0rd!';
  c_instance   constant uuid := '00000000-0000-0000-0000-000000000000';

  v_store_a_owner uuid := 'a0000000-0000-4000-8000-000000000001';
  v_store_b_owner uuid := 'a0000000-0000-4000-8000-000000000002';
  v_customer      uuid := 'a0000000-0000-4000-8000-000000000003';
  v_rider         uuid := 'a0000000-0000-4000-8000-000000000004';

  v_store_a bigint;
  v_store_b bigint;
  v_cat     bigint;
  v_user    record;
begin
  -- ---- demo users (the profile row is created by the on_auth_user_created trigger) ----
  for v_user in
    select * from (values
      (v_store_a_owner, 'store.a@demo.tabeedar.test', '{"role":"store","full_name":"Hamza Ali","phone":"+923001000001"}'),
      (v_store_b_owner, 'store.b@demo.tabeedar.test', '{"role":"store","full_name":"Ayesha Noor","phone":"+923001000002"}'),
      (v_customer,      'customer@demo.tabeedar.test', '{"role":"customer","full_name":"Sara Khan","phone":"+923001000003"}'),
      (v_rider,         'rider@demo.tabeedar.test',    '{"role":"rider","full_name":"Usman Tariq","phone":"+923001000004"}')
    ) as t(id, email, meta)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      -- GoTrue expects empty strings here, not NULL.
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      c_instance, v_user.id, 'authenticated', 'authenticated', v_user.email,
      extensions.crypt(c_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, v_user.meta::jsonb, now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_user.id, v_user.id::text,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;

  -- ---- stores ----
  insert into public.stores (owner_id, name, description, phone, address_line, area, city, latitude, longitude)
  values (v_store_a_owner, 'Al-Fatah Fresh Mart', 'Groceries, dairy and household essentials.', '+923001000001',
          'Shop 12, F-7 Markaz', 'F-7', 'Islamabad', 33.7215, 73.0565)
  returning id into v_store_a;

  insert into public.stores (owner_id, name, description, phone, address_line, area, city, latitude, longitude)
  values (v_store_b_owner, 'Green Valley Bakery', 'Fresh bread, cakes and snacks, baked daily.', '+923001000002',
          'Plot 5, Jinnah Super Market', 'F-7', 'Islamabad', 33.7123, 73.0612)
  returning id into v_store_b;

  -- ---- Al-Fatah Fresh Mart ----
  insert into public.categories (store_id, name, sort_order) values (v_store_a, 'Dairy & Eggs', 1) returning id into v_cat;
  insert into public.products (store_id, category_id, name, description, price, sort_order) values
    (v_store_a, v_cat, 'Fresh Milk 1L', 'Full cream, pasteurised.', 290, 1),
    (v_store_a, v_cat, 'Eggs (dozen)', 'Farm eggs, medium.', 340, 2),
    (v_store_a, v_cat, 'Yogurt 1kg', 'Thick set yogurt.', 280, 3),
    (v_store_a, v_cat, 'Butter 200g', null, 520, 4);

  insert into public.categories (store_id, name, sort_order) values (v_store_a, 'Pantry', 2) returning id into v_cat;
  insert into public.products (store_id, category_id, name, description, price, sort_order) values
    (v_store_a, v_cat, 'Basmati Rice 5kg', 'Aged long-grain rice.', 2150, 1),
    (v_store_a, v_cat, 'Cooking Oil 3L', null, 2350, 2),
    (v_store_a, v_cat, 'Sugar 1kg', null, 170, 3),
    (v_store_a, v_cat, 'Tea Leaves 430g', 'Strong black tea.', 780, 4);

  insert into public.categories (store_id, name, sort_order) values (v_store_a, 'Fruit & Vegetables', 3) returning id into v_cat;
  insert into public.products (store_id, category_id, name, price, sort_order) values
    (v_store_a, v_cat, 'Tomatoes 1kg', 120, 1),
    (v_store_a, v_cat, 'Onions 1kg', 90, 2),
    (v_store_a, v_cat, 'Bananas (dozen)', 180, 3);
  -- An out-of-stock item, so the unavailable state can be seen in the app.
  insert into public.products (store_id, category_id, name, price, is_available, sort_order)
  values (v_store_a, v_cat, 'Apples 1kg', 360, false, 4);

  -- ---- Green Valley Bakery ----
  insert into public.categories (store_id, name, sort_order) values (v_store_b, 'Bread', 1) returning id into v_cat;
  insert into public.products (store_id, category_id, name, description, price, sort_order) values
    (v_store_b, v_cat, 'White Bread', 'Sliced loaf.', 150, 1),
    (v_store_b, v_cat, 'Brown Bread', 'Whole wheat loaf.', 190, 2),
    (v_store_b, v_cat, 'Burger Buns (6)', null, 220, 3);

  insert into public.categories (store_id, name, sort_order) values (v_store_b, 'Cakes & Pastries', 2) returning id into v_cat;
  insert into public.products (store_id, category_id, name, description, price, sort_order) values
    (v_store_b, v_cat, 'Chocolate Cake 1lb', 'Rich chocolate sponge.', 1450, 1),
    (v_store_b, v_cat, 'Chicken Patty', 'Hot and fresh.', 140, 2),
    (v_store_b, v_cat, 'Cream Roll', null, 120, 3);

  -- ---- customer with a saved address (G-8, a couple of km from both stores) ----
  insert into public.addresses (user_id, label, address_line, area, city, instructions, latitude, longitude, is_default)
  values (v_customer, 'Home', 'House 21, Street 4, G-8/2', 'G-8', 'Islamabad', 'Green gate, ring the bell.', 33.7080, 73.0420, true);

  -- ---- rider: approved, offline until they go online in the app ----
  insert into public.riders (user_id, status) values (v_rider, 'approved');
end
$seed$;
