# FinLens SG

Bare-minimum Next.js 14 MVP for comparing Singapore bank rates.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional Environment

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to enable Claude responses. Without it, the chat route returns local seed-rate answers.

Redis, Supabase, Prisma, live web search, and email alerts are scaffolded but not required for this MVP.

## Automated Rate Updates

`/api/check-rates` scrapes live data and refreshes the Supabase DB on a schedule. It runs in two phases:

1. **Fixed deposits** — the curated manifest in `constants/rateCheckManifest.ts` (7 banks), with ≥0.10pp change detection, appended to `rate_history`.
2. **Everything else + extra sources** — savings, home loans, credit cards, ETFs and bonds, pulled from the registry in `constants/sources.ts`. Beyond the 7 banks' own pages this adds **aggregator sites** (SingSaver, MoneySmart, Seedly), **fund-manager pages** (Amova/ex-Nikko AM, Lion Global, UOB AM), and **SGX** feeds. Each page is fetched, HTML-stripped, and structured-extracted by Claude (`lib/scraper.ts`), then upserted via `lib/update-rates.ts`.

### Setup

1. Create the tables: `npm run db:init` (runs `supabase/migrations/0001_init.sql` against `DATABASE_URL`), or paste the SQL into the Supabase SQL editor.
2. Set `ANTHROPIC_API_KEY`, the Supabase service env vars, and a `CHECK_RATES_SECRET` (and/or `CRON_SECRET` for Vercel Cron).

### Triggers

```bash
# Local CLI
npm run update:rates            # full run, writes to DB
npm run update:rates:dry        # extract only, no writes

# HTTP (manual / CI)
curl -X POST "$APP_URL/api/check-rates?phase=all" -H "x-check-secret: $CHECK_RATES_SECRET"
curl "$APP_URL/api/check-rates?kind=etf&dry=1" -H "Authorization: Bearer $CHECK_RATES_SECRET"
```

Automatic runs are configured in `vercel.json` (daily 01:00 / 01:30 UTC, split by phase to stay within serverless time limits). To add or change sources, edit `constants/sources.ts`.

### Headless rendering (JS-rendered / bot-protected pages)

Plain `fetch` only sees raw HTML, so client-rendered rate tables (DBS/OCBC landing pages) come back empty and some aggregators (MoneySmart) return 403. `lib/render.ts` adds a Chromium fallback:

- Sources flagged `render: true` in `constants/sources.ts` (MoneySmart, SGX) always render.
- Passing `?render=1` (or `--render` on the CLI) also re-renders any source that extracted 0 rows on the normal fetch, then re-extracts — capturing the JS-only bank pages.

Install the browser engine before using it:

```bash
# Local
npm i -D playwright && npx playwright install chromium
npm run update:rates:full          # = --render

# Serverless (Vercel/AWS Lambda) — already in optionalDependencies
# playwright-core + @sparticuz/chromium are used automatically when present
```

If the Playwright deps aren't installed, the renderer is skipped gracefully and the scraper falls back to plain fetch. Trigger a full render run over HTTP with:

```bash
curl "$APP_URL/api/check-rates?phase=extended&render=1" -H "x-check-secret: $CHECK_RATES_SECRET"
```
