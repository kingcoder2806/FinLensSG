'use client';

import { useState } from 'react';
import type { BankInfo } from '@/constants/banks';

/**
 * Renders a bank's real logo with a graceful fallback chain:
 *   1. Clearbit logo (clean transparent brand logo)
 *   2. Google favicon service (always available)
 *   3. the bank's emoji (offline / both blocked)
 *
 * Logos are loaded from the bank's own domain (derived from `website`), so no
 * assets need to be bundled. Plain <img> is used (not next/image) to avoid the
 * remotePatterns allowlist.
 */
export function BankLogo({
  bank,
  size = 28,
  rounded = 8,
}: {
  bank: BankInfo;
  size?: number;
  rounded?: number;
}) {
  // Some banks' website host isn't the brand domain the logo services key on,
  // so override those explicitly.
  const LOGO_DOMAIN: Partial<Record<string, string>> = {
    'standard-chartered': 'sc.com',
    'maybank': 'maybank.com',
    'citibank': 'citi.com',
  };

  let domain = LOGO_DOMAIN[bank.slug] ?? '';
  if (!domain) {
    try {
      domain = new URL(bank.website).hostname.replace(/^www\./, '');
    } catch {
      /* fall back to emoji below */
    }
  }

  const sources = domain
    ? [
        `https://logo.clearbit.com/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      ]
    : [];

  const [idx, setIdx] = useState(0);

  if (sources.length === 0 || idx >= sources.length) {
    return (
      <span style={{ fontSize: Math.round(size * 0.82), lineHeight: 1 }} aria-hidden>
        {bank.logo}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt={`${bank.name} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: rounded,
        background: '#fff',
        padding: Math.max(2, Math.round(size * 0.1)),
        flexShrink: 0,
      }}
    />
  );
}
