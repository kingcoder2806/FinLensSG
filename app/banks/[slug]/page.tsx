import { notFound } from 'next/navigation';
import { Phone, Mail, ExternalLink } from 'lucide-react';
import { BANKS, BANK_MAP, type BankSlug } from '@/constants/banks';
import { SEED_RATES } from '@/constants/products';
import { RateTable } from '@/components/rates/RateTable';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function generateStaticParams() {
  return BANKS.map((bank) => ({ slug: bank.slug }));
}

export default function BankPage({ params }: { params: { slug: BankSlug } }) {
  const bank = BANK_MAP[params.slug];
  if (!bank) notFound();

  const fdRow = {
    bank: bank.slug,
    fd3m: SEED_RATES.fixedDeposit[3].find((item) => item.bank === bank.slug)?.rate,
    fd6m: SEED_RATES.fixedDeposit[6].find((item) => item.bank === bank.slug)?.rate,
    fd12m: SEED_RATES.fixedDeposit[12].find((item) => item.bank === bank.slug)?.rate,
    fd24m: SEED_RATES.fixedDeposit[24].find((item) => item.bank === bank.slug)?.rate,
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="text-4xl">{bank.logo}</span>
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
