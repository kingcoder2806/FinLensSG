/**
 * Alert checker — compares every active alert against the current live rates and
 * emails the user when a threshold is crossed. Designed to run at the end of the
 * /api/check-rates cron, after fresh rates have been written.
 *
 * Supported categories (numeric thresholds): savings, fixed-deposit, home-loan.
 * De-dupes notifications by only emailing when the tripped value differs from the
 * last one we notified about (stored in alerts.last_value).
 */

import { Resend } from 'resend';
import { getActiveAlerts, markAlertTriggered, type AlertRow } from '@/lib/supabase';
import { getLiveData, type LiveData } from '@/lib/live-data';
import { BANK_MAP } from '@/constants/banks';

export interface AlertCheckReport {
  checked: number;
  tripped: number;
  emailed: number;
  emailConfigured: boolean;
  details: Array<{ id: string; label: string; current: number | null; tripped: boolean; emailed: boolean }>;
}

const TENORS = [3, 6, 12, 24] as const;

/** Current rate relevant to an alert, or null if not determinable. Higher-is-better
 *  for savings/FD; lower-is-better for home loans (returns the min available rate). */
function currentValue(alert: AlertRow, data: LiveData): number | null {
  const bank = alert.bank_slug;

  if (alert.product_category === 'savings') {
    const rows = bank ? data.savings.filter((s) => s.bank === bank) : data.savings;
    if (!rows.length) return null;
    return Math.max(...rows.map((s) => s.maxRate));
  }

  if (alert.product_category === 'fixed-deposit') {
    const t = (TENORS as readonly number[]).includes(alert.tenor_months ?? 12)
      ? ((alert.tenor_months ?? 12) as 3 | 6 | 12 | 24)
      : 12;
    const rows = data.fdRates[t] ?? [];
    const scoped = bank ? rows.filter((r) => r.bank === bank) : rows;
    if (!scoped.length) return null;
    return Math.max(...scoped.map((r) => r.rate));
  }

  if (alert.product_category === 'home-loan') {
    const rows = bank ? data.homeLoans.filter((l) => l.bank === bank) : data.homeLoans;
    if (!rows.length) return null;
    return Math.min(...rows.map((l) => l.rate)); // lower is better
  }

  return null;
}

function describe(alert: AlertRow): string {
  if (alert.label) return alert.label;
  const cat =
    alert.product_category === 'fixed-deposit'
      ? `${alert.tenor_months ?? 12}-month fixed deposit`
      : alert.product_category === 'home-loan'
        ? 'home loan'
        : 'savings account';
  const where = alert.bank_slug ? `${BANK_MAP[alert.bank_slug as keyof typeof BANK_MAP]?.shortName ?? alert.bank_slug} ` : 'any ';
  return `${where}${cat} ${alert.direction} ${alert.target_rate}%`;
}

function isTripped(alert: AlertRow, value: number): boolean {
  if (alert.target_rate == null) return false;
  return alert.direction === 'above' ? value >= alert.target_rate : value <= alert.target_rate;
}

async function sendAlertEmail(alert: AlertRow, value: number): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL ?? 'FinLens SG <fin@finlenssg.com>';

  const label = describe(alert);
  const subject = `Rate alert: ${label} — now ${value.toFixed(2)}% p.a.`;
  const body =
    `Good news — a rate you're watching just crossed your threshold.\n\n` +
    `Your alert: ${label}\n` +
    `Current best rate: ${value.toFixed(2)}% p.a.${alert.last_value != null ? ` (was ${alert.last_value.toFixed(2)}%)` : ''}\n\n` +
    `Compare the latest rates: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://finlenssg.com'}/compare\n\n` +
    `— Fin, FinLens SG\n` +
    `You're receiving this because you set a rate alert. Manage your alerts at ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://finlenssg.com'}/alerts`;

  try {
    const res = await resend.emails.send({ from, to: [alert.email], subject, text: body });
    return !res.error;
  } catch {
    return false;
  }
}

export async function checkAlerts(): Promise<AlertCheckReport> {
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const report: AlertCheckReport = { checked: 0, tripped: 0, emailed: 0, emailConfigured, details: [] };

  const alerts = await getActiveAlerts();
  if (!alerts.length) return report;

  const data = await getLiveData();

  for (const alert of alerts) {
    report.checked++;
    const value = currentValue(alert, data);
    const tripped = value != null && isTripped(alert, value);

    let emailed = false;
    if (tripped && value != null) {
      report.tripped++;
      // Only notify when this is a new/different value than last time.
      const alreadyNotified =
        alert.last_triggered_at != null &&
        alert.last_value != null &&
        Math.abs(alert.last_value - value) < 0.01;

      if (!alreadyNotified) {
        emailed = await sendAlertEmail(alert, value);
        if (emailed) report.emailed++;
        // Mark regardless of email success so we don't re-evaluate endlessly;
        // if email wasn't configured we still record the value seen.
        await markAlertTriggered(alert.id, value);
      }
    }

    report.details.push({ id: alert.id, label: describe(alert), current: value, tripped, emailed });
  }

  return report;
}
