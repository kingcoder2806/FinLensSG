/**
 * Scraper primitives for the automated rate updater.
 *
 * Pipeline (mirrors the proven fetchUrl path in app/api/chat/route.ts):
 *   fetch(url) -> strip HTML to text -> Claude structured extraction (generateObject)
 *
 * JSON endpoints (SGX / MAS APIs) are passed through verbatim instead of HTML-stripped.
 * Every numeric field is nullable: the model must emit null rather than guess when a
 * value is not explicitly present on the page.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BANK_SLUGS } from '@/constants/banks';
import type { ExtractKind } from '@/constants/sources';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
const MAX_CHARS = 14_000;
const FETCH_TIMEOUT_MS = 25_000;

/**
 * Realistic desktop-Chrome headers. Many SG bank/aggregator sites reject the
 * default Node fetch UA with 403/500, so we present as a normal browser.
 */
export function browserHeaders(url: string, isJson = false): Record<string, string> {
  let origin = '';
  try { origin = new URL(url).origin; } catch { /* ignore */ }
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: isJson
      ? 'application/json, text/plain, */*'
      : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-SG,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': isJson ? 'empty' : 'document',
    'Sec-Fetch-Mode': isJson ? 'cors' : 'navigate',
    'Sec-Fetch-Site': isJson ? 'same-origin' : 'none',
    ...(isJson && origin ? { Referer: origin + '/', Origin: origin } : {}),
  };
}

export interface FetchResult {
  ok: boolean;
  text?: string;
  status?: number;
  error?: string;
  isJson?: boolean;
}

/** Fetch a URL and reduce it to plain text (or raw JSON for API endpoints). */
export async function fetchAndStrip(url: string): Promise<FetchResult> {
  try {
    const wantJson = /\.json|\/api\.|\/api\//i.test(url) || /api\.sgx\.com/i.test(url);
    const res = await fetch(url, {
      headers: browserHeaders(url, wantJson),
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };

    const contentType = res.headers.get('content-type') ?? '';
    const raw = await res.text();
    const isJson = contentType.includes('json') || /\.json|\/api\//i.test(url);

    if (isJson) {
      return { ok: true, isJson: true, status: res.status, text: raw.slice(0, MAX_CHARS) };
    }

    const text = raw
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, MAX_CHARS);

    return { ok: true, isJson: false, status: res.status, text };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ── Structured-extraction schemas (one per ExtractKind) ─────────────────────── */

const bankEnum = z
  .string()
  .describe(`Bank slug, one of: ${BANK_SLUGS.join(', ')}. Use the closest match, or the raw bank name if not one of these.`);

const fdSchema = z.object({
  rows: z.array(
    z.object({
      bank: bankEnum,
      tenorMonths: z.number().describe('Tenor in months, e.g. 3, 6, 9, 12, 24'),
      boardRate: z.number().nullable().describe('Standard/board rate % p.a., null if only a promo rate is shown'),
      promoRate: z.number().nullable().describe('Promotional rate % p.a., null if none'),
      minDepositPromo: z.number().nullable().describe('Minimum placement (SGD) to earn the promo rate, null if unknown'),
    }),
  ),
});

const savingsSchema = z.object({
  rows: z.array(
    z.object({
      bank: bankEnum,
      accountName: z.string(),
      baseRate: z.number().nullable().describe('Base rate % p.a. when no bonus conditions met'),
      maxRate: z.number().describe('Maximum effective rate % p.a. when all bonus conditions met'),
      balanceCap: z.number().nullable().describe('SGD balance cap the max rate applies to, null if incremental/unspecified'),
      conditions: z.string().nullable().describe('Short summary of conditions to reach max rate'),
      effectiveDate: z.string().nullable().describe('Stated effective date if shown'),
    }),
  ),
});

const homeLoanSchema = z.object({
  rows: z.array(
    z.object({
      bank: bankEnum,
      packageName: z.string(),
      type: z.string().describe("'Fixed' or 'SORA' (floating)"),
      rate: z.number().nullable().describe('Approx all-in % p.a. for the initial period'),
      lockin: z.string().nullable().describe("e.g. '2 years' or 'None'"),
      ref: z.string().nullable().describe("Benchmark, e.g. '3M SORA', '1M SORA'"),
      minLoan: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

const creditCardSchema = z.object({
  rows: z.array(
    z.object({
      bank: bankEnum,
      name: z.string(),
      type: z.string().describe("'Cashback' or 'Miles'"),
      headline: z.string().describe('Headline reward, e.g. "Up to 6%", "4 mpd"'),
      detail: z.string().nullable(),
      annualFee: z.string().nullable(),
      minIncome: z.string().nullable(),
    }),
  ),
});

const etfSchema = z.object({
  rows: z.array(
    z.object({
      ticker: z.string().nullable().describe('SGX ticker incl. .SI suffix if known, e.g. G3B.SI'),
      name: z.string(),
      type: z.string().describe("'bond-etf' or 'equity-etf'"),
      nav: z.number().nullable().describe('NAV in SGD'),
      ytd: z.number().nullable().describe('Year-to-date return %'),
      oneYear: z.number().nullable().describe('1-year return %'),
      expenseRatio: z.number().nullable().describe('Total expense ratio % p.a.'),
      aumSgdM: z.number().nullable().describe('Fund size / AUM in SGD millions'),
      dividendYield: z.number().nullable().describe('Distribution / dividend yield %'),
      asOf: z.string().nullable().describe('As-of date shown on the page'),
    }),
  ),
});

const bondSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string(),
      issuer: z.string().nullable(),
      type: z.string().describe("'sgs', 'ssb', or 'corporate'"),
      tenor: z.string().nullable(),
      maturity: z.string().nullable(),
      coupon: z.number().nullable(),
      price: z.number().nullable(),
      ytm: z.number().describe('Yield to maturity %'),
      rating: z.string().nullable(),
      callDate: z.string().nullable(),
      notes: z.string().nullable(),
      asOf: z.string().nullable(),
    }),
  ),
});

const benchmarkSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().describe("e.g. 'SORA', '1M Compounded SORA', '3M Compounded SORA'"),
      rate: z.number().describe('Rate % p.a.'),
      asOf: z.string().nullable().describe('Reference date'),
    }),
  ),
});

