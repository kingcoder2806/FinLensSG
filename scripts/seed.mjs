/**
 * scripts/seed.mjs
 *
 * Creates all FinLens SG tables in Supabase (if they don't exist) and
 * populates them with the Jun-2026 seed data from constants/products.ts.
 *
 * Run:  node scripts/seed.mjs
 * (No extra packages needed beyond what's already installed — uses `pg`
 *  which we added as a devDependency.)
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// ── Load .env.local ───────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // Already set via shell env — fine to continue.
}

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Check .env.local');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── DDL ───────────────────────────────────────────────────────────────────────

const DDL = `
-- rate_history
CREATE TABLE IF NOT EXISTS rate_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_slug        TEXT NOT NULL,
  product_category TEXT NOT NULL,
  product_name     TEXT NOT NULL,
  rate             NUMERIC(6,4) NOT NULL,
  promo_rate       NUMERIC(6,4),
  tenor_months     INTEGER,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_history_bank_product
  ON rate_history (bank_slug, product_category, recorded_at DESC);

-- alerts
CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  bank_slug        TEXT,
  product_category TEXT,
  target_rate      NUMERIC(6,4),
  direction        TEXT CHECK (direction IN ('above','below')),
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_email  ON alerts (email);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts (active) WHERE active = TRUE;

-- home_loans
CREATE TABLE IF NOT EXISTS home_loans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_slug      TEXT NOT NULL,
  package_name   TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('SORA','Fixed')),
  rate           NUMERIC(5,2) NOT NULL,
  lockin         TEXT NOT NULL,
  ref            TEXT NOT NULL,
  min_loan       TEXT NOT NULL,
  notes          TEXT NOT NULL DEFAULT '',
  effective_date DATE NOT NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_home_loans_upsert ON home_loans (bank_slug, package_name);
CREATE INDEX IF NOT EXISTS idx_home_loans_bank   ON home_loans (bank_slug);
CREATE INDEX IF NOT EXISTS idx_home_loans_active ON home_loans (active) WHERE active = TRUE;

-- credit_cards
CREATE TABLE IF NOT EXISTS credit_cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_slug      TEXT NOT NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('Cashback','Miles')),
  headline       TEXT NOT NULL,
  detail         TEXT NOT NULL,
  annual_fee     TEXT NOT NULL,
  min_income     TEXT NOT NULL DEFAULT '—',
  effective_date DATE NOT NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_cards_upsert ON credit_cards (bank_slug, name);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank   ON credit_cards (bank_slug);
CREATE INDEX IF NOT EXISTS idx_credit_cards_type   ON credit_cards (type);
CREATE INDEX IF NOT EXISTS idx_credit_cards_active ON credit_cards (active) WHERE active = TRUE;

-- etf_products
CREATE TABLE IF NOT EXISTS etf_products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker         TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('bond-etf','equity-etf')),
  nav            NUMERIC(10,4),
  ytd            NUMERIC(6,2),
  one_year       NUMERIC(6,2),
  expense_ratio  NUMERIC(5,3),
  aum_sgd_m      NUMERIC(10,2),
  dividend_yield NUMERIC(5,2),
  description    TEXT NOT NULL DEFAULT '',
  as_of          TEXT NOT NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etf_products_type   ON etf_products (type);
CREATE INDEX IF NOT EXISTS idx_etf_products_active ON etf_products (active) WHERE active = TRUE;
`;

// ── Seed data ─────────────────────────────────────────────────────────────────

const HOME_LOANS = [
  { bank_slug: 'dbs',                package_name: '3M SORA + 0.28%',  type: 'SORA',  rate: 2.35, lockin: 'None',    ref: '3M SORA', min_loan: 'S$1,000,000',                         notes: 'Green Home Loan — Green Mark new launches only. Y3–4: +0.30%, thereafter +0.60%.',                                   effective_date: '2026-06-03' },
  { bank_slug: 'hsbc',               package_name: 'Premier package',   type: 'SORA',  rate: 1.33, lockin: '2 years', ref: '3M SORA', min_loan: 'S$900,000',                           notes: 'Effective rate via SmartMortgage deposit-offset. Premier only, requires ≥S$200k relationship balance.',               effective_date: '2026-06-03' },
  { bank_slug: 'citibank',           package_name: '1M SORA + 0.55%',  type: 'SORA',  rate: 2.60, lockin: '2 years', ref: '1M SORA', min_loan: 'S$100,000',                           notes: 'Completed property <S$1M. Y3: +0.70%, thereafter +0.85%. Citigold ≥S$1M: spread +0.45% Y1–2. Fixed 1.70% also avail.', effective_date: '2026-06-03' },
  { bank_slug: 'uob',                package_name: '3M SORA + 0.70%',  type: 'SORA',  rate: 2.77, lockin: '2 years', ref: '3M SORA', min_loan: 'S$250,000',                           notes: 'Direct-to-bank package. Y3: +0.80%, thereafter +1.00%. One free conversion after 24 months.',                         effective_date: '2026-06-03' },
  { bank_slug: 'maybank',            package_name: '3M SORA + 0.70%',  type: 'SORA',  rate: 2.77, lockin: '2 years', ref: '3M SORA', min_loan: 'S$100,000',                           notes: 'Completed property floating. Y3+: +1.00%. Fixed alternatives: 3.30% (2Y) or 3.75% (3Y).',                             effective_date: '2026-06-03' },
  { bank_slug: 'ocbc',               package_name: '1M SORA + 0.98%',  type: 'SORA',  rate: 3.03, lockin: '2 years', ref: '1M SORA', min_loan: 'S$200,000 (HDB) / S$300,000 (pvt)',  notes: 'Thereafter: +1.40%. Refinancing cash reward up to S$2,800 until Jun 2026.',                                            effective_date: '2026-06-03' },
  { bank_slug: 'standard-chartered', package_name: '3M SORA + 1.00%',  type: 'SORA',  rate: 3.07, lockin: '2 years', ref: '3M SORA', min_loan: 'S$100,000',                           notes: 'Same +1.00% spread throughout. Residential property only. Bank may revise without prior notice.',                    effective_date: '2026-06-03' },
];

const CREDIT_CARDS = [
  { bank_slug: 'uob',                name: 'UOB One Card',             type: 'Cashback', headline: 'Up to 20%',      detail: 'Up to 20% rebate at Grab, Shopee, Cold Storage, Giant, Guardian & SPC. Tiered on min S$500/S$1,000/S$2,000 monthly spend.',                                       annual_fee: 'S$196.20 (waived 1st yr)', min_income: 'S$30,000 (SG/PR) · S$40,000 (foreigners)', effective_date: '2026-06-03' },
  { bank_slug: 'ocbc',               name: 'OCBC 365',                 type: 'Cashback', headline: 'Up to 6%',       detail: '6% on dining incl. delivery, 3% on groceries & transport, 0.3% unlimited base. Min S$800/mo.',                                                                    annual_fee: 'S$196.20 (waived 1st yr)', min_income: '—',                                        effective_date: '2026-06-03' },
  { bank_slug: 'dbs',                name: 'DBS Live Fresh',           type: 'Cashback', headline: '0.3%',           detail: '0.3% unlimited cashback on all spend. Zero FX fees promo ongoing. Min S$800/mo.',                                                                                   annual_fee: 'S$196.20 (waived 1st yr)', min_income: 'S$30,000',                                 effective_date: '2026-06-03' },
  { bank_slug: 'maybank',            name: 'Maybank Family & Friends', type: 'Cashback', headline: '8%',             detail: '8% cashback across selected everyday categories. 3-year annual fee waiver. Spend gift campaign valid till 30 Jun 2026.',                                             annual_fee: 'Free (3yr waiver)',         min_income: 'S$30,000 (SG/PR) · S$45,000 (Malaysians) · S$60,000 (foreigners)', effective_date: '2026-06-03' },
  { bank_slug: 'dbs',                name: 'DBS Altitude',             type: 'Miles',    headline: '1.3–4 mpd',      detail: 'Miles never expire. 4 mpd on flights & hotels via DBS Travel Marketplace. Airport lounge access with Visa Infinite.',                                              annual_fee: 'S$196.20',                  min_income: '—',                                        effective_date: '2026-06-03' },
  { bank_slug: 'citibank',           name: 'Citi Rewards',             type: 'Miles',    headline: '10X Points',     detail: '10X Rewards points (~4 mpd) on online and in-store shopping. Points never expire. Welcome offer: 40,000 bonus ThankYou Points.',                                   annual_fee: 'S$196.20 (waived 1st yr)', min_income: '—',                                        effective_date: '2026-06-03' },
  { bank_slug: 'standard-chartered', name: 'SC Journey',               type: 'Miles',    headline: '3 mpd',          detail: '3 mpd online + 2 mpd on all local spend incl. transport & dining. No minimum spend.',                                                                               annual_fee: 'S$196.20 (waived 1st yr)', min_income: '—',                                        effective_date: '2026-06-03' },
  { bank_slug: 'hsbc',               name: 'HSBC Revolution',          type: 'Miles',    headline: 'Up to 20× Rewards', detail: '20× accelerated Rewards on online & contactless spend. No annual fee. Finance charge 27.8% p.a. Promo: 1 Apr–30 Jun 2026.', annual_fee: 'S$0',                  min_income: 'S$30,000 (SG/PR) · S$40,000 (foreigners/self-employed)',           effective_date: '2026-06-03' },
];

const ETF_PRODUCTS = [
  { ticker: 'A35.SI',   name: 'ABF Singapore Bond Index Fund',           type: 'bond-etf',   nav: 1.1498,  ytd: 2.61,  one_year: null,  expense_ratio: null, aum_sgd_m: 1155,  dividend_yield: 2.32, as_of: '2 Jun 2026',   description: 'Tracks the iBoxx ABF Singapore Bond Index. SGD investment-grade government and quasi-government bonds.' },
  { ticker: 'G3B.SI',   name: 'Nikko AM Singapore STI ETF',              type: 'equity-etf', nav: 5.23,    ytd: 10.73, one_year: 33.54, expense_ratio: 0.24, aum_sgd_m: 1390,  dividend_yield: 3.65, as_of: '2 Jun 2026',   description: 'Tracks the Straits Times Index (STI). 30 largest Singapore-listed companies. Semi-annual distributions.' },
  { ticker: 'CLR.SI',   name: 'Lion-OCBC China Leaders ETF',             type: 'equity-etf', nav: 1.8524,  ytd: null,  one_year: 16.1,  expense_ratio: null, aum_sgd_m: 96,    dividend_yield: 3.0,  as_of: '29 May 2026',  description: 'Tracks diversified leading Chinese companies. OCBC group (Lion Global Investors). 12M gross dividend 3.0%.' },
  { ticker: 'HST.SI',   name: 'Lion-OCBC HSTECH ETF',                    type: 'equity-etf', nav: null,    ytd: null,  one_year: -7.2,  expense_ratio: 0.45, aum_sgd_m: 479,   dividend_yield: null, as_of: '2 Jun 2026',   description: 'Tracks Hang Seng TECH Index. Hong Kong-listed technology companies. OCBC group (Lion Global Investors). AUM as at Apr 2026. Ann. since inception: –9.8%.' },
  { ticker: 'PASD.SI',  name: 'UOBAM Ping An FTSE ASEAN Dividend ETF',  type: 'equity-etf', nav: null,    ytd: null,  one_year: null,  expense_ratio: 0.45, aum_sgd_m: null,  dividend_yield: 6.0,  as_of: '3 Jun 2026',   description: 'Tracks FTSE ASEAN Dividend index. UOB group (UOBAM). Listed 29 Jan 2026. Target dividends ≥6% p.a. in 2026 & 2027.' },
  { ticker: 'UA50.SI',  name: 'UOBAM FTSE China A50 Index ETF',          type: 'equity-etf', nav: null,    ytd: null,  one_year: null,  expense_ratio: 0.45, aum_sgd_m: null,  dividend_yield: null, as_of: '3 Jun 2026',   description: 'Tracks FTSE China A50 Index. UOB group (UOBAM). Annual distributions intended around December.' },
];

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  await client.connect();
  console.log('Connected to Supabase Postgres');

  // 1. Create tables
  console.log('\n── Creating tables (IF NOT EXISTS)…');
  await client.query(DDL);
  console.log('   Tables ready.');

  // 2. Upsert home_loans  (keyed on bank_slug + package_name)
  console.log('\n── Seeding home_loans…');
  for (const r of HOME_LOANS) {
    await client.query(
      `INSERT INTO home_loans (bank_slug, package_name, type, rate, lockin, ref, min_loan, notes, effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (bank_slug, package_name) DO UPDATE
         SET type=$3, rate=$4, lockin=$5, ref=$6, min_loan=$7, notes=$8, effective_date=$9, updated_at=NOW()`,
      [r.bank_slug, r.package_name, r.type, r.rate, r.lockin, r.ref, r.min_loan, r.notes, r.effective_date],
    );
    process.stdout.write(`   ✓ ${r.bank_slug} — ${r.package_name}\n`);
  }

  // 3. Upsert credit_cards (keyed on bank_slug + name)
  console.log('\n── Seeding credit_cards…');
  for (const c of CREDIT_CARDS) {
    await client.query(
      `INSERT INTO credit_cards (bank_slug, name, type, headline, detail, annual_fee, min_income, effective_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (bank_slug, name) DO UPDATE
         SET type=$3, headline=$4, detail=$5, annual_fee=$6, min_income=$7, effective_date=$8, updated_at=NOW()`,
      [c.bank_slug, c.name, c.type, c.headline, c.detail, c.annual_fee, c.min_income, c.effective_date],
    );
    process.stdout.write(`   ✓ ${c.bank_slug} — ${c.name}\n`);
  }

  // 4. Upsert etf_products (keyed on ticker — already has UNIQUE constraint)
  console.log('\n── Seeding etf_products…');
  for (const e of ETF_PRODUCTS) {
    await client.query(
      `INSERT INTO etf_products (ticker, name, type, nav, ytd, one_year, expense_ratio, aum_sgd_m, dividend_yield, description, as_of)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (ticker) DO UPDATE
         SET name=$2, type=$3, nav=$4, ytd=$5, one_year=$6, expense_ratio=$7, aum_sgd_m=$8,
             dividend_yield=$9, description=$10, as_of=$11, updated_at=NOW()`,
      [e.ticker, e.name, e.type, e.nav, e.ytd, e.one_year, e.expense_ratio, e.aum_sgd_m, e.dividend_yield, e.description, e.as_of],
    );
    process.stdout.write(`   ✓ ${e.ticker} — ${e.name}\n`);
  }

  await client.end();
  console.log('\n✅ Seed complete.');
}

run().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
