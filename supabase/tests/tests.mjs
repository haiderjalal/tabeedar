// Behaviour and security tests for the Tabeedar migrations, run against PGlite + PostGIS.
// Each test acts as a specific role (anon / a signed-in user) exactly like the Supabase API would.
import { createDb } from './lib.mjs';

const db = await createDb({ log: false });

// ------------------------------------------------------------------ tiny test framework
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log('  ok   ' + name);
  } catch (error) {
    failed += 1;
    failures.push(name);
    console.log('  FAIL ' + name + '\n         ' + error.message);
  }
}
function section(title) {
  console.log('\n' + title);
}
function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'assertion failed');
}
function eq(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message ?? 'not equal'}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}
async function rejects(fn, fragment) {
  try {
    await fn();
  } catch (error) {
    if (!String(error.message).includes(fragment)) {
      throw new Error(`expected an error containing "${fragment}" but got "${error.message}"`);
    }
    return;
  }
  throw new Error(`expected an error containing "${fragment}" but the call succeeded`);
}

// ------------------------------------------------------------------ acting as a user
const q = async (sql, params) => (await db.query(sql, params)).rows;

async function as(userId, fn) {
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId }),
  ]);
  await db.exec('set role authenticated');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.exec("select set_config('request.jwt.claims', '', false)");
  }
}
async function asAnon(fn) {
  await db.exec('set role anon');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}
async function newUser(email, meta) {
  const rows = await q(
    'insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [email, meta === null ? null : JSON.stringify(meta)],
  );
  return rows[0].id;
}

// ------------------------------------------------------------------ fixtures
// Islamabad-ish coordinates. 0.001 degree of latitude is about 111 m.
const STORE_LAT = 33.6844;
const STORE_LON = 73.0479;
const NEAR = { lat: STORE_LAT + 0.0207, lon: STORE_LON }; // about 2.3 km from the store
const FAR_RIDER = { lat: STORE_LAT + 0.1, lon: STORE_LON }; // about 11 km from the store
const NEAR_RIDER = { lat: STORE_LAT + 0.02, lon: STORE_LON }; // about 2.2 km from the store

section('Setup');
const ids = {};
await test('sign-ups create profiles with the right role', async () => {
  ids.storeOwner = await newUser('store1@test', {
    role: 'store',
    full_name: '  Ali Traders  ',
    phone: '+923001234567',
    language: 'ur',
  });
  ids.storeOwner2 = await newUser('store2@test', { role: 'store', full_name: 'Bilal Mart' });
  ids.customer = await newUser('cust1@test', {
    role: 'customer',
    full_name: 'Sara Khan',
    phone: '03001234567',
  });
  ids.customer2 = await newUser('cust2@test', { full_name: 'Omar' });
  ids.rider = await newUser('rider1@test', {
    role: 'rider',
    full_name: 'Rider One',
    phone: '923009999999',
  });
  ids.rider2 = await newUser('rider2@test', { role: 'rider', full_name: 'Rider Two' });
  ids.riderFar = await newUser('rider3@test', { role: 'rider', full_name: 'Rider Far' });
  const profiles = await q(
    'select id, role, full_name, phone, language from public.profiles order by created_at, id',
  );
  eq(profiles.length, 7, 'profile count');
  const p = (id) => profiles.find((x) => x.id === id);
  eq(p(ids.storeOwner).role, 'store');
  eq(p(ids.storeOwner).full_name, 'Ali Traders', 'name is trimmed');
  eq(p(ids.storeOwner).language, 'ur');
  eq(p(ids.customer).role, 'customer');
  eq(p(ids.rider).role, 'rider');
});

await test('self-chosen "admin" role is ignored; bad phone and missing metadata do not break sign-up', async () => {
  const adminTry = await newUser('evil@test', { role: 'admin', phone: '12' });
  const noMeta = await newUser('nometa@test', null);
  const rows = await q('select id, role, phone from public.profiles where id in ($1, $2)', [
    adminTry,
    noMeta,
  ]);
  eq(rows.find((r) => r.id === adminTry).role, 'customer');
  eq(rows.find((r) => r.id === adminTry).phone, null, 'invalid phone dropped');
  eq(rows.find((r) => r.id === noMeta).role, 'customer');
});

// ------------------------------------------------------------------ anon
section('Anonymous (not signed in) has no access at all');
for (const table of [
  'profiles',
  'stores',
  'products',
  'categories',
  'orders',
  'order_items',
  'order_events',
  'riders',
  'addresses',
  'app_settings',
]) {
  await test(`anon cannot read ${table}`, () =>
    asAnon(() => rejects(() => q(`select * from public.${table} limit 1`), 'permission denied')));
}
await test('anon cannot call any function', () =>
  asAnon(async () => {
    await rejects(() => q('select * from public.list_delivery_offers()'), 'permission denied');
    await rejects(() => q('select public.accept_delivery(1)'), 'permission denied');
    await rejects(
      () => q('select public.update_order_status(1, $1)', ['accepted']),
      'permission denied',
    );
    await rejects(
      () => q('select * from public.quote_delivery_fee(1, 33.6, 73.0)'),
      'permission denied',
    );
  }));

// ------------------------------------------------------------------ profiles
section('Profiles');
await test('a user sees only their own profile', () =>
  as(ids.customer, async () => {
    const rows = await q('select id from public.profiles');
    eq(
      rows.map((r) => r.id),
      [ids.customer],
    );
  }));
await test('a user can edit their name, phone and language', () =>
  as(ids.customer, async () => {
    await q("update public.profiles set full_name = 'Sara K.', language = 'ur' where id = $1", [
      ids.customer,
    ]);
    const rows = await q('select full_name, language from public.profiles');
    eq(rows[0], { full_name: 'Sara K.', language: 'ur' });
  }));
await test('a user cannot change their own role', () =>
  as(ids.customer, () =>
    rejects(
      () => q("update public.profiles set role = 'store' where id = $1", [ids.customer]),
      'permission denied',
    ),
  ));
await test("a user cannot edit someone else's profile", () =>
  as(ids.customer, async () => {
    const rows = await q(
      "update public.profiles set full_name = 'hacked' where id = $1 returning id",
      [ids.customer2],
    );
    eq(rows.length, 0);
  }));
await test('profiles cannot be inserted or deleted from the app', () =>
  as(ids.customer, async () => {
    await rejects(
      () => q('insert into public.profiles (id) values (gen_random_uuid())'),
      'permission denied',
    );
    await rejects(() => q('delete from public.profiles'), 'permission denied');
  }));

// ------------------------------------------------------------------ settings
section('Settings');
await test('settings are readable but not writable', () =>
  as(ids.customer, async () => {
    const rows = await q(
      'select delivery_fee_per_km, rider_offer_radius_km from public.app_settings',
    );
    eq(rows.length, 1);
    eq(Number(rows[0].delivery_fee_per_km), 35);
    eq(Number(rows[0].rider_offer_radius_km), 5);
    await rejects(
      () => q('update public.app_settings set delivery_fee_per_km = 1'),
      'permission denied',
    );
  }));

// ------------------------------------------------------------------ stores
section('Stores');
const storeInsert = `insert into public.stores (name, address_line, city, latitude, longitude, phone)
                     values ($1, 'Shop 4, Market Road', 'Islamabad', $2, $3, '+923001112233') returning id`;
await test('a store account can create a store, and it is live immediately', async () => {
  ids.store = (
    await as(ids.storeOwner, () => q(storeInsert, ['Ali Traders', STORE_LAT, STORE_LON]))
  )[0].id;
  ids.store2 = (
    await as(ids.storeOwner2, () => q(storeInsert, ['Bilal Mart', STORE_LAT + 0.2, STORE_LON]))
  )[0].id;
  const rows = await as(ids.customer, () =>
    q('select id, status, is_open, owner_id from public.stores order by id'),
  );
  eq(rows.length, 2);
  eq(rows[0].status, 'active');
  eq(rows[0].owner_id, ids.storeOwner, 'owner is taken from the login, not from the request');
});
await test('a store account can have only one store', () =>
  as(ids.storeOwner, () =>
    rejects(() => q(storeInsert, ['A second shop', STORE_LAT, STORE_LON]), 'stores_owner_id_key'),
  ));
await test('a customer account cannot create a store', () =>
  as(ids.customer, () =>
    rejects(() => q(storeInsert, ['Fake', STORE_LAT, STORE_LON]), 'row-level security'),
  ));
await test('a store cannot set its own status or owner', () =>
  as(ids.storeOwner, async () => {
    await rejects(
      () =>
        q(
          "insert into public.stores (name, address_line, city, latitude, longitude, status) values ('x','y','z',1,1,'active')",
        ),
      'permission denied',
    );
    await rejects(
      () => q("update public.stores set status = 'active' where id = $1", [ids.store]),
      'permission denied',
    );
    await rejects(
      () => q('update public.stores set owner_id = $2 where id = $1', [ids.store, ids.storeOwner2]),
      'permission denied',
    );
  }));
