import { NextResponse } from 'next/server';

// Reads live rates from Supabase (with seed fallback baked into getLiveData).
// Dynamically imports the data layer so a missing Supabase env can't break the
// route — on failure we return a seed marker and the client uses its own copy.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getLiveData } = await import('@/lib/live-data');
    const data = await getLiveData();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[api/data] falling back to seed:', err);
    return NextResponse.json({ meta: { source: 'seed', asOf: null } });
  }
}
