# Architecture

## What Tabeedar is

A delivery marketplace with three roles in **one Expo app**:

| Role     | What they do                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------- |
| Customer | Browse and search stores, build a cart, order (for themselves or someone else), track the order |
| Store    | Manage categories and products, accept or reject orders, mark them preparing                    |
| Rider    | Go online, see nearby deliveries, accept one, pick up and deliver                               |

After sign-in the user lands in the area for their role. Expo Router route groups
(`(customer)`, `(rider)`, `(store)`) keep the areas separate while sharing components and services.

## Business rules

These are confirmed by the owner. Anything not listed here is **not decided**; ask first.

- Languages English and Urdu (Urdu is right-to-left). Currency Pakistani rupees (PKR).
- Email and password login. No phone OTP for now.
- One store per cart.
- Cash on delivery only. The payment layer is abstracted so online payment can be added later.
- Delivery fee is Rs 35 per km: the straight-line distance from the store to the address, times the
  rate, rounded up to a whole rupee, no minimum. Riders within 5 km of the store are offered a
  delivery.
- Stores sign themselves up and are visible immediately. Riders sign themselves up but cannot work
  until the owner approves them in the Supabase dashboard.
- Everyone must sign in; there is no guest browsing.
- Order flow: `placed` -> `accepted` (store) -> `preparing` -> `ready` -> `picked_up` -> `delivered`,
  plus `rejected` and `cancelled`. Riders are offered an order as soon as the store accepts it, and
  the first rider to accept gets it. Full rules in [database.md](database.md).
- Ordering for someone else: every order stores its own delivery address plus the recipient's name
  and phone, independent of the customer's saved addresses. Item names and prices are also
  copied onto the order, so later menu edits never change past orders.

## Stack

Expo SDK 58, React Native, Expo Router, TypeScript (strict, `noUncheckedIndexedAccess`),
Supabase (Postgres, Auth, Realtime, Storage, PostGIS), TanStack Query, Zustand,
React Hook Form + Zod, i18next + expo-localization, ESLint + Prettier.

## Layers and data flow

```
Screen  ->  hook (TanStack Query)  ->  service  ->  Supabase client  ->  Postgres (RLS + functions)
```

- **Screens** render and handle interaction. They never import the Supabase client.
- **Hooks** wrap services with caching, loading, and error state.
- **Services** hold the app-side logic and the only calls to Supabase.
- **Postgres** is the authority. There is no server between the app and the database, so the app
  cannot be trusted. Orders cannot be written by the app at all: placing an order, changing its
  status and "rider accepts a delivery" are database functions (`place_order`,
  `update_order_status`, `accept_delivery`), and every table has Row Level Security. See
  [database.md](database.md). Side effects such as push notifications run in Supabase Edge Functions.

## Sign-in, roles and navigation

How a person gets to the right screen (all in `src/features/auth`):

```
sign-up  -> Supabase Auth creates the user -> a database trigger creates their profile (with the
            role they picked: customer, store or rider)
sign-in  -> Supabase Auth session (saved on the device) -> AuthProvider loads the profile
         -> AuthStatus: loading | signedOut | ready | error
         -> AppNavigator guards each area -> "/" redirects to the role's home
```

- **Routes** (`src/app`): `(auth)` has `sign-in` and `sign-up`; `(customer)/home`, `(store)/orders`
  and `(rider)/deliveries` are the three areas; `account-problem` is the retry screen. Route groups
  add nothing to the URL, so each area's first screen needs a different file name.
- **Guards:** `AppNavigator` wraps each group in `Stack.Protected`. Signed-out people can only reach
  `(auth)`; each role can only reach its own area; a failed profile load goes to `account-problem`.
  Opening another area's address, or `/sign-in` while signed in, redirects to your own home.
- **Deep links:** the navigator is not rendered until the sign-in state is first known, so an address
  the app is opened with is not thrown away. See ADR 013.
- **Using it:** screens call `useAuth()` (status, user, profile, role), `useSignIn()`, `useSignUp()`
  and `useSignOut()`. Only `services/auth.service.ts` talks to Supabase.
