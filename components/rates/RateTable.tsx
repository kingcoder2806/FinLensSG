'use client';

import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import { cn, formatRate } from '@/lib/utils';

interface RateRow {
  bank: BankSlug;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  format?: (val: unknown) => string;
  highlight?: (val: number) => boolean;
}

interface RateTableProps {
  rows: RateRow[];
  columns: Column[];
  filteredBanks?: BankSlug[] | 'all';
  highlightBest?: boolean;
  caption?: string;
}

function findBest(rows: RateRow[], key: string): number {
  return Math.max(...rows.map((r) => Number(r[key] ?? 0)));
}

export function RateTable({
  rows,
  columns,
  filteredBanks = 'all',
  highlightBest = true,
  caption,
}: RateTableProps) {
  const visible =
    filteredBanks === 'all'
      ? rows
      : rows.filter((r) => (filteredBanks as BankSlug[]).includes(r.bank));

  const bestValues = Object.fromEntries(columns.map((c) => [c.key, findBest(visible, c.key)]));

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-3">
      <table className="w-full text-sm border-collapse">
        {caption && (
          <caption className="text-left text-xs text-muted-foreground mb-2 caption-bottom px-4 py-2">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-surface-3 bg-surface-2/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
              Bank
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => {
            const bank = BANK_MAP[row.bank];
            return (
              <tr
                key={row.bank}
                className={cn(
                  'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                  i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{bank?.logo}</span>
                    <span className={`text-sm font-medium ${bank?.textClass}`}>
                      {bank?.shortName ?? row.bank}
                    </span>
                  </div>
                </td>
                {columns.map((col) => {
                  const val = row[col.key];
                  const numVal = Number(val ?? 0);
                  const isBest = highlightBest && numVal > 0 && numVal === bestValues[col.key];
                  const display = col.format ? col.format(val) : val != null ? formatRate(numVal) : '—';

                  return (
                    <td key={col.key} className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'font-mono text-sm',
                          isBest
                            ? 'text-brand-green font-bold'
                            : numVal >= 3.5
                            ? 'text-brand-amber'
                            : 'text-muted-foreground'
                        )}
                      >
                        {display}
                      </span>
                      {isBest && (
                        <span className="ml-1.5 text-[9px] text-brand-green font-mono uppercase">
                          BEST
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
