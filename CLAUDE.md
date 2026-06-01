# FinLens SG — CLAUDE.md

## 1. Project Overview

FinLens SG is a Next.js 14 web app for Singapore retail banking decisions. It helps users compare financial product rates (savings accounts, fixed deposits, home loans, credit cards, ETFs/unit trusts) across seven major Singapore banks: DBS/POSB, OCBC, UOB, Standard Chartered, Citibank, HSBC, Maybank.

The core feature is an AI chat assistant called "Fin" (powered by Claude) that fetches live rate data directly from official bank websites and gives personalized, opinionated recommendations — not just raw data. The assistant has two modes: a **rates agent** for single-bank/product queries, and a **compare agent** for cross-bank rankings.

The app is an MVP. Seed data (fixed deposit reference rates only) is always available as a fallback. Supabase (rate history + user alerts) and email delivery are scaffolded but not yet implemented.

---

## 2. Tech Stack

| Dependency | Purpose |
|---|---|
| `next` 14.2.5 | App framework — App Router, server components, static generation |
| `react` 18 | UI |
| `@ai-sdk/anthropic` + `ai` | Vercel AI SDK used to call Claude in the chat API route (`generateText`, `tool`) |
| `@anthropic-ai/sdk` | Also installed but **not used** in current code — `@ai-sdk/anthropic` is the active Claude client |
| `@upstash/redis` | Serverless Redis for 30-minute response caching (avoids redundant live fetches) |
| `@supabase/supabase-js` | Client for Supabase — stubbed; tables don't exist yet |
| `@prisma/client` + `prisma` | ORM — scripts exist (`db:push`, `db:generate`, `db:studio`, `db:migrate`) but no `schema.prisma` file exists in the repo yet |
| `zod` | Schema validation for chat API tool parameters |
| `tailwindcss` 3.4 | Styling — heavily customised with brand tokens and surface scale |
| `class-variance-authority` | Variant system for UI components (shadcn/ui pattern) |
| `clsx` + `tailwind-merge` | Conditional class merging (`cn()` helper) |
| `lucide-react` | Icons |
| `@radix-ui/*` | Headless primitives: Dialog, Tabs, ScrollArea, Select, Tooltip, Avatar, Separator, Label, Switch, Slot |
| `react-markdown` + `remark-gfm` | Installed but not yet wired up in the chat UI (messages currently render as plain `<p>` tags) |
| `framer-motion` | Installed but not yet used in any component |
| `date-fns` | Date utilities — installed, minimal usage |
| `Inter` + `JetBrains Mono` | Fonts loaded via `next/font/google`; Mono used for all rate/number display |

---

## 3. Architecture

```
app/                        Next.js App Router pages
  layout.tsx                Root layout — fonts, metadata, Header, dark mode forced
  page.tsx                  Home → ChatPanel + Sidebar
  compare/page.tsx          FD rate comparison table (seed data only, client component)
  banks/[slug]/page.tsx     Individual bank profile — static params from BANKS array
  alerts/page.tsx           Placeholder — no functionality yet
  api/chat/route.ts         POST handler — the AI backend

components/
  layout/
    Header.tsx              Sticky top nav, responsive (desktop text + mobile icons)
    Sidebar.tsx             xl-only sticky sidebar — shows top-5 FD 12m reference rates + bank links
  chat/
    ChatPanel.tsx           Client component — full chat UI, calls /api/chat, manages message state
  banks/
    BankCard.tsx            Card with bank info + top rate, links to /banks/[slug]
    BankFilter.tsx          Multi-select pill filter by bank slug
  rates/
    RateTable.tsx           Sortable rate table — highlights best value per column in green
  ui/                       shadcn/ui-pattern components (Button, Card, Badge, Input, etc.)

lib/
  supabase.ts               Supabase client (public + admin), type interfaces, DB helper functions
  redis.ts                  Upstash Redis wrapper — cacheGet/cacheSet/cacheDel/cacheGetOrSet
  utils.ts                  cn(), formatRate(), formatCurrency(), getRateColor(), detectAgentType(), timeAgo()
  agents/
    rates-agent.ts          System prompt + context for the Rates Agent mode
    compare-agent.ts        System prompt + context for the Compare Agent mode

constants/
  banks.ts                  BANKS array (BankInfo), BANK_MAP, BANK_SLUGS, BankSlug type
  bankUrls.ts               Official bank URLs per bank/product — used to pass to Claude for live fetching
  products.ts               Product categories, FD tenors, QUICK_PROMPTS, SEED_RATES (FD fallback data)

types/
  index.ts                  All shared TypeScript types: RateEntry subtypes, ChatMessage, AlertSubscription, ComparisonRow
```

