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

function detectBankProduct(
  message: string,
): { bank: BankUrlKey; product: ProductUrlKey; url: string } | null {
  const lower = message.toLowerCase();

  const bankMap: Array<[BankUrlKey, string[]]> = [
    ['dbs', ['dbs', 'posb']],
    ['ocbc', ['ocbc']],
    ['uob', ['uob']],
    ['sc', ['standard chartered', 'stanchart']],
    ['citi', ['citi', 'citibank']],
    ['hsbc', ['hsbc']],
    ['maybank', ['maybank']],
  ];

  const productMap: Array<[ProductUrlKey, string[]]> = [
    ['savings', ['savings', 'saving account', 'high-yield']],
    ['fixedDeposit', ['fixed deposit', 'fd ', 'time deposit']],
    ['funds', ['fund', 'etf', 'unit trust']],
    ['homeLoan', ['home loan', 'mortgage', 'property loan']],
    ['creditCard', ['credit card', 'cashback card', 'miles card']],
  ];

  let bank: BankUrlKey | null = null;
  let product: ProductUrlKey | null = null;

  for (const [b, keywords] of bankMap) {
    if (keywords.some((kw) => lower.includes(kw))) { bank = b; break; }
  }

  for (const [p, keywords] of productMap) {
    if (keywords.some((kw) => lower.includes(kw))) { product = p; break; }
  }

  if (!bank || !product) return null;

  return { bank, product, url: BANK_URLS[bank][product] };
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

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  console.log('[FinLens] calling Claude model:', model);

  const urlContext = bankProduct
    ? `\n\nOfficial source URL: ${bankProduct.url}\nFetch this URL first before using web search.`
    : '';

  try {
    const result = await generateText({
      model: anthropic(model),
      maxSteps: 5,
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
      system: agentType === 'compare' ? COMPARE_AGENT_SYSTEM : RATES_AGENT_SYSTEM,
      prompt: `${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}${urlContext}\nassistant:`,
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
