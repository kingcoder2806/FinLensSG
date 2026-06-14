/**
 * Orchestrator for the automated rate updater.
 *
 * Loops the registry in constants/sources.ts, scrapes + extracts each source, maps
 * the extracted rows onto the Supabase tables, and logs a scrape_runs audit row.
 *
 * Entry points:
 *   - app/api/check-rates/route.ts  (cron / manual HTTP trigger)
 *   - scripts/update-rates.ts       (local CLI via `npx tsx`)
 *
 * Design notes:
 *   - Per-source try/catch: one bad page never aborts the batch.
 *   - "current view" tables are upserted; rate_history is appended for trends.
 *   - Bank names from aggregator pages are normalised to canonical slugs where possible;
 *     unknown banks (e.g. GXS, CIMB) are slugified and still stored — bonus coverage.
 */

import {
  ACTIVE_SOURCES,
  type ScrapeSource,
  type ExtractKind,
} from '@/constants/sources';
import { BANK_SLUGS } from '@/constants/banks';
import { fetchAndStrip, extractRows } from '@/lib/scraper';
import {
  insertRateHistory,
  upsertSavingsAccounts,
  upsertHomeLoans,
  upsertCreditCards,
  upsertEtfProducts,
  upsertBonds,
  logScrapeRun,
} from '@/lib/supabase';

export interface SourceReport {
  id: string;
  url: string;
  extract: ExtractKind;
  ok: boolean;
  rowsExtracted: number;
  rowsWritten: number;
  error?: string;
}

export interface RunReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sourcesTotal: number;
  sourcesOk: number;
  rowsWritten: number;
  status: 'success' | 'partial' | 'error';
  sources: SourceReport[];
}

export interface RunOptions {
  /** Restrict to certain extract kinds, e.g. ['fd','savings']. */
  only?: ExtractKind[];
  /** Restrict to specific source ids. */
  sourceIds?: string[];
  /** Extract but do not write to the database. */
  dryRun?: boolean;
}

const BANK_NAME_ALIASES: Record<string, string> = {
  posb: 'dbs',
  dbs: 'dbs',
  'dbs/posb': 'dbs',
  ocbc: 'ocbc',
  uob: 'uob',
  'united overseas bank': 'uob',
  sc: 'standard-chartered',
  stanchart: 'standard-chartered',
  'standard chartered': 'standard-chartered',
  citi: 'citibank',
  citibank: 'citibank',
  hsbc: 'hsbc',
  maybank: 'maybank',
};

