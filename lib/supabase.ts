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
