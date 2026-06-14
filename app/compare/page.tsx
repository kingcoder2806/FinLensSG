'use client';

import { useState } from 'react';
import {
  Crosshair, Shield, Building2, Star, BarChart3, Layers,
  ChevronUp, ChevronDown, Sparkles, Check, X,
} from 'lucide-react';
import {
  SAVINGS_ACCOUNTS,
  FD_BANK_META,
  HOME_LOANS,
  CREDIT_CARDS,
  ETF_PRODUCTS,
  SGS_BONDS,
  CORPORATE_BONDS,
} from '@/constants/products';
import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import Link from 'next/link';
import { ComparisonPanel, type SelectableItem } from '@/components/compare/ComparisonPanel';
import { useLiveData } from '@/lib/useLiveData';

// ── Sort hook ─────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';

interface SortState {
  key: string;
  dir: SortDir;
  onSort: (k: string) => void;
}

function useSort<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: string,
  initialDir: SortDir = 'desc',
): { sorted: T[]; key: string; dir: SortDir; onSort: (k: string) => void } {
  const [key, setKey] = useState(initialKey);
  const [dir, setDir] = useState<SortDir>(initialDir);

  const sorted = [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') {
      return dir === 'desc' ? vb - va : va - vb;
    }
    return dir === 'desc'
      ? String(vb ?? '').localeCompare(String(va ?? ''))
      : String(va ?? '').localeCompare(String(vb ?? ''));
  });

  const onSort = (k: string) => {
    if (k === key) setDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setKey(k); setDir('desc'); }
  };

  return { sorted, key, dir, onSort };
}

// ── Shared primitives ─────────────────────────────────────────────────────────

const TD: React.CSSProperties = {
  padding: '14px 16px',
  borderTop: '1px solid var(--line-soft)',
  verticalAlign: 'middle',
};

const TD_SELECT: React.CSSProperties = {
  padding: '14px 12px 14px 16px',
  borderTop: '1px solid var(--line-soft)',
  verticalAlign: 'middle',
  width: 44,
};

function SortableTh({ label, sortKey, sort, align = 'left', width }: {
  label: string; sortKey: string; sort: SortState;
  align?: 'left' | 'right'; width?: number | string;
}) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => sort.onSort(sortKey)} style={{ textAlign: align, padding: '0 16px 12px', cursor: 'pointer', width, userSelect: 'none', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', color: active ? 'var(--gold)' : 'var(--ink-3)', fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
        {active && (sort.dir === 'desc' ? <ChevronDown size={12} strokeWidth={2.4} /> : <ChevronUp size={12} strokeWidth={2.4} />)}
      </span>
    </th>
  );
}

function TableShell({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="card-finlens" style={{ padding: '22px 8px 10px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>{children}</table>
      {note && <p style={{ fontSize: 12, color: 'var(--ink-4)', padding: '14px 16px 6px', lineHeight: 1.6 }}>{note}</p>}
    </div>
  );
}

function BankCell({ bank, sub }: { bank: BankSlug; sub?: string }) {
  const b = BANK_MAP[bank];
  const initials = b.shortName.replace('/', '').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${b.color} 22%, var(--surface))`, border: `1px solid color-mix(in oklab, ${b.color} 35%, var(--line))`, fontFamily: 'var(--font-ibm-mono)', fontWeight: 600, fontSize: 11, color: `color-mix(in oklab, ${b.color} 60%, var(--ink))`, flexShrink: 0, letterSpacing: '-0.02em' }}>
        {initials}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{b.shortName}</span>
        {sub && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── SelectButton — shared across all tables ───────────────────────────────────

function SelectButton({
  item, selectedIds, onToggle,
}: {
  item: SelectableItem;
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const isSelected = selectedIds.has(item.id);
  const isFull = selectedIds.size >= 2 && !isSelected;

  return (
    <button
      onClick={() => { if (!isFull) onToggle(item); }}
      title={isSelected ? 'Remove from comparison' : isFull ? 'Clear a selection first' : 'Add to comparison'}
      style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${isSelected ? 'var(--gold)' : isFull ? 'var(--line-soft)' : 'var(--line)'}`,
        background: isSelected ? 'var(--gold)' : 'transparent',
        display: 'grid', placeItems: 'center',
        transition: 'all .15s',
        cursor: isFull ? 'not-allowed' : 'pointer',
        opacity: isFull ? 0.3 : 1,
        color: isSelected ? 'oklch(0.2 0.02 75)' : 'transparent',
      }}
    >
      {isSelected && <Check size={11} strokeWidth={3} />}
    </button>
  );
}

// ── Data → SelectableItem converters ─────────────────────────────────────────

type FdRow = { bank: BankSlug; isPromo: boolean; minAmount: number; r3: number; r6: number; r12: number; r24: number; best: number };

