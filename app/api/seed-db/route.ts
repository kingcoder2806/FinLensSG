import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  SAVINGS_ACCOUNTS,
  SEED_RATES,
  FD_BANK_META,
  HOME_LOANS,
  CREDIT_CARDS,
  ETF_PRODUCTS,
  SGS_BONDS,
  CORPORATE_BONDS,
} from '@/constants/products';
import { BANK_URLS } from '@/constants/bankUrls';

const SEED_SECRET = process.env.SEED_SECRET ?? 'finlens-seed-2026';

type BankKey = keyof typeof BANK_URLS;
const FD_TENORS = [3, 6, 12, 24] as const;

function fdProductName(bank: string, tenor: number): string {
  const tdBanks = new Set(['standard-chartered', 'hsbc', 'maybank']);
  return `${tdBanks.has(bank) ? 'SGD TD' : 'SGD FD'} ${tenor}M`;
}

// DELETE every row (workaround: delete where id IS NOT NULL)
async function clearTable(table: string) {
  return supabaseAdmin.from(table).delete().filter('id', 'not.is', null);
}

// ── GET — health check ────────────────────────────────────────────────────────

export async function GET() {
  // Check which tables exist
  const checks = await Promise.all([
    supabaseAdmin.from('rate_history').select('count'),
    supabaseAdmin.from('savings_accounts').select('count'),
    supabaseAdmin.from('home_loans').select('count'),
    supabaseAdmin.from('credit_cards').select('count'),
    supabaseAdmin.from('etf_products').select('count'),
    supabaseAdmin.from('bonds').select('count'),
  ]);

  const names = ['rate_history', 'savings_accounts', 'home_loans', 'credit_cards', 'etf_products', 'bonds'];
  const status: Record<string, string> = {};
  checks.forEach((r, i) => {
    status[names[i]] = r.error
      ? `missing — run supabase/migrations/001_create_product_tables.sql first`
      : `exists (${r.data?.[0]?.count ?? 0} rows)`;
  });

  const missingTables = checks.slice(1).some((r) => r.error);
  return NextResponse.json({
    tables: status,
    ready: !missingTables,
    seed_instructions: missingTables
      ? 'Run supabase/migrations/001_create_product_tables.sql in the Supabase SQL editor, then POST with the seed secret.'
      : 'POST to this endpoint with { "secret": "finlens-seed-2026" } to seed all product data.',
  });
}

