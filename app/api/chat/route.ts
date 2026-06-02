import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { COMPARE_AGENT_SYSTEM } from '@/lib/agents/compare-agent';
import { RATES_AGENT_SYSTEM } from '@/lib/agents/rates-agent';
import { SEED_RATES } from '@/constants/products';
import { BANK_URLS, type BankUrlKey, type ProductUrlKey } from '@/constants/bankUrls';
import { detectAgentType } from '@/lib/utils';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getLatestFdRates, type RateHistoryRow } from '@/lib/supabase';
import { buildKnowledgeBase } from '@/lib/knowledge-base';

type IncomingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function seedAnswer(_prompt: string) {
  const rows = (months: 3 | 6 | 12 | 24) =>
    [...SEED_RATES.fixedDeposit[months]]
      .sort((a, b) => b.rate - a.rate)
      .map((item) => `| ${item.bank.toUpperCase()} | ${months}M | ${item.rate.toFixed(2)}% |`)
      .join('\n');

  return [
    '> **Note:** Live data unavailable — showing reference FD rates. Configure `ANTHROPIC_API_KEY` for real-time rates.',
    '',
    '| Bank | Tenor | Rate p.a. |',
    '|------|-------|-----------|',
    rows(3),
    rows(6),
    rows(12),
    rows(24),
    '',
    '*Verify current rates directly with each bank before placing a fixed deposit.*',
  ].join('\n');
}

const PRODUCT_KEYWORDS: Array<[ProductUrlKey, string[]]> = [
  ['savings',      ['savings', 'saving account', 'high-yield']],
  ['fixedDeposit', ['fixed deposit', 'fd ', 'fd rate', 'fd interest', 'time deposit']],
  ['funds',        ['fund', 'etf', 'unit trust']],
  ['homeLoan',     ['home loan', 'mortgage', 'property loan']],
  ['creditCard',   ['credit card', 'cashback card', 'miles card']],
];

const BANK_KEYWORDS: Array<[BankUrlKey, string[]]> = [
  ['dbs',     ['dbs', 'posb']],
  ['ocbc',    ['ocbc']],
  ['uob',     ['uob']],
  ['sc',      ['standard chartered', 'stanchart']],
  ['citi',    ['citi', 'citibank']],
  ['hsbc',    ['hsbc']],
  ['maybank', ['maybank']],
];

function detectBankProduct(
  message: string,
): { bank: BankUrlKey; product: ProductUrlKey; url: string } | null {
  const lower = message.toLowerCase();
  let bank: BankUrlKey | null = null;
  let product: ProductUrlKey | null = null;
  for (const [b, kws] of BANK_KEYWORDS) { if (kws.some((kw) => lower.includes(kw))) { bank = b; break; } }
  for (const [p, kws] of PRODUCT_KEYWORDS) { if (kws.some((kw) => lower.includes(kw))) { product = p; break; } }
  if (!bank || !product) return null;
  return { bank, product, url: BANK_URLS[bank][product] };
}

function detectProductOnly(message: string): ProductUrlKey | null {
  const lower = message.toLowerCase();
  for (const [p, kws] of PRODUCT_KEYWORDS) {
    if (kws.some((kw) => lower.includes(kw))) return p;
  }
  return null;
}

function buildCompareUrlContext(product: ProductUrlKey): string {
  const lines = (Object.keys(BANK_URLS) as BankUrlKey[])
    .map((bank) => `- ${bank}: ${BANK_URLS[bank][product]}`)
    .join('\n');
  return `\n\nOptional verification URLs (use fetchUrl only if you want to check for very recent changes — proceed from the knowledge base if any URL fails):\n${lines}`;
}

// Maps BankUrlKey (chat detection) → bank_slug used in rate_history
const BANK_URL_TO_SLUG: Record<BankUrlKey, string> = {
  dbs: 'dbs',
  ocbc: 'ocbc',
  uob: 'uob',
  sc: 'standard-chartered',
  citi: 'citibank',
  hsbc: 'hsbc',
  maybank: 'maybank',
};

// Maps ProductUrlKey → product_category stored in rate_history
const PRODUCT_TO_CATEGORY: Partial<Record<ProductUrlKey, string>> = {
  fixedDeposit: 'fixed-deposit',
  savings: 'savings',
};

function filterDbRows(
  rows: RateHistoryRow[],
  bankProduct: { bank: BankUrlKey; product: ProductUrlKey } | null,
  detectedProduct: ProductUrlKey | null,
): RateHistoryRow[] {
  if (!detectedProduct) return [];
  const category = PRODUCT_TO_CATEGORY[detectedProduct];
  if (!category) return [];
  return rows.filter((r) => {
    if (r.product_category !== category) return false;
    if (bankProduct) return r.bank_slug === BANK_URL_TO_SLUG[bankProduct.bank];
    return true;
  });
}

