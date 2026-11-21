# Decision log

Short records of decisions that shape the project. Newest at the bottom.

## 001: Supabase as the backend

**Decision:** Supabase (Postgres, Auth, Realtime, Storage, PostGIS).
**Why:** One managed service covers auth, live order dispatch to riders, image storage, and
"nearby" queries, so there is no server to run. **Trade-off:** business rules that must be trusted
live in Postgres functions rather than app code, because the app talks to the database directly.

## 002: One Expo app for all roles

**Decision:** a single app; customer, rider, and store areas are route groups chosen by role.
**Why:** one codebase and one release process, shared components. Expo Router lets the store area
also run on web later. **Trade-off:** a larger app bundle than three separate apps; can be split later.

## 003: Store accepts before riders are alerted

**Decision:** a rider is only offered an order after the store has accepted it.
**Why:** avoids sending riders for orders a store cannot fulfil (closed, out of stock).

## 004: Cash on delivery for the first version

**Decision:** no online payments yet. **Why:** removes the payment provider, refunds, and payout
scope from the first release. Order code goes through a payment abstraction so online payment can be
added without rewriting orders.

## 005: Session storage uses expo-sqlite

**Decision:** the Supabase auth session is stored through `expo-sqlite`'s `localStorage`.
**Why:** it follows Supabase's current Expo guide and has no size limit (the session is larger than
expo-secure-store's 2 KB value limit). **Trade-off:** the session is stored unencrypted on the
device, as with most apps using the default setup. Revisit with an encrypted store before launch if
the threat model requires it.

## 006: Language switch restarts the app

**Decision:** changing between English and Urdu calls `reloadAppAsync` from `expo`.
**Why:** React Native only applies a layout direction change after a restart. `reloadAppAsync` works
in debug and release builds without adding `expo-updates`. It is skipped in Expo Go, where the RTL
flag cannot be changed.

## 007: Orders are read-only for the app; functions do the writing

**Decision:** the app has no insert, update or delete access to `orders`, `order_items` or
`order_events`. `place_order`, `update_order_status`, `accept_delivery` and `set_rider_presence` are
`SECURITY DEFINER` functions that check `auth.uid()` and the caller's relationship to the order.
**Why:** the app runs on the customer's phone and could be modified. Prices, fees and status changes
must come from the database. **Trade-offs:** `SECURITY DEFINER` bypasses row-level security inside
the function, so each function carries its own checks, and they are covered by tests
(`npm run test:db`). Supabase's advisor will warn that signed-in users can execute them; that is
intended. This is the exception to the parent file's "no business logic in the database" rule,
justified by ADR 001.

## 008: Order lifecycle: rider assignment is not a status

**Decision:** statuses are `placed`, `accepted`, `preparing`, `ready`, `picked_up`, `delivered`,
`rejected`, `cancelled`. Which rider has an order is the `rider_id` column, not a status. Riders are
offered an order from the moment the store accepts it and can pick it up once the store marks it
`ready`. The first draft had an `awaiting_rider` status after `preparing`; that would have alerted
riders only after preparation, which contradicts "store accepts, then riders are alerted".
**Who can do what:** see the table in `docs/database.md`. The store may cancel until pickup; the
customer may cancel only while the order is `placed`. Both are my reading of the flow, listed in the
open items so you can change them.

## 009: Primary keys are `bigint` identity columns

**Decision:** `bigint generated always as identity` for every table, except `profiles.id` and
`riders.user_id`, which are the user's own UUID. **Why:** smaller indexes and ordered inserts than
random UUIDs. **Trade-off:** order numbers are sequential, so anyone who sees two order numbers can
estimate order volume. Access is controlled by row-level security, not by hiding ids.

## 010: Riders see a limited preview until they accept

**Decision:** riders have no read access to an order until it is assigned to them. Before that,
`list_delivery_offers()` returns only the pickup point and the drop-off area. Offers reach riders by
polling that function plus a push notification, not by Realtime. **Why:** the order row holds the
customer's name, phone and exact address, and Realtime would have to expose that row to every nearby
rider. **Trade-off:** a few seconds of polling delay, which a push notification covers.

## 011: Delivery fee

