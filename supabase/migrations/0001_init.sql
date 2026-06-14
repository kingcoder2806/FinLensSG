-- FinLens SG — initial schema for the automated rate updater (/api/check-rates).
-- Run against the Supabase Postgres instance (DATABASE_URL) via the SQL editor or:
--   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
--
-- Mirrors the TypeScript row interfaces in lib/supabase.ts. The *_accounts/etf/bond
-- tables are "current view" rows (upserted on a natural key); rate_history is an
-- append-only time series feeding trend/alert features.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger ---------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- rate_history (append-only) --------------------------------------------------
create table if not exists rate_history (
  id                uuid primary key default gen_random_uuid(),
  bank_slug         text not null,
  product_category  text not null,
  product_name      text not null,
  rate              numeric not null,
  promo_rate        numeric,
  tenor_months      integer,
  source_url        text,
  min_deposit_board numeric,
  min_deposit_promo numeric,
  recorded_at       timestamptz not null default now()
);
create index if not exists rate_history_lookup_idx
  on rate_history (product_category, bank_slug, tenor_months, recorded_at desc);

-- savings_accounts ------------------------------------------------------------
create table if not exists savings_accounts (
  id             uuid primary key default gen_random_uuid(),
  bank_slug      text not null,
  account_name   text not null,
  base_rate      numeric,
  max_rate       numeric not null,
  balance_cap    numeric not null default 0,
  conditions     text,
  effective_date text,
  updated_at     timestamptz not null default now(),
  unique (bank_slug, account_name)
);
create or replace trigger savings_accounts_set_updated_at
  before update on savings_accounts
  for each row execute function set_updated_at();

-- home_loans ------------------------------------------------------------------
create table if not exists home_loans (
  id             uuid primary key default gen_random_uuid(),
  bank_slug      text not null,
  package_name   text not null,
  type           text not null,
  rate           numeric not null,
  lockin         text,
  ref            text,
  min_loan       text,
  notes          text,
  effective_date text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (bank_slug, package_name)
);
create or replace trigger home_loans_set_updated_at
  before update on home_loans
  for each row execute function set_updated_at();

-- credit_cards ----------------------------------------------------------------
create table if not exists credit_cards (
  id             uuid primary key default gen_random_uuid(),
  bank_slug      text not null,
  name           text not null,
  type           text not null,
  headline       text not null,
  detail         text,
  annual_fee     text,
  min_income     text,
  effective_date text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (bank_slug, name)
);
create or replace trigger credit_cards_set_updated_at
  before update on credit_cards
  for each row execute function set_updated_at();

-- etf_products ----------------------------------------------------------------
create table if not exists etf_products (
  id               uuid primary key default gen_random_uuid(),
  ticker           text not null unique,
  name             text not null,
  etf_type         text not null,
  nav              numeric,
  ytd_return       numeric,
  one_year_return  numeric,
  expense_ratio    numeric,
  aum_sgd_m        numeric,
  dividend_yield   numeric,
  description      text,
  as_of            text,
  updated_at       timestamptz not null default now()
);
create or replace trigger etf_products_set_updated_at
  before update on etf_products
  for each row execute function set_updated_at();

-- bonds -----------------------------------------------------------------------
create table if not exists bonds (
  id         uuid primary key default gen_random_uuid(),
  bond_name  text not null,
  issuer     text,
  bond_type  text not null,
  tenor      text,
  maturity   text,
  coupon     numeric,
  price      numeric,
  ytm        numeric not null,
  rating     text,
  call_date  text,
  notes      text,
  as_of      text,
  updated_at timestamptz not null default now(),
  unique (bond_name, maturity)
);
create or replace trigger bonds_set_updated_at
  before update on bonds
  for each row execute function set_updated_at();

-- alerts ----------------------------------------------------------------------
create table if not exists alerts (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  bank_slug        text,
  product_category text,
  target_rate      numeric,
  direction        text not null check (direction in ('above','below')),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- scrape_runs (updater audit log) ---------------------------------------------
create table if not exists scrape_runs (
  id            uuid primary key default gen_random_uuid(),
  started_at    timestamptz not null,
  finished_at   timestamptz,
  sources_total integer not null default 0,
  sources_ok    integer not null default 0,
  rows_written  integer not null default 0,
  status        text not null default 'success',
  detail        jsonb
);
create index if not exists scrape_runs_started_idx on scrape_runs (started_at desc);