function buildDbContext(rows: RateHistoryRow[]): string {
  if (rows.length === 0) return '';

  const recordedAt = [...rows]
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
    .recorded_at.slice(0, 10);

  const lines = [...rows]
    .sort((a, b) => {
      if (a.bank_slug !== b.bank_slug) return a.bank_slug.localeCompare(b.bank_slug);
      return (a.tenor_months ?? 0) - (b.tenor_months ?? 0);
    })
    .map((r) => {
      const promo = r.promo_rate != null ? `${r.promo_rate.toFixed(2)}%` : '—';
      const minPromo = r.min_deposit_promo != null
        ? `S$${r.min_deposit_promo.toLocaleString()}`
        : '—';
      return `| ${r.bank_slug} | ${r.tenor_months}M | ${r.rate.toFixed(2)}% | ${promo} | ${minPromo} |`;
    });

  return [
    `\n\nVerified rates from database (recorded ${recordedAt}):`,
    '| Bank | Tenor | Board rate | Promo rate | Min deposit (promo) |',
    '|------|-------|------------|------------|---------------------|',
    ...lines,
    '\nUse these as your primary source. Only call fetchUrl if you need to verify whether a specific rate has changed since the recorded date.',
  ].join('\n');
}

export async function POST(req: Request) {
  const { messages = [] } = (await req.json()) as { messages?: IncomingMessage[] };
  const last = messages.at(-1)?.content ?? '';
  const agentType = detectAgentType(last);

  console.log('[FinLens] ── new request ──────────────────────');
  console.log('[FinLens] message:', last);
  console.log('[FinLens] agent type:', agentType);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[FinLens] source: SEED DATA (no ANTHROPIC_API_KEY set)');
    return NextResponse.json({ content: seedAnswer(last) });
  }

  const bankProduct = detectBankProduct(last);
  const detectedProduct = bankProduct?.product ?? detectProductOnly(last);

  console.log('[FinLens] detected bank/product:', bankProduct
    ? `${bankProduct.bank} / ${bankProduct.product} → ${bankProduct.url}`
    : 'none (generic query)');

  const cacheKey = bankProduct ? `${bankProduct.bank}:${bankProduct.product}` : null;

  if (cacheKey) {
    const cached = await cacheGet<string>(cacheKey);
    if (cached) {
      console.log('[FinLens] source: REDIS CACHE (key:', cacheKey, ')');
      return NextResponse.json({ content: cached });
    }
    console.log('[FinLens] cache miss for key:', cacheKey);
  }

  // Query Supabase for verified rates — used as primary context for Claude
  const allDbRates = await getLatestFdRates();
  const relevantDbRows = filterDbRows(allDbRates, bankProduct, detectedProduct);
  const dbContext = buildDbContext(relevantDbRows);
  console.log('[FinLens] db rows for context:', relevantDbRows.length);

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  console.log('[FinLens] calling Claude model:', model);

  let urlContext = '';
  const maxSteps = 3; // KB is the primary source; fetchUrl is optional verification only

  if (bankProduct) {
    urlContext = `\n\nOptional verification URL (only call fetchUrl if you want to check for very recent changes — proceed from the knowledge base if it fails): ${bankProduct.url}`;
  } else if (agentType === 'compare') {
    const product = detectedProduct;
    if (product) {
      urlContext = buildCompareUrlContext(product);
      console.log('[FinLens] compare mode: product =', product, '| db rows =', relevantDbRows.length);
    }
  }

  const knowledgeBase = buildKnowledgeBase();
  const baseSystem = agentType === 'compare' ? COMPARE_AGENT_SYSTEM : RATES_AGENT_SYSTEM;
  const systemWithKb = `${baseSystem}\n\n${knowledgeBase}`;

  try {
    const result = await generateText({
      model: anthropic(model),
      maxSteps,
      tools: {
        fetchUrl: tool({
          description:
            'Fetch the content of an official bank webpage to retrieve live rate data. Use this before webSearch when an official URL is provided.',
          parameters: z.object({
            url: z.string().url().describe('The official bank URL to fetch'),
          }),
          execute: async ({ url }) => {
            console.log('[FinLens] fetchUrl called →', url);
            try {
              const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinLenSG/1.0)' },
                signal: AbortSignal.timeout(10_000),
              });
              console.log('[FinLens] fetchUrl response: HTTP', res.status, res.statusText);
              if (!res.ok) {
                console.log('[FinLens] fetchUrl failed — HTTP', res.status);
                return { success: false, error: `HTTP ${res.status}` };
              }
              const html = await res.text();
              const text = html
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
                .slice(0, 8000);
              console.log('[FinLens] fetchUrl extracted', text.length, 'chars of text');
              console.log('[FinLens] fetchUrl preview:', text.slice(0, 300));
              return { success: true, content: text };
            } catch (err) {
              console.log('[FinLens] fetchUrl threw:', String(err));
              return { success: false, error: String(err) };
            }
          },
        }),
      },
      system: systemWithKb,
      prompt: `${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}${dbContext}${urlContext}\nassistant:`,
    });

    console.log('[FinLens] source: CLAUDE LIVE (steps used:', result.steps.length, ')');
    console.log('[FinLens] tool calls:', result.steps.flatMap(s => s.toolCalls).map(t => t.toolName));

    const content = result.text;
    if (cacheKey && content) {
      await cacheSet(cacheKey, content, 60 * 30);
      console.log('[FinLens] cached result at key:', cacheKey, '(30 min TTL)');
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.log('[FinLens] source: SEED DATA (Claude call failed:', String(err), ')');
    return NextResponse.json({ content: seedAnswer(last) });
  }
}
