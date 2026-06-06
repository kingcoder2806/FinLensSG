-- FinLens SG — Product tables migration
-- Run once in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/ewxkhpigqqtimrooyohm/sql/new
--
-- Existing tables (do NOT recreate): rate_history, credit_cards, home_loans, alerts
-- This script creates the 3 missing product tables.

-- ── Enable UUID extension (already enabled on most Supabase projects) ─────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Savings accounts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_accounts (
  id             uuid primary key default gen_random_uuid(),
  bank_slug      text not null,
  account_name   text not null,
  base_rate      numeric,
  max_rate       numeric not null,
  balance_cap    integer not null default 0,
  conditions     text,
  effective_date text,
  updated_at     timestamptz default now(),
  UNIQUE (bank_slug, account_name)
);

-- ── SGX-listed ETFs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS etf_products (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null unique,
  name            text not null,
  etf_type        text not null,
  nav             numeric,
  ytd_return      numeric,
  one_year_return numeric,
  expense_ratio   numeric,
  aum_sgd_m       numeric,
  dividend_yield  numeric,
  description     text,
  as_of           text,
  updated_at      timestamptz default now()
);

-- ── Government and corporate bonds ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bonds (
  id        uuid primary key default gen_random_uuid(),
  bond_name text not null,
  issuer    text,
  bond_type text not null,
  tenor     text,
  maturity  text,
  coupon    numeric,
  price     numeric,
  ytm       numeric not null,
  rating    text,
  call_date text,
  notes     text,
  as_of     text,
  updated_at timestamptz default now(),
  UNIQUE (bond_name, bond_type, COALESCE(tenor, ''))
);
