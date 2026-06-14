/**
 * Cross-platform DB initializer — runs supabase/migrations/0001_init.sql against
 * DATABASE_URL using the `pg` package (no psql install required).
 *
 *   npm run db:init
 *
 * Reads DATABASE_URL from the environment, falling back to .env.local.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local — rely on process env */
  }
}

async function main() {
  loadEnvLocal();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set (checked environment and .env.local).');
    process.exit(1);
  }

  const sqlPath = join(root, 'supabase', 'migrations', '0001_init.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  // Supabase requires SSL; allow self-signed in the pooled connection string.
  const client = new pg.Client({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('Connecting to database…');
  await client.connect();
  console.log(`Applying ${sqlPath} …`);
  await client.query(sql);
  await client.end();
  console.log('✓ Migration applied. Tables are ready.');
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message ?? err);
  process.exit(1);
});
