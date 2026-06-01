'use client';

import { BANKS } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BankFilterProps {
  selected: BankSlug[] | 'all';
  onChange: (selected: BankSlug[] | 'all') => void;
  className?: string;
}

export function BankFilter({ selected, onChange, className }: BankFilterProps) {
  const isAll = selected === 'all';

  function toggle(slug: BankSlug) {
    if (isAll) {
      onChange([slug]);
      return;
    }
    const current = selected as BankSlug[];
    if (current.includes(slug)) {
      const next = current.filter((s) => s !== slug);
      onChange(next.length === 0 ? 'all' : next);
    } else {
      const next = [...current, slug];
      onChange(next.length === BANKS.length ? 'all' : next);
    }
  }

  function isSelected(slug: BankSlug) {
    return isAll || (selected as BankSlug[]).includes(slug);
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        onClick={() => onChange('all')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
          isAll
            ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue'
            : 'border-surface-3 text-muted-foreground hover:border-surface-4 hover:text-foreground'
        )}
      >
        All Banks
      </button>
      {BANKS.map((bank) => (
        <button
          key={bank.slug}
          onClick={() => toggle(bank.slug)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            isSelected(bank.slug)
              ? `${bank.bgClass} ${bank.borderClass} ${bank.textClass}`
              : 'border-surface-3 text-muted-foreground hover:border-surface-4 hover:text-foreground'
          )}
        >
          {bank.shortName}
        </button>
      ))}
    </div>
  );
}
