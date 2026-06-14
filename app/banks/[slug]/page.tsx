import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone, Mail, ExternalLink, ArrowLeft } from 'lucide-react';
import { BANKS, BANK_MAP, type BankSlug } from '@/constants/banks';
import { SEED_RATES } from '@/constants/products';
import { RateTable } from '@/components/rates/RateTable';
import { BankLogo } from '@/components/banks/BankLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function generateStaticParams() {
  return BANKS.map((bank) => ({ slug: bank.slug }));
}

// Prerender at build, then refresh from the live DB at most every 5 minutes (ISR).
export const revalidate = 300;

export default async function BankPage({ params }: { params: { slug: BankSlug } }) {
  const bank = BANK_MAP[params.slug];
  if (!bank) notFound();

  // Read live FD rates server-side; fall back to seed if Supabase is unavailable.
  let fd = SEED_RATES.fixedDeposit;
  try {
    const { getLiveFdRates } = await import('@/lib/live-data');
    fd = await getLiveFdRates();
  } catch {
    /* keep seed */
  }

  const fdRow = {
    bank: bank.slug,
    fd3m: fd[3].find((item) => item.bank === bank.slug)?.rate,
    fd6m: fd[6].find((item) => item.bank === bank.slug)?.rate,
    fd12m: fd[12].find((item) => item.bank === bank.slug)?.rate,
    fd24m: fd[24].find((item) => item.bank === bank.slug)?.rate,
  };

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <main className="mx-auto w-full max-w-5xl">
        <Link
          href="/banks"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All banks
        </Link>

        {/* Bank switcher */}
        <div className="mb-6 flex flex-wrap gap-2">
          {BANKS.map((b) => {
            const active = b.slug === bank.slug;
            return (
              <Link
                key={b.slug}
                href={`/banks/${b.slug}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? `${b.bgClass} ${b.textClass} ${b.borderClass}`
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                <BankLogo bank={b} size={16} rounded={4} />
                {b.shortName}
              </Link>
            );
          })}
        </div>

        <div className="mb-6 flex items-start gap-3">
          <BankLogo bank={bank} size={44} rounded={10} />
          <div>
            <h1 className={`text-2xl font-semibold tracking-tight ${bank.textClass}`}>{bank.name}</h1>
            <p className="text-sm text-muted-foreground">{bank.description}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RateTable
                rows={[fdRow]}
                columns={[
                  { key: 'fd3m', label: 'FD 3M' },
                  { key: 'fd6m', label: 'FD 6M' },
                  { key: 'fd12m', label: 'FD 12M' },
                  { key: 'fd24m', label: 'FD 24M' },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground" href={`tel:${bank.phone.replace(/\s/g, '')}`}>
                <Phone className="h-4 w-4" />
                {bank.phone}
              </a>
              {bank.email && (
                <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground" href={`mailto:${bank.email}`}>
                  <Mail className="h-4 w-4" />
                  {bank.email}
                </a>
              )}
              <a className="flex items-center gap-2 text-brand-blue hover:underline" href={bank.website} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {bank.website.replace('https://', '')}
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