const SCHEMAS = {
  fd: fdSchema,
  savings: savingsSchema,
  homeLoan: homeLoanSchema,
  creditCard: creditCardSchema,
  etf: etfSchema,
  bond: bondSchema,
  benchmark: benchmarkSchema,
} as const;

export type ExtractedRows<K extends ExtractKind> = z.infer<(typeof SCHEMAS)[K]>['rows'];

const KIND_HINT: Record<ExtractKind, string> = {
  fd: 'fixed deposit / time deposit interest rates per tenor (board and promotional)',
  savings: 'savings account base and maximum bonus interest rates and conditions',
  homeLoan: 'home loan / mortgage packages (SORA-pegged and fixed)',
  creditCard: 'credit card headline rewards (cashback % or miles per dollar)',
  etf: 'listed ETF / fund NAV, returns, expense ratio, AUM and dividend yield',
  bond: 'government (SGS/SSB) and corporate bond prices, coupons and yields',
  benchmark: 'benchmark reference rates such as SORA and compounded SORA',
};

/**
 * Run Claude structured extraction over fetched page text.
 * Returns [] (not an error) when the page contains no relevant data.
 */
export async function extractRows<K extends ExtractKind>(
  kind: K,
  pageText: string,
  context: { url: string; isJson?: boolean },
): Promise<ExtractedRows<K>> {
  const schema = SCHEMAS[kind];

  const { object } = await generateObject({
    model: anthropic(MODEL),
    schema,
    system:
      'You extract structured Singapore retail-banking product data from web pages for FinLens SG. ' +
      'Only record values that are explicitly present in the supplied content. ' +
      'Never infer, estimate, or carry over values from prior knowledge — emit null for anything not shown. ' +
      'Return rates as plain numbers (e.g. 3.40 for 3.40% p.a.), not strings. ' +
      'If the page has no data of the requested type, return an empty rows array.',
    prompt:
      `Extract ${KIND_HINT[kind]} from the ${context.isJson ? 'JSON' : 'page text'} below.\n` +
      `Source URL: ${context.url}\n\n` +
      `--- CONTENT START ---\n${pageText}\n--- CONTENT END ---`,
  });

  return object.rows as ExtractedRows<K>;
}
