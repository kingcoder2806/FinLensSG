import type { BankSlug } from '@/constants/banks';
import type { ProductCategory } from '@/constants/products';

export type { BankSlug, ProductCategory };

export type AgentType = 'rates' | 'compare';

export interface RateEntry {
  bank: BankSlug;
  product: string;
  rate: number;
  promoRate?: number;
  conditions?: string;
  validUntil?: string;
  updatedAt: string;
}

export interface SavingsRate extends RateEntry {
  category: 'savings';
  baseRate: number;
  maxRate: number;
}

export interface FixedDepositRate extends RateEntry {
  category: 'fixed-deposit';
  tenor: 3 | 6 | 12 | 24;
  minDeposit?: number;
  maxDeposit?: number;
}

export interface HomeLoanRate extends RateEntry {
  category: 'home-loan';
  type: 'sora' | 'fixed';
  spread?: number;
  lockInYears?: number;
}

export interface CreditCard extends RateEntry {
  category: 'credit-card';
  cardType: 'cashback' | 'miles' | 'rewards';
  rewardRate: number;
  annualFee: number;
  minSpend?: number;
}

export interface ETFProduct extends RateEntry {
  category: 'etf';
  ticker?: string;
  expenseRatio?: number;
  ytdReturn?: number;
  oneYearReturn?: number;
}

export type AnyRateProduct =
  | SavingsRate
  | FixedDepositRate
  | HomeLoanRate
  | CreditCard
  | ETFProduct;

export interface ComparisonRow {
  bank: BankSlug;
  savings?: { base: number; promo: number };
  fd3m?: number;
  fd6m?: number;
  fd12m?: number;
  fd24m?: number;
  homeLoanSora?: number;
  homeLoanFixed?: number;
  topCashback?: number;
  topMiles?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: AgentType;
  timestamp: Date;
}

export interface AlertSubscription {
  id: string;
  email: string;
  bank?: BankSlug;
  productCategory?: ProductCategory;
  targetRate?: number;
  direction: 'above' | 'below';
  active: boolean;
  createdAt: Date;
}

export interface CachedRates {
  data: ComparisonRow[];
  cachedAt: string;
  expiresAt: string;
}