// ── POST — seed all data ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: { secret?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }

  if (body.secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized — pass { "secret": "finlens-seed-2026" } in body' }, { status: 401 });
  }

  const log: string[] = [];
  let totalRows = 0;

  // ── rate_history: Fixed Deposits ─────────────────────────────────────────
  const fdRows = [];

  for (const meta of FD_BANK_META) {
    const { bank, isPromo, minAmount } = meta;
    const bankKey = bank as BankKey;

    for (const tenor of FD_TENORS) {
      const entry = SEED_RATES.fixedDeposit[tenor].find((r) => r.bank === bank);
      if (!entry) continue;

      fdRows.push({
        bank_slug: bank,
        product_category: 'fixed-deposit',
        product_name: fdProductName(bank, tenor),
        rate: isPromo ? 0 : entry.rate,
        promo_rate: isPromo ? entry.rate : null,
        tenor_months: tenor,
        source_url: BANK_URLS[bankKey]?.fixedDeposit ?? null,
        min_deposit_board: isPromo ? 1000 : minAmount,
        min_deposit_promo: isPromo ? minAmount : null,
      });
    }
  }

  await supabaseAdmin
    .from('rate_history')
    .delete()
    .eq('product_category', 'fixed-deposit')
    .in('tenor_months', [3, 6, 12, 24]);

  const { error: fdErr } = await supabaseAdmin.from('rate_history').insert(fdRows);
  if (fdErr) {
    log.push(`✗ rate_history (FD): ${fdErr.message}`);
  } else {
    log.push(`✓ rate_history (fixed-deposit): ${fdRows.length} rows`);
    totalRows += fdRows.length;
  }

  // ── rate_history: Savings ────────────────────────────────────────────────
  await supabaseAdmin.from('rate_history').delete().eq('product_category', 'savings');

  const savRateRows = SAVINGS_ACCOUNTS.map((s) => ({
    bank_slug: s.bank,
    product_category: 'savings',
    product_name: s.accountName,
    rate: s.baseRate ?? 0,
    promo_rate: s.maxRate,
    tenor_months: null,
    source_url: BANK_URLS[s.bank as BankKey]?.savings ?? null,
    min_deposit_board: s.balanceCap > 0 ? s.balanceCap : null,
    min_deposit_promo: null,
  }));

  const { error: savRateErr } = await supabaseAdmin.from('rate_history').insert(savRateRows);
  if (savRateErr) {
    log.push(`✗ rate_history (savings): ${savRateErr.message}`);
  } else {
    log.push(`✓ rate_history (savings): ${savRateRows.length} rows`);
    totalRows += savRateRows.length;
  }

  // ── savings_accounts ─────────────────────────────────────────────────────
  await clearTable('savings_accounts');

  const { error: savErr } = await supabaseAdmin.from('savings_accounts').insert(
    SAVINGS_ACCOUNTS.map((s) => ({
      bank_slug: s.bank,
      account_name: s.accountName,
      base_rate: s.baseRate,
      max_rate: s.maxRate,
      balance_cap: s.balanceCap,
      conditions: s.conditions,
      effective_date: s.effectiveDate,
    }))
  );
  if (savErr) {
    log.push(`✗ savings_accounts: ${savErr.message}`);
  } else {
    log.push(`✓ savings_accounts: ${SAVINGS_ACCOUNTS.length} rows`);
    totalRows += SAVINGS_ACCOUNTS.length;
  }

  // ── home_loans (existing schema: type, lockin, ref — not loan_type/lock_in/benchmark) ─
  await clearTable('home_loans');

  const { error: loanErr } = await supabaseAdmin.from('home_loans').insert(
    HOME_LOANS.map((l) => ({
      bank_slug: l.bank,
      package_name: l.packageName,
      type: l.type,
      rate: l.rate,
      lockin: l.lockin,
      ref: l.ref,
      min_loan: l.minLoan,
      notes: l.notes,
      effective_date: '2026-06-04',
    }))
  );
  if (loanErr) {
    log.push(`✗ home_loans: ${loanErr.message}`);
  } else {
    log.push(`✓ home_loans: ${HOME_LOANS.length} rows`);
    totalRows += HOME_LOANS.length;
  }

  // ── credit_cards (existing schema: name, type — not card_name/card_type) ─
  await clearTable('credit_cards');

  const { error: cardErr } = await supabaseAdmin.from('credit_cards').insert(
    CREDIT_CARDS.map((c) => ({
      bank_slug: c.bank,
      name: c.name,
      type: c.type,
      headline: c.headline,
      detail: c.detail,
      annual_fee: c.annualFee,
      min_income: c.minIncome,
      effective_date: '2026-06-04',
    }))
  );
  if (cardErr) {
    log.push(`✗ credit_cards: ${cardErr.message}`);
  } else {
    log.push(`✓ credit_cards: ${CREDIT_CARDS.length} rows`);
    totalRows += CREDIT_CARDS.length;
  }

  // ── etf_products ─────────────────────────────────────────────────────────
  await clearTable('etf_products');

  const { error: etfErr } = await supabaseAdmin.from('etf_products').insert(
    ETF_PRODUCTS.map((e) => ({
      ticker: e.ticker,
      name: e.name,
      etf_type: e.type,
      nav: e.nav,
      ytd_return: e.ytd,
      one_year_return: e.oneYear,
      expense_ratio: e.expenseRatio,
      aum_sgd_m: e.aumSgdM,
      dividend_yield: e.dividendYield,
      description: e.description,
      as_of: e.asOf,
    }))
  );
  if (etfErr) {
    log.push(`✗ etf_products: ${etfErr.message}`);
  } else {
    log.push(`✓ etf_products: ${ETF_PRODUCTS.length} rows`);
    totalRows += ETF_PRODUCTS.length;
  }

  // ── bonds (SGS + SSB + corporate) ────────────────────────────────────────
  await clearTable('bonds');

  const sgsRows = SGS_BONDS.map((b) => ({
    bond_name: b.name,
    issuer: 'Singapore Government / MAS',
    bond_type: b.type,
    tenor: b.tenor,
    maturity: b.maturity,
    coupon: b.coupon,
    price: b.price,
    ytm: b.ytm,
    rating: 'Aaa/AAA',
    call_date: null,
    notes: b.notes,
    as_of: b.asOf,
  }));

  const corpRows = CORPORATE_BONDS.map((b) => ({
    bond_name: `${b.issuer} ${b.name}`,
    issuer: b.issuer,
    bond_type: 'corporate',
    tenor: null,
    maturity: b.maturity,
    coupon: b.coupon,
    price: b.price,
    ytm: b.ytm,
    rating: b.rating,
    call_date: b.callDate ?? null,
    notes: b.notes,
    as_of: b.asOf,
  }));

  const { error: bondErr } = await supabaseAdmin.from('bonds').insert([...sgsRows, ...corpRows]);
  if (bondErr) {
    log.push(`✗ bonds: ${bondErr.message}`);
  } else {
    log.push(`✓ bonds: ${sgsRows.length + corpRows.length} rows (${sgsRows.length} SGS/SSB + ${corpRows.length} corporate)`);
    totalRows += sgsRows.length + corpRows.length;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const errors = log.filter((l) => l.startsWith('✗'));
  return NextResponse.json({
    success: errors.length === 0,
    total_rows_written: totalRows,
    log,
    ...(errors.length > 0 && {
      hint: 'Missing tables? Run supabase/migrations/001_create_product_tables.sql in the Supabase SQL editor first.',
    }),
  });
}
