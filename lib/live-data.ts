/**
 * Server-side data layer: reads the live Supabase tables the scraper populates and
 * maps each row back to the TypeScript shapes the UI already uses. Every category
 * falls back to the static seed in constants/products.ts when the table is empty,
 * so the app renders correctly whether or not the DB has been populated.
 *
 * Imported dynamically from /api/data so a missing Supabase env never breaks build
 * or render — the route catches and the client falls back to its own seed copy.
 */

import {
  getAllSavingsAccounts,
  getAllHomeLoans,
  getAllCreditCards,
  getAllEtfs,
  getAllBonds,
  getLatestFdRates,
} from '@/lib/supabase';
import {
  SAVINGS_ACCOUNTS,
  HOME_LOANS,
  CREDIT_CARDS,
  ETF_PRODUCTS,
  SGS_BONDS,
  CORPORATE_BONDS,
  SEED_RATES,
  type SavingsAccount,
  type HomeLoan,
  type CreditCard,
  type CardType,
  type EtfProduct,
  type SgsBond,
  type CorporateBond,
} from '@/constants/products';
import { BANK_SLUGS, type BankSlug } from '@/constants/banks';

export interface LiveData {
  savings: SavingsAccount[];
  homeLoans: HomeLoan[];
  creditCards: CreditCard[];
  etfs: EtfProduct[];
  sgsBonds: SgsBond[];
  corporateBonds: CorporateBond[];
  fdRates: typeof SEED_RATES.fixedDeposit;
  meta: { source: 'live' | 'seed' | 'mixed'; asOf: string | null };
}

const known = new Set<string>(BANK_SLUGS);
const isKnownBank = (s: string): s is BankSlug => known.has(s);

function day(ts?: string | null): string | null {
  return ts ? ts.slice(0, 10) : null;
}
function maxDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Lean FD-only read for server components that just need the fixed-deposit table
 * (bank profile, sidebar). Merges live rate_history over the seed, falling back
 * entirely to seed on any error.
 */
export async function getLiveFdRates(): Promise<typeof SEED_RATES.fixedDeposit> {
  try {
    const fdLive = await getLatestFdRates();
    const buildTenor = (t: 3 | 6 | 12 | 24) =>
      BANK_SLUGS.map((bank) => {
        const live = fdLive.find((r) => r.bank_slug === bank && r.tenor_months === t);
        if (live) return { bank, rate: live.promo_rate ?? live.rate };
        const seed = SEED_RATES.fixedDeposit[t].find((r) => r.bank === bank);
        return { bank, rate: seed?.rate ?? 0 };
      });
    return { 3: buildTenor(3), 6: buildTenor(6), 12: buildTenor(12), 24: buildTenor(24) };
  } catch {
    return SEED_RATES.fixedDeposit;
  }
}