function normaliseBank(raw: string): string {
  const key = raw.trim().toLowerCase();
  if ((BANK_SLUGS as string[]).includes(key)) return key;
  if (BANK_NAME_ALIASES[key]) return BANK_NAME_ALIASES[key];
  // Partial contains match (e.g. "DBS Multiplier", "Standard Chartered Bonus$aver")
  for (const [alias, slug] of Object.entries(BANK_NAME_ALIASES)) {
    if (key.includes(alias)) return slug;
  }
  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

function normaliseEtfType(raw: string): string {
  return /bond/i.test(raw) ? 'bond-etf' : 'equity-etf';
}

/** Map extracted rows for one source onto DB writes; returns rows written. */
async function persist(
  source: ScrapeSource,
  rows: any[],
  dryRun: boolean,
): Promise<number> {
  if (rows.length === 0) return 0;
  if (dryRun) return rows.length;

  switch (source.extract) {
    case 'fd': {
      const out = rows
        .filter((r) => r.boardRate != null || r.promoRate != null)
        .map((r) => ({
          bank_slug: normaliseBank(r.bank),
          product_category: 'fixed-deposit',
          product_name: `${normaliseBank(r.bank)} ${r.tenorMonths}M Fixed Deposit`,
          rate: r.boardRate ?? r.promoRate,
          promo_rate: r.promoRate ?? null,
          tenor_months: r.tenorMonths ?? null,
          source_url: source.url,
          min_deposit_board: null,
          min_deposit_promo: r.minDepositPromo ?? null,
        }));
      await insertRateHistory(out);
      return out.length;
    }

    case 'savings': {
      const accounts = rows.map((r) => ({
        bank_slug: normaliseBank(r.bank),
        account_name: r.accountName,
        base_rate: r.baseRate ?? null,
        max_rate: r.maxRate,
        balance_cap: r.balanceCap ?? 0,
        conditions: r.conditions ?? null,
        effective_date: r.effectiveDate ?? null,
      }));
      const res = await upsertSavingsAccounts(accounts);
      // Append a rate_history snapshot keyed on the max effective rate.
      await insertRateHistory(
        accounts.map((a) => ({
          bank_slug: a.bank_slug,
          product_category: 'savings',
          product_name: a.account_name,
          rate: a.max_rate,
          promo_rate: null,
          tenor_months: null,
          source_url: source.url,
          min_deposit_board: null,
          min_deposit_promo: null,
        })),
      );
      return res.count;
    }

    case 'homeLoan': {
      const res = await upsertHomeLoans(
        rows.map((r) => ({
          bank_slug: normaliseBank(r.bank),
          package_name: r.packageName,
          type: r.type,
          rate: r.rate ?? 0,
          lockin: r.lockin ?? null,
          ref: r.ref ?? null,
          min_loan: r.minLoan ?? null,
          notes: r.notes ?? null,
          effective_date: null,
          active: true,
        })),
      );
      return res.count;
    }

    case 'creditCard': {
      const res = await upsertCreditCards(
        rows.map((r) => ({
          bank_slug: normaliseBank(r.bank),
          name: r.name,
          type: r.type,
          headline: r.headline,
          detail: r.detail ?? null,
          annual_fee: r.annualFee ?? null,
          min_income: r.minIncome ?? null,
          effective_date: null,
          active: true,
        })),
      );
      return res.count;
    }

    case 'etf': {
      const res = await upsertEtfProducts(
        rows
          .filter((r) => r.ticker) // ticker is the conflict key
          .map((r) => ({
            ticker: r.ticker,
            name: r.name,
            etf_type: normaliseEtfType(r.type),
            nav: r.nav ?? null,
            ytd_return: r.ytd ?? null,
            one_year_return: r.oneYear ?? null,
            expense_ratio: r.expenseRatio ?? null,
            aum_sgd_m: r.aumSgdM ?? null,
            dividend_yield: r.dividendYield ?? null,
            description: null,
            as_of: r.asOf ?? null,
          })),
      );
      return res.count;
    }

    case 'bond': {
      const res = await upsertBonds(
        rows.map((r) => ({
          bond_name: r.name,
          issuer: r.issuer ?? null,
          bond_type: r.type,
          tenor: r.tenor ?? null,
          maturity: r.maturity ?? null,
          coupon: r.coupon ?? null,
          price: r.price ?? null,
          ytm: r.ytm,
          rating: r.rating ?? null,
          call_date: r.callDate ?? null,
          notes: r.notes ?? null,
          as_of: r.asOf ?? null,
        })),
      );
      return res.count;
    }

    case 'benchmark': {
      const out = rows.map((r) => ({
        bank_slug: 'mas',
        product_category: 'benchmark',
        product_name: r.name,
        rate: r.rate,
        promo_rate: null,
        tenor_months: null,
        source_url: source.url,
        min_deposit_board: null,
        min_deposit_promo: null,
      }));
      await insertRateHistory(out);
      return out.length;
    }

    default:
      return 0;
  }
}

async function processSource(
  source: ScrapeSource,
  dryRun: boolean,
): Promise<SourceReport> {
  const base = { id: source.id, url: source.url, extract: source.extract };
  try {
    const fetched = await fetchAndStrip(source.url);
    if (!fetched.ok || !fetched.text) {
      return { ...base, ok: false, rowsExtracted: 0, rowsWritten: 0, error: fetched.error ?? 'empty response' };
    }

    const rows = await extractRows(source.extract, fetched.text, {
      url: source.url,
      isJson: fetched.isJson,
    });

    const rowsWritten = await persist(source, rows as any[], dryRun);
    return { ...base, ok: true, rowsExtracted: rows.length, rowsWritten };
  } catch (err) {
    return { ...base, ok: false, rowsExtracted: 0, rowsWritten: 0, error: String(err) };
  }
}

export async function runRateUpdate(opts: RunOptions = {}): Promise<RunReport> {
  const startedAt = new Date();

  let sources = ACTIVE_SOURCES;
  if (opts.only?.length) sources = sources.filter((s) => opts.only!.includes(s.extract));
  if (opts.sourceIds?.length) sources = sources.filter((s) => opts.sourceIds!.includes(s.id));

  // Run sources concurrently but bounded, to avoid hammering hosts / rate limits.
  const CONCURRENCY = 4;
  const reports: SourceReport[] = [];
  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    reports.push(...(await Promise.all(batch.map((s) => processSource(s, opts.dryRun ?? false)))));
  }

  const finishedAt = new Date();
  const sourcesOk = reports.filter((r) => r.ok).length;
  const rowsWritten = reports.reduce((n, r) => n + r.rowsWritten, 0);
  const status: RunReport['status'] =
    sourcesOk === 0 ? 'error' : sourcesOk < reports.length ? 'partial' : 'success';

  const report: RunReport = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    sourcesTotal: reports.length,
    sourcesOk,
    rowsWritten,
    status,
    sources: reports,
  };

  if (!opts.dryRun) {
    await logScrapeRun({
      started_at: report.startedAt,
      finished_at: report.finishedAt,
      sources_total: report.sourcesTotal,
      sources_ok: report.sourcesOk,
      rows_written: report.rowsWritten,
      status: report.status,
      detail: { sources: reports },
    });
  }

  return report;
}