- **Errors:** failures are mapped from Supabase's error `code` to a translated message
  (`toAuthErrorKey`); the raw message is never shown.
- **Stores and riders** have a profile with their role from sign-up. What they see next is decided
  by their own area's layout: a new store account goes to the setup form, a rider who is not yet
  approved goes to the status screen. See the store area and the rider area below.

## The customer area

Four tabs (`(customer)/(tabs)`: Stores, Cart, Orders, Account) with screens that open on top of them
in a stack (a store, checkout, addresses, an order). The route files are thin; the screens live in
the features:

| Feature     | What it does                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `addresses` | Saved addresses; the one the customer delivers to (remembered on the device); setting a map position by phone location or a pasted link       |
| `stores`    | Stores near the chosen address, search by store or product name, a store's page with its products by category                                 |
| `cart`      | The cart, kept on the device (ADR 017); live price and stock check; one store per cart, with a confirmation before replacing it               |
| `checkout`  | Delivery address, who receives the order, the fee from the database, placing the order with an idempotency key so a retry cannot duplicate it |
| `orders`    | My orders, one order with its items, timeline and rider, and cancelling while the store has not responded (ADR 018)                           |

Everything the database owns stays there: the fee, the totals, who may cancel. The screens show
what the database says. After placing an order the cart is emptied only at the moment the checkout
screen leaves for the order page.

## The store area

A store account runs one store (ADR 021). `(store)/_layout.tsx` waits until it knows whether the
store exists. Until it does, the only screen is the setup form (`setup-store`); once it exists the
layout opens three tabs (`(store)/(tabs)`: Orders, Products, My store) and the screens on top of them
(an order, edit store, categories, a product). Route files are thin, as in the customer area.

| Feature    | What it does                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shop`     | The owner's store: setup and edit form (name, description, phone, address, map position, logo and cover), and the "accepting orders" switch                                             |
| `catalog`  | Products and categories: add, edit, delete, in/out of stock switch, price typed in rupees (Urdu digits accepted), product photo                                                         |
| `orders`   | (store side, next to the customer side) The store's order list with Active and History tabs, a count of new orders, one order with its buttons, an optional reason when ending an order |
| `media`    | Choosing, shrinking and uploading pictures, and showing them (`ImageField`, `Picture`). Shared by `shop` and `catalog`; customers see the pictures on the store pages                   |
| `location` | The map-position picker (phone location or a pasted link), shared by addresses and the store                                                                                            |

How the pieces fit:

- The store's catalog uses the same query (`storeKeys.catalog`) as the customer's store page, so a
  change made in the Products tab is what customers get on their next refresh. Catalog changes update
  the cached list at once and are confirmed by a background re-read.
- Order buttons come from `storeActionsFor(status)`; the database's `update_order_status` decides.
  The order screen reuses the customer side's order query, timeline and status chip, with `perspective="store"`
  for the store's own wording (`storeOrders` translations).
- The store area polls (ADR 023). It does not wake the phone for a new order: that needs push
  notifications (Phase 6).
- Pictures are stored as bucket paths and turned into addresses by `publicImageUrl` (ADR 020).

## The rider area

A rider must be approved before anything else. `(rider)/_layout.tsx` waits until it knows the rider's
state; until the owner approves, the only screen is `rider-status` (register, wait, or suspended).
Once approved, three tabs open (`(rider)/(tabs)`: Offers, Deliveries, Account) and the delivery
screen on top of them. Everything lives in the `dispatch` feature:

| Part                 | What it does                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration         | "Request approval" creates the `riders` row (pending). The waiting screen re-checks every 30 seconds and opens the area when the owner approves (ADR 028)             |
| Online switch        | Reads the phone's position, then calls `set_rider_presence`. While online and the app is open, `usePresenceHeartbeat` re-sends the position every minute (ADR 025)    |
| Offers               | `list_delivery_offers` every 10 seconds while online: store, distances, drop-off **area**, fee and cash total; never the customer's name, phone or address            |
| Accepting            | `accept_delivery`; first rider wins, and one delivery at a time (ADR 026). Failures show a translated message and the offer list refreshes                            |
| Deliveries           | Active and History lists, and one delivery with the store and customer details, items, the cash to collect, and "Open in Maps" for both places                        |
| Picking up, delivery | The one button comes from `riderActionFor(status)`: "picked it up" once the store marks the order ready, then "delivered" (with a confirmation). The database decides |

Notes:

- The delivery screen reuses the orders feature's status change (`changeOrderStatus`) and its status
  chip (`perspective="rider"`, wording in the `rider` translations).
- Offers poll every 10 seconds; deliveries and the delivery screen follow live updates (see the next
  section). A store cancelling an order, or marking it ready, shows up without any action.
- The position is only sent while the app is open. A rider who leaves the app stops being sent new
  offers on screen, but a "new delivery nearby" notification can still reach them if their position
  is recent (ADR 030).
- "Open in Maps" is a plain Google Maps address (`buildDirectionsUrl`), so no extra package or
  permission is needed.

## Notifications and live updates

Two things keep the app current without anyone asking. Both start from one component,
`NotificationsBridge` (in the root layout, inside the auth provider), which renders nothing.

```
database change ──> order_events trigger ──> notifications queue ──> Database Webhook
                                                                          │