export async function getLiveData(): Promise<LiveData> {
  let asOf: string | null = null;
  let liveCount = 0;
  let seedCount = 0;

  // ── Savings ────────────────────────────────────────────────────────────────
  const savingsRows = (await getAllSavingsAccounts()).filter((r) => isKnownBank(r.bank_slug));
  let savings: SavingsAccount[];
  if (savingsRows.length) {
    liveCount++;
    savings = savingsRows.map((r) => {
      asOf = maxDate(asOf, day(r.updated_at));
      return {
        bank: r.bank_slug as BankSlug,
        accountName: r.account_name,
        baseRate: r.base_rate,
        maxRate: r.max_rate,
        balanceCap: r.balance_cap ?? 0,
        conditions: r.conditions ?? '',
        effectiveDate: r.effective_date ?? '',
      };
    });
  } else { seedCount++; savings = SAVINGS_ACCOUNTS; }

  // ── Home loans ───────────────────────────────────────────────────────────────
  const loanRows = (await getAllHomeLoans()).filter((r) => isKnownBank(r.bank_slug));
  let homeLoans: HomeLoan[];
  if (loanRows.length) {
    liveCount++;
    homeLoans = loanRows.map((r) => {
      asOf = maxDate(asOf, day(r.updated_at));
      return {
        bank: r.bank_slug as BankSlug,
        packageName: r.package_name,
        type: (r.type === 'Fixed' ? 'Fixed' : 'SORA') as HomeLoan['type'],
        rate: r.rate,
        lockin: r.lockin ?? '',
        ref: r.ref ?? '',
        minLoan: r.min_loan ?? '',
        notes: r.notes ?? '',
      };
    });
  } else { seedCount++; homeLoans = HOME_LOANS; }

  // ── Credit cards ─────────────────────────────────────────────────────────────
  const cardRows = (await getAllCreditCards()).filter((r) => isKnownBank(r.bank_slug));
  let creditCards: CreditCard[];
  if (cardRows.length) {
    liveCount++;
    creditCards = cardRows.map((r) => {
      asOf = maxDate(asOf, day(r.updated_at));
      return {
        bank: r.bank_slug as BankSlug,
        name: r.name,
        type: (r.type === 'Miles' ? 'Miles' : 'Cashback') as CardType,
        headline: r.headline,
        detail: r.detail ?? '',
        annualFee: r.annual_fee ?? '',
        minIncome: r.min_income ?? '',
      };
    });
  } else { seedCount++; creditCards = CREDIT_CARDS; }

  // ── ETFs ─────────────────────────────────────────────────────────────────────
  const etfRows = await getAllEtfs();
  let etfs: EtfProduct[];
  if (etfRows.length) {
    liveCount++;
    etfs = etfRows.map((r) => {
      asOf = maxDate(asOf, day(r.updated_at));
      return {
        ticker: r.ticker,
        name: r.name,
        type: (r.etf_type === 'bond-etf' ? 'bond-etf' : 'equity-etf') as EtfProduct['type'],
        nav: r.nav,
        ytd: r.ytd_return,
        oneYear: r.one_year_return,
        expenseRatio: r.expense_ratio,
        aumSgdM: r.aum_sgd_m,
        dividendYield: r.dividend_yield,
        description: r.description ?? '',
        asOf: r.as_of ?? day(r.updated_at) ?? '',
      };
    });
  } else { seedCount++; etfs = ETF_PRODUCTS; }

  // ── Bonds (split by type) ────────────────────────────────────────────────────
  const bondRows = await getAllBonds();
  let sgsBonds: SgsBond[];
  let corporateBonds: CorporateBond[];
  if (bondRows.length) {
    liveCount++;
    sgsBonds = bondRows
      .filter((r) => r.bond_type === 'sgs' || r.bond_type === 'ssb')
      .map((r) => ({
        name: r.bond_name,
        tenor: r.tenor ?? '',
        maturity: r.maturity ?? '',
        coupon: r.coupon,
        price: r.price ?? 100,
        ytm: r.ytm,
        type: (r.bond_type === 'ssb' ? 'ssb' : 'sgs') as SgsBond['type'],
        notes: r.notes ?? '',
        asOf: r.as_of ?? '',
      }));
    corporateBonds = bondRows
      .filter((r) => r.bond_type !== 'sgs' && r.bond_type !== 'ssb')
      .map((r) => ({
        issuer: r.issuer ?? '',
        name: r.bond_name,
        maturity: r.maturity ?? '',
        coupon: r.coupon ?? 0,
        price: r.price ?? 0,
        ytm: r.ytm,
        rating: r.rating ?? '',
        callDate: r.call_date ?? undefined,
        notes: r.notes ?? '',
        asOf: r.as_of ?? '',
      }));
    // If only one side existed, backfill the other from seed.
    if (!sgsBonds.length) sgsBonds = SGS_BONDS;
    if (!corporateBonds.length) corporateBonds = CORPORATE_BONDS;
  } else {
    seedCount++;
    sgsBonds = SGS_BONDS;
    corporateBonds = CORPORATE_BONDS;
  }

  // ── Fixed deposits: merge live rate_history over the seed table ───────────────
  const fdLive = await getLatestFdRates();
  if (fdLive.length) {
    liveCount++;
    for (const r of fdLive) asOf = maxDate(asOf, day(r.recorded_at));
  } else {
    seedCount++;
  }
  const buildTenor = (t: 3 | 6 | 12 | 24) =>
    BANK_SLUGS.map((bank) => {
      const live = fdLive.find((r) => r.bank_slug === bank && r.tenor_months === t);
      if (live) return { bank, rate: live.promo_rate ?? live.rate };
      const seed = SEED_RATES.fixedDeposit[t].find((r) => r.bank === bank);
      return { bank, rate: seed?.rate ?? 0 };
    });
  const fdRates = { 3: buildTenor(3), 6: buildTenor(6), 12: buildTenor(12), 24: buildTenor(24) };

  const source: LiveData['meta']['source'] =
    liveCount === 0 ? 'seed' : seedCount === 0 ? 'live' : 'mixed';

  return { savings, homeLoans, creditCards, etfs, sgsBonds, corporateBonds, fdRates, meta: { source, asOf } };
}