await test("a store owner cannot register a store in someone else's name", () =>
  as(ids.storeOwner, () =>
    rejects(
      () =>
        q(
          "insert into public.stores (owner_id, name, address_line, city, latitude, longitude) values ($1,'x','y','z',1,1)",
          [ids.storeOwner2],
        ),
      'permission denied',
    ),
  ));
await test('an owner can toggle open/closed; other owners and customers cannot edit it', async () => {
  const mine = await as(ids.storeOwner, () =>
    q('update public.stores set is_open = false where id = $1 returning id', [ids.store]),
  );
  eq(mine.length, 1);
  await as(ids.storeOwner, () =>
    q('update public.stores set is_open = true where id = $1', [ids.store]),
  );
  const theirs = await as(ids.storeOwner2, () =>
    q("update public.stores set name = 'hijacked' where id = $1 returning id", [ids.store]),
  );
  eq(theirs.length, 0);
  const cust = await as(ids.customer, () =>
    q("update public.stores set name = 'hijacked' where id = $1 returning id", [ids.store]),
  );
  eq(cust.length, 0);
});
await test('coordinates are validated', () =>
  as(ids.storeOwner, () =>
    rejects(
      () => q('update public.stores set latitude = 95 where id = $1', [ids.store]),
      'violates check constraint',
    ),
  ));
await test('a suspended store disappears for customers but not for its owner', async () => {
  await q("update public.stores set status = 'suspended' where id = $1", [ids.store2]);
  try {
    eq(
      (await as(ids.customer, () => q('select id from public.stores'))).map((r) => r.id),
      [ids.store],
      'customer sees only the active store',
    );
    // The owner of the suspended store still sees it (plus the other, active store).
    const owner2 = (
      await as(ids.storeOwner2, () => q('select id from public.stores order by id'))
    ).map((r) => r.id);
    eq(owner2, [ids.store, ids.store2], 'owner still sees their own suspended store');
    eq(
      (
        await as(ids.customer, () =>
          q('select * from public.quote_delivery_fee($1, 33.6, 73.0)', [ids.store2]),
        )
      ).length,
      0,
      'no fee quote for a hidden store',
    );
  } finally {
    await q("update public.stores set status = 'active' where id = $1", [ids.store2]);
  }
});

// ------------------------------------------------------------------ catalog
section('Catalog');
await test('an owner builds a catalog; customers can read but not write it', async () => {
  const cat = await as(ids.storeOwner, () =>
    q(
      "insert into public.categories (store_id, name, sort_order) values ($1, 'Dairy', 1) returning id",
      [ids.store],
    ),
  );
  ids.catDairy = cat[0].id;
  const cat2 = await as(ids.storeOwner2, () =>
    q("insert into public.categories (store_id, name) values ($1, 'Snacks') returning id", [
      ids.store2,
    ]),
  );
  ids.catSnacks = cat2[0].id;
  const mk = (store, category, name, price) =>
    q(
      'insert into public.products (store_id, category_id, name, price) values ($1,$2,$3,$4) returning id',
      [store, category, name, price],
    );
  ids.milk = (await as(ids.storeOwner, () => mk(ids.store, ids.catDairy, 'Milk 1L', 280)))[0].id;
  ids.eggs = (
    await as(ids.storeOwner, () => mk(ids.store, ids.catDairy, 'Eggs (dozen)', 345.5))
  )[0].id;
  ids.bread = (await as(ids.storeOwner, () => mk(ids.store, null, 'Bread', 150)))[0].id;
  ids.chips = (await as(ids.storeOwner2, () => mk(ids.store2, ids.catSnacks, 'Chips', 60)))[0].id;
  const visible = await as(ids.customer, () => q('select id from public.products'));
  eq(visible.length, 4);
  await as(ids.customer, async () => {
    await rejects(
      () => q("insert into public.products (store_id, name, price) values ($1,'x',1)", [ids.store]),
      'row-level security',
    );
    const upd = await q('update public.products set price = 1 where id = $1 returning id', [
      ids.milk,
    ]);
    eq(upd.length, 0, 'customer update affects nothing');
    const del = await q('delete from public.products where id = $1 returning id', [ids.milk]);
    eq(del.length, 0, 'customer delete affects nothing');
  });
});
await test("another store cannot add to, edit or delete this store's catalog", () =>
  as(ids.storeOwner2, async () => {
    await rejects(
      () => q("insert into public.products (store_id, name, price) values ($1,'x',1)", [ids.store]),
      'row-level security',
    );
    await rejects(
      () => q("insert into public.categories (store_id, name) values ($1,'x')", [ids.store]),
      'row-level security',
    );
    eq(
      (await q('update public.products set price = 1 where id = $1 returning id', [ids.milk]))
        .length,
      0,
    );
    eq(
      (await q('delete from public.categories where id = $1 returning id', [ids.catDairy])).length,
      0,
    );
  }));
await test("a product cannot use another store's category", () =>
  as(ids.storeOwner, () =>
    rejects(
      () =>
        q("insert into public.products (store_id, category_id, name, price) values ($1,$2,'x',1)", [
          ids.store,
          ids.catSnacks,
        ]),
      'violates foreign key',
    ),
  ));
await test('a product cannot be moved to another store', () =>
  as(ids.storeOwner, () =>
    rejects(
      () => q('update public.products set store_id = $2 where id = $1', [ids.milk, ids.store2]),
      'permission denied',
    ),
  ));
await test('category names are unique per store, ignoring case', () =>
  as(ids.storeOwner, () =>
    rejects(
      () => q("insert into public.categories (store_id, name) values ($1, 'dairy')", [ids.store]),
      'duplicate key',
    ),
  ));
await test('negative prices are rejected', () =>
  as(ids.storeOwner, () =>
    rejects(
      () => q('update public.products set price = -1 where id = $1', [ids.milk]),
      'violates check constraint',
    ),
  ));
await test('deleting a category un-categorises its products but keeps them in the store', async () => {
  const cat = await as(ids.storeOwner, () =>
    q("insert into public.categories (store_id, name) values ($1, 'Temp') returning id", [
      ids.store,
    ]),
  );
  const prod = await as(ids.storeOwner, () =>
    q(
      "insert into public.products (store_id, category_id, name, price) values ($1,$2,'Temp item',10) returning id",
      [ids.store, cat[0].id],
    ),
  );
  await as(ids.storeOwner, () => q('delete from public.categories where id = $1', [cat[0].id]));
  const row = (
    await q('select store_id, category_id from public.products where id = $1', [prod[0].id])
  )[0];
  eq(row.category_id, null);
  eq(row.store_id, ids.store, 'store_id must survive');
  await q('delete from public.products where id = $1', [prod[0].id]);
});

// ------------------------------------------------------------------ addresses
section('Addresses');
await test('a customer manages their own addresses; the database fills in the owner and the location', async () => {
  const first = await as(ids.customer, () =>
    q(
      "insert into public.addresses (label, address_line, city, latitude, longitude, is_default) values ('Home','House 1','Islamabad',$1,$2,true) returning id, user_id, location is not null as has_location",
      [NEAR.lat, NEAR.lon],
    ),
  );
  eq(first[0].user_id, ids.customer);
  eq(first[0].has_location, true, 'generated geography column');
  ids.addrHome = first[0].id;
});
await test('marking a new address as default clears the old default', async () => {
  const second = await as(ids.customer, () =>
    q(
      "insert into public.addresses (label, address_line, city, latitude, longitude, is_default, recipient_name, recipient_phone) values ('Mum','House 9','Rawalpindi',33.6,73.0,true,'Mum','+923001234500') returning id",
      [],
    ),
  );
  const rows = await as(ids.customer, () =>
    q('select label, is_default from public.addresses order by id'),
  );
  eq(rows, [
    { label: 'Home', is_default: false },
    { label: 'Mum', is_default: true },
  ]);
  void second;
});
await test('addresses are private, and user_id cannot be set or changed', async () => {
  eq((await as(ids.customer2, () => q('select id from public.addresses'))).length, 0);
  await as(ids.customer2, () =>
    rejects(
      () =>
        q(
          "insert into public.addresses (user_id, label, address_line, city, latitude, longitude) values ($1,'x','y','z',1,1)",
          [ids.customer],
        ),
      'permission denied',
    ),
  );
  await as(ids.customer, () =>
    rejects(
      () =>
        q('update public.addresses set user_id = $2 where id = $1', [ids.addrHome, ids.customer2]),
      'permission denied',
    ),
  );
  eq((await as(ids.customer2, () => q('delete from public.addresses returning id'))).length, 0);
});

