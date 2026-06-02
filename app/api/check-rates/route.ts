import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { RATE_CHECK_MANIFEST, type BankCheckEntry } from '@/constants/rateCheckManifest';
import { supabaseAdmin, getLatestFdRates } from '@/lib/supabase';

const CHANGE_THRESHOLD = 0.10; // flag movements ≥ 0.10 percentage points

// Protect the endpoint — set CHECK_RATES_SECRET in .env.local
function isAuthorized(req: Request): boolean {
  const secret = process.env.CHECK_RATES_SECRET;
  if (!secret) return true; // no secret set → open (dev only)
  return req.headers.get('x-check-secret') === secret;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinLensSG-RateCheck/1.0)' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 10000);
  } catch {
    return null;
  }
}

interface ExtractedTenor {
  months: number;
  boardRate: number | null;
  promoRate: number | null;
  minDepositBoard: number | null;
  minDepositPromo: number | null;
}

async function extractRates(
  entry: BankCheckEntry,
  pageText: string
): Promise<ExtractedTenor[]> {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  const tenorList = entry.tenors.map((t) => `${t.months}-month`).join(', ');

  const result = await generateText({
    model: anthropic(model),
    maxSteps: 1,
    tools: {
      recordRates: tool({
        description: 'Record the extracted SGD fixed deposit rates',
        parameters: z.object({
          tenors: z.array(
            z.object({
              months: z.number().describe('Tenor in months'),
              boardRate: z.number().nullable().describe('Standard board rate % p.a., null if not found'),
              promoRate: z.number().nullable().describe('Promotional rate % p.a., null if none'),
              minDepositBoard: z.number().nullable().describe('Min deposit for board rate in SGD'),
              minDepositPromo: z.number().nullable().describe('Min deposit for promo rate in SGD'),
            })
          ),
        }),
        execute: async (args) => args,
      }),
    },
    system: `You extract SGD fixed deposit rates from bank website text.
Return only factual numbers you can see in the text.
Use null for any rate or amount you cannot find.
Call recordRates with whatever tenors you can extract — do not guess.`,
    prompt: `Bank: ${entry.bankName}
Source: ${entry.sourceUrl}
Extract SGD fixed deposit rates for these tenors: ${tenorList}

Website text:
${pageText}`,
  });

  const call = result.steps
    .flatMap((s) => s.toolResults)
    .find((r) => r.toolName === 'recordRates');

  if (!call) return [];
  const output = call.result as { tenors: ExtractedTenor[] };
  return output.tenors ?? [];
}

interface BankResult {
  bank: string;
  url: string;
  status: 'ok' | 'fetch_failed' | 'extract_failed';
  changes: Array<{
    tenor: number;
    field: 'boardRate' | 'promoRate';
    old: number | null;
    new: number | null;
    delta: number;
  }>;
  rowsInserted: number;
  error?: string;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun: boolean = body.dryRun === true;

  const previousRates = await getLatestFdRates();
  const prevMap = new Map(
    previousRates.map((r) => [`${r.bank_slug}:${r.tenor_months}`, r])
  );

  const results: BankResult[] = [];

  for (const entry of RATE_CHECK_MANIFEST) {
    const result: BankResult = {
      bank: entry.bankSlug,
      url: entry.sourceUrl,
      status: 'ok',
      changes: [],
      rowsInserted: 0,
    };

    const pageText = await fetchPage(entry.sourceUrl);
    if (!pageText) {
      result.status = 'fetch_failed';
      result.error = `Could not fetch ${entry.sourceUrl}`;
      results.push(result);
      continue;
    }

    let extracted: ExtractedTenor[];
    try {
      extracted = await extractRates(entry, pageText);
    } catch (err) {
      result.status = 'extract_failed';
      result.error = String(err);
      results.push(result);
      continue;
    }

    if (extracted.length === 0) {
      result.status = 'extract_failed';
      result.error = 'Claude returned no tenor data';
      results.push(result);
      continue;
    }

    const rowsToInsert: object[] = [];

    for (const tenor of extracted) {
      const prev = prevMap.get(`${entry.bankSlug}:${tenor.months}`);

      const boardChanged =
        tenor.boardRate !== null &&
        prev &&
        Math.abs((tenor.boardRate ?? 0) - (prev.rate ?? 0)) >= CHANGE_THRESHOLD;

      const promoChanged =
        tenor.promoRate !== null &&
        prev &&
        Math.abs((tenor.promoRate ?? 0) - (prev.promo_rate ?? 0)) >= CHANGE_THRESHOLD;

      const isNew = !prev;

      if (isNew || boardChanged || promoChanged) {
        if (boardChanged && prev) {
          result.changes.push({
            tenor: tenor.months,
            field: 'boardRate',
            old: prev.rate,
            new: tenor.boardRate,
            delta: Math.abs((tenor.boardRate ?? 0) - (prev.rate ?? 0)),
          });
        }
        if (promoChanged && prev) {
          result.changes.push({
            tenor: tenor.months,
            field: 'promoRate',
            old: prev.promo_rate,
            new: tenor.promoRate,
            delta: Math.abs((tenor.promoRate ?? 0) - (prev.promo_rate ?? 0)),
          });
        }

        const manifest = entry.tenors.find((t) => t.months === tenor.months);
        rowsToInsert.push({
          bank_slug: entry.bankSlug,
          product_category: 'fixed-deposit',
          product_name: `SGD FD ${tenor.months}M`,
          tenor_months: tenor.months,
          rate: tenor.boardRate ?? manifest?.boardRate ?? 0,
          promo_rate: tenor.promoRate ?? null,
          min_deposit_board: tenor.minDepositBoard ?? manifest?.minDepositBoard ?? null,
          min_deposit_promo: tenor.minDepositPromo ?? manifest?.minDepositPromo ?? null,
          source_url: entry.sourceUrl,
        });
      }
    }

    if (rowsToInsert.length > 0 && !dryRun) {
      const { error } = await supabaseAdmin.from('rate_history').insert(rowsToInsert);
      if (error) {
        result.error = `DB insert failed: ${error.message}`;
      } else {
        result.rowsInserted = rowsToInsert.length;
      }
    } else if (dryRun) {
      result.rowsInserted = rowsToInsert.length;
    }

    results.push(result);
  }

  const totalChanges = results.reduce((n, r) => n + r.changes.length, 0);
  const totalInserted = results.reduce((n, r) => n + r.rowsInserted, 0);
  const failed = results.filter((r) => r.status !== 'ok');

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    dryRun,
    summary: {
      banksChecked: RATE_CHECK_MANIFEST.length,
      banksOk: results.filter((r) => r.status === 'ok').length,
      banksFailed: failed.length,
      totalChanges,
      totalRowsInserted: totalInserted,
    },
    flagged: results.filter((r) => r.changes.length > 0),
    failed,
  });
}
