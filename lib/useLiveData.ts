'use client';

import { useEffect, useState } from 'react';
import {
  SAVINGS_ACCOUNTS,
  HOME_LOANS,
  CREDIT_CARDS,
  ETF_PRODUCTS,
  SGS_BONDS,
  CORPORATE_BONDS,
  SEED_RATES,
} from '@/constants/products';
import type { LiveData } from '@/lib/live-data';

/**
 * Client hook for live rate data. Renders instantly with the bundled seed copy
 * (so there's no empty flash and it works during SSR), then fetches /api/data
 * once — shared across all callers — and swaps in the live values.
 *
 * `meta.source` is 'live' | 'mixed' | 'seed' so the UI can show a freshness badge.
 */

const SEED: LiveData = {
  savings: SAVINGS_ACCOUNTS,
  homeLoans: HOME_LOANS,
  creditCards: CREDIT_CARDS,
  etfs: ETF_PRODUCTS,
  sgsBonds: SGS_BONDS,
  corporateBonds: CORPORATE_BONDS,
  fdRates: SEED_RATES.fixedDeposit,
  meta: { source: 'seed', asOf: null },
};

let cache: LiveData | null = null;
let inflight: Promise<LiveData> | null = null;
const subscribers = new Set<() => void>();

function load(): Promise<LiveData> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/api/data')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((d: Partial<LiveData>) => {
        // Merge over seed so any missing/empty category keeps a sensible value.
        const merged: LiveData = {
          ...SEED,
          ...d,
          meta: d.meta ?? { source: 'live', asOf: null },
        };
        cache = merged;
        subscribers.forEach((fn) => fn());
        return merged;
      })
      .catch(() => {
        cache = SEED;
        return SEED;
      });
  }
  return inflight;
}

export function useLiveData(): LiveData {
  const [data, setData] = useState<LiveData>(cache ?? SEED);

  useEffect(() => {
    let active = true;
    const sync = () => { if (active && cache) setData(cache); };
    subscribers.add(sync);
    load().then(sync);
    return () => { active = false; subscribers.delete(sync); };
  }, []);

  return data;
}
