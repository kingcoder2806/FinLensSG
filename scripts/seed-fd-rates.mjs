/**
 * One-time seed script — pushes mid-2026 SGD FD rate data into rate_history.
 *
 * Run from the project root:
 *   node scripts/seed-fd-rates.mjs
 *
 * Requires Node 20.6+ (uses --env-file flag) or reads .env.local directly.
 * Will skip insertion if rows for the same bank/tenor already exist on today's date.
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local without any extra dependencies
try {
  const envContent = readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn('Could not read .env.local — relying on environment variables already set.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mid-2026 snapshot. board = always-available rate. promo = promotional rate (conditions apply).
const ROWS = [
  // ── DBS ──────────────────────────────────────────────────────────────────
  // Board rates apply to S$1,000–S$19,999. ≥S$20,000 earns 0.05% on all tenors.
  { bank_slug: 'dbs', product_category: 'fixed-deposit', product_name: 'SGD FD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: 1000,  min_deposit_promo: null, source_url: 'https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page' },
  { bank_slug: 'dbs', product_category: 'fixed-deposit', product_name: 'SGD FD 3M',  tenor_months: 3,  rate: 0.15, promo_rate: null, min_deposit_board: 1000,  min_deposit_promo: null, source_url: 'https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page' },
  { bank_slug: 'dbs', product_category: 'fixed-deposit', product_name: 'SGD FD 6M',  tenor_months: 6,  rate: 0.80, promo_rate: null, min_deposit_board: 1000,  min_deposit_promo: null, source_url: 'https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page' },
  { bank_slug: 'dbs', product_category: 'fixed-deposit', product_name: 'SGD FD 12M', tenor_months: 12, rate: 1.00, promo_rate: null, min_deposit_board: 1000,  min_deposit_promo: null, source_url: 'https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page' },

  // ── OCBC ─────────────────────────────────────────────────────────────────
  { bank_slug: 'ocbc', product_category: 'fixed-deposit', product_name: 'SGD FD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page' },
  { bank_slug: 'ocbc', product_category: 'fixed-deposit', product_name: 'SGD FD 3M',  tenor_months: 3,  rate: 0.10, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page' },
  { bank_slug: 'ocbc', product_category: 'fixed-deposit', product_name: 'SGD FD 6M',  tenor_months: 6,  rate: 0.20, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page' },
  { bank_slug: 'ocbc', product_category: 'fixed-deposit', product_name: 'SGD FD 12M', tenor_months: 12, rate: 0.50, promo_rate: 1.10, min_deposit_board: 5000,  min_deposit_promo: 20000, source_url: 'https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page' },

  // ── UOB ──────────────────────────────────────────────────────────────────
  { bank_slug: 'uob', product_category: 'fixed-deposit', product_name: 'SGD FD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page' },
  { bank_slug: 'uob', product_category: 'fixed-deposit', product_name: 'SGD FD 3M',  tenor_months: 3,  rate: 0.05, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page' },
  { bank_slug: 'uob', product_category: 'fixed-deposit', product_name: 'SGD FD 6M',  tenor_months: 6,  rate: 0.05, promo_rate: 1.10, min_deposit_board: 5000,  min_deposit_promo: 10000, source_url: 'https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page' },
  { bank_slug: 'uob', product_category: 'fixed-deposit', product_name: 'SGD FD 10M', tenor_months: 10, rate: 0.05, promo_rate: 1.15, min_deposit_board: 5000,  min_deposit_promo: 10000, source_url: 'https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page' },
  { bank_slug: 'uob', product_category: 'fixed-deposit', product_name: 'SGD FD 12M', tenor_months: 12, rate: 0.05, promo_rate: 1.15, min_deposit_board: 5000,  min_deposit_promo: 10000, source_url: 'https://www.uob.com.sg/personal/save/deposits/fixed-deposit.page' },

  // ── Standard Chartered ───────────────────────────────────────────────────
  // Promo is 9-month only (1 May–8 Jun 2026 window). Check monthly for new promo tenor.
  { bank_slug: 'standard-chartered', product_category: 'fixed-deposit', product_name: 'SGD TD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/' },
  { bank_slug: 'standard-chartered', product_category: 'fixed-deposit', product_name: 'SGD TD 3M',  tenor_months: 3,  rate: 0.10, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/' },
  { bank_slug: 'standard-chartered', product_category: 'fixed-deposit', product_name: 'SGD TD 6M',  tenor_months: 6,  rate: 0.30, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/' },
  { bank_slug: 'standard-chartered', product_category: 'fixed-deposit', product_name: 'SGD TD 9M',  tenor_months: 9,  rate: 0.55, promo_rate: 1.10, min_deposit_board: 5000,  min_deposit_promo: 25000, source_url: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/' },
  { bank_slug: 'standard-chartered', product_category: 'fixed-deposit', product_name: 'SGD TD 12M', tenor_months: 12, rate: 0.60, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/' },

  // ── Citibank ─────────────────────────────────────────────────────────────
  // Best short-tenor board rate of the 7. No public retail promo for non-Citigold.
  { bank_slug: 'citibank', product_category: 'fixed-deposit', product_name: 'SGD FD 1M',  tenor_months: 1,  rate: 0.60, promo_rate: null, min_deposit_board: 10000, min_deposit_promo: null, source_url: 'https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit/' },
  { bank_slug: 'citibank', product_category: 'fixed-deposit', product_name: 'SGD FD 3M',  tenor_months: 3,  rate: 0.60, promo_rate: null, min_deposit_board: 10000, min_deposit_promo: null, source_url: 'https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit/' },
  { bank_slug: 'citibank', product_category: 'fixed-deposit', product_name: 'SGD FD 6M',  tenor_months: 6,  rate: 0.60, promo_rate: null, min_deposit_board: 10000, min_deposit_promo: null, source_url: 'https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit/' },
  { bank_slug: 'citibank', product_category: 'fixed-deposit', product_name: 'SGD FD 12M', tenor_months: 12, rate: 0.70, promo_rate: null, min_deposit_board: 10000, min_deposit_promo: null, source_url: 'https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit/' },

  // ── HSBC ─────────────────────────────────────────────────────────────────
  // Promo requires HSBC Singapore App placement; weakest promo of the 7.
  { bank_slug: 'hsbc', product_category: 'fixed-deposit', product_name: 'SGD TD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: 5000,  min_deposit_promo: null,  source_url: 'https://www.hsbc.com.sg/savings/products/time-deposit/' },
  { bank_slug: 'hsbc', product_category: 'fixed-deposit', product_name: 'SGD TD 3M',  tenor_months: 3,  rate: 0.05, promo_rate: 0.58, min_deposit_board: 5000,  min_deposit_promo: 30000, source_url: 'https://www.hsbc.com.sg/savings/products/time-deposit/' },
  { bank_slug: 'hsbc', product_category: 'fixed-deposit', product_name: 'SGD TD 6M',  tenor_months: 6,  rate: 0.10, promo_rate: 0.65, min_deposit_board: 5000,  min_deposit_promo: 30000, source_url: 'https://www.hsbc.com.sg/savings/products/time-deposit/' },
  { bank_slug: 'hsbc', product_category: 'fixed-deposit', product_name: 'SGD TD 9M',  tenor_months: 9,  rate: 0.10, promo_rate: 0.70, min_deposit_board: 5000,  min_deposit_promo: 30000, source_url: 'https://www.hsbc.com.sg/savings/products/time-deposit/' },
  { bank_slug: 'hsbc', product_category: 'fixed-deposit', product_name: 'SGD TD 12M', tenor_months: 12, rate: 0.15, promo_rate: 0.80, min_deposit_board: 5000,  min_deposit_promo: 30000, source_url: 'https://www.hsbc.com.sg/savings/products/time-deposit/' },

  // ── Maybank ───────────────────────────────────────────────────────────────
  // Best standalone retail promo of the 7. Deposits Bundle can lift yield to ~1.41%.
  { bank_slug: 'maybank', product_category: 'fixed-deposit', product_name: 'SGD TD 1M',  tenor_months: 1,  rate: 0.05, promo_rate: null, min_deposit_board: null,  min_deposit_promo: null,  source_url: 'https://www.maybank2u.com.sg/en/personal/deposit/time-deposit.page' },
  { bank_slug: 'maybank', product_category: 'fixed-deposit', product_name: 'SGD TD 3M',  tenor_months: 3,  rate: 0.25, promo_rate: null, min_deposit_board: null,  min_deposit_promo: null,  source_url: 'https://www.maybank2u.com.sg/en/personal/deposit/time-deposit.page' },
  { bank_slug: 'maybank', product_category: 'fixed-deposit', product_name: 'SGD TD 6M',  tenor_months: 6,  rate: 0.05, promo_rate: 1.30, min_deposit_board: null,  min_deposit_promo: 20000, source_url: 'https://www.maybank2u.com.sg/en/personal/deposit/time-deposit.page' },
  { bank_slug: 'maybank', product_category: 'fixed-deposit', product_name: 'SGD TD 9M',  tenor_months: 9,  rate: 0.05, promo_rate: 1.30, min_deposit_board: null,  min_deposit_promo: 20000, source_url: 'https://www.maybank2u.com.sg/en/personal/deposit/time-deposit.page' },
  { bank_slug: 'maybank', product_category: 'fixed-deposit', product_name: 'SGD TD 12M', tenor_months: 12, rate: 0.05, promo_rate: 1.30, min_deposit_board: null,  min_deposit_promo: 20000, source_url: 'https://www.maybank2u.com.sg/en/personal/deposit/time-deposit.page' },
];

async function main() {
  console.log(`Seeding ${ROWS.length} rows into rate_history...`);

  // Check for existing data today to avoid double-inserts
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('rate_history')
    .select('bank_slug, tenor_months')
    .gte('recorded_at', today);

  const alreadySeeded = new Set(
    (existing ?? []).map((r) => `${r.bank_slug}:${r.tenor_months}`)
  );

  const toInsert = ROWS.filter(
    (r) => !alreadySeeded.has(`${r.bank_slug}:${r.tenor_months}`)
  );

  if (toInsert.length === 0) {
    console.log('All rows already seeded today. Nothing to insert.');
    return;
  }

  const { error } = await supabase.from('rate_history').insert(toInsert);
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`Done. Inserted ${toInsert.length} rows.`);
  if (toInsert.length < ROWS.length) {
    console.log(`Skipped ${ROWS.length - toInsert.length} rows already present today.`);
  }
}

main();