function savingsToItem(s: typeof SAVINGS_ACCOUNTS[number]): SelectableItem {
  const b = BANK_MAP[s.bank];
  return {
    id: `savings-${s.bank}`,
    label: s.accountName,
    subLabel: b.shortName,
    bank: s.bank,
    category: 'Savings Account',
    bullets: [
      { label: 'Max effective rate', value: `${s.maxRate.toFixed(2)}% p.a.`, highlight: true },
      ...(s.baseRate != null ? [{ label: 'Base rate', value: `${s.baseRate.toFixed(2)}% p.a.` }] : []),
      { label: 'Balance cap', value: s.balanceCap > 0 ? `S$${(s.balanceCap / 1000).toFixed(0)}k` : 'Incremental' },
      { label: 'Effective from', value: s.effectiveDate },
      { label: 'Requirements', value: s.conditions },
    ],
    chatContext: `${s.accountName} (${b.shortName}): max rate ${s.maxRate}% p.a., base ${s.baseRate ?? '—'}% p.a., balance cap ${s.balanceCap > 0 ? `S$${(s.balanceCap / 1000).toFixed(0)}k` : 'incremental'}. Conditions: ${s.conditions}`,
  };
}

function fdToItem(fd: FdRow): SelectableItem {
  const b = BANK_MAP[fd.bank];
  return {
    id: `fd-${fd.bank}`,
    label: `${b.shortName} Fixed Deposit`,
    subLabel: fd.isPromo ? 'Promotional rate' : 'Board rate',
    bank: fd.bank,
    category: 'Fixed Deposit',
    bullets: [
      { label: '3-month rate', value: `${fd.r3.toFixed(2)}% p.a.`, highlight: fd.r3 === fd.best },
      { label: '6-month rate', value: `${fd.r6.toFixed(2)}% p.a.`, highlight: fd.r6 === fd.best && fd.r6 !== fd.r3 },
      { label: '12-month rate', value: `${fd.r12.toFixed(2)}% p.a.`, highlight: fd.r12 === fd.best && fd.r12 !== fd.r3 && fd.r12 !== fd.r6 },
      { label: '24-month rate', value: `${fd.r24.toFixed(2)}% p.a.` },
      { label: 'Min. placement', value: `S$${(fd.minAmount / 1000).toFixed(0)}k` },
      { label: 'Rate type', value: fd.isPromo ? 'Promotional — fresh funds required' : 'Board rate' },
    ],
    chatContext: `${b.shortName} Fixed Deposit (${fd.isPromo ? 'promo' : 'board'} rate): 3M ${fd.r3.toFixed(2)}%, 6M ${fd.r6.toFixed(2)}%, 12M ${fd.r12.toFixed(2)}%, 24M ${fd.r24.toFixed(2)}%. Min placement S$${(fd.minAmount / 1000).toFixed(0)}k.`,
  };
}

function loanToItem(l: typeof HOME_LOANS[number]): SelectableItem {
  const b = BANK_MAP[l.bank];
  return {
    id: `loan-${l.bank}`,
    label: l.packageName,
    subLabel: b.shortName,
    bank: l.bank,
    category: 'Home Loan',
    bullets: [
      { label: 'All-in rate (Y1–2)', value: `${l.rate.toFixed(2)}% p.a.`, highlight: true },
      { label: 'Package type', value: l.type },
      { label: 'Benchmark', value: l.ref },
      { label: 'Lock-in period', value: l.lockin },
      { label: 'Min. loan', value: l.minLoan },
      { label: 'Notes', value: l.notes },
    ],
    chatContext: `${b.shortName} ${l.packageName}: ${l.rate.toFixed(2)}% p.a. all-in (${l.type}), benchmark ${l.ref}, lock-in ${l.lockin}, min loan ${l.minLoan}. ${l.notes}`,
  };
}

function cardToItem(c: typeof CREDIT_CARDS[number]): SelectableItem {
  const b = BANK_MAP[c.bank];
  const safeId = c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: `card-${c.bank}-${safeId}`,
    label: c.name,
    subLabel: b.shortName,
    bank: c.bank,
    category: `${c.type} Card`,
    bullets: [
      { label: c.type === 'Miles' ? 'Best earn rate' : 'Max cashback', value: c.headline, highlight: true },
      { label: 'Details', value: c.detail },
      { label: 'Annual fee', value: c.annualFee },
      { label: 'Min. income', value: c.minIncome },
    ],
    chatContext: `${c.name} (${b.shortName}, ${c.type}): ${c.headline} ${c.type === 'Miles' ? 'miles per dollar' : 'cashback'}. ${c.detail} Annual fee: ${c.annualFee}. Min income: ${c.minIncome}.`,
  };
}