// ------------------------------------------------------------------ fee formula
section('Delivery fee formula');
await test('fee = ceil(metres x rate / 1000), no minimum', async () => {
  const fee = async (m, rate = 35) =>
    Number((await q('select private.delivery_fee_for($1, $2) as f', [m, rate]))[0].f);
  eq(await fee(0), 0, '0 m');
  eq(await fee(1), 1, '1 m rounds up to Rs 1');
  eq(await fee(2000), 70, 'exactly 2 km');
  eq(await fee(2001), 71, '2.001 km rounds up');
  eq(await fee(2300), 81, '2.3 km = 80.5 rounds up to 81');
  eq(await fee(10000, 40), 400, 'rate change');
});
await test('the checkout preview matches the stored distance rule', () =>
  as(ids.customer, async () => {
    const rows = await q('select * from public.quote_delivery_fee($1, $2, $3)', [
      ids.store,
      NEAR.lat,
      NEAR.lon,
    ]);
    eq(rows.length, 1);
    assert(
      rows[0].distance_m > 2250 && rows[0].distance_m < 2350,
      `distance ${rows[0].distance_m} m should be about 2.3 km`,
    );
    eq(Number(rows[0].delivery_fee), Math.ceil((rows[0].distance_m * 35) / 1000));
    eq(
      (await q('select * from public.quote_delivery_fee($1, 200, 73)', [ids.store])).length,
      0,
      'bad coordinates give no quote',
    );
    eq(
      (await q('select * from public.quote_delivery_fee(99999, 33, 73)')).length,
      0,
      'unknown store gives no quote',
    );
  }));

// ------------------------------------------------------------------ place_order
section('place_order');
const KEY = () => crypto.randomUUID();
const order = (overrides = {}) => ({
  store: ids.store,
  items: [
    { product_id: ids.milk, quantity: 2 },
    { product_id: ids.eggs, quantity: 1 },
  ],
  name: 'Sara Khan',
  phone: '+923001234567',
  line: 'House 1, Street 2',
  area: 'F-7',
  city: 'Islamabad',
  instructions: 'Ring the bell',
  lat: NEAR.lat,
  lon: NEAR.lon,
  notes: null,
  key: KEY(),
  ...overrides,
});
const place = (o) =>
  q('select public.place_order($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as id', [
    o.store,
    JSON.stringify(o.items),
    o.name,
    o.phone,
    o.line,
    o.area,
    o.city,
    o.instructions,
    o.lat,
    o.lon,
    o.notes,
    o.key,
  ]).then((r) => r[0].id);

let firstOrder;
await test('a customer places an order; money is calculated by the database', async () => {
  const o = order({ name: 'Mum', phone: '+923001234500', notes: 'Leave with the guard' });
  firstOrder = { ...o, id: await as(ids.customer, () => place(o)) };
  ids.order1 = firstOrder.id;
  const row = (await q('select * from public.orders where id = $1', [ids.order1]))[0];
  eq(row.status, 'placed');
  eq(row.customer_id, ids.customer);
  eq(row.store_name, 'Ali Traders');
  eq(row.recipient_name, 'Mum', 'ordering for someone else');
  eq(row.recipient_phone, '+923001234500');
  eq(Number(row.subtotal), 2 * 280 + 345.5, 'subtotal from database prices');
  eq(Number(row.delivery_fee), Math.ceil((row.distance_m * 35) / 1000), 'fee rule');
  eq(Number(row.total), Number(row.subtotal) + Number(row.delivery_fee), 'total = subtotal + fee');
  eq(Number(row.fee_per_km), 35, 'rate is recorded on the order');
  const items = await q(
    'select product_name, unit_price, quantity, line_total from public.order_items where order_id = $1 order by product_name',
    [ids.order1],
  );
  eq(items.length, 2);
  eq(
    items.map((i) => i.product_name),
    ['Eggs (dozen)', 'Milk 1L'],
  );
  eq(Number(items[1].line_total), 560);
  const events = await q(
    'select event_type, status, actor_id from public.order_events where order_id = $1',
    [ids.order1],
  );
  eq(events, [{ event_type: 'status_changed', status: 'placed', actor_id: ids.customer }]);
});
await test('placing the same checkout twice returns the same order', async () => {
  const again = await as(ids.customer, () => place(firstOrder));
  eq(again, ids.order1);
  eq(Number((await q('select count(*) as n from public.orders'))[0].n), 1, 'still one order');
  eq(
    Number((await q('select count(*) as n from public.order_items'))[0].n),
    2,
    'items not duplicated',
  );
});
await test('a retry still succeeds after the store has closed', async () => {
  await q('update public.stores set is_open = false where id = $1', [ids.store]);
  eq(await as(ids.customer, () => place(firstOrder)), ids.order1);
  await q('update public.stores set is_open = true where id = $1', [ids.store]);
});
await test('later price edits do not change an existing order', async () => {
  await as(ids.storeOwner, () =>
    q('update public.products set price = 999 where id = $1', [ids.milk]),
  );
  eq(
    Number(
      (
        await q(
          'select unit_price from public.order_items where order_id = $1 and product_name = $2',
          [ids.order1, 'Milk 1L'],
        )
      )[0].unit_price,
    ),
    280,
  );
  await as(ids.storeOwner, () =>
    q('update public.products set price = 280 where id = $1', [ids.milk]),
  );
});
await test('the same product listed twice is merged into one line', async () => {
  const o = order({
    items: [
      { product_id: ids.bread, quantity: 1 },
      { product_id: ids.bread, quantity: 2 },
    ],
  });
  const id = await as(ids.customer, () => place(o));
  const items = await q('select quantity from public.order_items where order_id = $1', [id]);
  eq(items, [{ quantity: 3 }]);
  await q("update public.orders set status = 'cancelled' where id = $1", [id]);
});
await test('an unavailable product, or one from another store, is refused', async () => {
  await as(ids.storeOwner, () =>
    q('update public.products set is_available = false where id = $1', [ids.eggs]),
  );
  await as(ids.customer, () => rejects(() => place(order()), 'product_unavailable'));
  await as(ids.storeOwner, () =>
    q('update public.products set is_available = true where id = $1', [ids.eggs]),
  );
  await as(ids.customer, () =>
    rejects(
      () => place(order({ items: [{ product_id: ids.chips, quantity: 1 }] })),
      'product_unavailable',
    ),
  );
  await as(ids.customer, () =>
    rejects(
      () => place(order({ items: [{ product_id: 424242, quantity: 1 }] })),
      'product_unavailable',
    ),
  );
});
await test('closed and suspended stores cannot take orders', async () => {
  await q('update public.stores set is_open = false where id = $1', [ids.store]);
  await as(ids.customer, () => rejects(() => place(order()), 'store_unavailable'));
  await q('update public.stores set is_open = true where id = $1', [ids.store]);
  await q("update public.stores set status = 'suspended' where id = $1", [ids.store]);
  await as(ids.customer, () => rejects(() => place(order()), 'store_unavailable'));
  await q("update public.stores set status = 'active' where id = $1", [ids.store]);
  await as(ids.customer, () => rejects(() => place(order({ store: 99999 })), 'store_unavailable'));
});
await test('malformed carts are refused', () =>
  as(ids.customer, async () => {
    for (const items of [
      [],
      [{ product_id: ids.milk, quantity: 0 }],
      [{ product_id: ids.milk, quantity: -1 }],
      [{ product_id: ids.milk, quantity: 100000 }],
      [{ quantity: 1 }],
      [5],
      'nope',
      null,
    ]) {
      await rejects(() => place(order({ items })), 'invalid_items');
    }
    await rejects(
      () =>
        place(
          order({
            items: Array.from({ length: 101 }, (_, i) => ({ product_id: i + 1, quantity: 1 })),
          }),
        ),
      'invalid_items',
    );
  }));
await test('bad coordinates and a missing idempotency key are refused', () =>
  as(ids.customer, async () => {
    await rejects(() => place(order({ lat: 120 })), 'invalid_location');
    await rejects(() => place(order({ lon: null })), 'invalid_location');
    await rejects(() => place(order({ key: null })), 'invalid_request');
  }));
await test('only customer accounts can place orders', async () => {
  await as(ids.storeOwner2, () => rejects(() => place(order()), 'not_a_customer'));
  await as(ids.rider, () => rejects(() => place(order()), 'not_a_customer'));
});
await test('no client can write orders directly', () =>
  as(ids.customer, async () => {
    await rejects(
      () =>
        q(
          "insert into public.orders (customer_id, store_id, idempotency_key, store_name, recipient_name, recipient_phone, address_line, city, latitude, longitude, subtotal, distance_m, fee_per_km, delivery_fee) values ($1,$2,gen_random_uuid(),'x','x','+923001234567','x','x',1,1,0,0,0,0)",
          [ids.customer, ids.store],
        ),
      'permission denied',
    );
    await rejects(
      () => q("update public.orders set status = 'delivered' where id = $1", [ids.order1]),
      'permission denied',
    );
    await rejects(
      () => q('update public.orders set delivery_fee = 0 where id = $1', [ids.order1]),
      'permission denied',
    );
    await rejects(() => q('delete from public.orders'), 'permission denied');
    await rejects(
      () =>
        q(
          "insert into public.order_items (order_id, product_name, unit_price, quantity) values ($1,'x',0,1)",
          [ids.order1],
        ),
      'permission denied',
    );
    await rejects(
      () =>
        q(
          "insert into public.order_events (order_id, event_type, status) values ($1,'status_changed','delivered')",
          [ids.order1],
        ),
      'permission denied',
    );
  }));

