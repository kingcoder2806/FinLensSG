import {
  SAVINGS_ACCOUNTS,
  SEED_RATES,
  ETF_PRODUCTS,
  SGS_BONDS,
  CORPORATE_BONDS,
  BANK_INVESTMENTS,
} from '@/constants/products';

function row(...cells: string[]) {
  return `| ${cells.join(' | ')} |`;
}

function pct(n: number | null | undefined): string {
  return n != null ? `${n.toFixed(2)}% p.a.` : 'unspecified';
}

export function buildKnowledgeBase(): string {
  const sections: string[] = [];

  // ── Savings accounts ─────────────────────────────────────────────────────
  sections.push('## Savings Accounts (as of Jun 2026)');
  sections.push(
    row('Bank', 'Account', 'Base Rate', 'Max Bonus Rate', 'Balance Cap', 'Key Conditions'),
    row('----', '-------', '---------', '--------------', '-----------', '---------------'),
  );
  for (const acc of SAVINGS_ACCOUNTS) {
    sections.push(row(
      acc.bank,
      acc.accountName,
      acc.baseRate != null ? pct(acc.baseRate) : 'unspecified',
      pct(acc.maxRate),
      acc.balanceCap > 0 ? `S$${(acc.balanceCap / 1000).toFixed(0)}k` : 'incremental',
      acc.conditions,
    ));
  }
  sections.push(
    '',
    'Conditions note: most banks use a layered bonus structure. The max rate requires meeting ALL conditions simultaneously. Base rate applies when no conditions are met.',
    'StanChart Bonus$aver 5.85% max is real but requires salary ≥S$3,000 + card spend ≥S$1,000 + invest S$30k + insure S$24k/yr — the highest bar of the seven banks.',
    'Citi MaxiGain 3.01% max is still valid on 2 Jun 2026 but Citi has announced a reduction to max 2.40% from 1 Jul 2026.',
    'HSBC note: base rate changes from 0.05% to 0.01% effective 1 Jul 2026; Everyday+ bonus programme also removed from 1 Jul 2026.',
  );

  // ── Fixed deposits ────────────────────────────────────────────────────────
  sections.push('', '## Fixed Deposit Reference Rates (mid-2026 snapshot)');
  sections.push(
    row('Bank', '3M', '6M', '12M', '24M'),
    row('----', '--', '--', '---', '---'),
  );
  const banks = ['dbs', 'ocbc', 'uob', 'standard-chartered', 'citibank', 'hsbc', 'maybank'];
  for (const bank of banks) {
    const get = (t: 3 | 6 | 12 | 24) => {
      const match = SEED_RATES.fixedDeposit[t].find((r) => r.bank === bank);
      return match ? `${match.rate.toFixed(2)}%` : '—';
    };
    sections.push(row(bank, get(3), get(6), get(12), get(24)));
  }
  sections.push('', 'FD notes: 24M rates are non-competitive across all 7 banks. Best 12M: Maybank 1.30%, UOB 1.15%, OCBC 1.10%.');

  // ── SGS Benchmark Bonds ───────────────────────────────────────────────────
  sections.push('', '## Singapore Government Securities — Benchmark Yield Curve (2 Jun 2026)');
  sections.push(
    row('Tenor', 'Bond', 'Coupon', 'Price', 'YTM', 'Type', 'Notes'),
    row('-----', '----', '------', '-----', '---', '----', '-----'),
  );
  for (const b of SGS_BONDS) {
    sections.push(row(
      b.tenor,
      b.name,
      b.coupon != null ? `${b.coupon.toFixed(3)}%` : 'step-up',
      b.type === 'ssb' ? 'par' : b.price.toFixed(2),
      `${b.ytm.toFixed(2)}%`,
      b.type.toUpperCase(),
      b.notes,
    ));
  }
  sections.push(
    '',
    'SGS curve note (2 Jun 2026): mildly upward sloping from 2Y (1.56%) to 50Y (2.14%). 20Y dips slightly before rising again.',
    'SSB GX26050H (SBMAY26) 10-year average return 2.49%. Apply via DBS/POSB, OCBC, or UOB — requires individual CDP securities account. Monthly redemption at par.',
    'Tax: interest from Singapore government bonds and SSBs is generally not taxable for individual investors (IRAS ruling).',
  );

  // ── Retail Corporate Bonds ────────────────────────────────────────────────
  sections.push('', '## SGX-Listed Retail Corporate Bonds (2 Jun 2026)');
  sections.push(
    row('Issuer', 'Issue', 'Maturity', '1st Call', 'Coupon', 'Price', 'Approx YTM', 'Rating', 'Notes'),
    row('------', '-----', '--------', '--------', '------', '-----', '----------', '------', '-----'),
  );
  for (const b of CORPORATE_BONDS) {
    sections.push(row(
      b.issuer,
      b.name,
      b.maturity,
      b.callDate ?? '—',
      `${b.coupon.toFixed(3)}%`,
      b.price.toFixed(1),
      `~${b.ytm.toFixed(2)}%`,
      b.rating,
      b.notes,
    ));
  }
  sections.push(
    '',
    'Corporate bond note: Astrea 9 Class A-1 was the most actively traded issue on 2 Jun 2026 (~227,000 volume). YTM figures are to final maturity; yield-to-call may differ for callable issues.',
    'Temasek T2026 matures Nov 2026 — very short tenor, near-par pricing, Aaa/AAA rated.',
    'Tax: interest from SGX-listed corporate bonds is generally not taxable for individual investors (IRAS).',
  );

  // ── Listed ETFs ───────────────────────────────────────────────────────────
  sections.push('', '## SGX-Listed ETFs (as of 2 Jun 2026)');
  sections.push(
    row('Ticker', 'Name', 'Type', 'NAV (SGD)', 'YTD', '1Y Return', 'Div Yield', 'TER', 'AUM'),
    row('------', '----', '----', '---------', '---', '---------', '---------', '---', '---'),
  );
  for (const e of ETF_PRODUCTS) {
    sections.push(row(
      e.ticker,
      e.name,
      e.type === 'bond-etf' ? 'Bond ETF' : 'Equity ETF',
      e.nav != null ? `S$${e.nav.toFixed(4)}` : '—',
      e.ytd != null ? `${e.ytd.toFixed(2)}%` : '—',
      e.oneYear != null ? `${e.oneYear.toFixed(2)}%` : '—',
      e.dividendYield != null ? `${e.dividendYield.toFixed(2)}%` : '—',
      e.expenseRatio != null ? `${e.expenseRatio.toFixed(2)}%` : '—',
      e.aumSgdM != null ? `S$${(e.aumSgdM / 1000).toFixed(2)}bn` : '—',
    ));
  }
  sections.push(
    '',
    'ETF note: Amova STI ETF (G3B.SI) returned 33.54% over 1 year and 10.73% YTD as of 2 Jun 2026. ABF Bond ETF (A35.SI) yielded 2.32% with YTD total return 2.61%.',
  );

  // ── Bank Investment Products ──────────────────────────────────────────────
  sections.push('', '## Bank-Offered Investment Products');
  sections.push(
    row('Bank', 'Product', 'Type', 'Min Investment', 'Fees'),
    row('----', '-------', '----', '--------------', '----'),
  );
  for (const p of BANK_INVESTMENTS) {
    sections.push(row(p.bank, p.productName, p.type, p.minInvestment, p.fees));
  }
  sections.push(
    '',
    'Investment product note: DBS digiPortfolio charges 0.25% p.a. for Income portfolio and 0.75% p.a. for Global/Asia. OCBC RoboInvest charges 0.88% p.a. UOB United SGD Fund has S$3.48bn AUM with ~3.10% portfolio YTM. SC Invest charges 0% sales charge.',
  );

  return [
    '---',
    'KNOWLEDGE BASE — FinLens SG Research Data (sourced 2 Jun 2026)',
    'Use the data below as your PRIMARY source for all Singapore banking rate queries.',
    'Call fetchUrl only as an OPTIONAL verification step — if it fails or returns no useful data, proceed directly from this knowledge base.',
    '---',
    '',
    ...sections,
    '',
    '---',
    'End of knowledge base.',
  ].join('\n');
}
