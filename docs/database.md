# Database

Supabase Postgres, defined entirely by the migrations in `supabase/migrations/`. This page explains
what is there and why. Rules that are not written down in this repo are not decided; see
[decisions.md](decisions.md) for the open items.

## How access works

The app talks straight to the database, so the database protects itself:

1. **Everything is closed by default.** Every table has Row Level Security (RLS) switched on, and
   the migrations revoke all access before granting anything back. Grants are narrow and often per
   column: a store can edit its name but not its `status`; nobody can edit `role`.
2. **Not signed in means no access.** The `anon` role has no access to any table or function. Every
   screen requires sign-in.
3. **Reads** are filtered by RLS policies: you see your own orders, a store sees its own orders, and
   so on.
4. **Writes that matter go through functions.** Orders cannot be inserted or updated by the app at
   all. `place_order`, `update_order_status`, `accept_delivery` and `set_rider_presence` recompute
   everything from the database and check who is calling. A modified app cannot change a price, a
   fee or someone else's order.
5. **Roles are chosen at sign-up and are not powers.** The profile `role` (customer, store or
   rider) only decides which part of the app a person sees. What a person can actually do comes from
   the rules above: a rider has no access until the owner approves them in the dashboard.

## Tables

```
profiles ──< addresses
   │
   ├──< stores ──< categories ──< products
   │       │                        │
   │       └──< orders >────────────┘ (via order_items, copied name + price)
   │               │
   ├──< riders ────┘ (rider_id, set when a rider accepts)
   │
   └──< orders (customer_id) ──< order_items
                          └──< order_events

app_settings  (one row: delivery fee per km, rider offer radius, how fresh a rider's position must be for alerts)

profiles ──< push_tokens          (the phones a person receives notifications on)
profiles ──< notifications >── orders   (the queue of "tell this person about this order")
```

| Table           | Purpose                                                                                                | Read by                                                | Written by                                               |
| --------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------- |
| `profiles`      | One row per user: role, name, phone, language. Created automatically at sign-up.                       | The user. People on an active order also see its rider | The user (name, phone, language only)                    |
| `app_settings`  | Fee per km (Rs 35) and rider offer radius (5 km). Single row.                                          | Any signed-in user                                     | The owner, in the dashboard                              |
| `addresses`     | A customer's saved addresses, optionally for another recipient.                                        | The customer                                           | The customer                                             |
| `stores`        | A shop, one per store account. Live at once; `status` can be set to `suspended` by the platform owner. | Anyone signed in (active stores), the owner (always)   | The store owner (not `owner_id` or `status`)             |
| `categories`    | How a store groups its products.                                                                       | Anyone who can see the store                           | The store owner                                          |
| `products`      | Items a store sells, with price and an in/out of stock switch.                                         | Anyone who can see the store                           | The store owner                                          |
| `riders`        | Rider registration, approval status, online flag and last position.                                    | The rider; people on an active order with that rider   | Registration by the rider; everything else via functions |
| `orders`        | An order with its own copy of recipient, address and money.                                            | Customer, the store owner, the assigned rider          | Functions only                                           |
| `order_items`   | Lines of an order, with the name and unit price as they were when ordered.                             | Same as the order                                      | Functions only                                           |
| `order_events`  | Append-only timeline: status changes and rider assignment, with who did it.                            | Same as the order                                      | Functions only                                           |
| `push_tokens`   | One row per signed-in phone: its Expo push token, platform and language.                               | Nobody in the app (the sender, using the service role) | `register_push_token` / `unregister_push_token` only     |
| `notifications` | Queue of notifications to send: kind, order number, store name. Holds no text and no personal details. | Nobody in the app (the sender, using the service role) | A trigger on `order_events`; the sender marks them sent  |

### Key rules in the data itself

- **Orders keep their own copy** of the delivery address, recipient, store name, item names and
  prices. Editing or deleting an address, store or product never rewrites an old order. This is also
  how ordering for someone else works: the recipient is whoever is written on the order.
- **Money** is `numeric(12,2)` in PKR. The order's `total` is a generated column
  (`subtotal + delivery_fee`), so it can never disagree with its parts.
- **One store per store account**, enforced by the unique constraint `stores_owner_id_key`
  (migration 11). See ADR 021.