// ------------------------------------------------------------------ order visibility
section('Who can see an order');
await test('the customer and the store see it; strangers and riders do not', async () => {
  const total = Number((await q('select count(*) as n from public.orders'))[0].n);
  const idsSeen = async (uid) =>
    (await as(uid, () => q('select id from public.orders'))).map((r) => r.id);
  assert((await idsSeen(ids.customer)).includes(ids.order1), 'customer sees their order');
  eq(
    (await idsSeen(ids.customer)).length,
    total,
    'customer sees all of their own orders (they placed every order so far)',
  );
  assert((await idsSeen(ids.storeOwner)).includes(ids.order1), 'store sees the order');
  eq((await idsSeen(ids.customer2)).length, 0, 'other customer');
  eq((await idsSeen(ids.storeOwner2)).length, 0, 'other store');
  eq((await idsSeen(ids.rider)).length, 0, 'rider before accepting');
  const itemsFor = async (uid) =>
    (await as(uid, () => q('select id from public.order_items where order_id = $1', [ids.order1])))
      .length;
  eq(await itemsFor(ids.storeOwner), 2, 'items follow the order');
  eq(await itemsFor(ids.customer2), 0, 'strangers see no items');
  eq((await as(ids.customer2, () => q('select id from public.order_events'))).length, 0);
});

// ------------------------------------------------------------------ status changes
section('Status changes');
const setStatus = (id, status, note = null) =>
  q('select public.update_order_status($1, $2::public.order_status, $3)', [id, status, note]);
await test('only the right person can make each move', async () => {
  await as(ids.customer, () =>
    rejects(() => setStatus(ids.order1, 'accepted'), 'invalid_transition'),
  );
  await as(ids.customer2, () =>
    rejects(() => setStatus(ids.order1, 'cancelled'), 'order_not_found'),
  );
  await as(ids.storeOwner2, () =>
    rejects(() => setStatus(ids.order1, 'accepted'), 'order_not_found'),
  );
  await as(ids.rider, () => rejects(() => setStatus(ids.order1, 'picked_up'), 'order_not_found'));
  await as(ids.storeOwner, () =>
    rejects(() => setStatus(ids.order1, 'delivered'), 'invalid_transition'),
  );
  await as(ids.storeOwner, () =>
    rejects(() => setStatus(ids.order1, 'ready'), 'invalid_transition'),
  );
});
await test('a customer can cancel before the store responds, but not after', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.customer, () => setStatus(id, 'cancelled', 'changed my mind'));
  eq((await q('select status from public.orders where id = $1', [id]))[0].status, 'cancelled');
  await as(ids.storeOwner, () => rejects(() => setStatus(id, 'accepted'), 'invalid_transition'));
  const id2 = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id2, 'accepted'));
  await as(ids.customer, () => rejects(() => setStatus(id2, 'cancelled'), 'invalid_transition'));
  await as(ids.storeOwner, () => setStatus(id2, 'cancelled', 'out of stock'));
});
await test('a store can reject an order, and a rejected order is final', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id, 'rejected', 'we are closing'));
  await as(ids.storeOwner, () => rejects(() => setStatus(id, 'accepted'), 'invalid_transition'));
  const ev = await q(
    'select status, note from public.order_events where order_id = $1 order by id',
    [id],
  );
  eq(
    ev.map((e) => e.status),
    ['placed', 'rejected'],
  );
  eq(ev[1].note, 'we are closing');
});
await test('the store walks an order through accepted, preparing, ready; each step is logged', async () => {
  await as(ids.storeOwner, () => setStatus(ids.order1, 'accepted'));
  await as(ids.storeOwner, () => setStatus(ids.order1, 'preparing'));
  await as(ids.storeOwner, () => setStatus(ids.order1, 'ready'));
  const ev = await q(
    'select status, actor_id from public.order_events where order_id = $1 order by id',
    [ids.order1],
  );
  eq(
    ev.map((e) => e.status),
    ['placed', 'accepted', 'preparing', 'ready'],
  );
  eq(ev[1].actor_id, ids.storeOwner);
});

// ------------------------------------------------------------------ riders
section('Riders: registration and approval');
await test('a rider account can register, and starts as pending', async () => {
  await as(ids.rider, () => q('insert into public.riders (user_id) values ($1)', [ids.rider]));
  await as(ids.rider2, () => q('insert into public.riders default values'));
  await as(ids.riderFar, () =>
    q('insert into public.riders (user_id) values ($1)', [ids.riderFar]),
  );
  const rows = await q('select user_id, status, is_online from public.riders');
  eq(rows.length, 3);
  assert(
    rows.every((r) => r.status === 'pending' && r.is_online === false),
    'all pending and offline',
  );
});
await test('registration cannot be forged', async () => {
  await as(ids.customer, () =>
    rejects(
      () => q('insert into public.riders (user_id) values ($1)', [ids.customer]),
      'row-level security',
    ),
  );
  await as(ids.customer2, () =>
    rejects(
      () =>
        q("insert into public.riders (user_id, status) values ($1,'approved')", [ids.customer2]),
      'permission denied',
    ),
  );
  await as(ids.rider, () =>
    rejects(
      () => q("update public.riders set status = 'approved' where user_id = $1", [ids.rider]),
      'permission denied',
    ),
  );
  await as(ids.rider, () =>
    rejects(
      () => q('update public.riders set is_online = true where user_id = $1', [ids.rider]),
      'permission denied',
    ),
  );
});
await test('a pending rider cannot go online, see offers or accept anything', async () => {
  await as(ids.rider, async () => {
    await rejects(
      () => q('select public.set_rider_presence(true, $1, $2)', [NEAR_RIDER.lat, NEAR_RIDER.lon]),
      'rider_not_approved',
    );
    eq((await q('select * from public.list_delivery_offers()')).length, 0);
    await rejects(
      () => q('select public.accept_delivery($1)', [ids.order1]),
      'rider_not_available',
    );
  });
});

await q("update public.riders set status = 'approved' where user_id in ($1, $2, $3)", [
  ids.rider,
  ids.rider2,
  ids.riderFar,
]);

section('Riders: presence');
await test('going online needs a position; going offline keeps the last one', async () => {
  await as(ids.rider, async () => {
    await rejects(() => q('select public.set_rider_presence(true)'), 'location_required');
    await rejects(() => q('select public.set_rider_presence(true, 200, 73)'), 'invalid_location');
    await q('select public.set_rider_presence(true, $1, $2)', [NEAR_RIDER.lat, NEAR_RIDER.lon]);
    let row = (
      await q(
        'select is_online, latitude, location_updated_at is not null as stamped from public.riders',
      )
    )[0];
    eq(row.is_online, true);
    eq(row.stamped, true);
    await q('select public.set_rider_presence(false)');
    row = (await q('select is_online, latitude from public.riders'))[0];
    eq(row.is_online, false);
    eq(row.latitude, NEAR_RIDER.lat, 'last position kept');
    await q('select public.set_rider_presence(true, $1, $2)', [NEAR_RIDER.lat, NEAR_RIDER.lon]);
  });
  await as(ids.rider2, () =>
    q('select public.set_rider_presence(true, $1, $2)', [NEAR_RIDER.lat + 0.001, NEAR_RIDER.lon]),
  );
  await as(ids.riderFar, () =>
    q('select public.set_rider_presence(true, $1, $2)', [FAR_RIDER.lat, FAR_RIDER.lon]),
  );
});
await test('riders see only themselves, not each other', async () => {
  eq(
    (await as(ids.rider, () => q('select user_id from public.riders'))).map((r) => r.user_id),
    [ids.rider],
  );
});

section('Riders: offers and accepting');
await test('a nearby rider is offered the order, with a privacy-limited preview', async () => {
  const offers = await as(ids.rider, () => q('select * from public.list_delivery_offers()'));
  eq(offers.length, 1);
  const o = offers[0];
  eq(o.order_id, ids.order1);
  eq(o.store_name, 'Ali Traders');
  eq(o.dropoff_area, 'F-7');
  const columns = Object.keys(o);
  for (const secret of [
    'recipient_name',
    'recipient_phone',
    'address_line',
    'latitude',
    'longitude',
    'instructions',
    'notes',
    'customer_id',
  ]) {
    assert(!columns.includes(secret), `offer must not expose ${secret}`);
  }
  assert(
    o.rider_to_store_m > 2000 && o.rider_to_store_m < 2400,
    `rider is about 2.2 km away (${o.rider_to_store_m})`,
  );
});
await test('a rider more than 5 km away is offered nothing and cannot accept', async () => {
  await as(ids.riderFar, async () => {
    eq((await q('select * from public.list_delivery_offers()')).length, 0);
    await rejects(
      () => q('select public.accept_delivery($1)', [ids.order1]),
      'delivery_unavailable',
    );
  });
});
await test('before accepting, a rider cannot read the order, its items or the customer', () =>
  as(ids.rider, async () => {
    eq((await q('select id from public.orders')).length, 0);
    eq((await q('select id from public.order_items')).length, 0);
    eq((await q('select id from public.profiles where id = $1', [ids.customer])).length, 0);
  }));
