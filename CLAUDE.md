# CLAUDE.md: Tabeedar

Tabeedar is a food/grocery delivery marketplace (Uber Eats style) for Pakistan. Customers order
from many stores; stores manage their own catalog and incoming orders; riders accept and deliver.

**This file overrides `D:\Projects\CLAUDE.md` where they conflict.** That parent file describes the
PeptoLogics Next.js website. Ignore its stack, folder layout, and PascalCase file naming. Its
engineering workflow still applies: plan before coding, ask when a business rule is unclear, keep
changes incremental, no `any`, validate all input, document significant changes, and use
Conventional Commits (never commit to `main` directly).

## Stack

Expo SDK 58 (React Native, Expo Router, TypeScript strict) · Supabase (Postgres, Auth, Realtime,
Storage, PostGIS) · TanStack Query (server state) · Zustand (cart only) · React Hook Form + Zod ·
i18next (English + Urdu, RTL) · plain `StyleSheet` with tokens from `src/theme.ts`. Package manager: npm.

## Commands

```bash
npm start            # Expo dev server
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint (includes Prettier + import order)
npm run format       # Prettier write
npm test             # unit tests (Vitest): schemas and helpers, no screens
npm run test:db      # database tests (PGlite); run after any change in supabase/
```

Before calling any task done: `typecheck`, `lint` and `npm test` must pass. After changing a
migration, also run `test:db` (first time: `npm --prefix supabase/tests install`).

## Architecture rules

- `src/app` is **routes only** (Expo Router). Screen bodies live in `src/features/<name>/screens`.
- Data flow: Screen → hook (TanStack Query) → service → Supabase → Postgres (RLS + functions).
  Screens never import the Supabase client.
- The client is untrusted. Pricing, delivery fee, and "rider accepts" are enforced in Postgres
  functions, never only in the app. Every table has RLS.
- Only `EXPO_PUBLIC_*` values go in the app. Secrets belong in Edge Functions.
- Files are kebab-case, one named export per component, `@/` path alias.
- Comments explain **why**, not what.
- No hardcoded colours or sizes (use `src/theme.ts`), no hardcoded user-facing strings (use `t()`),
  no `console` (use `@/lib/logger`).
- **RTL:** use logical style props (`marginStart`, `paddingEnd`, `start`, `end`), never
  `left`/`right`. Flip directional icons. Use the shared `Text` so Urdu line height is right.
- **Accessibility:** use `aria-*` props (`aria-checked`, `aria-selected`, `aria-disabled`,
  `aria-busy`), not `accessibilityState` (silent on web). Every input needs a visible label.
- **Navigation:** areas are guarded in `AppNavigator`; never render a role's screens without the
  guard, and keep the navigator unrendered until the sign-in state is known (ADR 013).

## Business rules (confirmed by the owner)

- Languages: English and Urdu. Currency: PKR. Login: email + password (no OTP).
- One store per cart. Payment: cash on delivery only.
- Delivery fee: Rs 35 per km of straight-line distance, rounded up to a whole rupee, no minimum.
  Rider offer radius: 5 km (from the store).
- Order flow: customer places → store accepts → riders within 5 km alerted → first to accept wins.
- A customer can order for someone else: each order stores its own delivery address and recipient.
- Stores self sign-up and are live immediately. Riders self sign-up but need the owner's approval.
- Everyone must sign in; no guest browsing.

Schema, access rules, functions and order lifecycle: `docs/database.md`. Never write to `orders`,
`order_items` or `order_events` from the app; use the functions.

Never invent business rules. If something is unspecified, ask. See `docs/decisions.md` for open items.

## Docs

`docs/architecture.md` (structure and conventions) · `docs/database.md` (schema and rules) ·
`docs/decisions.md` (decision log, open items)
