import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Categories that have a numeric threshold the checker can evaluate.
const CATEGORIES = ['savings', 'fixed-deposit', 'home-loan'] as const;

const createSchema = z.object({
  email: z.string().email(),
  productCategory: z.enum(CATEGORIES),
  bankSlug: z.string().optional().nullable(),
  tenorMonths: z.number().int().positive().optional().nullable(),
  direction: z.enum(['above', 'below']),
  targetRate: z.number().min(0).max(100),
  label: z.string().max(140).optional().nullable(),
});

async function db() {
  // Dynamic import so a missing Supabase env returns a clean 503 instead of crashing.
  return import('@/lib/supabase');
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  try {
    const { listAlertsByEmail } = await db();
    return NextResponse.json({ alerts: await listAlertsByEmail(email) });
  } catch {
    return NextResponse.json({ error: 'Alerts storage not configured' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid alert', details: parsed.error.flatten() }, { status: 400 });
  }
  const a = parsed.data;
  try {
    const { createAlert } = await db();
    const alert = await createAlert({
      email: a.email.toLowerCase().trim(),
      product_category: a.productCategory,
      bank_slug: a.bankSlug || null,
      tenor_months: a.tenorMonths ?? null,
      direction: a.direction,
      target_rate: a.targetRate,
      label: a.label || null,
      active: true,
    });
    return NextResponse.json({ alert });
  } catch (err) {
    console.error('[api/alerts] create failed:', err);
    return NextResponse.json({ error: 'Could not save alert' }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  const email = params.get('email');
  if (!id || !email) return NextResponse.json({ error: 'id and email required' }, { status: 400 });
  try {
    const { deleteAlert } = await db();
    const ok = await deleteAlert(id, email);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Alerts storage not configured' }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const json = (await req.json().catch(() => ({}))) as { id?: string; email?: string; active?: boolean };
  if (!json.id || !json.email || typeof json.active !== 'boolean') {
    return NextResponse.json({ error: 'id, email and active required' }, { status: 400 });
  }
  try {
    const { setAlertActive } = await db();
    const ok = await setAlertActive(json.id, json.email, json.active);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Alerts storage not configured' }, { status: 503 });
  }
}