await test('an order the store has not accepted yet is not offered and cannot be accepted', async () => {
  const id = await as(ids.customer, () => place(order()));
  eq(
    (await as(ids.rider, () => q('select order_id from public.list_delivery_offers()'))).map(
      (r) => r.order_id,
    ),
    [ids.order1],
    'only the accepted order is listed',
  );
  await as(ids.rider, () =>
    rejects(() => q('select public.accept_delivery($1)', [id]), 'delivery_unavailable'),
  );
  await as(ids.customer, () => setStatus(id, 'cancelled'));
});
await test('the first rider to accept wins; the second is told it is gone', async () => {
  await as(ids.rider, () => q('select public.accept_delivery($1)', [ids.order1]));
  const row = (
    await q('select rider_id, status from public.orders where id = $1', [ids.order1])
  )[0];
  eq(row.rider_id, ids.rider);
  eq(row.status, 'ready', 'accepting does not change the status');
  await as(ids.rider2, () =>
    rejects(() => q('select public.accept_delivery($1)', [ids.order1]), 'delivery_unavailable'),
  );
  await as(ids.rider, () =>
    rejects(() => q('select public.accept_delivery($1)', [ids.order1]), 'delivery_unavailable'),
  );
  eq(
    (await as(ids.rider2, () => q('select * from public.list_delivery_offers()'))).length,
    0,
    "gone from everyone's offers",
  );
  const ev = await q(
    "select actor_id from public.order_events where order_id = $1 and event_type = 'rider_assigned'",
    [ids.order1],
  );
  eq(ev, [{ actor_id: ids.rider }], 'exactly one rider_assigned event');
});
await test('after accepting, the rider sees the full order, items and delivery details', async () => {
  await as(ids.rider, async () => {
    const o = (
      await q('select recipient_name, recipient_phone, address_line, latitude from public.orders')
    )[0];
    eq(o.recipient_name, 'Mum');
    eq(o.recipient_phone, '+923001234500');
    eq((await q('select id from public.order_items')).length, 2);
  });
  eq(
    (await as(ids.rider2, () => q('select id from public.orders'))).length,
    0,
    'the losing rider sees nothing',
  );
});

section('People on an active order can see the rider; nobody else can');
await test("customer and store see the assigned rider's profile; strangers do not", async () => {
  const names = async (uid) =>
    (await as(uid, () => q('select full_name from public.profiles order by full_name'))).map(
      (r) => r.full_name,
    );
  assert((await names(ids.customer)).includes('Rider One'), 'customer sees rider profile');
  assert((await names(ids.storeOwner)).includes('Rider One'), 'store sees rider profile');
  assert(!(await names(ids.customer)).includes('Rider Two'), 'not other riders');
  assert(!(await names(ids.customer2)).includes('Rider One'), 'unrelated customer does not');
  const riderRows = await as(ids.customer, () => q('select user_id from public.riders'));
  eq(
    riderRows.map((r) => r.user_id),
    [ids.rider],
    'customer sees only the assigned rider row',
  );
});
await test('the rider picks up and delivers; invalid moves are refused', async () => {
  await as(ids.rider, () =>
    rejects(() => setStatus(ids.order1, 'delivered'), 'invalid_transition'),
  );
  await as(ids.customer, () =>
    rejects(() => setStatus(ids.order1, 'picked_up'), 'invalid_transition'),
  );
  await as(ids.rider, () => setStatus(ids.order1, 'picked_up'));
  await as(ids.storeOwner, () =>
    rejects(() => setStatus(ids.order1, 'cancelled'), 'invalid_transition'),
  );
  await as(ids.rider, () => setStatus(ids.order1, 'delivered'));
  const ev = await q('select status from public.order_events where order_id = $1 order by id', [
    ids.order1,
  ]);
  eq(
    ev.map((e) => e.status),
    ['placed', 'accepted', 'preparing', 'ready', 'ready', 'picked_up', 'delivered'],
  );
});
await test("once delivered, the customer can no longer see the rider's profile", async () => {
  const names = (await as(ids.customer, () => q('select full_name from public.profiles'))).map(
    (r) => r.full_name,
  );
  assert(!names.includes('Rider One'), 'rider profile hidden after delivery');
  eq((await as(ids.customer, () => q('select user_id from public.riders'))).length, 0);
});
section('Riders: one delivery at a time');
await test('a rider with an unfinished delivery gets no offers and cannot accept a second one', async () => {
  const a = await as(ids.customer, () => place(order()));
  const b = await as(ids.customer, () => place(order()));
  for (const id of [a, b]) await as(ids.storeOwner, () => setStatus(id, 'accepted'));

  await as(ids.rider, () => q('select public.accept_delivery($1)', [a]));
  await as(ids.rider, async () => {
    eq(
      (await q('select * from public.list_delivery_offers()')).length,
      0,
      'no offers while delivering',
    );
    await rejects(() => q('select public.accept_delivery($1)', [b]), 'already_delivering');
  });
  // The refused claim changed nothing, and other riders are unaffected.
  eq((await q('select rider_id from public.orders where id = $1', [b]))[0].rider_id, null);
  eq(
    (await as(ids.rider2, () => q('select order_id from public.list_delivery_offers()'))).map(
      (r) => r.order_id,
    ),
    [b],
    'another rider still sees the order',
  );

  // Every way the first delivery ends frees the rider: here, the store calls it off.
  await as(ids.storeOwner, () => setStatus(a, 'cancelled'));
  eq(
    (await as(ids.rider, () => q('select order_id from public.list_delivery_offers()'))).map(
      (r) => r.order_id,
    ),
    [b],
    'offered again once free',
  );
  await as(ids.rider, () => q('select public.accept_delivery($1)', [b]));

  // Delivering also frees the rider.
  await as(ids.storeOwner, () => setStatus(b, 'ready'));
  await as(ids.rider, () => setStatus(b, 'picked_up'));
  await as(ids.rider, () => setStatus(b, 'delivered'));
  const c = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(c, 'accepted'));
  await as(ids.rider, () => q('select public.accept_delivery($1)', [c]));
  await as(ids.storeOwner, () => setStatus(c, 'cancelled'));
});
await test('the rule is held by the database itself, whatever function asks', async () => {
  const a = await as(ids.customer, () => place(order()));
  const b = await as(ids.customer, () => place(order()));
  await q("update public.orders set rider_id = $2, status = 'accepted' where id = $1", [
    a,
    ids.rider,
  ]);
  await rejects(
    () =>
      q("update public.orders set rider_id = $2, status = 'accepted' where id = $1", [
        b,
        ids.rider,
      ]),
    'orders_one_active_delivery_per_rider',
  );
  // A finished delivery does not count, and a different rider is unaffected.
  await q("update public.orders set status = 'cancelled' where id = $1", [a]);
  await q("update public.orders set rider_id = $2, status = 'accepted' where id = $1", [
    b,
    ids.rider,
  ]);
  await q("update public.orders set status = 'cancelled' where id = $1", [b]);
});

section('Push notifications: phones');
const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const tokenRows = (token) =>
  q('select user_id, platform, language from public.push_tokens where token = $1', [token]);
await test('a person registers their phone; the same phone moves to whoever signs in next', async () => {
  await as(ids.customer, () =>
    q("select public.register_push_token($1, 'android', 'ur')", [TOKEN_A]),
  );
  eq(await tokenRows(TOKEN_A), [{ user_id: ids.customer, platform: 'android', language: 'ur' }]);
  // Registering again refreshes the row instead of adding another, and follows a language switch.
  await as(ids.customer, () =>
    q("select public.register_push_token($1, 'android', 'en')", [TOKEN_A]),
  );
  eq(await tokenRows(TOKEN_A), [{ user_id: ids.customer, platform: 'android', language: 'en' }]);
  // Someone else signs in on the same phone: the token moves, so it never serves the old person.
  await as(ids.customer2, () => q("select public.register_push_token($1, 'ios', 'en')", [TOKEN_A]));
  eq(await tokenRows(TOKEN_A), [{ user_id: ids.customer2, platform: 'ios', language: 'en' }]);
});
await test('bad tokens, platforms and callers are refused; unknown languages become English', async () => {
  await as(ids.customer, async () => {
    await rejects(() => q("select public.register_push_token('abc', 'android')"), 'invalid_token');
    await rejects(() => q("select public.register_push_token(null, 'android')"), 'invalid_token');
    await rejects(
      () => q("select public.register_push_token($1, 'web')", ['ExponentPushToken[cccccccccccc]']),
      'invalid_request',
    );
    await q("select public.register_push_token($1, 'android', 'fr')", [
      'ExponentPushToken[cccccccccccc]',
    ]);
  });
  eq((await tokenRows('ExponentPushToken[cccccccccccc]'))[0].language, 'en');
  await asAnon(() =>
    rejects(
      () => q("select public.register_push_token($1, 'android')", [TOKEN_A]),
      'permission denied',
    ),
  );
});
await test('clients cannot read or write the token table directly', () =>
  as(ids.customer, async () => {
    await rejects(() => q('select * from public.push_tokens'), 'permission denied');
    await rejects(
      () =>
        q(
          "insert into public.push_tokens (user_id, token, platform) values ($1, 'ExponentPushToken[dddddddddddd]', 'android')",
          [ids.customer],
        ),
      'permission denied',
    );
  }));
