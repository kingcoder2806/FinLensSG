import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { RATE_CHECK_MANIFEST, type BankCheckEntry } from '@/constants/rateCheckManifest';
import { supabaseAdmin, getLatestFdRates } from '@/lib/supabase';
import { runRateUpdate } from '@/lib/update-rates';
import { browserHeaders } from '@/lib/scraper';
import type { ExtractKind } from '@/constants/sources';

// Live network fetches + Claude extraction: never cache, allow long runtime.
// On Vercel Hobby the effective cap is 60s — use ?phase=fd or ?phase=extended,
// or ?kind=etf to run a slice per invocation. Pro allows the full batch.
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CHANGE_THRESHOLD = 0.10; // flag FD movements ≥ 0.10 percentage points

/**
 * Auth: accepts the configured secret (CHECK_RATES_SECRET, or Vercel's CRON_SECRET)
 * via the legacy `x-check-secret` header, an `Authorization: Bearer` header, or a
 * `?secret=` query param. If no secret env var is set, the endpoint stays open (dev).
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CHECK_RATES_SECRET || process.env.CRON_SECRET;
  if (!secret) return true; // no secret set → open (dev only)
  const header = req.headers.get('x-check-secret');
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const query = new URL(req.url).searchParams.get('secret') ?? '';
  return header === secret || bearer === secret || query === secret;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: browserHeaders(url),
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
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

/**
 * Phase 1 — fixed deposits via the curated manifest, with change detection.
 * Kept verbatim from the original route: the manifest baselines and the
 * ≥0.10pp change flagging feed the (future) alerts pipeline.
 */
async function runFdManifestCheck(dryRun: boolean) {
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

  return {
    summary: {
      banksChecked: RATE_CHECK_MANIFEST.length,
      banksOk: results.filter((r) => r.status === 'ok').length,
      banksFailed: failed.length,
      totalChanges,
      totalRowsInserted: totalInserted,
    },
    flagged: results.filter((r) => r.changes.length > 0),
    failed,
  };
}

type Phase = 'fd' | 'extended' | 'all';

const VALID_KINDS: ExtractKind[] = ['fd', 'savings', 'homeLoan', 'creditCard', 'etf', 'bond', 'benchmark'];

interface RunParams {
  dryRun: boolean;
  phase: Phase;
  only?: ExtractKind[];
  sourceIds?: string[];
}

async function readParams(req: Request): Promise<RunParams> {
  const params = new URL(req.url).searchParams;
  let dryRun = params.get('dry') === '1' || params.get('dryRun') === 'true';
  let phase = (params.get('phase') as Phase) || 'all';
  let only: ExtractKind[] | undefined;
  let sourceIds: string[] | undefined;

  const kindParam = params.get('kind');
  if (kindParam) {
    const kinds = kindParam.split(',').map((k) => k.trim())
      .filter((k): k is ExtractKind => (VALID_KINDS as string[]).includes(k));
    if (kinds.length) only = kinds;
  }
  const sourceParam = params.get('source');
  if (sourceParam) {
    const ids = sourceParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length) sourceIds = ids;
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({} as any));
    if (body.dryRun === true) dryRun = true;
    if (body.phase) phase = body.phase as Phase;
    if (Array.isArray(body.only)) only = body.only as ExtractKind[];
    if (Array.isArray(body.sourceIds)) sourceIds = body.sourceIds as string[];
  }
  if (!['fd', 'extended', 'all'].includes(phase)) phase = 'all';
  return { dryRun, phase, only, sourceIds };
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured — extraction needs Claude' },
      { status: 503 },
    );
  }

  const { dryRun, phase, only, sourceIds } = await readParams(req);
  const targeted = Boolean(only || sourceIds);
  console.log('[check-rates] run', { phase, dryRun, only, sourceIds });

  const response: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    dryRun,
    phase,
    ...(only ? { only } : {}),
    ...(sourceIds ? { sourceIds } : {}),
  };

  try {
    // Phase 1: fixed deposits (manifest + change detection). Skipped when the
    // caller targets specific source ids, or filters to non-FD kinds.
    const wantFd =
      (phase === 'fd' || phase === 'all') && (!only || only.includes('fd')) && !sourceIds;
    if (wantFd) {
      response.fixedDeposits = await runFdManifestCheck(dryRun);
    }

    // Phase 2: every other product + the extra sources (aggregators, fund
    // managers, SGX) from the registry in constants/sources.ts. FD is excluded
    // here to avoid double-writing what the manifest pass already handled.
    if (phase === 'extended' || phase === 'all' || targeted) {
      const extendedOnly = (only ?? ['savings', 'homeLoan', 'creditCard', 'etf', 'bond'])
        .filter((k) => k !== 'fd');
      if (extendedOnly.length || sourceIds) {
        response.extended = await runRateUpdate({
          only: extendedOnly.length ? extendedOnly : undefined,
          sourceIds,
          dryRun,
        });
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[check-rates] run failed:', err);
    return NextResponse.json({ ...response, error: String(err) }, { status: 500 });
  }
}

// GET so Vercel Cron (which issues GET) can trigger it; POST for manual/CI use.
export const GET = handle;
export const POST = handle;
