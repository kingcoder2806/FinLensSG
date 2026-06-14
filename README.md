# FinLens SG

**An independent comparison desk for Singapore retail banking rates — with an AI assistant that reads the rate tables for you.**

FinLens SG compares savings accounts, fixed deposits, home loans, credit cards, ETFs and bonds across Singapore's seven major banks (DBS/POSB, OCBC, UOB, Standard Chartered, Citibank, HSBC, Maybank). Rates are kept current by an automated scraper that pulls from official bank pages, fund managers, aggregators and SGX, extracts the numbers with Claude, and stores them in Supabase. "Fin", the built-in AI assistant, turns those tables into personalised, opinionated answers.

> Built with Next.js 14 (App Router) and the Claude API. Everything degrades gracefully — without a database or API keys the app still runs from bundled seed data.

---

## About

Singapore's bank rate tables are scattered, frequently changing, and full of fine print (bonus tiers, fresh-fund requirements, lock-ins). FinLens SG brings them into one place and adds three things on top:

- **Live data** — a daily scraper refreshes rates from real sources, with AI extraction and a seed fallback so the UI is never empty.
- **Fin, the AI assistant** — ask in plain English ("where should I park S$50k for 6 months?") and get a ranked answer grounded in the current figures.
- **Rate alerts** — set a threshold ("tell me when any 12-month FD beats 1.6%") and get emailed automatically when it's crossed.

It's an information tool, not a financial adviser — every figure links back to the source, and users are reminded to verify with the bank before transacting.

---

## Screenshots

> Images live in `docs/screenshots/`. Run the app locally (`npm run dev`) and drop screenshots in, or have them captured automatically.

| Home | Compare |
|------|---------|
| ![Home page](docs/screenshots/home.png) | ![Compare rates](docs/screenshots/compare.png) |

| Banks | Advisors |
|-------|----------|
| ![Bank profiles](docs/screenshots/banks.png) | ![Advisors / contacts](docs/screenshots/advisors.png) |

| Ask Fin | Rate Alerts |
|---------|-------------|
| ![Ask Fin chat](docs/screenshots/chat.png) | ![Rate alerts](docs/screenshots/alerts.png) |

---

## Features

- **Compare tables** — savings, fixed deposits, home loans, credit cards, SGX ETFs and bonds; sortable, with side-by-side comparison and a live/reference freshness badge.
- **Bank profiles** — per-bank rates and contact details, with real bank logos; ISR-refreshed from the live DB.
- **Ask Fin** — Claude-powered chat with a rates agent and a cross-bank compare agent.
- **Advisors** — real, officially-published bank contact channels (priority/wealth desks, mortgage lines, emails) with an AI email drafter that streams the message in real time.
- **Rate alerts** — natural-language or structured alerts, checked daily against live rates, delivered by email (Resend).
- **Automated scraper** — fetch → strip → Claude extraction, with a headless-browser fallback for JS-rendered / bot-protected pages.

---

## Tech stack

| Area | Stack |
|------|-------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| AI | Claude via the Vercel AI SDK (`@ai-sdk/anthropic`, `ai`) |
| Data | Supabase (Postgres) for live rates, history and alerts |
| Caching | Upstash Redis (30-min response cache) |
| Email | Resend (alert + advisor emails) |
| Scraping | `fetch` + regex HTML strip, Claude `generateObject`, Playwright/Chromium fallback |
| Styling | Tailwind + custom design tokens, dark theme |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in keys (all optional — see below)
npm run dev                  # http://localhost:3000
```

The app runs with **no configuration** using bundled seed data. Add keys to unlock features:

| Variable | Unlocks |
|----------|---------|
| `ANTHROPIC_API_KEY` | Fin chat, AI extraction, AI email/alert parsing |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` | Live rates DB + alerts storage |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Sending alert / advisor emails |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Response caching |
| `CHECK_RATES_SECRET` / `CRON_SECRET` | Protecting the scraper + alert-check endpoints |

### Database setup

```bash
npm run db:init   # applies every migration in supabase/migrations/ (cross-platform, no psql needed)
```