await test("unregistering removes only the caller's own token", async () => {
  await as(ids.customer, () => q('select public.unregister_push_token($1)', [TOKEN_A]));
  eq((await tokenRows(TOKEN_A)).length, 1, "someone else's token is untouched");
  await as(ids.customer2, () => q('select public.unregister_push_token($1)', [TOKEN_A]));
  eq((await tokenRows(TOKEN_A)).length, 0);
});
await test('a person keeps at most ten phones, the newest first', async () => {
  for (let i = 1; i <= 12; i += 1) {
    const token = `ExponentPushToken[phone${String(i).padStart(2, '0')}xxxxxxxx]`;
    await as(ids.storeOwner2, () => q("select public.register_push_token($1, 'android')", [token]));
  }
  const rows = await q(
    'select token from public.push_tokens where user_id = $1 order by updated_at, id',
    [ids.storeOwner2],
  );
  eq(rows.length, 10);
  assert(
    !rows.some((r) => r.token.includes('phone01') || r.token.includes('phone02')),
    'oldest two gone',
  );
  assert(
    rows.some((r) => r.token.includes('phone12')),
    'newest kept',
  );
});

section('Push notifications: who is told what');
const who = {
  [ids.storeOwner]: 'store',
  [ids.customer]: 'customer',
  [ids.rider]: 'rider',
  [ids.rider2]: 'rider2',
  [ids.riderFar]: 'riderFar',
};
// What is queued for an order, as "person:kind", sorted. Read as the database owner: clients cannot.
const told = async (orderId) =>
  (await q('select user_id, kind from public.notifications where order_id = $1', [orderId]))
    .map((r) => `${who[r.user_id] ?? r.user_id}:${r.kind}`)
    .sort();
const sorted = (...items) => items.sort();
await test('the store hears of a new order and the customer of each step that matters', async () => {
  const id = await as(ids.customer, () => place(order()));
  eq(await told(id), ['store:order_placed'], 'the store, and nobody else');

  await as(ids.storeOwner, () => setStatus(id, 'accepted'));
  const afterAccept = sorted(
    'store:order_placed',
    'customer:order_accepted',
    // Riders who are free, near the store and recently seen. The far rider is not alerted.
    'rider:delivery_available',
    'rider2:delivery_available',
  );
  eq(await told(id), afterAccept);

  await as(ids.storeOwner, () => setStatus(id, 'preparing'));
  eq(await told(id), afterAccept, 'nobody is told about "being prepared"');

  await as(ids.storeOwner, () => setStatus(id, 'ready'));
  await as(ids.rider, () => q('select public.accept_delivery($1)', [id]));
  await as(ids.rider, () => setStatus(id, 'picked_up'));
  await as(ids.rider, () => setStatus(id, 'delivered'));
  eq(
    await told(id),
    sorted(
      ...afterAccept,
      'customer:order_ready',
      'customer:order_picked_up',
      'customer:order_delivered',
    ),
    'a rider accepting is not announced; the customer hears ready, picked up and delivered',
  );
});
await test('a declined order tells the customer; cancelling your own order tells nobody', async () => {
  const declined = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(declined, 'rejected'));
  eq(await told(declined), sorted('store:order_placed', 'customer:order_rejected'));

  const own = await as(ids.customer, () => place(order()));
  await as(ids.customer, () => setStatus(own, 'cancelled'));
  eq(await told(own), ['store:order_placed'], 'the customer is not told what they did themselves');
});
await test('a store cancelling a delivery tells the customer and the rider carrying it', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id, 'accepted'));
  await as(ids.rider, () => q('select public.accept_delivery($1)', [id]));
  await as(ids.storeOwner, () => setStatus(id, 'cancelled', 'Out of stock'));
  eq(
    (await told(id)).filter((x) => x.endsWith('cancelled')),
    sorted('customer:order_cancelled', 'rider:delivery_cancelled'),
    'the rider who was not carrying it is not told',
  );
});
await test('delivery alerts go only to approved, online, free riders in range with a recent position', async () => {
  const alerted = async (orderId) =>
    (await told(orderId)).filter((x) => x.endsWith(':delivery_available'));
  const newAccepted = async () => {
    const id = await as(ids.customer, () => place(order()));
    await as(ids.storeOwner, () => setStatus(id, 'accepted'));
    return id;
  };
  const cleanUp = (id) => as(ids.storeOwner, () => setStatus(id, 'cancelled'));
  const touch = (rider, ago) =>
    q('update public.riders set location_updated_at = now() - $2::interval where user_id = $1', [
      rider,
      ago,
    ]);

  // A position older than the window (5 minutes by default) means "probably not looking".
  await touch(ids.rider2, '10 minutes');
  const stale = await newAccepted();
  eq(await alerted(stale), ['rider:delivery_available'], 'rider2 is stale, riderFar is too far');
  await cleanUp(stale);

  // The window is a setting the owner can change without a new app version.
  await q('update public.app_settings set rider_position_max_age_minutes = 30');
  try {
    const wide = await newAccepted();
    eq(await alerted(wide), sorted('rider:delivery_available', 'rider2:delivery_available'));
    await cleanUp(wide);
  } finally {
    await q('update public.app_settings set rider_position_max_age_minutes = 5');
  }
  await touch(ids.rider2, '0 minutes');

  // An offline rider is not alerted.
  await q('update public.riders set is_online = false where user_id = $1', [ids.rider2]);
  const offline = await newAccepted();
  eq(await alerted(offline), ['rider:delivery_available']);
  await cleanUp(offline);
  await q('update public.riders set is_online = true where user_id = $1', [ids.rider2]);

  // A rider already carrying a delivery is not alerted (they could not accept another anyway).
  const carried = await newAccepted();
  await as(ids.rider, () => q('select public.accept_delivery($1)', [carried]));
  const busy = await newAccepted();
  eq(await alerted(busy), ['rider2:delivery_available'], 'rider is busy');
  await cleanUp(busy);
  await cleanUp(carried);
});
await test('the same news is never queued twice for the same person and order', async () => {
  const id = await as(ids.customer, () => place(order()));
  const before = (await told(id)).length;
  await q("select private.queue_notification($1, 'order_placed', $2, 'Ali Traders')", [
    ids.storeOwner,
    id,
  ]);
  eq((await told(id)).length, before);
  await as(ids.customer, () => setStatus(id, 'cancelled'));
});
await test('a sender claims each notification once; retries are limited and sent ones are left alone', async () => {
  const id = await as(ids.customer, () => place(order()));
  const claimedIds = async () =>
    (await q('select id from public.claim_notifications(100)')).map((r) => r.id);
  const rowId = (
    await q("select id from public.notifications where order_id = $1 and kind = 'order_placed'", [
      id,
    ])
  )[0].id;
  // Drain anything left over from earlier tests so only this order's row is in play.
  await q('update public.notifications set sent_at = now() where sent_at is null and id <> $1', [
    rowId,
  ]);

  assert((await claimedIds()).includes(rowId), 'first claim gets the row');
  assert(!(await claimedIds()).includes(rowId), 'a second sender run does not get it again');
  // The lease expires after two minutes: another run may take it (second attempt, then third).
  for (const expectedAttempts of [2, 3]) {
    await q(
      "update public.notifications set claimed_at = now() - interval '5 minutes' where id = $1",
      [rowId],
    );
    assert((await claimedIds()).includes(rowId), 'taken again once the lease has expired');
    eq(
      Number(
        (await q('select attempts from public.notifications where id = $1', [rowId]))[0].attempts,
      ),
      expectedAttempts,
    );
  }
  await q(
    "update public.notifications set claimed_at = now() - interval '5 minutes' where id = $1",
    [rowId],
  );
  assert(!(await claimedIds()).includes(rowId), 'after three attempts it is left alone');

  // A row that was sent is never handed out again.
  const sent = await as(ids.customer, () => place(order()));
  const sentRow = (
    await q("select id from public.notifications where order_id = $1 and kind = 'order_placed'", [
      sent,
    ])
  )[0].id;
  await q('update public.notifications set sent_at = now() where id = $1', [sentRow]);
  assert(!(await claimedIds()).includes(sentRow), 'sent rows are not claimed');
  await as(ids.customer, () => setStatus(id, 'cancelled'));
  await as(ids.customer, () => setStatus(sent, 'cancelled'));
});
await test('only the sender (service role) can claim notifications', async () => {
  await as(ids.customer, () =>
    rejects(() => q('select * from public.claim_notifications(10)'), 'permission denied'),
  );
  await asAnon(() =>
    rejects(() => q('select * from public.claim_notifications(10)'), 'permission denied'),
  );
});
await test('the queue holds no addresses or phone numbers, and clients cannot touch it', async () => {
  const rows = await q('select params from public.notifications');
  assert(rows.length > 0, 'there is something queued');
  for (const row of rows) {
    eq(
      Object.keys(row.params).sort(),
      ['order_id', 'store_name'],
      'only the order number and store name',
    );
  }
  await as(ids.customer, async () => {
    await rejects(() => q('select * from public.notifications'), 'permission denied');
    await rejects(
      () =>
        q(
          "insert into public.notifications (user_id, kind, order_id) values ($1, 'order_placed', 1)",
          [ids.customer],
        ),
      'permission denied',
    );
  });
});