function etfToItem(e: typeof ETF_PRODUCTS[number]): SelectableItem {
  return {
    id: `etf-${e.ticker}`,
    label: e.name,
    subLabel: `SGX: ${e.ticker}`,
    category: e.type === 'bond-etf' ? 'Bond ETF' : 'Equity ETF',
    bullets: [
      ...(e.ytd != null ? [{ label: 'YTD return', value: `${e.ytd > 0 ? '+' : ''}${e.ytd.toFixed(2)}%`, highlight: e.ytd > 0 }] : []),
      ...(e.oneYear != null ? [{ label: '1Y return', value: `${e.oneYear.toFixed(2)}%` }] : []),
      ...(e.dividendYield != null ? [{ label: 'Dividend yield', value: `${e.dividendYield.toFixed(2)}%` }] : []),
      ...(e.expenseRatio != null ? [{ label: 'Expense ratio (TER)', value: `${e.expenseRatio.toFixed(2)}%` }] : []),
      ...(e.nav != null ? [{ label: 'NAV', value: `S$${e.nav.toFixed(4)}` }] : []),
      ...(e.aumSgdM != null ? [{ label: 'AUM', value: `S$${(e.aumSgdM / 1000).toFixed(2)}bn` }] : []),
      { label: 'Description', value: e.description },
    ],
    chatContext: `${e.name} (${e.ticker}, ${e.type === 'bond-etf' ? 'Bond ETF' : 'Equity ETF'}): YTD ${e.ytd != null ? (e.ytd > 0 ? '+' : '') + e.ytd.toFixed(2) + '%' : '—'}, 1Y ${e.oneYear != null ? e.oneYear.toFixed(2) + '%' : '—'}, dividend yield ${e.dividendYield != null ? e.dividendYield.toFixed(2) + '%' : '—'}, TER ${e.expenseRatio != null ? e.expenseRatio.toFixed(2) + '%' : '—'}. ${e.description}`,
  };
}

function sgsToItem(b: typeof SGS_BONDS[number]): SelectableItem {
  const safeId = `${b.name}-${b.tenor}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: `sgs-${safeId}`,
    label: b.name,
    subLabel: b.type === 'ssb' ? 'Singapore Savings Bond' : 'SGS Bond',
    category: b.type === 'ssb' ? 'Savings Bond' : 'Govt Bond',
    bullets: [
      { label: 'YTM / Return', value: `${b.ytm.toFixed(2)}%`, highlight: true },
      { label: 'Coupon', value: b.coupon != null ? `${b.coupon.toFixed(3)}%` : 'Step-up (SSB)' },
      { label: 'Tenor', value: b.tenor },
      { label: 'Price', value: b.type === 'ssb' ? 'Par (S$100)' : b.price.toFixed(2) },
      { label: 'Maturity', value: b.maturity },
      { label: 'Notes', value: b.notes },
    ],
    chatContext: `${b.name} (${b.type.toUpperCase()}): ${b.tenor} tenor, YTM ${b.ytm.toFixed(2)}%, coupon ${b.coupon != null ? b.coupon.toFixed(3) + '%' : 'step-up'}, price ${b.type === 'ssb' ? 'par' : b.price.toFixed(2)}, matures ${b.maturity}. ${b.notes}`,
  };
}

function corpToItem(b: typeof CORPORATE_BONDS[number]): SelectableItem {
  const safeId = `${b.issuer}-${b.name}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: `corp-${safeId}`,
    label: `${b.issuer} ${b.name}`,
    subLabel: 'Corporate Bond',
    category: 'Corp Bond',
    bullets: [
      { label: 'Approx YTM', value: `~${b.ytm.toFixed(2)}%`, highlight: true },
      { label: 'Coupon', value: `${b.coupon.toFixed(3)}%` },
      { label: 'Credit rating', value: b.rating },
      { label: 'Price', value: b.price.toFixed(1) },
      { label: 'Maturity', value: b.maturity },
      ...(b.callDate ? [{ label: 'First call date', value: b.callDate }] : []),
      { label: 'Notes', value: b.notes },
    ],
    chatContext: `${b.issuer} ${b.name} (${b.rating} rated, corporate bond): approx YTM ~${b.ytm.toFixed(2)}%, coupon ${b.coupon.toFixed(3)}%, price ${b.price.toFixed(1)}, matures ${b.maturity}${b.callDate ? `, callable ${b.callDate}` : ''}. ${b.notes}`,
  };
}

// ── Savings ───────────────────────────────────────────────────────────────────

