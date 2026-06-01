import Link from 'next/link';
import { ExternalLink, Phone, Mail } from 'lucide-react';
import type { BankInfo } from '@/constants/banks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BankCardProps {
  bank: BankInfo;
  topRate?: number;
  topRateLabel?: string;
}

export function BankCard({ bank, topRate, topRateLabel }: BankCardProps) {
  return (
    <Link href={`/banks/${bank.slug}`}>
      <Card
        className={`group hover:border-opacity-60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${bank.borderClass}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{bank.logo}</span>
              <div>
                <h3 className={`font-semibold text-sm ${bank.textClass}`}>{bank.name}</h3>
                <p className="text-[10px] text-muted-foreground">Est. {bank.established}</p>
              </div>
            </div>
            {topRate && (
              <div className="text-right">
                <p className="font-mono text-lg font-bold text-brand-green">
                  {topRate.toFixed(2)}%
                </p>
                <p className="text-[10px] text-muted-foreground">{topRateLabel}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {bank.description}
          </p>
          <div className="flex flex-col gap-1.5">
            <a
              href={`tel:${bank.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {bank.phone}
            </a>
            {bank.email && (
              <a
                href={`mailto:${bank.email}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3" />
                {bank.email}
              </a>
            )}
            <a
              href={bank.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              {bank.website.replace('https://', '')}
            </a>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
