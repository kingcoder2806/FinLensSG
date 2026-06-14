/**
 * Local CLI for the automated rate updater. Runs the same orchestrator the cron
 * route uses, against your configured Supabase + Anthropic env.
 *
 * Usage (loads .env.local automatically via Next's loader if run through next,
 * otherwise export the env vars first):
 *
 *   npx tsx scripts/update-rates.ts                  # full run, writes to DB
 *   npx tsx scripts/update-rates.ts --dry            # extract only, no writes
 *   npx tsx scripts/update-rates.ts --only=etf,bond  # restrict to extract kinds
 *   npx tsx scripts/update-rates.ts --source=fm:amova:sti-etf
 *
 * Requires ANTHROPIC_API_KEY and the Supabase service env vars to be set.
 */

import { runRateUpdate, type RunOptions } from '@/lib/update-rates';
import type { ExtractKind } from '@/constants/sources';

function parseArgs(argv: string[]): RunOptions {
  const opts: RunOptions = {};
  for (const arg of argv) {
    if (arg === '--dry' || arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--render') opts.render = true;
    else if (arg.startsWith('--only=')) {
      opts.only = arg.slice('--only='.length).split(',').map((s) => s.trim()) as ExtractKind[];
    } else if (arg.startsWith('--source=')) {
      opts.sourceIds = arg.slice('--source='.length).split(',').map((s) => s.trim());
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log('Running rate update with options:', opts);

  const report = await runRateUpdate(opts);

  console.log('\n── Run report ───────────────────────────────');
  console.log(`status:        ${report.status}`);
  console.log(`sources ok:    ${report.sourcesOk}/${report.sourcesTotal}`);
  console.log(`rows written:  ${report.rowsWritten}`);
  console.log(`duration:      ${report.durationMs}ms`);
  console.log('\nPer-source:');
  for (const s of report.sources) {
    const tag = s.ok ? 'ok ' : 'ERR';
    console.log(
      `  [${tag}] ${s.id.padEnd(28)} extracted=${s.rowsExtracted} written=${s.rowsWritten}` +
      (s.error ? `  (${s.error})` : ''),
    );
  }

  process.exit(report.status === 'error' ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