section('Settings really drive the rules');
await test('the per-km rate comes from app_settings and is recorded on the order', async () => {
  await q('update public.app_settings set delivery_fee_per_km = 40');
  try {
    const id = await as(ids.customer, () => place(order()));
    const row = (
      await q('select distance_m, fee_per_km, delivery_fee from public.orders where id = $1', [id])
    )[0];
    eq(Number(row.fee_per_km), 40);
    eq(Number(row.delivery_fee), Math.ceil((row.distance_m * 40) / 1000));
    await as(ids.customer, () => setStatus(id, 'cancelled'));
    // The preview uses the same rate.
    const quote = (
      await as(ids.customer, () =>
        q('select * from public.quote_delivery_fee($1, $2, $3)', [ids.store, NEAR.lat, NEAR.lon]),
      )
    )[0];
    eq(Number(quote.delivery_fee), Math.ceil((quote.distance_m * 40) / 1000));
  } finally {
    await q('update public.app_settings set delivery_fee_per_km = 35');
  }
});
await test('the rider offer radius comes from app_settings', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id, 'accepted'));
  try {
    eq(
      (await as(ids.rider, () => q('select order_id from public.list_delivery_offers()'))).map(
        (r) => r.order_id,
      ),
      [id],
      'within 5 km',
    );
    await q('update public.app_settings set rider_offer_radius_km = 1');
    eq(
      (await as(ids.rider, () => q('select order_id from public.list_delivery_offers()'))).length,
      0,
      'rider 2.2 km away is outside a 1 km radius',
    );
    await as(ids.rider, () =>
      rejects(() => q('select public.accept_delivery($1)', [id]), 'delivery_unavailable'),
    );
    await q('update public.app_settings set rider_offer_radius_km = 12');
    eq(
      (await as(ids.riderFar, () => q('select order_id from public.list_delivery_offers()'))).map(
        (r) => r.order_id,
      ),
      [id],
      'far rider is in range of a 12 km radius',
    );
  } finally {
    await q('update public.app_settings set rider_offer_radius_km = 5');
    await as(ids.storeOwner, () => setStatus(id, 'cancelled'));
  }
});
await test('an offline rider gets no offers', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id, 'accepted'));
  await as(ids.rider, () => q('select public.set_rider_presence(false)'));
  try {
    eq((await as(ids.rider, () => q('select * from public.list_delivery_offers()'))).length, 0);
    await as(ids.rider, () =>
      rejects(() => q('select public.accept_delivery($1)', [id]), 'rider_not_available'),
    );
  } finally {
    await as(ids.rider, () =>
      q('select public.set_rider_presence(true, $1, $2)', [NEAR_RIDER.lat, NEAR_RIDER.lon]),
    );
    await as(ids.storeOwner, () => setStatus(id, 'cancelled'));
  }
});

section('Cancelling an assigned order');
await test('a store can still cancel an assigned order before pickup, and the delivery is then closed', async () => {
  const id = await as(ids.customer, () => place(order()));
  await as(ids.storeOwner, () => setStatus(id, 'accepted'));
  await as(ids.rider, () => q('select public.accept_delivery($1)', [id]));
  await as(ids.storeOwner, () => setStatus(id, 'cancelled', 'sorry'));
  eq((await q('select status from public.orders where id = $1', [id]))[0].status, 'cancelled');
  await as(ids.rider, () =>
    rejects(() => q('select public.accept_delivery($1)', [id]), 'delivery_unavailable'),
  );
});

// ------------------------------------------------------------------ store search
section('Store search');
const search = (query = null, { limit = 20, offset = 0, lat = NEAR.lat, lon = NEAR.lon } = {}) =>
  as(ids.customer, () =>
    q('select * from public.search_stores($1, $2, $3, $4, $5)', [lat, lon, query, limit, offset]),
  );
const searchIds = async (...args) => (await search(...args)).map((r) => r.id);

await test('with no query, lists stores nearest first, with distances', async () => {
  const rows = await search();
  eq(
    rows.map((r) => r.id),
    [ids.store, ids.store2],
  );
  assert(
    rows[0].distance_m > 2250 && rows[0].distance_m < 2350,
    `near store ~2.3 km (${rows[0].distance_m})`,
  );
  assert(
    rows[1].distance_m > 19000 && rows[1].distance_m < 21000,
    `far store ~20 km (${rows[1].distance_m})`,
  );
  eq(rows[0].matching_products, null, 'no query, no matching products');
});
await test('open stores come before closed ones, even when the closed one is nearer', async () => {
  await q('update public.stores set is_open = false where id = $1', [ids.store]);
  try {
    const rows = await search();
    eq(
      rows.map((r) => r.id),
      [ids.store2, ids.store],
    );
    eq(rows[1].is_open, false, 'the closed store is still listed, and says it is closed');
  } finally {
    await q('update public.stores set is_open = true where id = $1', [ids.store]);
  }
});
await test('finds a store by its name, ignoring case', async () => {
  eq(await searchIds('ali'), [ids.store]);
  eq(await searchIds('ALI TRADERS'), [ids.store]);
  eq(await searchIds('  bilal  '), [ids.store2], 'surrounding spaces are ignored');
});
await test('finds stores by what they sell, and says which products matched', async () => {
  const rows = await search('milk');
  eq(
    rows.map((r) => r.id),
    [ids.store],
  );
  eq(rows[0].matching_products, ['Milk 1L']);
  eq(await searchIds('chips'), [ids.store2]);
});
await test('a store can match by name and by product at once; unmatched stores have no product list', async () => {
  const rows = await search('b');
  eq(
    rows.map((r) => r.id),
    [ids.store, ids.store2],
    'Ali Traders sells Bread; Bilal Mart has "b" in its name',
  );
  eq(rows[0].matching_products, ['Bread']);
  eq(rows[1].matching_products, null);
});
await test('returns nothing when nothing matches', async () => {
  eq(await searchIds('zzzz'), []);
});
await test('treats % _ and \\ as plain characters, not wildcards', async () => {
  for (const hostile of ['%', '_', '%%', 'milk%', 'm_lk', '\\', '\\%']) {
    eq(await searchIds(hostile), [], `query ${JSON.stringify(hostile)}`);
  }
});
await test('a blank query is the same as no query', async () => {
  eq((await searchIds('   ')).length, 2);
  eq((await searchIds('')).length, 2);
});
await test('suspended stores never appear, not even for a product they sell', async () => {
  await q("update public.stores set status = 'suspended' where id = $1", [ids.store]);
  try {
    eq(await searchIds(), [ids.store2]);
    eq(await searchIds('milk'), []);
    // Row-level security already hides it from customers. The function filters it too, so even the
    // suspended store's own owner (who may see it in their dashboard) does not get it in search.
    const asOwner = await as(ids.storeOwner, () =>
      q('select id from public.search_stores($1, $2)', [NEAR.lat, NEAR.lon]),
    );
    eq(
      asOwner.map((r) => r.id),
      [ids.store2],
    );
  } finally {
    await q("update public.stores set status = 'active' where id = $1", [ids.store]);
  }
});
await test('out-of-stock products still lead customers to the store', async () => {
  await q('update public.products set is_available = false where id = $1', [ids.eggs]);
  try {
    eq(await searchIds('eggs'), [ids.store]);
  } finally {
    await q('update public.products set is_available = true where id = $1', [ids.eggs]);
  }
});
await test('paging works, and the page size is kept between 1 and 50', async () => {
  eq(await searchIds(null, { limit: 1, offset: 0 }), [ids.store]);
  eq(await searchIds(null, { limit: 1, offset: 1 }), [ids.store2]);
  eq(await searchIds(null, { limit: 1, offset: 2 }), []);
  eq((await searchIds(null, { limit: 1000 })).length, 2, 'a huge limit is capped, not an error');
  eq((await searchIds(null, { limit: 0 })).length, 1, 'zero is raised to 1');
  eq((await searchIds(null, { limit: -5 })).length, 1, 'negative is raised to 1');
  eq(
    (await searchIds(null, { limit: null, offset: null })).length,
    2,
    'null falls back to defaults',
  );
  eq((await searchIds(null, { offset: -3 })).length, 2, 'negative offset is treated as 0');
});
await test('impossible coordinates return nothing', async () => {
  eq(await searchIds(null, { lat: 200 }), []);
  eq(await searchIds(null, { lon: -400 }), []);
});
await test('the trigram indexes that make product and store search fast exist', async () => {
  const rows = await q(
    "select indexname from pg_indexes where schemaname = 'public' and indexname in ('stores_name_trgm_idx', 'products_name_trgm_idx')",
  );
  eq(rows.length, 2);
});

// ------------------------------------------------------------------ pictures
section('Pictures');
const BUCKET = 'catalog-images';
const putObject = (name, bucket = BUCKET) =>
  q('insert into storage.objects (bucket_id, name) values ($1, $2) returning id', [bucket, name]);

