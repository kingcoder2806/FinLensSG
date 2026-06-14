import { BANKS } from '@/constants/banks';
import { SEED_RATES } from '@/constants/products';
import { BankCard } from '@/components/banks/BankCard';

export const metadata = {
  title: 'Banks — FinLens SG',
  description: 'Compare Singapore retail banks and view their rates and contact details.',
};

export default function BanksIndexPage() {
  const topRateFor = (slug: string) =>
    SEED_RATES.fixedDeposit[12].find((r) => r.bank === slug)?.rate;

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Banks</h1>
          <p className="text-sm text-muted-foreground">
            Select a bank to view its rates and contact details.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BANKS.map((bank) => (
            <BankCard
              key={bank.slug}
              bank={bank}
              topRate={topRateFor(bank.slug)}
              topRateLabel="FD 12M"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