**Decision (confirmed by the owner):** `ceil(straight-line metres × Rs 35 / 1000)`, so the fee for
2.3 km is Rs 81. No minimum fee. The rate and the 5 km offer radius live in the one-row
`app_settings` table, and the rate used is stored on every order. **Why:** exact and easy to explain.
Road routing would need a paid maps service and would move the fee out of SQL.

## 012: Database tests run in PGlite

**Decision:** the migrations are tested with PGlite (Postgres compiled to WebAssembly) and its
experimental PostGIS build, in `supabase/tests`. **Why:** Docker is not available on the development
machine, so Supabase's local stack and `supabase test db` cannot run. **Trade-off:** it is not a full
Supabase stack (see the list in `docs/database.md`). The tests were checked by deliberately breaking
seven rules and confirming they fail. Run Supabase's advisors after the first real deploy.

## 013: Sign-in state comes from one provider; routes are guarded in one navigator

**Decision:** `AuthProvider` combines the Supabase session with the person's profile (fetched with
TanStack Query) into one status: `loading`, `signedOut`, `ready` or `error`. A single
`AppNavigator` guards each area with Expo Router's `Stack.Protected`: sign-in screens for signed-out
people, and one area per role. The entry route (`/`) redirects to the right place. The navigator is
not rendered until the sign-in state is first known.
**Why the last part:** while a saved session is loading every guard is false, and Expo Router
discards the address the app was opened with and goes to the entry route. That would lose every deep
link (an order notification, an email confirmation link). A failed profile load shows a screen with
"Try again" and "Sign out" instead of leaving people stuck.
**Trade-off:** the guards are the UI side of access control only. The database enforces the real
rules (ADR 007), so bypassing a guard gives access to a screen that has no data behind it.

## 014: No generated database types yet; rows are validated with Zod

**Decision:** until a Supabase project exists to generate types from, data read from the database is
checked with a Zod schema where it enters the app (`parseProfileRow`) instead of trusting a type.
**Why:** hand-writing the types would drift from the migrations. **Later:** once types are
generated, the client becomes `createClient<Database>`; the Zod check can stay as a runtime guard,
since types are erased and cannot detect a changed response.

## 015: Vitest for pure logic only

**Decision:** `npm test` (Vitest) covers code with no screens in it: validation schemas, phone
normalization, error mapping, the profile parser, and a check that the English and Urdu strings use
the same `{{placeholders}}`. Screens are verified by running them (web in the browser pane, then a
device). **Why:** these are the rules that decide whether a sign-up is accepted or reaches the
database, and they are cheap to test. Component tests (jest-expo and Testing Library) can be added
when screens carry more logic.

## 016: A delivery address gets its map position from the phone or a pasted link

**Decision (confirmed by the owner for the first part):** the customer sets an address's position
with "Use my current location", and, for an address where they are not (ordering for someone else),
by pasting a Google Maps link or coordinates. There is no map picker yet.
**Why:** the position decides the delivery fee, and it is needed for "stores near me". A map picker
needs a maps SDK, and Google Maps on Android needs an API key with a billing account. Phone
location alone cannot place someone else's address, and WhatsApp location shares already arrive as
Google Maps links, so pasting covers that case without any key. **Limits:** shortened links
(`maps.app.goo.gl`) hide the position behind a redirect and are not read; the customer is told to
paste the full link or the coordinates. A picker can be added later without changing the database.

## 017: The cart lives on the device and never decides a price

**Decision:** the cart is saved on the phone (Zustand, saved to local storage), is cleared when the
person signs out, and holds only product, name, quantity and the price seen when it was added.
Prices shown in the cart are checked against the database every few seconds, and `place_order`
prices everything again. The rules (one store per cart, quantity limits, totals in whole paisa)
are plain functions with tests. Adding from a second store asks before replacing the cart.
**Why:** a cart needs no server, so it works offline and costs nothing; the database stays the only
authority on money (ADR 007). **Trade-off:** the cart does not follow a customer to a second phone.
The 99-per-item limit is a convenience for the quantity buttons, not a business rule.

## 018: Order tracking refreshes by polling for now