---

## 4. Data Flow

### Live chat query (happy path)
```
User message → ChatPanel → POST /api/chat
  → detectAgentType() picks system prompt (rates or compare)
  → detectBankProduct() extracts bank + product → resolves official URL from BANK_URLS
  → check Redis cache (key: "{bank}:{product}") → cache hit → return immediately
  → cache miss → generateText() with Claude + fetchUrl tool
      → Claude calls fetchUrl(officialUrl) → strips HTML → returns text to Claude
      → Claude generates markdown response
  → store response in Redis (30-min TTL)
  → return { content } to ChatPanel → render in message list
```

### Fallback (no API key or Claude error)
```
POST /api/chat → no ANTHROPIC_API_KEY → seedAnswer() → markdown table from SEED_RATES
```

### Static pages (compare, bank profiles)
```
SEED_RATES (constants/products.ts) → RateTable component → rendered at request time
(compare page is a client component; bank pages use generateStaticParams for SSG)
```

### Supabase (not yet active)
```
Future: scraper/cron → insertRateHistory() → rate_history table
Future: alerts page form → createAlert() → alerts table → email delivery cron
```

---

## 5. Key Files

| File | What it does |
|---|---|
| `app/api/chat/route.ts` | The entire AI backend. Handles agent routing, URL detection, Redis caching, Claude call, seed fallback. The most complex file. |
| `lib/supabase.ts` | DB type definitions and helper functions. The implied schema lives here as TypeScript interfaces. |
| `lib/redis.ts` | Thin Upstash wrapper. All caching goes through `cacheGetOrSet`. |
| `lib/utils.ts` | `detectAgentType()` is critical — keyword matching on message content decides which system prompt Claude receives. |
| `constants/bankUrls.ts` | Maps every bank+product combination to its official URL. Claude fetches these directly. If a bank changes its URL structure, update it here. |
| `constants/products.ts` | `SEED_RATES` is the only fallback data — FD rates only, hardcoded, not auto-updated. Also contains `QUICK_PROMPTS`. |
| `constants/banks.ts` | Source of truth for all bank metadata (name, color classes, contact info, logo emoji). |
| `lib/agents/rates-agent.ts` | System prompt for single-product queries. Instructs Claude to call `fetchUrl` before using training data. |
| `lib/agents/compare-agent.ts` | System prompt for cross-bank comparisons. Formats output with fixed sections: Recommendation → Ranked table → Why → Watch Out For. |
| `tailwind.config.ts` | Defines the full brand token system — surface scale, brand colors, animations, font families. |
| `app/globals.css` | CSS custom properties for shadcn tokens + custom component classes (`.rate-value`, `.glass-card`, `.prose-dark`, `.live-dot`). |

---