phone <── Expo Push Service <── send-push Edge Function (claims rows, writes the words)
   │
   └── tap ──> the right screen for the person's role

database change ──> Supabase Realtime ──> useOrderRealtime ──> refresh the order queries
```

| Part                                  | What it does                                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications` feature, registration | On Android and iPhone, once signed in: creates the Android channel, asks permission (once), gets the Expo token, saves it with the phone's current language    |
| Tapping a notification                | `useNotificationTaps` reads the payload (checked with Zod) and opens the screen for the person's role (`routeForNotification`), once per tap, after sign-in    |
| Arriving while the app is open        | Shown as a banner (`notification-handler`), and the order queries refresh at once                                                                              |
| Signing out                           | `onBeforeSignOut` removes this phone's token while the person is still signed in; it never delays sign-out for more than 3 seconds                             |
| Account screens                       | `NotificationNotice` shows a short notice with an "Open settings" button when the phone has notifications off                                                  |
| `useOrderRealtime` (orders feature)   | Subscribes to changes of `orders` (row-level security decides who hears what), refreshes the order queries, debounced to one refresh per burst                 |
| Adaptive polling (`realtime-status`)  | Screens poll at their fast pace until Realtime is connected, once a minute while it is, and fast again the moment it drops; a reconnection refreshes once      |
| `supabase/functions/send-push`        | Deno code, deployed separately. Only does the I/O; what is sent, in which language and what Expo's answer means are in `_shared/*.ts`, which `npm test` covers |