**Decision:** an order screen re-reads the order every 10 seconds while it can still change, and
stops once it is delivered, rejected or cancelled. **Why:** it needs no extra infrastructure and was
verified end to end (store accepts, rider accepts, delivered, with the rider's details appearing
and disappearing). **Later:** Supabase Realtime and push notifications (Phase 6) make updates
instant; polling stays as the fallback.

## 019: Store search ranks open stores first, then nearest

**Decision:** `search_stores` lists active stores nearest first, with closed stores after open ones,
and matches text against store names and product names. It has no distance limit. **Why:** a closed
store is still worth seeing, but should not lead the list. This ordering is my default, not an
owner decision; it is easy to change in one SQL function. See the open items for a distance limit.

## 020: Pictures live in one public bucket and are shrunk on the phone

**Decision:** logos, covers and product photos go in one public Storage bucket, `catalog-images`, under
`stores/<store id>/<kind>/<uuid>.jpg`. The database columns (`logo_url`, `cover_url`, `image_url`) hold
that path, never a full address, and a check constraint keeps each path inside its own store's folder.
Only the store's owner can write inside that folder (Storage policies), and the bucket accepts only
JPEG, PNG or WebP up to 2 MB. Before upload the phone shrinks the picture (logo 512 px, product 800 px,
cover 1280 px on the longest side) and re-encodes it as JPEG at quality 0.8. Every upload gets a new
file name, so a replaced picture has a new address and nothing is ever overwritten. When a save
replaces or removes a picture, the old file is deleted afterwards (best effort).
**Why:** a public bucket makes every picture a plain cacheable address (no signing, no per-customer
cost), and shrinking on the phone keeps the files a few hundred kilobytes instead of several
megabytes. The folder rule makes "my store only" a database fact, not an app promise.
**Not verified yet:** this was tested against a stand-in for Storage (which runs the real bucket
policies) and in a browser, but never on a real Supabase project or a phone. A picture chosen and then
abandoned (the form is cancelled, or a second picture is chosen before saving) is left behind in the
bucket; see the open items.

## 021: One store per store account

**Decision:** a store account runs exactly one store. The database enforces it (`stores_owner_id_key`,
migration 11), and the app opens a new store account on a setup form; the rest of the store area
(orders, products, my store) appears once the store exists. **Why:** the owner chose it, and it keeps
every store screen free of a "which store?" step. Relaxing it later means dropping that one constraint
and adding a store switcher; every table already points at `store_id`, not at the owner.

## 022: Stock is an in/out switch; products are listed alphabetically

