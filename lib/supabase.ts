import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* Public client — safe for browser */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* Admin client — server-side only */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* DB type helpers */
export interface RateHistoryRow {
  id: string;
  bank_slug: string;
  product_category: string;
  product_name: string;
  rate: number;
  promo_rate: number | null;
  tenor_months: number | null;
  source_url: string | null;
  min_deposit_board: number | null;
  min_deposit_promo: number | null;
  recorded_at: string;
}

export interface AlertRow {
  id: string;
  email: string;
  bank_slug: string | null;
  product_category: string | null;
  target_rate: number | null;
  direction: 'above' | 'below';
  active: boolean;
  created_at: string;
}

export async function insertRateHistory(rows: Omit<RateHistoryRow, 'id' | 'recorded_at'>[]) {
  const { error } = await supabaseAdmin.from('rate_history').insert(rows);
  if (error) console.error('[Supabase] insert rate history error:', error);
}

export async function createAlert(alert: Omit<AlertRow, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin.from('alerts').insert(alert).select().single();
  if (error) throw error;
  return data as AlertRow;
}

export async function getActiveAlerts(): Promise<AlertRow[]> {
  const { data, error } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('active', true);
  if (error) return [];
  return (data as AlertRow[]) ?? [];
}

// ── New product table types ────────────────────────────────────────────────

export interface SavingsAccountRow {
  id: string;
  bank_slug: string;
  account_name: string;
  base_rate: number | null;
  max_rate: number;
  balance_cap: number;
  conditions: string | null;
  effective_date: string | null;
  updated_at: string;
}

export interface HomeLoanRow {
  id: string;
  bank_slug: string;
  package_name: string;
  type: string;       // 'Fixed' | 'SORA'
  rate: number;
  lockin: string | null;
  ref: string | null; // benchmark (e.g. '3M SORA')
  min_loan: string | null;
  notes: string | null;
  effective_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCardRow {
  id: string;
  bank_slug: string;
  name: string;       // card name
  type: string;       // 'Cashback' | 'Miles'
  headline: string;
  detail: string | null;
  annual_fee: string | null;
  min_income: string | null;
  effective_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EtfProductRow {
  id: string;
  ticker: string;
  name: string;
  etf_type: string;
  nav: number | null;
  ytd_return: number | null;
  one_year_return: number | null;
  expense_ratio: number | null;
  aum_sgd_m: number | null;
  dividend_yield: number | null;
  description: string | null;
  as_of: string | null;
  updated_at: string;
}

export interface BondRow {
  id: string;
  bond_name: string;
  issuer: string | null;
  bond_type: string;
  tenor: string | null;
  maturity: string | null;
  coupon: number | null;
  price: number | null;
  ytm: number;
  rating: string | null;
  call_date: string | null;
  notes: string | null;
  as_of: string | null;
  updated_at: string;
}

// ── Query helpers ──────────────────────────────────────────────────────────

export async function getAllSavingsAccounts(): Promise<SavingsAccountRow[]> {
  const { data, error } = await supabaseAdmin.from('savings_accounts').select('*').order('max_rate', { ascending: false });
  if (error) return [];
  return (data as SavingsAccountRow[]) ?? [];
}

export async function getAllHomeLoans(): Promise<HomeLoanRow[]> {
  const { data, error } = await supabaseAdmin.from('home_loans').select('*').order('rate', { ascending: true });
  if (error) return [];
  return (data as HomeLoanRow[]) ?? [];
}

export async function getAllCreditCards(): Promise<CreditCardRow[]> {
  const { data, error } = await supabaseAdmin.from('credit_cards').select('*').order('bank_slug');
  if (error) return [];
  return (data as CreditCardRow[]) ?? [];
}

export async function getAllEtfs(): Promise<EtfProductRow[]> {
  const { data, error } = await supabaseAdmin.from('etf_products').select('*').order('ticker');
  if (error) return [];
  return (data as EtfProductRow[]) ?? [];
}

export async function getAllBonds(): Promise<BondRow[]> {
  const { data, error } = await supabaseAdmin.from('bonds').select('*').order('ytm', { ascending: false });
  if (error) return [];
  return (data as BondRow[]) ?? [];
}

export async function getLatestFdRates(): Promise<RateHistoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from('rate_history')
    .select('*')
    .eq('product_category', 'fixed-deposit')
    .order('recorded_at', { ascending: false });
  if (error) return [];

  // Keep only the most recent row per bank + tenor
  const seen = new Set<string>();
  const latest: RateHistoryRow[] = [];
  for (const row of (data as RateHistoryRow[]) ?? []) {
    const key = `${row.bank_slug}:${row.tenor_months}`;
    if (!seen.has(key)) {
      seen.add(key);
      latest.push(row);
    }
  }
  return latest;
}
