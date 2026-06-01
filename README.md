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