**Decision:** a product is either in stock or out of stock (the owner's choice). Out-of-stock products
stay visible and cannot be ordered (`place_order` refuses them). There are no stock counts. Categories
and products are listed alphabetically within their group; the database column `sort_order` exists but
the app does not set it. **Why:** the owner chose the switch; manual ordering was not requested and
alphabetical order is predictable. The switch changes on screen immediately and is put back if the
save fails.

## 023: The store area polls for new orders and asks for an optional reason

**Decision:** the store's order list checks for news every 15 seconds while the Active tab is open, and
the Orders tab shows how many orders are waiting for an answer. Declining or cancelling an order asks
for an optional reason (at most 500 characters), which the customer sees in the order's history.
Which buttons appear for each status comes from one function (`storeActionsFor`), and a unit test
compares it with the database's rulebook (`order_transition_allowed`); the database remains the only
authority and refuses anything else. **Why:** polling needs no extra infrastructure (as in ADR 018);
the owner chose an optional reason. **Later:** push notifications and Realtime (Phase 6) replace
polling, because a store that has the app closed must also hear about a new order.

## 024: Prices are typed in rupees, with Urdu digits accepted

**Decision:** the product form reads a price such as `1250`, `1,250.50` or `۱٬۲۵۰`, with at most two
decimals, and turns it into a number before saving; anything else is refused with a message. Zero is
allowed because the database allows it. Prices above Rs 10,000,000 are refused as a technical guard
against a slipped finger, not as a business rule. **Why:** Urdu keyboards type Eastern Arabic digits,
and a price that silently failed to parse would be worse than an error.

## 025: A rider is tracked only while the app is open

**Decision:** an online rider's phone sends its position about once a minute, and once straight
away when the app opens, but only while the app is in the foreground. Offers are fetched by the app
(every 10 seconds), so a rider who leaves the app sees and accepts nothing until they return.
**Why:** the owner chose it. Background tracking needs the "always allow location" permission, a
background service, battery cost and extra app-store review; the first version does not need it
because nothing is pushed to riders yet. **Later:** with push notifications (Phase 6), riders can be
alerted while the app is closed, and background location can be reconsidered then.

## 026: A rider holds one delivery at a time

**Decision:** a rider with an unfinished delivery (accepted, preparing, ready or picked up) is shown
no offers and cannot accept another. The database enforces it with a partial unique index (migration
12), so two taps at once, or the same rider on two phones, cannot both get through. Delivering the
order, or the store cancelling it, frees the rider. **Why:** the owner chose it; without it a rider
could grab several far-apart orders and serve none in time. **Trade-off:** a rider cannot line up the
next order while finishing the current one. If the owner later wants two at once, the index becomes a
count check and the rule moves into `accept_delivery`.

## 027: A rider cannot give a delivery back

**Decision:** once accepted, a delivery stays with the rider until it is delivered or the store
cancels it. There is no "release" button and no database function for it. **Why:** the owner chose
it; it keeps first-come, first-served simple and fair. If a rider cannot continue (a flat tyre), the
store or the platform owner cancels the order. **Later:** allowing a release before pickup needs one
new function that clears `rider_id` and puts the order back in the offers.

## 028: Riders register with nothing extra; the owner approves in the dashboard

**Decision:** a rider signs up, taps "Request approval" (which creates their `riders` row as
`pending`) and waits. The owner approves in the Supabase dashboard by name and phone number; the
waiting screen checks every 30 seconds and opens the rider area by itself. No ID card or vehicle
details are collected. **Why:** the owner chose it. Collecting an ID number means storing sensitive
personal data, which needs its own safekeeping decisions. **Risk:** approval rests on a name and a
phone number the rider typed; the owner should call the number before approving.

## 029: Push notifications come from a database queue, sent by an Edge Function through Expo

**Decision:** database triggers write "tell this person about this order" rows into a `notifications`
queue (no text, only the kind, the order number and the store name). A Database Webhook calls the
`send-push` Edge Function whenever a row is added; the function takes waiting rows
(`claim_notifications`), writes each message in the language of each of the person's phones, and sends
it through the Expo Push Service to Android and iPhone. The phone registers its Expo token with
`register_push_token`, and removes it just before sign-out. **Why a queue filled by triggers:** the rules
about who is told what live in the database, so they apply to every way an order can change and are
tested with the other database tests; the sender only delivers. The claim step (`skip locked`, a
two-minute lease, three attempts) means several webhook calls at once, and crashes, can neither
send a notification twice nor lose it. **Why Expo (the owner's choice):** one token for both platforms,
no Firebase or Apple setup in the app. **Limits:** delivery is "at least once" (a crash after sending
but before recording would send again); Expo's later delivery receipts are not read (see the open items).

## 030: Who is told what, and how fresh a rider's position must be

**Decision (the owner's set):** the store hears of a new order. The customer hears when the store
accepts or declines, when the order is ready, picked up, delivered or cancelled (not for their own
cancellation). A rider hears of a new delivery nearby, and when the store cancels the delivery they
carry. Nobody hears about "being prepared", a rider accepting, or other small steps. A delivery alert
goes only to riders who are approved, online, free (one delivery at a time, ADR 026), within the offer
radius, and whose last reported position is under 5 minutes old (the setting
`rider_position_max_age_minutes`, changeable in the dashboard). **Why the position window:** riders
report their position only while their app is open (ADR 025), so an old position means they are
probably not looking. **Why unsent news is not lost to a bad moment:** an alert for a taken delivery
expires after 10 minutes at the push service; order news after 6 hours.

## 031: A notification speaks the language the phone is using

**Decision:** each phone's token is saved with the language the phone uses at that moment, and saved
again when the language is switched, so a notification arrives in that phone's language even when the
account's stored language is older. A person with two phones in two languages gets each in its own.
Notification text contains only the order number and the store's name: never an address, a phone
number or a customer's name, because a notification is shown on a locked screen. **Why:** the account
language is only what was chosen at sign-up (see the open item about which language is the account's).

## 032: Live updates use Supabase Realtime; polling stays as a safety net

**Decision:** while someone is signed in, the app listens for changes to orders through Realtime and
refreshes the order screens on each change (several changes within 0.4 seconds cause one refresh).
Polling is not removed: the screens keep polling at their normal fast pace (10 to 15 seconds) until
Realtime reports it is connected, slow to once a minute while it is, and return to the fast pace as
soon as the connection drops; when it comes back the app refreshes once to catch up on anything
missed. A notification that arrives while the app is open also refreshes at once. A tapped
notification opens the right screen for the person's role (an unexpected payload is ignored). **Why
adaptive polling:** if Realtime ever fails silently, the app behaves exactly as before; it cannot
become slower. **Not covered by Realtime:** a rider's list of new offers (a rider may not read an order
nobody holds yet, so no change event is sent to them): it keeps polling every 10 seconds, and the
"new delivery nearby" notification covers a rider whose app is open on another screen. **Verified:**
against a stand-in for Realtime in a browser (a new order appeared in under half a second, polling
slowed, and the app caught up after a six-second outage), not against real Supabase.

## 033: Live rider tracking on a map is not built

**Decision:** customers keep seeing the order's status and the rider's name and phone; there is no map.
**Why:** the owner chose "not now". A map needs a maps provider and key, a position update every few
seconds while delivering (today a rider's position is sent once a minute, only while the app is open),
a table made for that write rate, and a real phone to test on.

## Open items (not yet decided)

These need an owner decision before the related phase. Defaults are what the code does today.

| Item                                                                                            | Needed by                    | Current behaviour / proposal                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand spelling: "Tabeedar" (folder and app name) vs "Tabedar"                                   | Before first store build     | Tabeedar. The bundle identifier cannot be changed after publishing                                                                                                                                                                                     |
| Urdu wordmark and brand colours                                                                 | Before launch                | Latin "Tabeedar" in both languages; placeholder green palette                                                                                                                                                                                          |
| Digits in Urdu: Latin (1,250) or Urdu (۱٬۲۵۰)                                                   | Phase 3                      | Latin digits                                                                                                                                                                                                                                           |
| Urdu copy review by a native speaker                                                            | Before launch                | Current Urdu strings are a first draft                                                                                                                                                                                                                 |
| Email confirmation at sign-up                                                                   | Before launch                | The app works either way (it shows "check your email" when confirmation is on). Supabase has it on by default; turn it off while developing. When on, the link opens a web page, not the app, until deep-link handling is added                        |
| Forgot password                                                                                 | Before launch                | Not built. Needs the same deep-link handling as email confirmation                                                                                                                                                                                     |
| Phone numbers: verification, and non-Pakistani numbers                                          | Before launch                | Not verified (no OTP). A number starting with `0` is read as Pakistani (`+92`); other countries need `+` or `00`                                                                                                                                       |
| Which language is "the account's": this device, or the profile                                  | Phase 3                      | The device's choice wins; the profile stores the language chosen at sign-up and is not synced yet                                                                                                                                                      |
| Maximum delivery distance, minimum order value, maximum items per order                         | Phase 3                      | None today (a customer in another city could order, though no rider would be in range). Only technical limits: 100 lines and 1000 of one item                                                                                                          |
| Store can cancel until pickup; customer only while the order is `placed`                        | Phase 3-4                    | As described in ADR 008                                                                                                                                                                                                                                |
| Can one owner have several stores                                                               | Decided (ADR 021)            | One store per account, enforced by the database                                                                                                                                                                                                        |
| Stock counts (not just in/out of stock), opening hours, store types or cuisines for browsing    | Phase 3-4                    | Not built                                                                                                                                                                                                                                              |
| What happens if no rider accepts                                                                | Phase 5                      | The offer stays open until accepted or cancelled                                                                                                                                                                                                       |
| Can a rider give back a delivery after accepting; how many deliveries at once                   | Decided (ADR 026, 027)       | No giving back; one delivery at a time                                                                                                                                                                                                                 |
| How long a rider's reported position stays valid                                                | Decided for alerts (ADR 030) | A "new delivery nearby" alert goes only to riders whose position is under 5 minutes old (setting `rider_position_max_age_minutes`). A rider who closes the app still shows as "online" in the database, and the offers list does not apply this window |
| Rider details for approval (ID card, vehicle)                                                   | Decided (ADR 028)            | None collected; you approve by name and phone in the dashboard                                                                                                                                                                                         |
| Cash handling: how riders pass cash to stores or the company, and how riders are paid           | Before launch                | Not tracked. The delivery screen only shows how much cash to collect; there is no earnings screen, no "cash handed over" step and no payout record                                                                                                     |
| Tracking a rider while the app is closed (background location)                                  | Phase 6                      | Not built (ADR 025). Needs the "always allow location" permission and a background service, and extra app-store review steps                                                                                                                           |
| A rider going offline automatically when they sign out                                          | Low priority                 | Not done. Harmless today (a signed-out rider receives nothing); revisit with push notifications                                                                                                                                                        |
| Deleting an account that has orders                                                             | Before launch                | Blocked, so order history is not lost. Needs an anonymise-instead policy                                                                                                                                                                               |
| A map picker for addresses                                                                      | Before launch                | Not built: phone location or a pasted Google Maps link (ADR 016). Needs a maps API key for Android                                                                                                                                                     |
| Push notifications and live updates: check on a real project and phones                         | Before launch                | Built (ADR 029-032). Tested: the database rules (115 tests), the sender's code against a stand-in database with a fake Expo, and live updates in a browser against a stand-in. Never run on real Supabase, Expo, Android or iPhone                     |
| Push setup that only you can do                                                                 | Before launch                | EAS project (`eas init`), development build, Edge Function deploy and secrets, the Database Webhook; iOS release builds need the plugin's `mode` set to `production`. Steps in docs/database.md                                                        |
| Push receipts are not checked                                                                   | After launch                 | Expo reports a dead phone (uninstalled app) mostly in a later "receipt", which is not read. Dead tokens linger, harmlessly, until the person signs in on a new phone (a person keeps at most 10 tokens)                                                |
| Live rider tracking on a map for customers                                                      | After launch                 | Not built (ADR 033). Customers see the status and the rider's name and phone                                                                                                                                                                           |
| Other notification events: a rider is approved, a rider accepts, a customer cancels a new order | After launch                 | Not sent (the owner chose the set in ADR 030). The rider's waiting screen checks every 30 seconds                                                                                                                                                      |
| Store logos and product pictures: check on a real project and phone                             | Before launch                | Built (ADR 020) but only tested against a stand-in for Storage and in a browser. Needs a real upload from a phone, plus the dashboard check that the bucket and its policies exist                                                                     |
| Pictures left behind in the bucket                                                              | Before launch                | A picture chosen and then abandoned stays in Storage (a few hundred KB each, never shown). Needs a periodic clean-up job that deletes files no row points at                                                                                           |
| Putting categories and products in a chosen order                                               | After launch                 | Alphabetical (ADR 022). The `sort_order` column is ready; the screens to move items are not built                                                                                                                                                      |
| Store phone number                                                                              | Before launch                | Optional when setting up a store. Say if customers or riders must be able to reach the store, and it becomes required                                                                                                                                  |
| Alert sound or notification for a new order                                                     | Decided (ADR 029)            | A push notification with sound ("New order #12"). The Orders tab also shows a count while the app is open                                                                                                                                              |
| Switch drawn wrongly in Urdu on the web build                                                   | Low priority                 | React Native Web draws a switch's thumb on the wrong side in right-to-left layouts. Only the web build is affected; phones draw their own native switch                                                                                                |
| Ordering from a store open "now": opening hours                                                 | Phase 3-4                    | Stores have an open/closed switch only; a closed store can be browsed but not ordered from                                                                                                                                                             |
| Tips, ratings, reorder, scheduled delivery, promo codes                                         | After launch                 | Not built and not decided                                                                                                                                                                                                                              |
