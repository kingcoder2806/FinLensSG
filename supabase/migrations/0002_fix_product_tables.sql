-- 0002 — rebuild credit_cards and home_loans with the expected unique constraints.
--
-- These tables pre-existed in the Supabase project without the natural-key unique
-- constraints the updater upserts onto, so writes failed with:
--   42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
-- `create table if not exists` in 0001 left the old shape untouched. They hold only
-- scraped data (no user records, no foreign keys), so dropping + recreating is safe.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- credit_cards ----------------------------------------------------------------
drop table if exists credit_cards cascade;
create table credit_cards (
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

-- home_loans ------------------------------------------------------------------
drop table if exists home_loans cascade;
create table home_loans (
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

-- Defensive: ensure the other upsert targets also have their unique constraints
-- (no-ops if they already exist from 0001).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'savings_accounts'::regclass
      and contype = 'u' and conname = 'savings_accounts_bank_slug_account_name_key'
  ) then
    begin
      alter table savings_accounts add constraint savings_accounts_bank_slug_account_name_key unique (bank_slug, account_name);
    exception when others then null;
    end;
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'etf_products'::regclass
      and contype = 'u' and conname = 'etf_products_ticker_key'
  ) then
    begin
      alter table etf_products add constraint etf_products_ticker_key unique (ticker);
    exception when others then null;
    end;
  end if;
end $$;
