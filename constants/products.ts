import type { BankSlug } from './banks';

export type ProductCategory =
  | 'savings'
  | 'fixed-deposit'
  | 'etf'
  | 'credit-card'
  | 'home-loan';

export interface ProductCategoryInfo {
  id: ProductCategory;
  label: string;
  description: string;
  icon: string;
  unit: string;
}

export const PRODUCT_CATEGORIES: ProductCategoryInfo[] = [
  {
    id: 'savings',
    label: 'Savings Accounts',
    description: 'High-yield and promotional savings rates',
    icon: '💰',
    unit: '% p.a.',
  },
  {
    id: 'fixed-deposit',
    label: 'Fixed Deposits',
    description: 'Guaranteed returns for 3–24 month tenors',
    icon: '🔒',
    unit: '% p.a.',
  },
  {
    id: 'etf',
    label: 'ETFs & Unit Trusts',
    description: 'Exchange-traded funds and managed funds',
    icon: '📈',
    unit: 'returns',
  },
  {
    id: 'credit-card',
    label: 'Credit Cards',
    description: 'Cashback, miles, and rewards cards',
    icon: '💳',
    unit: '% cashback / mpd',
  },
  {
    id: 'home-loan',
    label: 'Home Loans',
    description: 'SORA-pegged and fixed rate mortgages',
    icon: '🏠',
    unit: '% p.a.',
  },
];

export interface FixedDepositTenor {
  months: number;
  label: string;
}

export const FD_TENORS: FixedDepositTenor[] = [
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' },
  { months: 24, label: '24 months' },
];

export type HomeLoadType = 'sora' | 'fixed';

export const HOME_LOAN_TYPES = [
  { id: 'sora' as HomeLoadType, label: 'SORA-pegged', description: 'Floating rate pegged to SORA' },
  { id: 'fixed' as HomeLoadType, label: 'Fixed Rate', description: 'Fixed for initial lock-in period' },
];