- **A product's category must belong to the same store**, enforced by a composite foreign key.
  Deleting a category un-categorises its products; it never deletes them.
- **Coordinates** are stored as plain `latitude` / `longitude` plus a generated PostGIS `location`
  column. Read the plain columns in the app; `location` comes back as an opaque hex string.
- **One default address per customer**: setting `is_default = true` clears the previous default.
- **Primary keys** are `bigint` identity columns, except where a row is keyed to a sign-in
  (`profiles.id`, `riders.user_id`), which use that user's UUID. See ADR 009.
- **Timestamps** are `timestamptz`, set by the database. `updated_at` is maintained by a trigger.
- **Deleting people:** a user who owns a store, has placed orders or is a rider cannot be deleted
  (`on delete restrict`), so order history is never lost by accident.

### Indexes

Every foreign key has a supporting index (checked by the tests). Beyond that:

| Index                                                           | Serves                                              |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `stores_owner_id_key` (unique)                                  | One store per account, and finding an owner's store |
| `stores_location_idx` (GiST)                                    | "Stores near me" and the rider offer radius         |
| `riders_online_location_idx` (GiST, online only)                | Finding online riders by position                   |
| `orders_customer_created_idx`                                   | "My orders", newest first                           |
| `orders_store_created_idx`                                      | A store's order list                                |
| `orders_rider_created_idx` (partial)                            | A rider's own deliveries                            |
| `orders_one_active_delivery_per_rider` (partial unique)         | A rider holds one unfinished delivery at a time     |
| `orders_open_offers_idx` (partial)                              | Deliveries waiting for a rider. Stays tiny          |
| `categories_store_name_key` (unique)                            | Category names unique per store, ignoring case      |
| `addresses_one_default_per_user` (partial unique)               | At most one default address                         |
| `stores_name_trgm_idx`, `products_name_trgm_idx` (GIN, trigram) | Fast `ILIKE '%text%'` for store and product search  |

## Functions (the write API)

