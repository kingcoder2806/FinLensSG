import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRate(rate: number, decimals = 2): string {
  return `${rate.toFixed(decimals)}%`;
}

export function formatCurrency(amount: number, currency = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency }).format(amount);
}

export function getRateColor(rate: number, thresholds = { good: 3.5, great: 4.0 }): string {
  if (rate >= thresholds.great) return 'text-brand-green';
  if (rate >= thresholds.good) return 'text-brand-amber';
  return 'text-muted-foreground';
}

export function getRateBadgeVariant(
  rate: number,
  thresholds = { good: 3.5, great: 4.0 }
): 'default' | 'secondary' | 'outline' {
  if (rate >= thresholds.great) return 'default';
  if (rate >= thresholds.good) return 'secondary';
  return 'outline';
}

export function detectAgentType(content: string): 'compare' | 'rates' {
  const compareKeywords = [
    'compare', 'rank', 'best', 'versus', 'vs', 'which bank', 'across', 'all banks',
    'recommend', 'highest', 'lowest', 'top', 'winner',
  ];
  const lower = content.toLowerCase();
  const isCompare = compareKeywords.some((kw) => lower.includes(kw));
  return isCompare ? 'compare' : 'rates';
}

export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
