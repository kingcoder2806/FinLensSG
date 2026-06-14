/**
 * Headless-browser fallback for JavaScript-rendered or bot-protected pages.
 *
 * Plain `fetch` only sees the raw HTML, so client-rendered rate tables (DBS/OCBC
 * landing pages) come back empty and some aggregators (MoneySmart) return 403.
 * This module renders the page in real Chromium and returns the settled HTML as text.
 *
 * Deps are loaded lazily via runtime `import()` with a variable specifier so:
 *   - Next/webpack does NOT try to bundle Chromium, and
 *   - `next build` type-checks even when Playwright isn't installed.
 *
 * Local dev:   npm i -D playwright            && npx playwright install chromium
 * Serverless:  npm i playwright-core @sparticuz/chromium   (Vercel/AWS Lambda)
 */

import { browserHeaders, type FetchResult } from '@/lib/scraper';

const MAX_CHARS = 14_000;
const RENDER_TIMEOUT_MS = 35_000;

// Reuse one browser across a run; closed by closeBrowser() at the end.
let browserPromise: Promise<any> | null = null;

async function launchBrowser(): Promise<any> {
  // 1) Serverless: playwright-core + @sparticuz/chromium (bundled Chromium build).
  try {
    const corePkg = 'playwright-core';
    const chromiumPkg = '@sparticuz/chromium';
    const sparticuz: any = (await import(/* webpackIgnore: true */ chromiumPkg as string)).default;
    const { chromium }: any = await import(/* webpackIgnore: true */ corePkg as string);
    return await chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  } catch {
    /* fall through to local Playwright */
  }

  // 2) Local dev: full `playwright` package with its own Chromium download.
  const pkg = 'playwright';
  const { chromium }: any = await import(/* webpackIgnore: true */ pkg as string);
  return await chromium.launch({ headless: true });
}

function getBrowser(): Promise<any> {
  if (!browserPromise) browserPromise = launchBrowser();
  return browserPromise;
}

/** True when a headless engine can be started (deps installed). */
export async function renderAvailable(): Promise<boolean> {
  try {
    await getBrowser();
    return true;
  } catch {
    return false;
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  try {
    const b = await browserPromise;
    await b.close();
  } catch {
    /* ignore */
  } finally {
    browserPromise = null;
  }
}

function strip(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_CHARS);
}

/**
 * Render a URL in headless Chromium and return its settled text.
 * Returns { ok: false } if rendering deps are missing or navigation fails —
 * callers should treat that as "fallback unavailable" and move on.
 */
export async function renderPage(
  url: string,
  opts: { waitForSelector?: string; isJson?: boolean } = {},
): Promise<FetchResult> {
  let context: any;
  try {
    const browser = await getBrowser();
    const headers = browserHeaders(url, opts.isJson);
    context = await browser.newContext({
      userAgent: headers['User-Agent'],
      locale: 'en-SG',
      extraHTTPHeaders: { 'Accept-Language': 'en-SG,en;q=0.9' },
    });
    const page = await context.newPage();
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT_MS });

    if (opts.waitForSelector) {
      await page.waitForSelector(opts.waitForSelector, { timeout: 8_000 }).catch(() => {});
    }

    // API/JSON endpoints: the body is the JSON payload (often inside <pre>).
    if (opts.isJson) {
      const body = await page.evaluate(() => document.body?.innerText ?? '');
      return { ok: true, isJson: true, status: resp?.status(), text: String(body).slice(0, MAX_CHARS) };
    }

    const html = await page.content();
    return { ok: true, isJson: false, status: resp?.status(), text: strip(html) };
  } catch (err) {
    return { ok: false, error: `render failed: ${String(err)}` };
  } finally {
    if (context) await context.close().catch(() => {});
  }
}