## 6. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | No (degrades gracefully) | Claude API key. Without it, chat returns seed data. Model is set via `ANTHROPIC_MODEL`. |
| `ANTHROPIC_MODEL` | No | Claude model ID to use. Defaults to `claude-sonnet-4-6` if unset. |
| `UPSTASH_REDIS_REST_URL` | No (degrades gracefully) | Upstash Redis REST endpoint. Cache failures are caught and logged — app continues without caching. |
| `UPSTASH_REDIS_REST_TOKEN` | No (degrades gracefully) | Auth token for Upstash Redis. |
| `NEXT_PUBLIC_SUPABASE_URL` | No (not yet active) | Supabase project URL. Used by both public and admin clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (not yet active) | Supabase anon key — safe for browser. Used by the public `supabase` client. |
| `SUPABASE_SERVICE_ROLE_KEY` | No (not yet active) | Supabase service role key — **server-only**, never expose to client. Used by `supabaseAdmin`. |
| `DATABASE_URL` | No (not yet active) | PostgreSQL connection string for Prisma. Points to the Supabase Postgres instance. |
| `NEXT_PUBLIC_APP_URL` | No | App base URL. Set to `http://localhost:3000` locally. |

---

## 7. Development Commands

```bash
npm run dev          # Start Next.js dev server at localhost:3000
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint (next lint)

# Prisma (no schema.prisma yet — these will fail until schema is created)
npm run db:push      # Push schema to DB without migration file
npm run db:generate  # Generate Prisma client from schema
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:migrate   # Create and run a migration
```

---

## 8. Conventions

**Naming**
- React components: PascalCase files and exports (`ChatPanel.tsx`, `BankCard.tsx`)
- Server utilities: camelCase (`cacheGet`, `insertRateHistory`)
- Constants: SCREAMING_SNAKE_CASE for arrays/objects (`BANKS`, `SEED_RATES`, `BANK_URLS`, `QUICK_PROMPTS`)
- Types: PascalCase (`BankSlug`, `RateEntry`, `AlertRow`)
- Tailwind class composition always via `cn()` from `lib/utils.ts`

**Component patterns**
- UI primitives in `components/ui/` follow the shadcn/ui pattern: `class-variance-authority` for variants, `cn()` for class merging, Radix UI as the headless base
- `'use client'` is declared explicitly on every client component; server components have no directive
- Pages that need interactivity (compare, chat) are fully client components; bank profile pages use SSG via `generateStaticParams`