This creates the rate, product, history and alerts tables. You can also paste the SQL from `supabase/migrations/` into the Supabase SQL editor.

---

## Automated rate updates

`/api/check-rates` scrapes live data and refreshes the database, then evaluates alerts. It runs in two phases:

1. **Fixed deposits** — the curated manifest in `constants/rateCheckManifest.ts` (7 banks), with ≥0.10pp change detection, appended to `rate_history`.
2. **Everything else + extra sources** — savings, home loans, credit cards, ETFs and bonds from the registry in `constants/sources.ts`: the 7 banks' own pages plus **aggregators** (SingSaver, MoneySmart, Seedly), **fund managers** (Amova/ex-Nikko AM, Lion Global, UOB AM) and **SGX**. Each page is fetched, HTML-stripped, and structured-extracted by Claude (`lib/scraper.ts`), then upserted via `lib/update-rates.ts`.

### Triggers

```bash
# Local CLI
npm run update:rates            # full run, writes to DB
npm run update:rates:dry        # extract only, no writes
npm run update:rates:full       # with headless rendering (--render)

# HTTP (manual / CI)
curl -X POST "$APP_URL/api/check-rates?phase=all" -H "x-check-secret: $CHECK_RATES_SECRET"
curl "$APP_URL/api/check-rates?kind=etf&dry=1" -H "Authorization: Bearer $CHECK_RATES_SECRET"
```

Automatic runs are configured in `vercel.json` (daily, split by phase to stay within serverless time limits). To add or change sources, edit `constants/sources.ts`.

### Headless rendering (JS-rendered / bot-protected pages)

Plain `fetch` only sees raw HTML, so client-rendered rate tables (DBS/OCBC landing pages) come back empty and some aggregators (MoneySmart) return 403. `lib/render.ts` adds a Chromium fallback:

- Sources flagged `render: true` in `constants/sources.ts` (MoneySmart, SGX) always render.
- Passing `?render=1` (or `--render` on the CLI) also re-renders any source that extracted 0 rows on the normal fetch.

```bash
# Local
npm i -D playwright && npx playwright install chromium
npm run update:rates:full

# Serverless (Vercel/AWS Lambda) — playwright-core + @sparticuz/chromium are
# in optionalDependencies and used automatically when present.
```

If Playwright isn't installed, the renderer is skipped and the scraper falls back to plain fetch.

---

## Live data in the UI

The Compare, Savings, ETFs/Bonds and home pages read live rates through a shared client hook (`lib/useLiveData.ts` → `/api/data`), rendering instantly from seed and swapping in live values, with a freshness badge. Bank profile pages read live FD rates server-side (`lib/live-data.ts`) and refresh via ISR. Every category falls back to seed when the DB is empty or unconfigured.

---

## Rate alerts

Users create alerts on `/alerts` — in plain English ("alert me when any 12-month FD beats 1.6%", parsed by Claude) or via the structured form. The checker (`lib/alerts.ts`) runs at the end of each `/api/check-rates` cron, compares each active alert to current live rates, and emails via Resend when a threshold is crossed (de-duped so it won't repeat the same value).

```bash
# Manually evaluate all alerts (secret-protected)
curl "$APP_URL/api/alerts/check?secret=$CHECK_RATES_SECRET"
```

Email delivery needs `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`; without them, alerts still save and display on the page.

---

## Deployment

Deploy to Vercel and add all environment variables in the dashboard. The cron in `vercel.json` then keeps rates fresh and fires alerts automatically. A full render scrape takes a few minutes, so the **Pro** plan (or splitting the cron by `kind`/`phase`) is recommended over Hobby's 60s function limit.

---

## Disclaimer

FinLens SG is an independent information service, not a financial adviser, bank, or MAS-licensed entity. Rates are illustrative and may not reflect live pricing. Nothing here is financial advice. Bank deposits at MAS-licensed full banks are insured up to S$100,000 by SDIC; investment products are not deposits, are not SDIC-insured, and may lose value. Always verify rates with the bank before transacting.
