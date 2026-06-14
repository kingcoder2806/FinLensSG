'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ETF_PRODUCTS, SGS_BONDS, CORPORATE_BONDS, BANK_INVESTMENTS } from '@/constants/products';
import { BANK_MAP } from '@/constants/banks';
import { BankLogo } from '@/components/banks/BankLogo';
import { cn } from '@/lib/utils';

function pct(n: number | null) {
  return n != null ? `${n.toFixed(2)}%` : '—';
}

function sgd(n: number | null) {
  if (n == null) return '—';
  return n >= 1000 ? `S$${(n / 1000).toFixed(1)}bn` : `S$${n.toFixed(0)}m`;
}

export default function EtfsBondsPage() {
  const maxEtfYtd = Math.max(...ETF_PRODUCTS.map((e) => e.ytd ?? -Infinity));
  const maxCorpYtm = Math.max(...CORPORATE_BONDS.map((b) => b.ytm));

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}>
          ETFs, Bonds &amp; Bank Investments
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          Singapore-listed ETFs, SGS benchmark bonds, SGX retail corporate bonds, and bank-offered investment products. Reference data as of 2 Jun 2026.
        </p>
      </div>

        <Tabs defaultValue="etfs">
          <TabsList className="mb-4">
            <TabsTrigger value="etfs">SGX ETFs</TabsTrigger>
            <TabsTrigger value="govt">SG Govt Bonds</TabsTrigger>
            <TabsTrigger value="corporate">Retail Corp Bonds</TabsTrigger>
            <TabsTrigger value="bank-products">Bank Investment Products</TabsTrigger>
          </TabsList>

          {/* ── SGX ETFs ── */}
          <TabsContent value="etfs">
            <div className="overflow-x-auto rounded-xl border border-surface-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-2/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticker</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">NAV</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">YTD</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">1Y</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Div Yield</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">TER</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">AUM</th>
                  </tr>
                </thead>
                <tbody>
                  {ETF_PRODUCTS.map((etf, i) => {
                    const isBest = etf.ytd === maxEtfYtd;
                    return (
                      <tr
                        key={etf.ticker}
                        className={cn(
                          'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                          i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-brand-blue font-semibold">{etf.ticker}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-foreground">{etf.name}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{etf.description}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] py-0">
                            {etf.type === 'bond-etf' ? 'Bond ETF' : 'Equity ETF'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-muted-foreground">{etf.nav != null ? `S$${etf.nav.toFixed(4)}` : '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('font-mono text-sm font-bold', isBest ? 'text-brand-green' : 'text-brand-amber')}>
                            {pct(etf.ytd)}
                          </span>
                          {isBest && <span className="ml-1 text-[9px] text-brand-green font-mono uppercase">BEST</span>}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">{pct(etf.oneYear)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">{pct(etf.dividendYield)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">{pct(etf.expenseRatio)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">{sgd(etf.aumSgdM)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 px-1">
              NAV, YTD, and yield data as of 2 Jun 2026 (Yahoo Finance / fund manager pages). Not investment advice.
            </p>
          </TabsContent>

          {/* ── SG Govt Bonds ── */}
          <TabsContent value="govt">
            <div className="overflow-x-auto rounded-xl border border-surface-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-2/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bond</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenor</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Maturity</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Coupon</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">YTM / Return</th>
                  </tr>
                </thead>
                <tbody>
                  {SGS_BONDS.map((bond, i) => {
                    const maxYtm = Math.max(...SGS_BONDS.map((b) => b.ytm));
                    const isBest = bond.ytm === maxYtm;
                    return (
                      <tr
                        key={`${bond.name}-${bond.tenor}`}
                        className={cn(
                          'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                          i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-foreground">{bond.name}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5 max-w-xs">{bond.notes}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] py-0',
                              bond.type === 'ssb' ? 'border-brand-purple/40 text-brand-purple' : 'border-brand-blue/40 text-brand-blue'
                            )}
                          >
                            {bond.type === 'ssb' ? 'SSB' : 'SGS'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-muted-foreground">{bond.tenor}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{bond.maturity}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">
                            {bond.coupon != null ? `${bond.coupon.toFixed(3)}%` : 'Step-up'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">
                            {bond.type === 'ssb' ? 'Par' : bond.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'font-mono text-sm font-bold',
                              isBest ? 'text-brand-green' : bond.ytm >= 2.0 ? 'text-brand-amber' : 'text-muted-foreground'
                            )}
                          >
                            {pct(bond.ytm)}
                          </span>
                          {isBest && <span className="ml-1 text-[9px] text-brand-green font-mono uppercase">BEST</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 px-1">
              SGS benchmark prices and yields: MAS benchmark quotations as of 2 Jun 2026. SSB return: 10-year average for SBMAY26 issue. Interest from Singapore government bonds is generally not taxable for individuals (IRAS).
            </p>
          </TabsContent>

          {/* ── Retail Corporate Bonds ── */}
          <TabsContent value="corporate">
            <div className="overflow-x-auto rounded-xl border border-surface-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-2/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Issuer / Issue</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Rating</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Maturity</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">1st Call</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Coupon</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Approx YTM</th>
                  </tr>
                </thead>
                <tbody>
                  {CORPORATE_BONDS.map((bond, i) => {
                    const isBest = bond.ytm === maxCorpYtm;
                    return (
                      <tr
                        key={`${bond.issuer}-${bond.name}`}
                        className={cn(
                          'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                          i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-foreground">{bond.issuer}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{bond.name}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{bond.notes}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] py-0 font-mono">{bond.rating}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{bond.maturity}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{bond.callDate ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-muted-foreground">{pct(bond.coupon)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">{bond.price.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'font-mono text-sm font-bold',
                              isBest ? 'text-brand-green' : bond.ytm >= 3.5 ? 'text-brand-amber' : 'text-muted-foreground'
                            )}
                          >
                            {pct(bond.ytm)}
                          </span>
                          {isBest && <span className="ml-1 text-[9px] text-brand-green font-mono uppercase">BEST</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 px-1">
              Prices and YTMs are approximate calculations from SGX quotations as of 2 Jun 2026. YTM is to final maturity; yield-to-call can differ for callable/step-up structures. Corporate bonds carry credit, liquidity, and call risk.
            </p>
          </TabsContent>

          {/* ── Bank Investment Products ── */}
          <TabsContent value="bank-products">
            <div className="overflow-x-auto rounded-xl border border-surface-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-2/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Bank</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Min Investment</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {BANK_INVESTMENTS.map((prod, i) => {
                    const bank = BANK_MAP[prod.bank];
                    return (
                      <tr
                        key={`${prod.bank}-${prod.productName}`}
                        className={cn(
                          'border-b border-surface-3/50 transition-colors hover:bg-surface-2/30',
                          i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {bank ? <BankLogo bank={bank} size={18} rounded={4} /> : null}
                            <span className={`text-sm font-medium ${bank?.textClass}`}>
                              {bank?.shortName ?? prod.bank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-foreground">{prod.productName}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5 max-w-xs">{prod.description}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] py-0 whitespace-nowrap">
                            {prod.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{prod.minInvestment}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{prod.fees}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 px-1">
              Bank investment products are platforms or wrappers — they are not always listed instruments with public daily market data. Fees and minimums are sourced from official bank pages as of Jun 2026 and may change.
            </p>
          </TabsContent>
        </Tabs>
    </div>
  );
}
