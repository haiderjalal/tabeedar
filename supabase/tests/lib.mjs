// Shared helpers for the SQL test harness: boots PGlite, applies the shim and every migration.
// PGlite is Postgres compiled to WebAssembly, so this runs anywhere Node does (no Docker needed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { postgis } from '@electric-sql/pglite-postgis';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SUPABASE_DIR = path.join(here, '..');
// MIGRATIONS_DIR can point at a modified copy, which is how the tests themselves were checked
// (break a rule on purpose, confirm a test fails).
export const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? path.join(SUPABASE_DIR, 'migrations');

export async function createDb({ log = true } = {}) {
  const db = new PGlite({ extensions: { postgis, pgcrypto, pg_trgm } });
  await db.exec(fs.readFileSync(path.join(here, 'shim.sql'), 'utf8'));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    try {
      await db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
      if (log) console.log('applied', file);
    } catch (error) {
      console.error('FAILED ', file);
      console.error(error.message);
      if (error.position) console.error('position:', error.position);
      throw error;
    }
  }
  return db;
}
