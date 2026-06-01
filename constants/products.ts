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

/* Fixed deposit reference rates — used only as fallback when API key is missing */
export const SEED_RATES = {
  fixedDeposit: {
    3: [
      { bank: 'dbs', rate: 3.2 },
      { bank: 'ocbc', rate: 3.3 },
      { bank: 'uob', rate: 3.25 },
      { bank: 'standard-chartered', rate: 3.35 },
      { bank: 'citibank', rate: 3.15 },
      { bank: 'hsbc', rate: 3.2 },
      { bank: 'maybank', rate: 3.5 },
    ],
    6: [
      { bank: 'dbs', rate: 3.3 },
      { bank: 'ocbc', rate: 3.4 },
      { bank: 'uob', rate: 3.35 },
      { bank: 'standard-chartered', rate: 3.45 },
      { bank: 'citibank', rate: 3.25 },
      { bank: 'hsbc', rate: 3.3 },
      { bank: 'maybank', rate: 3.6 },
    ],
    12: [
      { bank: 'dbs', rate: 3.1 },
      { bank: 'ocbc', rate: 3.2 },
      { bank: 'uob', rate: 3.15 },
      { bank: 'standard-chartered', rate: 3.25 },
      { bank: 'citibank', rate: 3.0 },
      { bank: 'hsbc', rate: 3.1 },
      { bank: 'maybank', rate: 3.45 },
    ],
    24: [
      { bank: 'dbs', rate: 2.9 },
      { bank: 'ocbc', rate: 3.0 },
      { bank: 'uob', rate: 2.95 },
      { bank: 'standard-chartered', rate: 3.05 },
      { bank: 'citibank', rate: 2.8 },
      { bank: 'hsbc', rate: 2.85 },
      { bank: 'maybank', rate: 3.2 },
    ],
  },
};