await test('the bucket is public, capped at 2 MB, and takes only common image types', async () => {
  const [bucket] = await q(
    'select public, file_size_limit, allowed_mime_types from storage.buckets where id = $1',
    [BUCKET],
  );
  eq(bucket.public, true);
  eq(Number(bucket.file_size_limit), 2 * 1024 * 1024);
  eq([...bucket.allowed_mime_types].sort(), ['image/jpeg', 'image/png', 'image/webp']);
});

await test('only an exact stores/<id>/<file> path names a store folder', async () => {
  const idOf = async (path) =>
    (await q('select private.store_id_from_object_path($1) as id', [path]))[0].id;
  eq(await idOf('stores/12/logo-ab.jpg'), 12);
  eq(await idOf('stores/7/products/milk-1.webp'), 7);
  for (const bad of [
    'stores/0/x.jpg', // no store 0
    'stores/012/x.jpg', // leading zero
    'stores/12', // no file
    'stores/12/', // no file name
    'stores//x.jpg',
    'stores/abc/x.jpg',
    'stores/12abc/x.jpg',
    'stores/12/../13/x.jpg', // path tricks
    'stores/99999999999999999999/x.jpg', // too long to be an id
    'Stores/12/x.jpg', // wrong case
    'other/12/x.jpg',
    '12/x.jpg',
    '',
  ]) {
    eq(await idOf(bad), null, JSON.stringify(bad));
  }
});

const ownLogo = () => `stores/${ids.store}/logo-aaa.jpg`;
const ownProductPicture = () => `stores/${ids.store}/products/milk-aaa.jpg`;
const otherLogo = () => `stores/${ids.store2}/logo-bbb.jpg`;

await test('a store owner can upload into their own folder', async () => {
  await as(ids.storeOwner, async () => {
    await putObject(ownLogo());
    await putObject(ownProductPicture());
  });
  await as(ids.storeOwner2, () => putObject(otherLogo()));
  eq(Number((await q('select count(*) as n from storage.objects'))[0].n), 3);
});

await test('but not into another store, a lookalike path, or outside the stores folder', () =>
  as(ids.storeOwner, async () => {
    const refused = [
      `stores/${ids.store2}/logo-x.jpg`, // another store's folder
      `stores/${ids.store}/../${ids.store2}/logo-x.jpg`, // path trick
      `stores/999/logo-x.jpg`, // a store that does not exist
      `stores/${ids.store}x/logo-x.jpg`,
      `stores/${ids.store}`,
      `elsewhere/${ids.store}/logo-x.jpg`,
      'logo-x.jpg',
    ];
    for (const name of refused) {
      await rejects(() => putObject(name), 'row-level security');
    }
    await rejects(() => putObject(ownLogo(), 'some-other-bucket'), 'row-level security');
  }));

await test('customers, riders and anonymous users cannot upload anywhere', async () => {
  await as(ids.customer, () =>
    rejects(() => putObject(`stores/${ids.store}/logo-c.jpg`), 'row-level security'),
  );
  await as(ids.rider, () =>
    rejects(() => putObject(`stores/${ids.store}/logo-c.jpg`), 'row-level security'),
  );
  await asAnon(() =>
    rejects(() => putObject(`stores/${ids.store}/logo-c.jpg`), 'row-level security'),
  );
});

await test('an owner can replace and remove their own pictures, and nobody else can touch them', async () => {
  // Another store's owner changes and deletes nothing:
  await as(ids.storeOwner2, async () => {
    eq(
      (
        await q("update storage.objects set name = name || '.x' where name = $1 returning id", [
          ownLogo(),
        ])
      ).length,
      0,
    );
    eq(
      (await q('delete from storage.objects where name = $1 returning id', [ownLogo()])).length,
      0,
    );
  });
  // A customer neither:
  await as(ids.customer, async () => {
    eq(
      (await q('delete from storage.objects where name = $1 returning id', [ownLogo()])).length,
      0,
    );
  });
  // The owner can remove their own, but cannot move it into someone else's folder:
  await as(ids.storeOwner, async () => {
    await rejects(
      () =>
        q('update storage.objects set name = $2 where name = $1', [
          ownProductPicture(),
          `stores/${ids.store2}/stolen.jpg`,
        ]),
      'row-level security',
    );
    eq(
      (await q('delete from storage.objects where name = $1 returning id', [ownProductPicture()]))
        .length,
      1,
    );
  });
});

await test('signed-in users can see pictures in this bucket only', async () => {
  await q(
    "insert into storage.buckets (id, name, public) values ('private-docs', 'private-docs', false) on conflict do nothing",
  );
  await q("insert into storage.objects (bucket_id, name) values ('private-docs', 'secret.pdf')");
  const names = (
    await as(ids.customer, () => q('select name from storage.objects order by name'))
  ).map((r) => r.name);
  assert(names.includes(ownLogo()) && names.includes(otherLogo()), 'catalog pictures visible');
  assert(!names.includes('secret.pdf'), 'objects in other buckets stay hidden');
});

await test('a store can only point its pictures at its own folder, never at a website', async () => {
  const setLogo = (value) =>
    as(ids.storeOwner, () =>
      q('update public.stores set logo_url = $1 where id = $2 returning id', [value, ids.store]),
    );
  eq((await setLogo(ownLogo())).length, 1, 'own folder');
  eq((await setLogo(null)).length, 1, 'clearing is fine');
  for (const bad of [
    'https://evil.example/pixel.png',
    otherLogo(),
    `stores/${ids.store}/../${ids.store2}/logo-bbb.jpg`,
    `stores/${ids.store}`,
    'logo.jpg',
  ]) {
    await rejects(() => setLogo(bad), 'violates check constraint');
  }
  await as(ids.storeOwner, async () => {
    eq(
      (
        await q('update public.stores set cover_url = $1 where id = $2 returning id', [
          `stores/${ids.store}/cover-1.jpg`,
          ids.store,
        ])
      ).length,
      1,
    );
    await rejects(
      () => q('update public.stores set cover_url = $1 where id = $2', [otherLogo(), ids.store]),
      'violates check constraint',
    );
  });
});

await test('product pictures follow the same rule, using the product’s own store', () =>
  as(ids.storeOwner, async () => {
    const setPicture = (value) =>
      q('update public.products set image_url = $1 where id = $2 returning id', [value, ids.milk]);
    eq((await setPicture(ownProductPicture())).length, 1);
    eq((await setPicture(null)).length, 1);
    await rejects(() => setPicture(otherLogo()), 'violates check constraint');
    await rejects(() => setPicture('https://evil.example/pixel.png'), 'violates check constraint');
  }));

// ------------------------------------------------------------------ structural audit
section('Structural audit');
await test('every table in public has row-level security on', async () => {
  const rows = await q(
    "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity",
  );
  eq(rows, []);
});
await test('anon has no privilege on any table, and no execute on any public function', async () => {
  const tables = await q("select tablename from pg_tables where schemaname = 'public'");
  for (const t of tables) {
    const r = await q(
      "select has_table_privilege('anon', 'public.' || $1, 'select, insert, update, delete') as a",
      [t.tablename],
    );
    eq(r[0].a, false, `anon on ${t.tablename}`);
  }
  const fns = await q(
    "select p.oid::regprocedure::text as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'",
  );
  // Functions for the sender (the Edge Function, using the service role) and nobody else.
  const serviceOnly = new Set(['claim_notifications(integer)']);
  for (const f of fns) {
    const isServiceOnly = [...serviceOnly].some(
      (name) => f.sig.endsWith(`.${name}`) || f.sig === name,
    );
    const can = async (role) =>
      (await q('select has_function_privilege($1, $2, $3) as a', [role, f.sig, 'execute']))[0].a;
    eq(await can('anon'), false, `anon execute ${f.sig}`);
    eq(await can('authenticated'), !isServiceOnly, `authenticated execute ${f.sig}`);
    if (isServiceOnly) eq(await can('service_role'), true, `service_role execute ${f.sig}`);
  }
});
await test('app roles have no write access to orders, order_items, order_events, app_settings', async () => {
  for (const t of ['orders', 'order_items', 'order_events', 'app_settings']) {
    const r = await q(
      "select has_table_privilege('authenticated', 'public.' || $1, 'insert, update, delete') as a",
      [t],
    );
    eq(r[0].a, false, t);
  }
});
await test('orders are published to Realtime', async () => {
  const rows = await q(
    "select tablename from pg_publication_tables where pubname = 'supabase_realtime'",
  );
  assert(
    rows.some((r) => r.tablename === 'orders'),
    'orders in publication',
  );
});
await test('every foreign key is served by an index', async () => {
  // An index serves a foreign key when its leading columns are exactly the key's columns, in any
  // order (equality lookups on all of them use the index either way).
  const rows = await q(`
    select c.conrelid::regclass::text as tbl, c.conname
    from pg_constraint c
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and (select array_agg(k order by k) from unnest((i.indkey::int2[])[0:cardinality(c.conkey) - 1]) k)
              = (select array_agg(k order by k) from unnest(c.conkey) k)
      )`);
  eq(rows, [], 'foreign keys without a supporting index');
});

// ------------------------------------------------------------------ summary
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failed:\n - ' + failures.join('\n - '));
  process.exit(1);
}
