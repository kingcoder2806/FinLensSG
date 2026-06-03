'use client';

import { useState } from 'react';
import { BankFilter } from '@/components/banks/BankFilter';
import { SAVINGS_ACCOUNTS } from '@/constants/products';
import { BANK_MAP } from '@/constants/banks';
import { cn } from '@/lib/utils';
import type { BankSlug } from '@/constants/banks';

export default function SavingsPage() {
  const [selectedBanks, setSelectedBanks] = useState<BankSlug[] | 'all'>('all');

  const visible =
    selectedBanks === 'all'
      ? SAVINGS_ACCOUNTS
      : SAVINGS_ACCOUNTS.filter((a) => (selectedBanks as BankSlug[]).includes(a.bank));

  const maxRate = Math.max(...visible.map((a) => a.maxRate));

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}>
          Compare Savings Account Rates
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          Main bonus savings products across Singapore&apos;s seven major banks. Ask Fin in the chat for live rates and personalised picks.
        </p>
      </div>

        <BankFilter selected={selectedBanks} onChange={setSelectedBanks} className="mb-4" />

        <div className="overflow-x-auto rounded-xl border border-surface-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-2/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                  Bank
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base Rate
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Max Bonus Rate
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Balance Cap
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Key Conditions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((acc, i) => {
                const bank = BANK_MAP[acc.bank];
                const isBest = acc.maxRate === maxRate;
                return (
                  <tr
                    key={acc.bank}
                    className={cn(
                      'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                      i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{bank?.logo}</span>
                        <span className={`text-sm font-medium ${bank?.textClass}`}>
                          {bank?.shortName ?? acc.bank}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground">{acc.accountName}</span>
                      <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                        {acc.effectiveDate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-muted-foreground">
                        {acc.baseRate != null ? `${acc.baseRate.toFixed(2)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'font-mono text-sm font-bold',
                          isBest
                            ? 'text-brand-green'
                            : acc.maxRate >= 3.5
                            ? 'text-brand-amber'
                            : 'text-muted-foreground'
                        )}
                      >
                        {`${acc.maxRate.toFixed(2)}%`}
                      </span>
                      {isBest && (
                        <span className="ml-1.5 text-[9px] text-brand-green font-mono uppercase">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {acc.balanceCap > 0
                          ? `S$${(acc.balanceCap / 1000).toFixed(0)}k`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {acc.conditions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-3 px-1">
          Reference data as of Jun 2026. Most banks use layered bonus structures — max rates require meeting multiple conditions simultaneously. Verify current terms directly with each bank.
        </p>
    </div>
  );
}
