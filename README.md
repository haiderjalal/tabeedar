# Tabeedar

A delivery marketplace for Pakistan, in the style of Uber Eats. Customers order from many stores,
stores manage their own catalog and orders, and riders accept and deliver. Built with Expo
(React Native) and Supabase. Available in English and Urdu.

## Getting started

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm start
```

On Windows PowerShell use `Copy-Item .env.example .env.local`.

The app needs a Supabase project (URL and publishable key in `.env.local`) and stops at start-up
with a clear message without them. Setup steps are in [docs/database.md](docs/database.md).

## Scripts

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `npm start`         | Start the Expo dev server                   |
| `npm run typecheck` | TypeScript check (strict)                   |
| `npm run lint`      | ESLint, including Prettier and import order |
| `npm run format`    | Format all files with Prettier              |
| `npm test`          | Unit tests (schemas and helpers)            |
| `npm run test:db`   | Test the database migrations (see below)    |

## Database

The schema lives in `supabase/migrations/`. To set up a Supabase project, apply it and generate the
types, follow [docs/database.md](docs/database.md). `supabase/seed.sql` adds demo data for a
development project only.

`npm run test:db` runs the migrations and the seed in an in-memory Postgres and checks the security
rules and order logic. No Docker needed. The first time, run `npm --prefix supabase/tests install`.

## Testing Urdu (right-to-left)

Expo Go cannot mirror the layout for RTL languages. To see Urdu the way users will, use a
[development build](https://docs.expo.dev/develop/development-builds/introduction/), or set your
phone's system language to Urdu. See `docs/architecture.md` for the RTL rules.

## Documentation

- [Architecture and conventions](docs/architecture.md)
- [Database: tables, access rules, functions, setup](docs/database.md)
- [Decision log and open items](docs/decisions.md)
- [`CLAUDE.md`](CLAUDE.md): instructions for AI assistants working in this repo