All are callable only by signed-in users (except `claim_notifications`, which only the service role
can call) and use an empty `search_path`. Seven are `SECURITY DEFINER` and check `auth.uid()` and
the caller's relationship to the data themselves; `quote_delivery_fee` and `search_stores` run with
the caller's own rights, so they only answer for stores the caller can see. They fail with a
short code (see [Error codes](#error-codes)). From the app, call them with `supabase.rpc(name, args)`;
arguments are named with a `p_` prefix.

| Function                                                                                                                                                                     | Who                    | What it does                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `place_order(p_store_id, p_items, p_recipient_name, p_recipient_phone, p_address_line, p_area, p_city, p_instructions, p_latitude, p_longitude, p_notes, p_idempotency_key)` | Customer               | Prices every line from the database, computes the delivery fee, creates the order, its items and its first event. Calling again with the same `p_idempotency_key` returns the same order.                                                                                                |
| `quote_delivery_fee(p_store_id, p_latitude, p_longitude)`                                                                                                                    | Anyone signed in       | Distance in metres and fee for the checkout preview. Same formula as `place_order`.                                                                                                                                                                                                      |
| `search_stores(p_latitude, p_longitude, p_query, p_limit, p_offset)`                                                                                                         | Anyone signed in       | Active stores near a position, open ones first, then nearest. With text, only stores whose name matches or that sell a matching product; returns up to three matching product names. The text is searched literally (`%` and `_` are not wildcards); `p_limit` is kept between 1 and 50. |
| `update_order_status(p_order_id, p_status, p_note)`                                                                                                                          | Customer, store, rider | Moves an order to a new status if that person is allowed to make that move (table below).                                                                                                                                                                                                |
| `set_rider_presence(p_is_online, p_latitude, p_longitude)`                                                                                                                   | Approved rider         | Go online or offline and report position. Also the periodic location ping.                                                                                                                                                                                                               |
| `list_delivery_offers()`                                                                                                                                                     | Online rider           | Deliveries within the offer radius of the rider; none while the rider has an unfinished delivery. Returns only the pickup point and the drop-off **area**, never the customer's name, phone or exact address.                                                                            |
| `accept_delivery(p_order_id)`                                                                                                                                                | Online rider           | First rider to call this gets the delivery. See "First rider wins" below.                                                                                                                                                                                                                |
| `register_push_token(p_token, p_platform, p_language)`                                                                                                                       | Anyone signed in       | Saves this phone's Expo token for the caller, or moves it to the caller if another person had it. A person keeps at most 10 phones.                                                                                                                                                      |
| `unregister_push_token(p_token)`                                                                                                                                             | Anyone signed in       | Removes the caller's own token (called just before sign-out).                                                                                                                                                                                                                            |
| `claim_notifications(p_limit)`                                                                                                                                               | **Service role only**  | Used by the `send-push` Edge Function. Takes waiting notifications, each to one caller only; see "Notifications" below.                                                                                                                                                                  |

`p_items` is a JSON array: `[{ "product_id": 12, "quantity": 2 }]`. Prices are never sent.

```ts
// Example (from a service, never from a screen)
const { data: orderId, error } = await supabase.rpc('place_order', {
  p_store_id: 12,
  p_items: [{ product_id: 5, quantity: 2 }],
  p_recipient_name: 'Mum',
  p_recipient_phone: '+923001234500',
  p_address_line: 'House 9, Street 2',
  p_area: 'F-7',
  p_city: 'Islamabad',
  p_instructions: null,
  p_latitude: 33.7,
  p_longitude: 73.05,
  p_notes: null,
  p_idempotency_key: checkoutAttemptId, // a UUID made once per checkout attempt
});
// error?.message is a code such as 'store_unavailable'
```

Select explicit columns instead of `*` (it keeps queries small and avoids the hex `location` column).

### Delivery fee

`fee = ceil(distance_in_metres × rate_per_km / 1000)`, where the distance is the straight line from
the store to the delivery address. Rounded up to a whole rupee, no minimum. At the current rate of
Rs 35: 2.0 km = Rs 70, 2.3 km = Rs 81. The rate used is saved on every order (`fee_per_km`) along
with the distance (`distance_m`), so any fee can be explained later.

### One delivery at a time

A rider with an unfinished delivery (`accepted`, `preparing`, `ready` or `picked_up`) is shown no
offers and cannot accept another (ADR 026). The guarantee is the partial unique index
`orders_one_active_delivery_per_rider`: even two taps at the same instant cannot both succeed,
because the database refuses the second row. `accept_delivery` turns that refusal into
`already_delivering`. Delivering the order, or the store cancelling it, ends the delivery and frees
the rider.

### First rider wins

`accept_delivery` is a single `update` whose `where` clause requires the order to still have no
rider, to be in an acceptable status, and to be within range. If two riders accept at the same
moment, Postgres makes the second wait for the first and then re-checks the clause: it finds the
order taken and updates nothing, so that rider gets `delivery_unavailable`. There is no app-side
locking to get wrong.

## Order lifecycle

```
placed ──> accepted ──> preparing ──> ready ──> picked_up ──> delivered
   │          │             │           │
   │          └─────────────┴───────────┴──> cancelled   (store, until pickup)
   ├──> rejected   (store)
   └──> cancelled  (customer, only while placed)
```

A rider is offered the order from `accepted` onwards (so they can head to the store while it is
being prepared) but can only pick up once the store marks it `ready`. Rider assignment is not a
status: it is the `rider_id` column plus a `rider_assigned` event.

| From                             | To                     | Who      |
| -------------------------------- | ---------------------- | -------- |
| `placed`                         | `accepted`, `rejected` | Store    |
| `placed`                         | `cancelled`            | Customer |
| `accepted`                       | `preparing`, `ready`   | Store    |
| `preparing`                      | `ready`                | Store    |
| `accepted`, `preparing`, `ready` | `cancelled`            | Store    |
| `ready`                          | `picked_up`            | Rider    |
| `picked_up`                      | `delivered`            | Rider    |

Anything not in the table is refused with `invalid_transition`. `rejected`, `cancelled` and
`delivered` are final.

## Error codes

Functions raise these as the error message. The app maps each to a translated sentence and shows a
generic message for anything else.

| Code                   | Meaning                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `not_authenticated`    | Not signed in                                                                         |
| `invalid_request`      | A required argument is missing                                                        |
| `invalid_items`        | Cart is empty, malformed, too large, or has a bad quantity                            |
| `invalid_location`     | Latitude or longitude missing or out of range                                         |
| `invalid_token`        | The push token is missing or not an Expo push token                                   |
| `not_a_customer`       | Only customer accounts can place orders                                               |
| `store_unavailable`    | Store does not exist, is suspended, or is closed                                      |
| `product_unavailable`  | A product is unknown, from another store, or out of stock                             |
| `order_not_found`      | No such order, or you are not part of it (deliberately indistinguishable)             |
| `invalid_transition`   | You may not move the order to that status from where it is                            |
| `location_required`    | A rider cannot go online without a position                                           |
| `rider_not_approved`   | The rider account is not approved yet                                                 |
| `rider_not_available`  | The rider is not approved and online                                                  |
| `delivery_unavailable` | Already taken by another rider, cancelled, not accepted by the store, or out of range |
| `already_delivering`   | The rider already has an unfinished delivery (one at a time, migration 12)            |
| `rider_not_approved`   | Going online or reporting position before the owner has approved the rider            |
| `location_required`    | Going online without a position                                                       |

## Setting up a Supabase project

The Supabase CLI is not a project dependency; run it with `npx`. These commands are for CLI v3
(`supabase db push` is local by default, so `--remote` is required for a hosted project).

```bash
npx supabase login
npx supabase link <project-ref>
npx supabase db push --remote --dry-run   # shows what would run
npx supabase db push --remote             # asks for confirmation, then applies
```

Then generate the TypeScript types, from Git Bash or `cmd` (Windows PowerShell 5 would save the file
in the wrong encoding):

```bash
npx supabase gen types --lang typescript --remote > src/lib/supabase/database.types.ts
```

`supabase/seed.sql` is demo data for a **development** project only (two stores, products, a
customer, an approved rider). Paste it into the SQL editor of a throwaway project, or let
`supabase db reset` run it locally. Never run it in production. Its logins share one demo password,
written at the top of the file.

Two dashboard settings to decide before launch (Phase 2): whether sign-up requires email
confirmation, and the project's Data API settings (the migrations grant access explicitly, so they
work either way).

## Notifications

Who is told what is decided here, in the database, and applies to every way an order can change
(ADR 029 and 030). A trigger on `order_events` writes rows into `notifications`; the Edge Function
`send-push` delivers them.

| When (status of the new event) | Who is told                                                          | Message kind                     |
| ------------------------------ | -------------------------------------------------------------------- | -------------------------------- |
| `placed`                       | The store's owner                                                    | `order_placed`                   |
| `accepted`                     | The customer                                                         | `order_accepted`                 |
| `accepted`                     | Each rider who is approved, online, free, in range and seen recently | `delivery_available`             |
| `rejected`                     | The customer                                                         | `order_rejected`                 |
| `ready`, `picked_up`           | The customer                                                         | `order_ready`, `order_picked_up` |
| `delivered`                    | The customer                                                         | `order_delivered`                |
| `cancelled`                    | The customer (unless they cancelled it themselves)                   | `order_cancelled`                |
| `cancelled`, a rider has it    | That rider                                                           | `delivery_cancelled`             |
| `preparing`, rider accepted    | Nobody                                                               |                                  |

- **Recently seen** means the rider's last position is younger than `app_settings.rider_position_max_age_minutes`
  (5 by default). **Free** and **in range** are the same rules as `list_delivery_offers`.
- **Nobody is told what they did themselves**, and the same news is never queued twice for the same
  person and order (a unique constraint).
- **The queue holds no text.** The sender writes the words from `kind` in the language each phone
  reports (`push_tokens.language`); `params` holds only the order number and the store's name.
- **Claiming.** `claim_notifications` takes up to 100 waiting rows with `for update skip locked`, so two
  senders at once get different rows. A claim counts as an attempt and lasts two minutes; after three
  attempts a row is left alone (`last_error` says why). Clients cannot call it, read the queue or the
  token table: only the service role can.
- **Realtime.** `orders` is in the `supabase_realtime` publication (migration 6), so the app hears about
  changes to orders it may read (row-level security applies to these events too).

### Setting up sending (steps only you can do)

1. **EAS project.** Run `npx eas init`. It writes `extra.eas.projectId` into `app.json`; the app needs it to
   get a push token and skips push registration (with a log line) until it is there.
2. **A development build.** Expo Go cannot receive remote notifications on Android. Build one with
   `npx eas build --profile development --platform android` (iPhone needs an Apple developer account;
   EAS creates the push key). For iPhone release builds set `mode` to `production` on the
   `expo-notifications` plugin in `app.json`.
3. **Deploy the function.** With the Supabase CLI linked to the project:
   `supabase secrets set PUSH_WEBHOOK_SECRET=<a long random string>` (optionally also
   `EXPO_ACCESS_TOKEN=<token>` if "enhanced security" is switched on at expo.dev), then
   `supabase functions deploy send-push --no-verify-jwt`. The function refuses any call that does not
   carry the secret, so switching the platform's own check off is safe; without the secret set it
   refuses everything.
4. **The webhook.** In the dashboard open Database, Webhooks, create one on table `public.notifications`,
   event `Insert`, type `Supabase Edge Functions`, function `send-push`, method `POST`, and add the HTTP
   header `x-webhook-secret` with the same secret. (The body is ignored; the call only means "something
   is waiting".) If a call is ever missed, the next one also sends what was left behind.
5. **Check it.** Sign in on a phone with the development build, accept the permission, place an order
   from another account and watch the store's phone. `select * from notifications order by id desc`
   shows `sent_at`, `attempts` and `last_error` for each row.

## Pictures (Storage)

Migration 10 creates one **public** bucket, `catalog-images` (2 MB limit; JPEG, PNG and WebP only).
Anyone with a picture's address can load it, which is what makes pictures cheap to show and to cache;
nothing private belongs in this bucket.

- **Where files go:** `stores/<store id>/<logo|cover|product>/<uuid>.jpg`. The app builds the path
  and stores it (not a full address) in `stores.logo_url`, `stores.cover_url` or `products.image_url`.
  The address is made from the project URL at display time.
- **Who may write:** only the owner of the store whose id is in the path. The Storage policies on
  `storage.objects` (insert, update, delete) call `private.store_id_from_object_path(name)` and check
  that the store belongs to `auth.uid()`. Reading is allowed to any signed-in user; public addresses
  need no sign-in at all.
- **What a column may hold:** check constraints (`stores_logo_path_check`, `stores_cover_path_check`,
  `products_image_path_check`) accept only a path inside the row's own store folder, so a store cannot
  point its product at another store's file or at a path containing `..`.
- **Policy trap, already handled:** inside the policy's subquery on `stores`, a bare `name` means the
  store's name, not the file's. The policy uses `objects.name`; a test fails if it is ever changed.
- **Not covered by the tests:** the real Storage service (see below). The tests use a small stand-in
  for the `storage` schema that has the columns the policies use.

## Tests

`npm run test:db` applies every migration and the seed to an in-memory Postgres with PostGIS
(PGlite) and checks 115 behaviours: the access rules for every table, that each cheating attempt is
refused, pricing and the fee formula, idempotent ordering, every status move, rider privacy,
first-rider-wins, one delivery at a time, store search, one store per account, who may write which
picture, and who is notified of what (including rider range, freshness and busy riders) and how the
sender claims its work. No Docker is needed. The first time, run
`npm --prefix supabase/tests install`.

What it cannot cover, because it is not a full Supabase stack:

- **Real concurrency.** It runs one connection, so "two riders accept at the same instant" is tested
  as "second accept after the first". The guarantee itself comes from Postgres, as described above.
- **Supabase's own services:** the real `auth` schema, the REST layer (PostgREST) and Realtime. The
  tests use a stand-in `auth` schema that copies the parts the migrations rely on.
- **PostGIS differences.** PGlite's PostGIS build is marked experimental.

Re-run the tests whenever a migration changes. After applying migrations to a real project, run
Supabase's security and performance advisors in the dashboard.

### Advisor notes you should expect

- _"Security definer function executable by signed-in users"_ for the seven definer functions above
  (all except `quote_delivery_fee`, `search_stores` and `claim_notifications`). This is intended:
  they are the app's write API. Each one checks `auth.uid()` and the caller's relationship to the data, and `anon` cannot
  execute any of them.
- _"Policy always true"_ on `app_settings`. Intended: it is a read-only settings row that every
  signed-in user may read.

## Not built yet (planned)

- Live rider tracking for customers. Position is currently the single "last known" value on
  `riders`; a separate high-frequency table will be added if live tracking needs it (Phase 6).