export const CREDIT_CARD_TYPES = [
  { id: 'cashback', label: 'Cashback', icon: '💵' },
  { id: 'miles', label: 'Air Miles', icon: '✈️' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
];

/* Quick prompt suggestions per page/agent */
export const QUICK_PROMPTS = {
  rates: [
    'What are the best savings account rates right now?',
    'Show me DBS fixed deposit rates for 12 months',
    'Compare OCBC and UOB savings rates',
    'What is the current SORA rate?',
    'Best cashback credit cards in Singapore 2024',
  ],
  compare: [
    'Rank all banks by 12-month fixed deposit rate',
    'Which bank has the best savings account for $50k?',
    'Compare home loan rates across all banks',
    'Best miles credit cards for frequent flyers',
    'Which bank offers the highest ETF returns?',
  ],
  banks: [
    'What products does this bank offer?',
    'Tell me about their savings account promotions',
    'What are their fixed deposit rates?',
    'How do I contact customer service?',
    'What credit cards do they have?',
  ],
};

/*
 * Fixed deposit reference rates — mid-2026 snapshot (captured 1 June 2026).
 * Shows best available rate per bank per tenor (promo where offered, board otherwise).
 * Used as fallback when ANTHROPIC_API_KEY is missing. Update monthly via /api/check-rates.
 */
export const SEED_RATES = {
  fixedDeposit: {
    // 3-month: most promos don't cover this tenor; Citi board and HSBC promo lead
    3: [
      { bank: 'dbs', rate: 0.15 },              // board (S$1k–19,999)
      { bank: 'ocbc', rate: 0.10 },              // board, no 3M promo
      { bank: 'uob', rate: 0.05 },               // board, no 3M promo
      { bank: 'standard-chartered', rate: 0.10 },// board, no 3M promo
      { bank: 'citibank', rate: 0.60 },          // board (best short-tenor of the 7)
      { bank: 'hsbc', rate: 0.58 },              // promo min S$30,000
      { bank: 'maybank', rate: 0.25 },           // approx board, no 3M promo
    ],
    // 6-month: Maybank and UOB promos lead
    6: [
      { bank: 'dbs', rate: 0.80 },              // board (S$1k–19,999 only)
      { bank: 'ocbc', rate: 0.20 },              // board, no 6M promo
      { bank: 'uob', rate: 1.10 },               // promo min S$10,000 fresh funds
      { bank: 'standard-chartered', rate: 0.30 },// board, no 6M promo
      { bank: 'citibank', rate: 0.60 },          // board
      { bank: 'hsbc', rate: 0.65 },              // promo min S$30,000
      { bank: 'maybank', rate: 1.30 },           // promo min S$20,000
    ],
    // 12-month: Maybank 1.30%, UOB 1.15%, OCBC 1.10% lead
    12: [
      { bank: 'dbs', rate: 1.00 },              // board (S$1k–19,999 only; ≥S$20k earns 0.05%)
      { bank: 'ocbc', rate: 1.10 },              // promo min S$20,000 fresh funds
      { bank: 'uob', rate: 1.15 },               // promo min S$10,000 fresh funds
      { bank: 'standard-chartered', rate: 0.60 },// board, no 12M promo (promo is 9M only)
      { bank: 'citibank', rate: 0.70 },          // board
      { bank: 'hsbc', rate: 0.80 },              // promo min S$30,000
      { bank: 'maybank', rate: 1.30 },           // promo min S$20,000
    ],
    // 24-month: not actively offered by any of the 7 banks at competitive rates
    24: [
      { bank: 'dbs', rate: 0.05 },
      { bank: 'ocbc', rate: 0.05 },
      { bank: 'uob', rate: 0.05 },
      { bank: 'standard-chartered', rate: 0.05 },
      { bank: 'citibank', rate: 0.05 },
      { bank: 'hsbc', rate: 0.05 },
      { bank: 'maybank', rate: 0.05 },
    ],
  },
};

// ── Savings Accounts ──────────────────────────────────────────────────────────

export interface SavingsAccount {
  bank: BankSlug;
  accountName: string;
  baseRate: number | null; // null = unspecified on public page
  maxRate: number;
  balanceCap: number; // S$ cap on which max rate applies; 0 = incremental/unspecified
  conditions: string;
  effectiveDate: string;
}

export const SAVINGS_ACCOUNTS: SavingsAccount[] = [
  {
    bank: 'dbs',
    accountName: 'DBS Multiplier',
    baseRate: null,
    maxRate: 4.10,
    balanceCap: 100000,
    conditions: 'Salary credit + 1+ categories: card/PayLah! spend, home loan, insurance, investments. Under-29 earns bonus without income credit.',
    effectiveDate: 'Jun 2026',
  },
  {
    bank: 'ocbc',
    accountName: 'OCBC 360 Account',
    baseRate: 0.05,
    maxRate: 4.45,
    balanceCap: 100000,
    conditions: 'Salary ≥S$1,800 + increase ADB S$500 + card spend ≥S$500 + eligible insurance + investment products',
    effectiveDate: '1 May 2026',
  },
  {
    bank: 'uob',
    accountName: 'UOB One Account',
    baseRate: 0.05,
    maxRate: 3.40,
    balanceCap: 150000,
    conditions: 'Card spend ≥S$500/month + salary ≥S$1,600 via GIRO/PayNow. 3.40% applies to 3rd S$25k band only.',
    effectiveDate: '1 Dec 2025',
  },
  {
    bank: 'standard-chartered',
    accountName: "Bonus$aver",
    baseRate: 0.05,
    maxRate: 5.85,
    balanceCap: 100000,
    conditions: 'Salary ≥S$3,000 + card spend ≥S$1,000 + invest S$30k in unit trusts/equities + insure S$24k/yr annual premium',
    effectiveDate: '1 May 2026',
  },
  {
    bank: 'citibank',
    accountName: 'Citi MaxiGain',
    baseRate: 0.01,
    maxRate: 3.01,
    balanceCap: 100000,
    conditions: "Monthly lowest balance ≥ previous month's; counter steps up 0.25%/month up to 3.00% after month 12. Downgrade announced from 1 Jul 2026.",
    effectiveDate: '1 Mar 2025',
  },
  {
    bank: 'hsbc',
    accountName: 'HSBC Everyday Global',
    baseRate: 0.05,
    maxRate: 1.05,
    balanceCap: 0,
    conditions: 'Everyday+ programme: deposit ≥S$2,000/month (Personal) or S$5,000 (Premier) + 5 eligible transactions. 1.00% bonus on incremental top-up amount only.',
    effectiveDate: '31 Mar 2025',
  },
  {
    bank: 'maybank',
    accountName: 'Maybank SaveUp',
    baseRate: 0.05,
    maxRate: 4.00,
    balanceCap: 75000,
    conditions: '3+ qualifying products: GIRO/salary ≥S$2,000, card spend ≥S$500, Etiqa insurance ≥S$5k, unit trusts ≥S$25k, structured deposits ≥S$30k',
    effectiveDate: '1 May 2026',
  },
];

// ── Listed ETFs ───────────────────────────────────────────────────────────────

export interface EtfProduct {
  ticker: string;
  name: string;
  type: 'bond-etf' | 'equity-etf';
  nav: number | null;          // null when not publicly surfaced in HTML
  ytd: number | null;          // null when not surfaced
  oneYear: number | null;
  expenseRatio: number | null;
  aumSgdM: number | null;      // null when not surfaced
  dividendYield: number | null;
  description: string;
  asOf: string;
}

export const ETF_PRODUCTS: EtfProduct[] = [
  // ── Broad market / index ──────────────────────────────────────────────────
  {
    ticker: 'A35.SI',
    name: 'ABF Singapore Bond Index Fund',
    type: 'bond-etf',
    nav: 1.1498,
    ytd: 2.61,
    oneYear: null,
    expenseRatio: null,
    aumSgdM: 1155,
    dividendYield: 2.32,
    description: 'Tracks the iBoxx ABF Singapore Bond Index. Invests in SGD investment-grade government and quasi-government bonds.',
    asOf: '2 Jun 2026',
  },
  {
    ticker: 'G3B.SI',
    name: 'Nikko AM Singapore STI ETF',
    type: 'equity-etf',
    nav: 5.23,
    ytd: 10.73,
    oneYear: 33.54,
    expenseRatio: 0.24,
    aumSgdM: 1390,
    dividendYield: 3.65,
    description: 'Tracks the Straits Times Index (STI). Invests in the 30 largest Singapore-listed companies. Semi-annual distributions.',
    asOf: '2 Jun 2026',
  },
  // ── OCBC group — Lion Global Investors ────────────────────────────────────
  {
    ticker: 'CLR.SI',
    name: 'Lion-OCBC China Leaders ETF',
    type: 'equity-etf',
    nav: 1.8524,
    ytd: null,
    oneYear: 16.1,
    expenseRatio: null,
    aumSgdM: 96,
    dividendYield: 3.0,
    description: 'Tracks a diversified index of leading Chinese companies. Managed by Lion Global Investors (OCBC group). 12-month gross dividend yield 3.0%. Source: Lion Global official page, 29 May 2026.',
    asOf: '29 May 2026',
  },
  {
    ticker: 'HST.SI',
    name: 'Lion-OCBC HSTECH ETF',
    type: 'equity-etf',
    nav: null,
    ytd: null,
    oneYear: -7.2,
    expenseRatio: 0.45,
    aumSgdM: 479,
    dividendYield: null,
    description: 'Tracks the Hang Seng TECH Index. Invests in Hong Kong-listed technology companies. Managed by Lion Global Investors (OCBC group). AUM as at Apr 2026. Annualised since inception: –9.8%.',
    asOf: '2 Jun 2026',
  },
  // ── UOB group — UOB Asset Management ─────────────────────────────────────
  {
    ticker: 'PASD.SI',
    name: 'UOBAM Ping An FTSE ASEAN Dividend ETF',
    type: 'equity-etf',
    nav: null,
    ytd: null,
    oneYear: null,
    expenseRatio: 0.45,
    aumSgdM: null,
    dividendYield: 6.0,
    description: 'Tracks the FTSE ASEAN Dividend index. Managed by UOB Asset Management. Listed 29 Jan 2026. UOBAM targets dividend distributions of at least 6.0% p.a. in 2026 and 2027. Too new for 1Y history.',
    asOf: '3 Jun 2026',
  },
  {
    ticker: 'UA50.SI',
    name: 'UOBAM FTSE China A50 Index ETF',
    type: 'equity-etf',
    nav: null,
    ytd: null,
    oneYear: null,
    expenseRatio: 0.45,
    aumSgdM: null,
    dividendYield: null,
    description: 'Tracks the FTSE China A50 Index. Managed by UOB Asset Management. Annual distributions intended around December. Management fee 0.45% p.a.',
    asOf: '3 Jun 2026',
  },
];

// ── Singapore Government Bonds ────────────────────────────────────────────────

export interface SgsBond {
  name: string;
  tenor: string;
  maturity: string;
  coupon: number | null; // null for SSB (step-up structure)
  price: number;
  ytm: number;
  type: 'sgs' | 'ssb';
  notes: string;
  asOf: string;
}

export const SGS_BONDS: SgsBond[] = [
  {
    name: '2.750% SGS',
    tenor: '2Y',
    maturity: '1 Mar 2028',
    coupon: 2.750,
    price: 102.79,
    ytm: 1.56,
    type: 'sgs',
    notes: 'Benchmark 2-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: '2.875% SGS',
    tenor: '5Y',
    maturity: '1 Sep 2030',
    coupon: 2.875,
    price: 104.88,
    ytm: 1.68,
    type: 'sgs',
    notes: 'Benchmark 5-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: '2.375% SGS',
    tenor: '10Y',
    maturity: '1 Jun 2035',
    coupon: 2.375,
    price: 102.13,
    ytm: 2.02,
    type: 'sgs',
    notes: 'Benchmark 10-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: '2.750% SGS',
    tenor: '20Y',
    maturity: '1 Aug 2046',
    coupon: 2.750,
    price: 112.28,
    ytm: 1.99,
    type: 'sgs',
    notes: 'Benchmark 20-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: '3.000% SGS',
    tenor: '30Y',
    maturity: '1 Sep 2055',
    coupon: 3.000,
    price: 125.81,
    ytm: 2.04,
    type: 'sgs',
    notes: 'Benchmark 30-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: '2.875% SGS',
    tenor: '50Y',
    maturity: '1 Mar 2071',
    coupon: 2.875,
    price: 125.27,
    ytm: 2.14,
    type: 'sgs',
    notes: 'Benchmark 50-year SGS. MAS benchmark quotation.',
    asOf: '2 Jun 2026',
  },
  {
    name: 'SSB GX26050H',
    tenor: '10Y step-up',
    maturity: '10-year redeemable',
    coupon: null,
    price: 100,
    ytm: 2.49,
    type: 'ssb',
    notes: 'Singapore Savings Bond SBMAY26. Not exchange-traded. Apply via DBS/POSB, OCBC or UOB + individual CDP account. Monthly redemption allowed.',
    asOf: '2 Jun 2026',
  },
];

// ── Retail Corporate Bonds ────────────────────────────────────────────────────

export interface CorporateBond {
  issuer: string;
  name: string;
  maturity: string;
  coupon: number;
  price: number;
  ytm: number;
  rating: string;
  callDate?: string;
  notes: string;
  asOf: string;
}

export const CORPORATE_BONDS: CorporateBond[] = [
  {
    issuer: 'Temasek',
    name: 'T2026-S$ Bond',
    maturity: '24 Nov 2026',
    coupon: 1.80,
    price: 100.0,
    ytm: 1.88,
    rating: 'Aaa/AAA',
    notes: 'Very short remaining tenor. Highest credit quality. SGX volume ~10,000 on 2 Jun 2026.',
    asOf: '2 Jun 2026',
  },
  {
    issuer: 'Astrea 7',
    name: 'Class A-1',
    maturity: '27 May 2032',
    coupon: 4.125,
    price: 102.6,
    ytm: 3.65,
    rating: 'A+sf',
    callDate: '27 May 2027',
    notes: 'Step-up structure if not called at first call date. SGX-listed.',
    asOf: '2 Jun 2026',
  },
  {
    issuer: 'Astrea 8',
    name: 'Class A-1',
    maturity: '19 Jul 2039',
    coupon: 4.35,
    price: 106.9,
    ytm: 3.83,
    rating: 'A+sf',
    callDate: '19 Jul 2029',
    notes: 'Long duration retail bond. SGX volume ~18,000 on 2 Jun 2026.',
    asOf: '2 Jun 2026',
  },
  {
    issuer: 'Astrea 9',
    name: 'Class A-1',
    maturity: '8 Aug 2040',
    coupon: 3.40,
    price: 103.0,
    ytm: 3.23,
    rating: 'A+sf',
    callDate: '8 Aug 2030',
    notes: 'Most actively traded in Astrea series. SGX volume ~227,000 on 2 Jun 2026.',
    asOf: '2 Jun 2026',
  },
  {
    issuer: 'Astrea 7',
    name: 'Class B',
    maturity: '27 May 2032',
    coupon: 6.00,
    price: 103.4,
    ytm: 5.34,
    rating: 'A-sf',
    callDate: '27 May 2027',
    notes: 'Higher coupon, lower structural seniority than A-1. SGX volume ~15,000 on 2 Jun 2026.',
    asOf: '2 Jun 2026',
  },
];

// ── Bank Investment Products ──────────────────────────────────────────────────

export interface BankInvestment {
  bank: BankSlug;
  productName: string;
  type: string;
  minInvestment: string;
  fees: string;
  description: string;
}

// ── Home Loans (illustrative packages — verified Jun 2026, verify with each bank before transacting) ──
// All-in SORA rates computed using 3M Compounded SORA ≈ 2.07% and 1M Compounded SORA ≈ 2.05% as at Jun 2026.

export interface HomeLoan {
  bank: BankSlug;
  packageName: string;
  type: 'Fixed' | 'SORA';
  rate: number;      // approximate all-in p.a. for Year 1–2
  lockin: string;
  ref: string;
  minLoan: string;
  notes: string;
}

export const HOME_LOANS: HomeLoan[] = [
  {
    bank: 'dbs',
    packageName: '3M SORA + 0.28%',
    type: 'SORA',
    rate: 2.35,
    lockin: 'None',
    ref: '3M SORA',
    minLoan: 'S$1,000,000',
    notes: 'Green Home Loan — Green Mark-certified new launches only. Two free conversions. Y3–4: +0.30%, thereafter +0.60%.',
  },
  {
    bank: 'hsbc',
    packageName: 'Premier package',
    type: 'SORA',
    rate: 1.33,
    lockin: '2 years',
    ref: '3M SORA',
    minLoan: 'S$900,000',
    notes: 'Effective rate as low as 1.33% p.a. for Premier customers via SmartMortgage deposit-offset feature. Requires ≥S$200k total relationship balance. Non-Premier spreads not publicly disclosed.',
  },
  {
    bank: 'citibank',
    packageName: '1M SORA + 0.55%',
    type: 'SORA',
    rate: 2.60,
    lockin: '2 years',
    ref: '1M SORA',
    minLoan: 'S$100,000',
    notes: 'Completed property, loans <S$1M. Y3: +0.70%, thereafter +0.85%. Citigold (≥S$1M): spread tightens to +0.45% Y1–2. Fixed option: 1.70% p.a. Y1–2.',
  },
  {
    bank: 'uob',
    packageName: '3M SORA + 0.70%',
    type: 'SORA',
    rate: 2.77,
    lockin: '2 years',
    ref: '3M SORA',
    minLoan: 'S$250,000',
    notes: 'Direct-to-bank package. Y3: +0.80%, thereafter +1.00%. One free conversion after 24 months.',
  },
  {
    bank: 'maybank',
    packageName: '3M SORA + 0.70%',
    type: 'SORA',
    rate: 2.77,
    lockin: '2 years',
    ref: '3M SORA',
    minLoan: 'S$100,000',
    notes: 'Completed property floating package. Y3+: +1.00%. Fixed alternatives: 3.30% p.a. (2Y lock-in) or 3.75% p.a. (3Y lock-in).',
  },
  {
    bank: 'ocbc',
    packageName: '1M SORA + 0.98%',
    type: 'SORA',
    rate: 3.03,
    lockin: '2 years',
    ref: '1M SORA',
    minLoan: 'S$200,000 (HDB) / S$300,000 (private)',
    notes: 'Thereafter: +1.40%. Also offers 2Y fixed packages. Refinancing cash reward up to S$2,800 and HDB refinance bonus until Jun 2026.',
  },
  {
    bank: 'standard-chartered',
    packageName: '3M SORA + 1.00%',
    type: 'SORA',
    rate: 3.07,
    lockin: '2 years',
    ref: '3M SORA',
    minLoan: 'S$100,000',
    notes: 'Residential property only. Same +1.00% spread throughout (Y1–3 and thereafter). Bank may revise package without prior notice.',
  },
];

// ── Credit Cards ──────────────────────────────────────────────────────────────

export type CardType = 'Cashback' | 'Miles';

export interface CreditCard {
  bank: BankSlug;
  name: string;
  type: CardType;
  headline: string;
  detail: string;
  annualFee: string;
  minIncome: string;  // minimum annual income for principal cardholder
}

export const CREDIT_CARDS: CreditCard[] = [
  {
    bank: 'uob',
    name: 'UOB One Card',
    type: 'Cashback',
    headline: 'Up to 20%',
    detail: 'Up to 20% rebate at Grab, Shopee, Cold Storage, Giant, Guardian & SPC. Tiered on min S$500/S$1,000/S$2,000 monthly card spend.',
    annualFee: 'S$196.20 (waived 1st yr)',
    minIncome: 'S$30,000 (SG/PR) · S$40,000 (foreigners)',
  },
  {
    bank: 'ocbc',
    name: 'OCBC 365',
    type: 'Cashback',
    headline: 'Up to 6%',
    detail: '6% on dining incl. delivery, 3% on groceries & transport, 0.3% unlimited base. Min S$800/mo. Auto-fee waiver linked to spending.',
    annualFee: 'S$196.20 (waived 1st yr)',
    minIncome: '—',
  },
  {
    bank: 'dbs',
    name: 'DBS Live Fresh',
    type: 'Cashback',
    headline: '0.3%',
    detail: '0.3% unlimited cashback on all spend — no category caps. Zero FX fees promo ongoing. Min S$800/mo spend to unlock cashback tier.',
    annualFee: 'S$196.20 (waived 1st yr)',
    minIncome: 'S$30,000',
  },
  {
    bank: 'maybank',
    name: 'Maybank Family & Friends',
    type: 'Cashback',
    headline: '8%',
    detail: '8% cashback across selected everyday categories. 3-year annual fee waiver. Spend-based gift campaign valid till 30 Jun 2026.',
    annualFee: 'Free (3yr waiver)',
    minIncome: 'S$30,000 (SG/PR) · S$45,000 (Malaysians) · S$60,000 (foreigners)',
  },
  {
    bank: 'dbs',
    name: 'DBS Altitude',
    type: 'Miles',
    headline: '1.3–4 mpd',
    detail: 'Miles never expire. 4 mpd on flights & hotels via DBS Travel Marketplace. Airport lounge access with Visa Infinite.',
    annualFee: 'S$196.20',
    minIncome: '—',
  },
  {
    bank: 'citibank',
    name: 'Citi Rewards',
    type: 'Miles',
    headline: '10X Points',
    detail: '10X Rewards points (≈4 mpd) on online purchases and in-store shopping. Points never expire. Current welcome offer: 40,000 bonus ThankYou Points.',
    annualFee: 'S$196.20 (waived 1st yr)',
    minIncome: '—',
  },
  {
    bank: 'standard-chartered',
    name: 'SC Journey',
    type: 'Miles',
    headline: '3 mpd',
    detail: '3 mpd on online spend + 2 mpd on all local spend incl. transport & dining. No minimum spend required.',
    annualFee: 'S$196.20 (waived 1st yr)',
    minIncome: '—',
  },
  {
    bank: 'hsbc',
    name: 'HSBC Revolution',
    type: 'Miles',
    headline: 'Up to 20× Rewards',
    detail: '20× accelerated Rewards points on online & contactless spend. No annual fee — best zero-fee rewards/miles card. Sign-up promo runs 1 Apr–30 Jun 2026. Finance charge: 27.8% p.a.',
    annualFee: 'S$0',
    minIncome: 'S$30,000 (SG/PR) · S$40,000 (self-employed/foreigners)',
  },
];

// ── FD per-bank metadata (min placement, promo vs board) ─────────────────────

export interface FdBankMeta {
  bank: BankSlug;
  minAmount: number;
  isPromo: boolean;
}

export const FD_BANK_META: FdBankMeta[] = [
  { bank: 'dbs',               minAmount: 1000,  isPromo: false },
  { bank: 'ocbc',              minAmount: 20000, isPromo: true  },
  { bank: 'uob',               minAmount: 10000, isPromo: true  },
  { bank: 'standard-chartered', minAmount: 25000, isPromo: true  },
  { bank: 'citibank',          minAmount: 1000,  isPromo: false },
  { bank: 'hsbc',              minAmount: 30000, isPromo: true  },
  { bank: 'maybank',           minAmount: 20000, isPromo: true  },
];

export const BANK_INVESTMENTS: BankInvestment[] = [
  {
    bank: 'dbs',
    productName: 'DBS digiPortfolio – Asia',
    type: 'Robo-advisor',
    minInvestment: 'From S$1,000',
    fees: '0.75% p.a. flat annual portfolio fee',
    description: 'Bank-curated ETF portfolio focused on Asian equities via DBS CIO Insights. Medium-risk performance (gross, cumulative) as of 31 Dec 2025: 1Y +12.7%, 3Y +22.9%, 5Y +11.1%, since inception +23.1%.',
  },
  {
    bank: 'dbs',
    productName: 'DBS digiPortfolio – Global',
    type: 'Robo-advisor',
    minInvestment: 'From S$1,000',
    fees: '0.75% p.a. flat annual portfolio fee',
    description: 'Bank-curated ETF portfolio with global diversification via DBS CIO Insights. Medium-risk performance (gross, cumulative) as of 31 Dec 2025: 1Y +18.9%, 3Y +47.8%, 5Y +34.9%, since inception +58.1%.',
  },
  {
    bank: 'dbs',
    productName: 'DBS Invest-Saver',
    type: 'Regular savings plan',
    minInvestment: 'S$100/month',
    fees: 'Unspecified',
    description: 'Dollar-cost averaging into ETFs and unit trusts via fixed monthly contributions.',
  },
  {
    bank: 'ocbc',
    productName: 'OCBC RoboInvest',
    type: 'Robo-advisor',
    minInvestment: 'US$100/month',
    fees: '0.88% p.a. AUM',
    description: 'Multi-asset model portfolios with quarterly/half-yearly rebalancing. Mostly USD-denominated portfolios.',
  },
  {
    bank: 'ocbc',
    productName: 'Blue Chip Investment Plan',
    type: 'Regular savings plan',
    minInvestment: 'S$100/month',
    fees: '0.88% per transaction (no minimum fee)',
    description: 'Monthly accumulation into SGX-listed blue-chip shares and ETFs via dollar-cost averaging.',
  },
  {
    bank: 'uob',
    productName: 'UOB Wealth on TMRW',
    type: 'Digital wealth platform',
    minInvestment: 'Unspecified',
    fees: '0.8% sales charge; no annual platform fee',
    description: 'App-based access to UOB AMTM fund portfolios and unit trusts. "Play Safe" portfolio uses United SGD Money Market Fund.',
  },
  {
    bank: 'uob',
    productName: 'United SGD Fund',
    type: 'Short-duration fund',
    minInvestment: 'S$1,000 initial / S$500 subsequent',
    fees: '0.63% p.a. management fee',
    description: 'Invests in money market and short-term investment-grade debt. Portfolio YTM ~3.10%. AUM S$3.48bn.',
  },
  {
    bank: 'standard-chartered',
    productName: 'SC Invest Portfolios',
    type: 'Curated portfolios / fund platform',
    minInvestment: 'S$30,000',
    fees: '0% sales charge; advisory 0.1%–0.5% p.a. where applicable',
    description: 'Curated investment portfolios with open-architecture fund access. Qualifies as the Bonus$aver "Invest" action.',
  },
  {
    bank: 'citibank',
    productName: 'Citi Investment Funds',
    type: 'Mutual fund platform',
    minInvestment: 'S$100 lump sum / S$100/month RSP',
    fees: 'Unspecified',
    description: 'Diversified professionally managed fund access via app. Both lump-sum and regular savings plan routes available.',
  },
  {
    bank: 'hsbc',
    productName: 'HSBC Unit Trusts',
    type: 'Mutual funds',
    minInvestment: 'S$1,000 / S$100/month RSP',
    fees: '0.85% online sales charge',
    description: 'Traditional mutual-fund access via lump sum or regular savings plan. SGD and fund-currency denominations.',
  },
  {
    bank: 'maybank',
    productName: 'Goal-Based Investment',
    type: 'Digital goal-based investing',
    minInvestment: 'S$200',
    fees: '1% sales charge',
    description: 'Goal-led investing journey via unit trusts built into Maybank digital channels. Entry-level workflow for newer investors.',
  },
];
