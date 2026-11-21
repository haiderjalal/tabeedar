// Checks that supabase/seed.sql loads cleanly AND that the data it creates obeys the app's rules,
// by using it the way the app will: sign in as the seeded customer, order, and get a rider to accept.
import fs from 'node:fs';
import path from 'node:path';

import { createDb, SUPABASE_DIR } from './lib.mjs';

const db = await createDb({ log: false });
const q = async (sql, params) => (await db.query(sql, params)).rows;
const assert = (c, m) => {
  if (!c) throw new Error('FAILED: ' + m);
};
const as = async (email, fn) => {
  const [{ id }] = await q('select id from auth.users where email = $1', [email]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: id }),
  ]);
  await db.exec('set role authenticated');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
};

await db.exec(fs.readFileSync(path.join(SUPABASE_DIR, 'seed.sql'), 'utf8'));
console.log('seed.sql applied');

const counts = (
  await q(`select
  (select count(*) from auth.users) as users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.stores) as stores,
  (select count(*) from public.categories) as categories,
  (select count(*) from public.products) as products,
  (select count(*) from public.addresses) as addresses,
  (select count(*) from public.riders where status = 'approved') as riders`)
)[0];
console.log('counts:', JSON.stringify(counts));
assert(
  Number(counts.users) === 4 && Number(counts.profiles) === 4,
  'every demo user got a profile',
);
assert(Number(counts.stores) === 2, 'two stores');
assert(Number(counts.riders) === 1, 'one approved rider');

const roles = Object.fromEntries(
  (await q('select u.email, p.role from auth.users u join public.profiles p on p.id = u.id')).map(
    (r) => [r.email, r.role],
  ),
);
assert(
  roles['store.a@demo.tabeedar.test'] === 'store' &&
    roles['customer@demo.tabeedar.test'] === 'customer' &&
    roles['rider@demo.tabeedar.test'] === 'rider',
  'roles from metadata',
);

// Use the seed like the app: customer orders from store A, store accepts, rider goes online and takes it.
const [{ id: storeA }] = await q("select id from public.stores where name = 'Al-Fatah Fresh Mart'");
const [milk] = await q("select id from public.products where name = 'Fresh Milk 1L'");
const [apples] = await q("select id from public.products where name = 'Apples 1kg'");
const [addr] = await as('customer@demo.tabeedar.test', () =>
  q('select address_line, area, city, latitude, longitude from public.addresses'),
);

const place = (items) =>
  as('customer@demo.tabeedar.test', () =>
    q('select public.place_order($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as id', [
      storeA,
      JSON.stringify(items),
      'Sara Khan',
      '+923001000003',
      addr.address_line,
      addr.area,
      addr.city,
      null,
      addr.latitude,
      addr.longitude,
      null,
      crypto.randomUUID(),
    ]),
  );

let refused = false;
try {
  await place([{ product_id: apples.id, quantity: 1 }]);
} catch (e) {
  refused = String(e.message).includes('product_unavailable');
}
assert(refused, 'the out-of-stock demo item cannot be ordered');

const [{ id: orderId }] = await place([{ product_id: milk.id, quantity: 2 }]);
const order = (
  await q('select subtotal, distance_m, delivery_fee, total from public.orders where id = $1', [
    orderId,
  ])
)[0];
console.log('order:', JSON.stringify(order));
assert(Number(order.subtotal) === 580, 'subtotal 2 x 290');
assert(
  order.distance_m > 500 && order.distance_m < 5000,
  'demo address is a realistic distance from the demo store',
);
assert(
  Number(order.delivery_fee) === Math.ceil((order.distance_m * 35) / 1000),
  'fee = ceil(m x 35 / 1000)',
);

await as('store.a@demo.tabeedar.test', () =>
  q("select public.update_order_status($1, 'accepted')", [orderId]),
);
await as('rider@demo.tabeedar.test', () =>
  q('select public.set_rider_presence(true, 33.7200, 73.0560)'),
);
const offers = await as('rider@demo.tabeedar.test', () =>
  q('select order_id from public.list_delivery_offers()'),
);
assert(offers.length === 1 && offers[0].order_id === orderId, 'seeded rider is offered the order');
await as('rider@demo.tabeedar.test', () => q('select public.accept_delivery($1)', [orderId]));
const final = (
  await q('select rider_id is not null as assigned from public.orders where id = $1', [orderId])
)[0];
assert(final.assigned, 'rider accepted');

// The other demo store is also within range, and its owner sees none of store A's orders.
const bOrders = await as('store.b@demo.tabeedar.test', () => q('select id from public.orders'));
assert(bOrders.length === 0, "store B cannot see store A's orders");

console.log('seed checks passed');
