/*
 * Monthly rate check manifest — SGD Fixed Deposits, 7 major Singapore banks.
 * Source URLs verified 1 June 2026. Baseline rates captured same date.
 *
 * Usage: POST /api/check-rates re-fetches every URL below, extracts current
 * rates, compares to baseline, and inserts new rate_history rows if changed.
 * Flag any movement of ≥ 0.10 percentage points for review.
 */

export interface TenorBaseline {
  months: number;
  boardRate: number | null;
  promoRate: number | null;
  minDepositBoard: number | null;
  minDepositPromo: number | null;
}

export interface BankCheckEntry {
  bankSlug: string;
  bankName: string;
  sourceUrl: string;
  tenors: TenorBaseline[];
}

export const RATE_CHECK_MANIFEST: BankCheckEntry[] = [
  {
    bankSlug: 'dbs',
    bankName: 'DBS',
    sourceUrl: 'https://www.dbs.com.sg/personal/rates/deposit-rates/fixed-deposits.page',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: 1000,  minDepositPromo: null },
      { months: 3,  boardRate: 0.15, promoRate: null, minDepositBoard: 1000,  minDepositPromo: null },
      { months: 6,  boardRate: 0.80, promoRate: null, minDepositBoard: 1000,  minDepositPromo: null },
      { months: 12, boardRate: 1.00, promoRate: null, minDepositBoard: 1000,  minDepositPromo: null },
      // Note: DBS rates above apply to S$1,000–S$19,999 only. ≥S$20,000 earns 0.05% on all tenors.
    ],
  },
  {
    bankSlug: 'ocbc',
    bankName: 'OCBC',
    sourceUrl: 'https://www.ocbc.com/personal-banking/deposits/fixed-deposit-account.page',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 3,  boardRate: 0.10, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 6,  boardRate: 0.20, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 12, boardRate: 0.50, promoRate: 1.10, minDepositBoard: 5000,  minDepositPromo: 20000 },
      // Promo is online-only (1.05% at branch). 18-month online promo also at 1.15%.
    ],
  },
  {
    bankSlug: 'uob',
    bankName: 'UOB',
    sourceUrl: 'https://www.uob.com.sg/personal/save/fixed-deposits/singapore-dollar-fixed-deposit.page',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 3,  boardRate: 0.05, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 6,  boardRate: 0.05, promoRate: 1.10, minDepositBoard: 5000,  minDepositPromo: 10000 },
      { months: 10, boardRate: 0.05, promoRate: 1.15, minDepositBoard: 5000,  minDepositPromo: 10000 },
      { months: 12, boardRate: 0.05, promoRate: 1.15, minDepositBoard: 5000,  minDepositPromo: 10000 },
    ],
  },
  {
    bankSlug: 'standard-chartered',
    bankName: 'Standard Chartered',
    sourceUrl: 'https://www.sc.com/sg/save/time-deposits/sgd-time-deposit/',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 3,  boardRate: 0.10, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 6,  boardRate: 0.30, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 9,  boardRate: 0.55, promoRate: 1.10, minDepositBoard: 5000,  minDepositPromo: 25000 },
      { months: 12, boardRate: 0.60, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      // Promo is 9-month only (1 May–8 Jun 2026). Check for new promo tenor each month.
    ],
  },
  {
    bankSlug: 'citibank',
    bankName: 'Citibank',
    sourceUrl: 'https://www.citibank.com.sg/personal-banking/deposits/fixed-deposit-account',
    tenors: [
      { months: 1,  boardRate: 0.60, promoRate: null, minDepositBoard: 10000, minDepositPromo: null },
      { months: 3,  boardRate: 0.60, promoRate: null, minDepositBoard: 10000, minDepositPromo: null },
      { months: 6,  boardRate: 0.60, promoRate: null, minDepositBoard: 10000, minDepositPromo: null },
      { months: 12, boardRate: 0.70, promoRate: null, minDepositBoard: 10000, minDepositPromo: null },
      // No public retail promo for non-Citigold customers as at Jun 2026.
    ],
  },
  {
    bankSlug: 'hsbc',
    bankName: 'HSBC',
    sourceUrl: 'https://www.hsbc.com.sg/accounts/products/time-deposit/',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: 5000,  minDepositPromo: null },
      { months: 3,  boardRate: 0.05, promoRate: 0.58, minDepositBoard: 5000,  minDepositPromo: 30000 },
      { months: 6,  boardRate: 0.10, promoRate: 0.65, minDepositBoard: 5000,  minDepositPromo: 30000 },
      { months: 9,  boardRate: 0.10, promoRate: 0.70, minDepositBoard: 5000,  minDepositPromo: 30000 },
      { months: 12, boardRate: 0.15, promoRate: 0.80, minDepositBoard: 5000,  minDepositPromo: 30000 },
      // Promo requires HSBC Singapore App placement; weakest promo of the 7.
    ],
  },
  {
    bankSlug: 'maybank',
    bankName: 'Maybank',
    sourceUrl: 'https://www.maybank2u.com.sg/en/personal/accounts/time-deposit/singapore-dollar-time-deposit.page',
    tenors: [
      { months: 1,  boardRate: 0.05, promoRate: null, minDepositBoard: null,  minDepositPromo: null },
      { months: 3,  boardRate: 0.25, promoRate: null, minDepositBoard: null,  minDepositPromo: null },
      { months: 6,  boardRate: 0.05, promoRate: 1.30, minDepositBoard: null,  minDepositPromo: 20000 },
      { months: 9,  boardRate: 0.05, promoRate: 1.30, minDepositBoard: null,  minDepositPromo: 20000 },
      { months: 12, boardRate: 0.05, promoRate: 1.30, minDepositBoard: null,  minDepositPromo: 20000 },
      // Best standalone retail rate of the 7. Deposits Bundle promo can lift effective yield to ~1.41%.
    ],
  },
];

/*
 * Aggregator pages to check monthly alongside the primary bank pages.
 * These catch promotions not prominently listed on bank sites.
 */
export const AGGREGATOR_CHECK_URLS = [
  { name: 'Beansprout FD tracker',    url: 'https://www.beansprout.co/tools/best-fixed-deposit-rates-singapore' },
  { name: 'MoneySmart FD comparison', url: 'https://www.moneysmart.sg/fixed-deposit' },
  { name: 'SingSaver FD comparison',  url: 'https://www.singsaver.com.sg/fixed-deposit' },
];

/*
 * Reference benchmarks — check these too; if 6M T-bill yield > best FD + 0.20%
 * the recommendation logic in the compare agent should flag T-bills instead.
 */
export const BENCHMARK_URLS = [
  { name: 'MAS T-bill results',   url: 'https://www.mas.gov.sg/bonds-and-bills/singapore-government-t-bills-information-for-individuals' },
  { name: 'MAS SSB rates',        url: 'https://www.mas.gov.sg/bonds-and-bills/singapore-savings-bonds' },
  { name: 'SDIC coverage limit',  url: 'https://www.sdic.org.sg/di-scheme/coverage' },
];