function SavingsTable({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const { savings } = useLiveData();
  const rows = savings.map((s) => ({ ...s, _best: s.maxRate, _item: savingsToItem(s) }));
  const sort = useSort(rows as unknown as Record<string, unknown>[], '_best');
  const best = Math.max(...rows.map((r) => r.maxRate));

  return (
    <TableShell note="Max effective rates require meeting all bonus criteria simultaneously on the stated balance cap. Base rate applies when no conditions are met.">
      <thead><tr>
        <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
        <SortableTh label="Account" sortKey="bank" sort={sort} width="32%" />
        <SortableTh label="Base p.a." sortKey="baseRate" sort={sort} align="right" />
        <SortableTh label="Max effective" sortKey="_best" sort={sort} align="right" />
        <SortableTh label="Bonus cap" sortKey="balanceCap" sort={sort} align="right" />
      </tr></thead>
      <tbody>
        {(sort.sorted as typeof rows).map((s) => {
          const isSelected = selectedIds.has(s._item.id);
          return (
            <tr key={s.bank} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
              <td style={TD_SELECT}>
                <SelectButton item={s._item} selectedIds={selectedIds} onToggle={onToggle} />
              </td>
              <td style={TD}><BankCell bank={s.bank} sub={s.accountName} /></td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-3)', fontSize: 14.5 }}>
                  {s.baseRate != null ? `${s.baseRate.toFixed(2)}%` : '—'}
                </span>
              </td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                  {s.maxRate === best && <span className="tag tag-gold">Best</span>}
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 18, fontWeight: 600, color: s.maxRate === best ? 'var(--gold)' : 'var(--ink)' }}>
                    {s.maxRate.toFixed(2)}%
                  </span>
                </div>
              </td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-3)', fontSize: 14 }}>
                  {s.balanceCap > 0 ? `S$${(s.balanceCap / 1000).toFixed(0)}k` : '—'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

// ── Fixed Deposits ────────────────────────────────────────────────────────────

function FDTable({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const [minFilter, setMinFilter] = useState(0);
  const { fdRates } = useLiveData();

  const allRows = FD_BANK_META.map((meta) => {
    const r3  = fdRates[3].find((r) => r.bank === meta.bank)?.rate ?? 0;
    const r6  = fdRates[6].find((r) => r.bank === meta.bank)?.rate ?? 0;
    const r12 = fdRates[12].find((r) => r.bank === meta.bank)?.rate ?? 0;
    const r24 = fdRates[24].find((r) => r.bank === meta.bank)?.rate ?? 0;
    const best = Math.max(r3, r6, r12, r24);
    const fd: FdRow = { bank: meta.bank, isPromo: meta.isPromo, minAmount: meta.minAmount, r3, r6, r12, r24, best };
    return { ...fd, _item: fdToItem(fd) };
  });

  const filtered = minFilter === 0 ? allRows : allRows.filter((r) => r.minAmount <= minFilter);
  const sort = useSort(filtered as unknown as Record<string, unknown>[], 'best');
  const globalBest = Math.max(...allRows.map((r) => r.best));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>I can place:</span>
        {([[0, 'Any amount'], [10000, '≤ S$10k'], [30000, '≤ S$30k'], [50000, '≤ S$50k']] as [number, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setMinFilter(v)} className="pill" style={{ cursor: 'pointer', borderColor: minFilter === v ? 'var(--gold-line)' : 'var(--line)', color: minFilter === v ? 'var(--gold)' : 'var(--ink-2)', background: minFilter === v ? 'var(--gold-soft)' : 'var(--surface)' }}>
            {l}
          </button>
        ))}
      </div>
      <TableShell note="Promo rates require minimum placement and may need fresh funds. Board rates apply otherwise. SDIC-insured up to S$100,000 for full banks.">
        <thead><tr>
          <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
          <SortableTh label="Bank" sortKey="bank" sort={sort} width="24%" />
          <SortableTh label="3M" sortKey="r3" sort={sort} align="right" />
          <SortableTh label="6M" sortKey="r6" sort={sort} align="right" />
          <SortableTh label="12M" sortKey="r12" sort={sort} align="right" />
          <SortableTh label="24M" sortKey="r24" sort={sort} align="right" />
          <SortableTh label="Min" sortKey="minAmount" sort={sort} align="right" />
        </tr></thead>
        <tbody>
          {(sort.sorted as typeof allRows).map((fd) => {
            const isSelected = selectedIds.has(fd._item.id);
            return (
              <tr key={fd.bank} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
                <td style={TD_SELECT}>
                  <SelectButton item={fd._item} selectedIds={selectedIds} onToggle={onToggle} />
                </td>
                <td style={TD}><BankCell bank={fd.bank} sub={fd.isPromo ? 'Promo rate' : 'Board rate'} /></td>
                {[fd.r3, fd.r6, fd.r12, fd.r24].map((rate, i) => (
                  <td key={i} style={{ ...TD, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 15.5, fontWeight: rate === fd.best ? 600 : 400, color: rate === globalBest ? 'var(--gold)' : rate === fd.best ? 'var(--ink)' : 'var(--ink-3)' }}>
                      {rate.toFixed(2)}
                    </span>
                  </td>
                ))}
                <td style={{ ...TD, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-3)', fontSize: 13.5 }}>
                    S${(fd.minAmount / 1000).toFixed(0)}k
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
    </>
  );
}

// ── Home Loans ────────────────────────────────────────────────────────────────

function HomeLoansTable({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const { homeLoans } = useLiveData();
  const rows = homeLoans.map((l) => ({ ...l, _item: loanToItem(l) }));
  const sort = useSort(rows as unknown as Record<string, unknown>[], 'rate', 'asc');
  const lowest = Math.min(...rows.map((r) => r.rate));

  return (
    <TableShell note="Illustrative packages as of Jun 2026. Actual eligibility depends on loan quantum, property type and TDSR. SORA = Singapore Overnight Rate Average. Early exit penalties apply during lock-in.">
      <thead><tr>
        <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
        <SortableTh label="Bank" sortKey="bank" sort={sort} width="22%" />
        <SortableTh label="Package" sortKey="packageName" sort={sort} />
        <SortableTh label="Benchmark" sortKey="ref" sort={sort} />
        <SortableTh label="Lock-in" sortKey="lockin" sort={sort} />
        <SortableTh label="Rate p.a." sortKey="rate" sort={sort} align="right" />
      </tr></thead>
      <tbody>
        {(sort.sorted as typeof rows).map((l) => {
          const isSelected = selectedIds.has(l._item.id);
          return (
            <tr key={l.bank} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
              <td style={TD_SELECT}>
                <SelectButton item={l._item} selectedIds={selectedIds} onToggle={onToggle} />
              </td>
              <td style={TD}><BankCell bank={l.bank} /></td>
              <td style={TD}><span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{l.packageName}</span></td>
              <td style={TD}><span className="tag tag-flat" style={{ fontSize: 12 }}>{l.ref}</span></td>
              <td style={TD}><span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{l.lockin}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                  {l.rate === lowest && <span className="tag tag-up" style={{ fontSize: 11 }}>Lowest</span>}
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 17, fontWeight: 600, color: l.rate === lowest ? 'var(--up)' : 'var(--ink)' }}>
                    {l.rate.toFixed(2)}%
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

// ── Credit Cards ──────────────────────────────────────────────────────────────

function CardsGrid({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const [filter, setFilter] = useState<'All' | 'Cashback' | 'Miles'>('All');
  const { creditCards } = useLiveData();
  const visible = creditCards.filter((c) => filter === 'All' || c.type === filter).map((c) => ({ ...c, _item: cardToItem(c) }));

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['All', 'Cashback', 'Miles'] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className="pill" style={{ cursor: 'pointer', borderColor: filter === t ? 'var(--gold-line)' : 'var(--line)', color: filter === t ? 'var(--gold)' : 'var(--ink-2)', background: filter === t ? 'var(--gold-soft)' : 'var(--surface)' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="cat-grid">
        {visible.map((c) => {
          const b = BANK_MAP[c.bank];
          const isSelected = selectedIds.has(c._item.id);
          const isFull = selectedIds.size >= 2 && !isSelected;
          return (
            <div
              key={`${c.bank}-${c.name}`}
              className="card-finlens"
              style={{
                padding: 0, overflow: 'hidden', position: 'relative',
                outline: isSelected ? '2px solid var(--gold)' : '2px solid transparent',
                outlineOffset: -1, transition: 'outline-color .15s',
              }}
            >
              {/* Selection badge */}
              <button
                onClick={() => { if (!isFull) onToggle(c._item); }}
                title={isSelected ? 'Remove from comparison' : isFull ? 'Clear a selection first' : 'Add to comparison'}
                style={{
                  position: 'absolute', top: 10, left: 10, zIndex: 2,
                  width: 24, height: 24, borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.5)'}`,
                  background: isSelected ? 'var(--gold)' : 'rgba(0,0,0,.35)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid', placeItems: 'center',
                  cursor: isFull ? 'not-allowed' : 'pointer',
                  opacity: isFull && !isSelected ? 0.35 : 1,
                  transition: 'all .15s',
                  color: isSelected ? 'oklch(0.2 0.02 75)' : 'transparent',
                }}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>

              <div style={{ height: 88, background: `linear-gradient(135deg, color-mix(in oklab, ${b.color} 55%, var(--surface)), var(--surface-2))`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                <span className="tag" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.35)', color: 'var(--ink)', backdropFilter: 'blur(4px)', fontSize: 11 }}>{c.type}</span>
                <div style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.1em' }}>•••• 8842</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: 18, gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${b.color} 22%, var(--surface))`, border: `1px solid color-mix(in oklab, ${b.color} 35%, var(--line))`, fontFamily: 'var(--font-ibm-mono)', fontWeight: 600, fontSize: 10, color: `color-mix(in oklab, ${b.color} 60%, var(--ink))`, flexShrink: 0 }}>
                    {b.shortName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{b.shortName}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 24, fontWeight: 600, color: 'var(--gold)' }}>{c.headline}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{c.type === 'Miles' ? 'miles per dollar' : 'cashback'}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, minHeight: 52 }}>{c.detail}</p>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Annual fee</span>
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{c.annualFee}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 14, lineHeight: 1.6 }}>
        Illustrative benefits as of Jun 2026. Cashback/miles are subject to spend caps and conditions. Verify with the card issuer before applying.
      </p>
    </>
  );
}

// ── SGX ETFs ──────────────────────────────────────────────────────────────────

function ETFTable({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const { etfs } = useLiveData();
  const rows = etfs.map((e) => ({ ...e, _item: etfToItem(e) }));
  const sort = useSort(rows as unknown as Record<string, unknown>[], 'ytd');

  return (
    <TableShell note="Prices illustrative. TER = total expense ratio. ETFs are not bank deposits, not SDIC-insured, and may lose value. Data as of 2 Jun 2026.">
      <thead><tr>
        <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
        <SortableTh label="ETF" sortKey="name" sort={sort} width="30%" />
        <SortableTh label="Category" sortKey="type" sort={sort} />
        <SortableTh label="NAV" sortKey="nav" sort={sort} align="right" />
        <SortableTh label="YTD" sortKey="ytd" sort={sort} align="right" />
        <SortableTh label="1Y Return" sortKey="oneYear" sort={sort} align="right" />
        <SortableTh label="Div Yield" sortKey="dividendYield" sort={sort} align="right" />
        <SortableTh label="TER" sortKey="expenseRatio" sort={sort} align="right" />
        <SortableTh label="AUM" sortKey="aumSgdM" sort={sort} align="right" />
      </tr></thead>
      <tbody>
        {(sort.sorted as typeof rows).map((e) => {
          const isSelected = selectedIds.has(e._item.id);
          return (
            <tr key={e.ticker} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
              <td style={TD_SELECT}>
                <SelectButton item={e._item} selectedIds={selectedIds} onToggle={onToggle} />
              </td>
              <td style={TD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', fontFamily: 'var(--font-ibm-mono)', fontWeight: 600, fontSize: 10, color: 'var(--ink-2)', flexShrink: 0, letterSpacing: '-0.02em' }}>
                    {e.ticker.split('.')[0]}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>SGX: {e.ticker}</div>
                  </div>
                </div>
              </td>
              <td style={TD}><span className="tag tag-flat" style={{ fontSize: 11.5 }}>{e.type === 'bond-etf' ? 'SG Bonds' : 'SG Equity'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 14.5, color: 'var(--ink-2)' }}>{e.nav != null ? `S$${e.nav.toFixed(4)}` : '—'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 15, fontWeight: 600, color: e.ytd != null ? (e.ytd > 0 ? 'var(--up)' : 'var(--ink-4)') : 'var(--ink-4)' }}>{e.ytd != null ? (e.ytd > 0 ? `+${e.ytd.toFixed(2)}%` : `${e.ytd.toFixed(2)}%`) : '—'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 14.5, color: 'var(--ink-2)' }}>{e.oneYear != null ? `${e.oneYear.toFixed(2)}%` : '—'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 15, fontWeight: 600, color: (e.dividendYield ?? 0) > 0 ? 'var(--up)' : 'var(--ink-4)' }}>{e.dividendYield != null ? `${e.dividendYield.toFixed(2)}%` : '—'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 13.5, color: 'var(--ink-3)' }}>{e.expenseRatio != null ? `${e.expenseRatio.toFixed(2)}%` : '—'}</span></td>
              <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 13.5, color: 'var(--ink-3)' }}>{e.aumSgdM != null ? `S$${(e.aumSgdM / 1000).toFixed(2)}bn` : '—'}</span></td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

// ── Bonds & T-bills ───────────────────────────────────────────────────────────

function BondsView({ selectedIds, onToggle }: {
  selectedIds: Set<string>;
  onToggle: (item: SelectableItem) => void;
}) {
  const { sgsBonds, corporateBonds } = useLiveData();
  const govRows = sgsBonds.map((b) => ({ ...b, _item: sgsToItem(b) }));
  const corpRows = corporateBonds.map((b) => ({ ...b, _item: corpToItem(b) }));
  const govSort = useSort(govRows as unknown as Record<string, unknown>[], 'ytm');
  const corpSort = useSort(corpRows as unknown as Record<string, unknown>[], 'ytm');
  const maxGovYtm = Math.max(...govRows.map((r) => r.ytm));
  const maxCorpYtm = Math.max(...corpRows.map((r) => r.ytm));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'var(--gold)' }}><Shield size={18} strokeWidth={1.6} /></span>
          <h3 style={{ fontSize: 19, fontFamily: 'var(--font-newsreader)', fontWeight: 600, color: 'var(--ink)' }}>Singapore Government Securities</h3>
          <span className="tag tag-up" style={{ fontSize: 11 }}>MAS-issued</span>
        </div>
        <TableShell note="SSBs are government-backed and redeemable monthly at par. SGS prices and YTMs from MAS benchmark quotations, 2 Jun 2026. Interest generally not taxable for individual investors (IRAS).">
          <thead><tr>
            <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
            <SortableTh label="Instrument" sortKey="name" sort={govSort} width="28%" />
            <SortableTh label="Type" sortKey="type" sort={govSort} />
            <SortableTh label="Tenor" sortKey="tenor" sort={govSort} />
            <SortableTh label="Coupon" sortKey="coupon" sort={govSort} align="right" />
            <SortableTh label="Price" sortKey="price" sort={govSort} align="right" />
            <SortableTh label="YTM / Return" sortKey="ytm" sort={govSort} align="right" />
          </tr></thead>
          <tbody>
            {(govSort.sorted as typeof govRows).map((b) => {
              const isSelected = selectedIds.has(b._item.id);
              return (
                <tr key={`${b.name}-${b.tenor}`} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
                  <td style={TD_SELECT}>
                    <SelectButton item={b._item} selectedIds={selectedIds} onToggle={onToggle} />
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{b.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Matures {b.maturity}</span>
                    </div>
                  </td>
                  <td style={TD}>
                    <span className="tag" style={{ fontSize: 11, background: b.type === 'ssb' ? 'color-mix(in oklab, var(--info) 12%, var(--surface))' : 'var(--gold-soft)', color: b.type === 'ssb' ? 'var(--info)' : 'var(--gold)', border: `1px solid ${b.type === 'ssb' ? 'color-mix(in oklab, var(--info) 28%, var(--line))' : 'var(--gold-line)'}` }}>
                      {b.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={TD}><span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-2)', fontSize: 13.5 }}>{b.tenor}</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-2)', fontSize: 14 }}>{b.coupon != null ? `${b.coupon.toFixed(3)}%` : 'Step-up'}</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-3)', fontSize: 14 }}>{b.type === 'ssb' ? 'Par' : b.price.toFixed(2)}</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 17, fontWeight: 600, color: b.ytm === maxGovYtm ? 'var(--gold)' : 'var(--ink)' }}>{b.ytm.toFixed(2)}%</span>
                      {b.type === 'ssb' && <span style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>10-yr avg</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ color: 'var(--info)' }}><Layers size={18} strokeWidth={1.6} /></span>
          <h3 style={{ fontSize: 19, fontFamily: 'var(--font-newsreader)', fontWeight: 600, color: 'var(--ink)' }}>Retail &amp; Corporate Bonds</h3>
          <span className="tag" style={{ fontSize: 11, background: 'var(--down-soft)', color: 'var(--down)' }}>Higher risk</span>
        </div>
        <TableShell note="Corporate bonds are not SDIC-insured and carry issuer credit risk. Prices and approximate YTMs from SGX quotations, 2 Jun 2026. YTM is to final maturity — yield-to-call differs for callable issues.">
          <thead><tr>
            <th style={{ padding: '0 12px 12px 16px', width: 44 }} />
            <SortableTh label="Bond" sortKey="name" sort={corpSort} width="24%" />
            <SortableTh label="Issuer" sortKey="issuer" sort={corpSort} />
            <SortableTh label="Rating" sortKey="rating" sort={corpSort} />
            <SortableTh label="Maturity" sortKey="maturity" sort={corpSort} />
            <SortableTh label="1st Call" sortKey="callDate" sort={corpSort} />
            <SortableTh label="Coupon" sortKey="coupon" sort={corpSort} align="right" />
            <SortableTh label="Price" sortKey="price" sort={corpSort} align="right" />
            <SortableTh label="Approx YTM" sortKey="ytm" sort={corpSort} align="right" />
          </tr></thead>
          <tbody>
            {(corpSort.sorted as typeof corpRows).map((b) => {
              const isSelected = selectedIds.has(b._item.id);
              return (
                <tr key={`${b.issuer}-${b.name}`} style={{ background: isSelected ? 'color-mix(in oklab, var(--gold) 5%, transparent)' : 'transparent' }}>
                  <td style={TD_SELECT}>
                    <SelectButton item={b._item} selectedIds={selectedIds} onToggle={onToggle} />
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{b.issuer} {b.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.4 }}>{b.notes}</span>
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{b.issuer}</span></td>
                  <td style={TD}><span className="tag tag-flat" style={{ fontSize: 11, fontFamily: 'var(--font-ibm-mono)' }}>{b.rating}</span></td>
                  <td style={TD}><span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-2)', fontSize: 13 }}>{b.maturity}</span></td>
                  <td style={TD}><span style={{ fontFamily: 'var(--font-ibm-mono)', color: 'var(--ink-3)', fontSize: 13 }}>{b.callDate ?? '—'}</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 14.5, color: 'var(--ink-2)' }}>{b.coupon.toFixed(3)}%</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 14.5, color: 'var(--ink-2)' }}>{b.price.toFixed(1)}</span></td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 17, fontWeight: 600, color: b.ytm === maxCorpYtm ? 'var(--gold)' : 'var(--ink)' }}>~{b.ytm.toFixed(2)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'savings', label: 'Savings',         icon: Crosshair  },
  { id: 'fd',      label: 'Fixed deposits',  icon: Shield     },
  { id: 'loans',   label: 'Home loans',      icon: Building2  },
  { id: 'cards',   label: 'Credit cards',    icon: Star       },
  { id: 'etfs',    label: 'SGX ETFs',        icon: BarChart3  },
  { id: 'bonds',   label: 'Bonds & T-bills', icon: Layers     },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ComparePage() {
  const [tab, setTab] = useState<TabId>('fd');
  const [selectedItems, setSelectedItems] = useState<SelectableItem[]>([]);
  const selectedIds = new Set(selectedItems.map((i) => i.id));
  const showComparison = selectedItems.length === 2;
  const { meta } = useLiveData();
  const freshness =
    meta.source === 'seed'
      ? 'Reference data'
      : `${meta.source === 'live' ? 'Live data' : 'Live + reference'}${meta.asOf ? ` · as of ${meta.asOf}` : ''}`;

  function handleToggle(item: SelectableItem) {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
  }

  function handleTabChange(id: TabId) {
    setTab(id);
    setSelectedItems([]);
  }

  const tableProps = { selectedIds, onToggle: handleToggle };

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: showComparison ? 60 : selectedItems.length === 1 ? 100 : 60 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="eyebrow eyebrow-gold">Compare rates</span>
              <span
                className="pill"
                style={{
                  fontSize: 11,
                  borderColor: meta.source === 'seed' ? 'var(--line)' : 'var(--gold-line)',
                  color: meta.source === 'seed' ? 'var(--ink-3)' : 'var(--gold)',
                  background: meta.source === 'seed' ? 'var(--surface)' : 'var(--gold-soft)',
                }}
                title={meta.source === 'seed' ? 'Showing bundled reference data' : 'Pulled from the live rates database'}
              >
                {meta.source !== 'seed' && <span className="live-dot" />}
                {freshness}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-newsreader)', fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.08 }}>
              Side-by-side, sorted your way
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 16, lineHeight: 1.5 }}>
              {showComparison
                ? 'Comparing two products side-by-side. Ask Fin on the right to get a personalised verdict.'
                : 'Click the circle on any row to select it, then select a second to compare. Ask Fin for a personalised opinion.'}
            </p>
          </div>
          {!showComparison && (
            <Link href="/chat">
              <button className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={14} /> Ask Fin instead
              </button>
            </Link>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--line-soft)', paddingBottom: 14, marginBottom: 24 }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => handleTabChange(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? 'var(--line)' : 'transparent'}`, background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .15s, background .15s', fontFamily: 'inherit' }}>
                <span style={{ color: active ? 'var(--gold)' : 'inherit' }}><Icon size={15} strokeWidth={1.8} /></span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Content: comparison panel or tables */}
        {showComparison ? (
          <ComparisonPanel
            items={[selectedItems[0], selectedItems[1]]}
            onClose={() => setSelectedItems([])}
          />
        ) : (
          <>
            {tab === 'savings' && <SavingsTable {...tableProps} />}
            {tab === 'fd'      && <FDTable {...tableProps} />}
            {tab === 'loans'   && <HomeLoansTable {...tableProps} />}
            {tab === 'cards'   && <CardsGrid {...tableProps} />}
            {tab === 'etfs'    && <ETFTable {...tableProps} />}
            {tab === 'bonds'   && <BondsView {...tableProps} />}
          </>
        )}
      </div>

      {/* Sticky selection bar — shown when exactly 1 item is selected */}
      {selectedItems.length === 1 && !showComparison && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)',
          borderTop: '1px solid var(--gold-line)',
          boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.5)',
        }}>
          <div className="wrap" style={{ height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Selected indicator */}
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--gold)',
              display: 'grid', placeItems: 'center',
              color: 'oklch(0.2 0.02 75)', flexShrink: 0,
            }}>
              <Check size={14} strokeWidth={2.8} />
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)', lineHeight: 1 }}>
                {selectedItems[0].label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {selectedItems[0].category} · {selectedItems[0].subLabel}
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <div style={{ width: 1, height: 28, background: 'var(--line)' }} />
              <span style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
                Now select a second item from the table to compare
              </span>
            </div>

            <button
              onClick={() => setSelectedItems([])}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8,
                border: '1px solid var(--line)', background: 'transparent',
                color: 'var(--ink-3)', fontSize: 12.5, cursor: 'pointer',
                transition: 'color .15s, border-color .15s', flexShrink: 0,
              }}
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