**Styling**
- Dark mode only — `dark` class is hardcoded on `<html>` in `layout.tsx`; no light mode tokens
- Surface scale: `surface-0` (#09090f, darkest background) → `surface-4` (#22222f, elevated elements)
- Rate numbers always render in JetBrains Mono via `.rate-value`, `.mono-data`, or `font-mono`
- Color thresholds for rate display: ≥4.0% = `text-brand-green`, ≥3.5% = `text-brand-amber`, below = `text-muted-foreground`
- Custom CSS component classes defined in `globals.css` @layer components: `.rate-value`, `.glass-card`, `.glow-green`, `.glow-blue`, `.mono-data`, `.live-dot`, `.prose-dark`

**Agent routing**
- `detectAgentType()` in `lib/utils.ts` keyword-matches the user message to pick `rates` or `compare`
- The system prompt swap happens in `app/api/chat/route.ts` at the `generateText` call
- `RATES_AGENT_CONTEXT` and `COMPARE_AGENT_CONTEXT` exports in the agent files are defined but **not currently imported** in the chat route

---

## 9. External Services

### Claude (Anthropic via Vercel AI SDK)
- Used via `@ai-sdk/anthropic` + `ai` package (`generateText`, `tool`)
- `maxSteps: 5` — Claude can call `fetchUrl` up to 5 times per request
- Only one tool is registered: `fetchUrl` — there is no web search tool wired up despite the compare agent prompt referencing search
- HTML stripping is done by regex in the route (removes `<style>`, `<script>`, all tags), truncated to 8,000 chars before passing to Claude
- Cache key format: `"{bankKey}:{productKey}"` e.g. `"dbs:fixedDeposit"`

### Upstash Redis
- REST-based (no persistent connection) — suitable for serverless/edge
- TTL: 30 minutes for all cached chat responses
- Cache keys prefixed with `finlens:` in `CACHE_KEYS` helper (used in `lib/redis.ts`) but the chat route uses its own raw key format (`dbs:fixedDeposit`) — these two systems are not unified
- Failures are silently caught and logged; app degrades gracefully

### Supabase (stubbed — tables do not exist yet)
Two tables are implied by the TypeScript interfaces in `lib/supabase.ts`:

**`rate_history`**
```sql
id             uuid primary key default gen_random_uuid()
bank_slug      text not null
product_category text not null
product_name   text not null
rate           numeric not null
promo_rate     numeric
tenor_months   integer
recorded_at    timestamptz default now()
```

**`alerts`**
```sql
id               uuid primary key default gen_random_uuid()
email            text not null
bank_slug        text
product_category text
target_rate      numeric
direction        text check (direction in ('above', 'below'))
active           boolean default true
created_at       timestamptz default now()
```

Both use the service role key (admin client) for all writes and reads — no row-level security is assumed in the current helper functions.

---

## 10. Known Gotchas

**BankUrlKey vs BankSlug mismatch**
`BANK_URLS` uses `sc` for Standard Chartered; `BankSlug` (from `constants/banks.ts`) uses `standard-chartered`. These are separate systems. `detectBankProduct()` in the chat route maps user messages to `BankUrlKey`, but all other parts of the app use `BankSlug`. Never conflate them.

**`@anthropic-ai/sdk` is installed but unused**
The direct Anthropic SDK is in `dependencies` but the active Claude integration is `@ai-sdk/anthropic` (Vercel AI SDK wrapper). Don't import from `@anthropic-ai/sdk` unless switching away from the Vercel AI SDK.

**Agent context strings are defined but not used**
`RATES_AGENT_CONTEXT` and `COMPARE_AGENT_CONTEXT` in `lib/agents/*.ts` are exported but never imported in the chat route. Only the `*_SYSTEM` exports are used.

**No web search tool**
The compare agent system prompt instructs Claude to "search for current rates across all relevant banks before comparing" but there is no search tool in the chat route — only `fetchUrl`. For generic queries with no detected bank+product, Claude has to rely on its training data.

**Seed data is FD-only**
`SEED_RATES` covers fixed deposits for 4 tenors only. There is no seed data for savings, home loans, credit cards, or ETFs. The compare page and sidebar only show FD data. If building new pages for other product types, live Claude responses are the only source.

**`react-markdown` and `framer-motion` are installed but not used**
Chat messages currently render as `<p className="whitespace-pre-wrap">` — markdown is not parsed in the UI. The assistant responses are markdown-formatted, so this is a pending improvement.

**Compare page is seed data only**
`app/compare/page.tsx` is a client component that reads directly from `SEED_RATES`. It does not call the chat API or fetch live data. The page explicitly tells users to use the chat for live rates.

**Bank pages are statically generated**
`app/banks/[slug]/page.tsx` uses `generateStaticParams` — all 7 bank pages are pre-rendered at build time from the `BANKS` array. Adding a new bank requires updating `BANKS`, `BANK_MAP`, `BANK_URLS`, and `SEED_RATES`.

**No Prisma schema file**
`prisma` and `@prisma/client` are in dependencies with npm scripts, but there is no `prisma/schema.prisma` file. The `db:*` scripts will fail until a schema is created. The Supabase Postgres URL is in `DATABASE_URL`.

**`SUPABASE_SERVICE_ROLE_KEY` must stay server-only**
This key bypasses all Supabase RLS policies. It is correctly stored without a `NEXT_PUBLIC_` prefix. Never move it to a public env var. The `supabaseAdmin` client in `lib/supabase.ts` is for server-side use only.

**Rate thresholds are hardcoded**
The 3.5% and 4.0% thresholds in `getRateColor()`, `getRateBadgeVariant()`, and `RateTable` are hardcoded. They made sense at time of writing but may need updating as Singapore rates change.
