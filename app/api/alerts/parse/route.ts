import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BANK_SLUGS } from '@/constants/banks';

export const dynamic = 'force-dynamic';

const schema = z.object({
  productCategory: z.enum(['savings', 'fixed-deposit', 'home-loan']),
  bankSlug: z.string().nullable().describe(`One of: ${BANK_SLUGS.join(', ')}, or null for "any bank"`),
  tenorMonths: z.number().nullable().describe('FD tenor in months (3/6/12/24) if mentioned, else null'),
  direction: z.enum(['above', 'below']).describe('"above" to alert when the rate rises past target; "below" when it falls'),
  targetRate: z.number().describe('Threshold rate in % p.a.'),
  label: z.string().describe('Short human-readable summary of the alert'),
});

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({ text: '' }))) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  // Fallback heuristic when Claude isn't configured.
  if (!process.env.ANTHROPIC_API_KEY) {
    const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
    const target = pct ? parseFloat(pct[1]) : 1.5;
    const lower = text.toLowerCase();
    const category = lower.includes('home') || lower.includes('mortgage')
      ? 'home-loan'
      : lower.includes('saving')
        ? 'savings'
        : 'fixed-deposit';
    const direction = /below|under|drops?|less than|<|falls/.test(lower) ? 'below' : 'above';
    const tenor = lower.match(/(\d+)\s*-?\s*(?:month|mo|m)\b/);
    return NextResponse.json({
      alert: {
        productCategory: category,
        bankSlug: BANK_SLUGS.find((s) => lower.includes(s)) ?? null,
        tenorMonths: tenor ? parseInt(tenor[1], 10) : null,
        direction,
        targetRate: target,
        label: text.trim().slice(0, 140),
      },
    });
  }

  try {
    const { object } = await generateObject({
      model: anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'),
      schema,
      system:
        'You convert a user\'s plain-English rate-alert request into structured fields for FinLens SG (Singapore retail banking). ' +
        'Categories: savings, fixed-deposit, home-loan. For home loans a lower rate is better, so "when rates drop" means direction "below". ' +
        'If no bank is named, bankSlug is null (any bank). Infer a sensible target rate from the text.',
      prompt: `Parse this rate alert request: "${text.trim()}"`,
    });
    return NextResponse.json({ alert: object });
  } catch (err) {
    console.error('[api/alerts/parse] failed:', err);
    return NextResponse.json({ error: 'Could not parse request' }, { status: 500 });
  }
}
