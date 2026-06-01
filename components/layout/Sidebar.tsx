'use client';

import Link from 'next/link';
import { SEED_RATES } from '@/constants/products';
import { BANK_MAP } from '@/constants/banks';
import { formatRate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function RateTick({ bank, rate, label }: { bank: string; rate: number; label: string }) {
  const info = BANK_MAP[bank as keyof typeof BANK_MAP];
  const isMid = rate >= 3.5;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col min-w-0">
        <span className={`text-xs font-medium ${info?.textClass ?? 'text-foreground'} truncate`}>
          {info?.shortName ?? bank}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
      </div>
      <span className={`font-mono text-sm font-semibold ${isMid ? 'text-brand-amber' : 'text-muted-foreground'}`}>
        {formatRate(rate)}
      </span>
    </div>
  );
}

export function Sidebar() {
  const fd12m = [...(SEED_RATES.fixedDeposit[12] ?? [])]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 border-r border-surface-3 bg-surface-1 h-[calc(100vh-3.5rem)] sticky top-14">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reference Rates
              </p>
              <Badge variant="outline" className="text-[10px] py-0">Reference</Badge>
            </div>
            <p className="text-[11px] font-mono uppercase text-brand-purple tracking-widest mb-1">
              Fixed Deposit 12m
            </p>
            <div className="divide-y divide-surface-3/50">
              {fd12m.map((r) => (
                <RateTick key={r.bank} bank={r.bank} rate={r.rate} label="12 months" />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-widest mb-2">
              Bank Profiles
            </p>
            <div className="grid grid-cols-2 gap-1">
              {Object.values(BANK_MAP).map((b) => (
                <Link
                  key={b.slug}
                  href={`/banks/${b.slug}`}
                  className={`text-xs px-2 py-1 rounded border ${b.borderClass} ${b.bgClass} ${b.textClass} hover:opacity-90 transition-opacity truncate`}
                >
                  {b.shortName}
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Reference rates only. Verify with the bank before transacting.
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}