Why polling stays: it is the safety net (Realtime failing cannot make the app slower than it was),
and it is the only way a rider sees new offers (a rider may not read an order nobody holds). The
web build has live updates but no push (Expo has no push token on the web). See ADR 029 to 033 for
the decisions and the setup steps in [database.md](database.md#setting-up-sending-steps-only-you-can-do).

## Folder structure

```
src/
  app/            Routes only (Expo Router). Thin files that render a screen.
  features/       One folder per feature. Built so far: auth, addresses, location, stores, cart,
                  checkout, orders (customer and store side), account, notifications, and for the
                  store area shop, catalog and media; for the rider area dispatch. Each has screens/
                  components/ hooks/ services/ schemas/ store/ utils/ and types.ts as needed.
  components/     Shared UI: Text, Button, Screen, FormScreen, TextField, SearchBar,
                  ConfirmDialog, QuantityStepper, StatusChip, Avatar, EmptyState, LoadingState,
                  ErrorState, ErrorBanner, LanguageSwitcher
  hooks/          Shared hooks: useTheme, useLanguage, useDebouncedValue, useGoBack
  lib/            Infrastructure: env, logger, supabase, query, i18n
  theme.ts        Design tokens: colours, spacing, radius, font sizes
supabase/         migrations/ (the schema), seed.sql (demo data), tests/ (database tests),
                  functions/ (Edge Functions: send-push, with its tested logic in _shared)
docs/             This documentation
```

## Conventions

- File names are kebab-case (`language-switcher.tsx`). One named component export per file.
- Import with the `@/` alias. Import order is enforced by ESLint.
- No `any`. Public functions have explicit return types.
- No hardcoded colours or sizes: use `src/theme.ts`. Use the shared `Text` component.
- No hardcoded user-facing strings: use `t('key')`. Keys are type-checked from the English file.
- No `console`: use `logger` from `@/lib/logger`. Never log personal data or tokens.
- Validate all input with Zod, and again in the database (constraints, RLS). Form schemas are
  built from `t` (`createSignInSchema(t)`), so messages are in the current language.
- Accessibility states use `aria-*` props (`role`, `aria-checked`, `aria-selected`,
  `aria-disabled`, `aria-busy`), not `accessibilityState`: the latter is not translated to ARIA on
  web, so screen readers there would not hear the state.
- Inputs always have a visible label (`TextField`), never only a placeholder.
- Forms read live values with `useWatch`, not `watch()`: the React Compiler cannot optimise a
  component that calls `watch()`.
- A mutation callback that closes a dialog must not wait for a list refresh: call
  `void queryClient.invalidateQueries(...)` instead of returning it, or the dialog stays open until
  the refresh finishes.
- A screen that finishes a task (saving an address, choosing one) leaves with `useGoBack(fallback)`,
  so it still works when it was opened straight from a link and there is nothing to go back to.
- Lists use `FlatList` with paging (`useInfiniteQuery`); route ids are read with `parseIdParam`, so a
  garbage address shows "not found" instead of querying with it.

## Testing

| Command           | What it covers                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`        | Pure logic with Vitest, next to the code (`*.test.ts`): schemas, phone and error helpers, translations, and the notification sender's decisions (`supabase/functions/_shared`) |
| `npm run test:db` | The database: access rules, order functions, seed (see [database.md](database.md))                                                                                             |

Screens have no automated tests yet. Check them by running the app: `npx expo start --web` and a
browser, then a device or emulator. Keyboard handling and the Urdu layout on a real phone still need
a device check.

The customer flow (sign-in, browse and search, cart, checkout, order tracking, cancelling, addresses,
Urdu) was run in a browser against a stand-in server that ran the real migrations and seed data. It
has **not** yet run against a real Supabase project or on a phone.

## Languages and right-to-left (RTL)

Urdu mirrors the whole layout. To make that work everywhere:

- Use logical style props: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`.
  Never use `left`/`right` or `marginLeft`/`marginRight`.
- `flexDirection: 'row'` mirrors automatically; do not hand-flip it.
- Directional icons (back arrows, chevrons) must be flipped when `I18nManager.isRTL` is true.
- Leave `textAlign` unset so text follows the language direction.
- Add every string to `src/lib/i18n/locales/en` first, then `ur` (the compiler checks they match).
- Urdu needs taller line heights than Latin; the shared `Text` handles this.

**Testing RTL:** Expo Go cannot show a mirrored layout (it resets the RTL flag). Use a
development build, or set the phone's system language to Urdu. A language switch inside the app
restarts the app so the new direction applies.

## Security

- The app contains only the Supabase **publishable** key. Anyone can read it, so RLS is the real
  protection.
- Secrets (service-role key, push credentials) never enter the app. They live in Edge Functions.
- Riders see only the pickup point and the drop-off area until they accept a delivery. This is
  enforced in the database, not the UI.
- Nothing is reachable without signing in, and the database grants access table by table and column
  by column. A user cannot change their own role, a store cannot change its own status, and a rider
  cannot approve themselves.

## Setup

1. `npm install`
2. Create a Supabase project and apply the migrations (see "Setting up a Supabase project" in
   [database.md](database.md)).
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key.
   The app stops at start-up with a clear message if they are missing.
4. In the Supabase dashboard, under Authentication, Providers, Email, decide whether "Confirm email"
   is on. While developing, turn it off so new accounts can sign in straight away.
5. `npm start`
