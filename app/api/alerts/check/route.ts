import { NextResponse } from 'next/server';

// Manually evaluate all active alerts against current live rates (and email any
// that have tripped). Useful for testing without running a full scrape.
// Protected by the same secret as /api/check-rates.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function authorized(req: Request): boolean {
  const secret = process.env.CHECK_RATES_SECRET || process.env.CRON_SECRET;
  if (!secret) return true; // open in dev when no secret set
  const header = req.headers.get('x-check-secret');
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const query = new URL(req.url).searchParams.get('secret') ?? '';
  return header === secret || bearer === secret || query === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { checkAlerts } = await import('@/lib/alerts');
    return NextResponse.json(await checkAlerts());
  } catch (err) {
    console.error('[api/alerts/check] failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
