'use client';

import { useState } from 'react';
import { BankFilter } from '@/components/banks/BankFilter';
import { RateTable } from '@/components/rates/RateTable';
import { Sidebar } from '@/components/layout/Sidebar';
import { SEED_RATES } from '@/constants/products';
import type { BankSlug } from '@/constants/banks';

const rows = SEED_RATES.fixedDeposit[12].map((item) => {
  const bank = item.bank as BankSlug;
  return {
    bank,
    fd3m: SEED_RATES.fixedDeposit[3].find((r) => r.bank === bank)?.rate,
    fd6m: SEED_RATES.fixedDeposit[6].find((r) => r.bank === bank)?.rate,
    fd12m: SEED_RATES.fixedDeposit[12].find((r) => r.bank === bank)?.rate,
    fd24m: SEED_RATES.fixedDeposit[24].find((r) => r.bank === bank)?.rate,
  };
});

export default function ComparePage() {
  const [selectedBanks, setSelectedBanks] = useState<BankSlug[] | 'all'>('all');

  return (
    <div className="flex">
      <Sidebar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Compare Fixed Deposit Rates</h1>
          <p className="text-sm text-muted-foreground">
            Reference rates across major Singapore banks. Ask Fin in the chat for live rates.
          </p>
        </div>
        <BankFilter selected={selectedBanks} onChange={setSelectedBanks} className="mb-4" />
        <RateTable
          rows={rows}
          filteredBanks={selectedBanks}
          columns={[
            { key: 'fd3m', label: 'FD 3M' },
            { key: 'fd6m', label: 'FD 6M' },
            { key: 'fd12m', label: 'FD 12M' },
            { key: 'fd24m', label: 'FD 24M' },
          ]}
          caption="Reference rates only. Verify directly with each bank before placing a fixed deposit."
        />
      </main>
    </div>
  );
}
