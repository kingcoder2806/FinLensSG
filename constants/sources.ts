/**
 * Scrape source registry for the automated rate updater (/api/check-rates).
 *
 * This is the single source of truth for every URL the scraper visits. It extends
 * the per-bank official URLs in `bankUrls.ts` with the extra sources requested:
 *   - SGX (listed ETF / bond market data)
 *   - Aggregator sites (SingSaver, MoneySmart, Seedly) — often more current than bank pages
 *   - Fund-manager pages (Amova/Nikko AM, Lion Global, UOB AM) — authoritative NAV / yield
 *   - MAS (optional, authoritative SORA + SGS benchmark yields)
 *
 * Each source declares an `extract` kind which selects the structured-extraction
 * schema applied to the fetched page (see lib/scraper.ts), plus where the result lands.
 */

import { BANK_URLS, type BankUrlKey } from './bankUrls';
import type { BankSlug } from './banks';

/** Maps the short BankUrlKey used in bankUrls.ts to the canonical BankSlug. */
export const BANK_URL_TO_SLUG: Record<BankUrlKey, BankSlug> = {
  dbs: 'dbs',
  ocbc: 'ocbc',
  uob: 'uob',
  sc: 'standard-chartered',
  citi: 'citibank',
  hsbc: 'hsbc',
  maybank: 'maybank',
};

/** Which structured-extraction schema to run against a fetched page. */
export type ExtractKind =
  | 'fd'          // fixed-deposit board/promo rates per tenor   -> rate_history
  | 'savings'     // savings-account headline/bonus rates         -> savings_accounts (+ rate_history)
  | 'homeLoan'    // mortgage packages                            -> home_loans
  | 'creditCard'  // card headline rewards                        -> credit_cards
  | 'etf'         // ETF NAV / returns / yield                    -> etf_products
  | 'bond'        // SGS / SSB / corporate bond yields            -> bonds
  | 'benchmark';  // SORA / benchmark reference rates             -> rate_history (benchmark)

export type SourceType = 'bank' | 'aggregator' | 'fund-manager' | 'sgx' | 'mas';

export interface ScrapeSource {
  /** Stable id, also used as the dedupe / log key. */
  id: string;
  url: string;
  sourceType: SourceType;
  extract: ExtractKind;
  /** Set when the page describes a single bank's product. */
  bankSlug?: BankSlug;
  /** Default true. Set false to keep a source registered but skip it on runs. */
  enabled?: boolean;
  /** Force the headless-browser renderer (JS-rendered or bot-protected pages). */
  render?: boolean;
  /** Operational notes (rendering quirks, rebrands, slow endpoints, etc.). */
  note?: string;
}

/* ── 1. Official bank pages (the 35 links already in bankUrls.ts) ───────────── */

const BANK_SOURCES: ScrapeSource[] = (Object.keys(BANK_URLS) as BankUrlKey[]).flatMap(
  (bankKey) => {
    const slug = BANK_URL_TO_SLUG[bankKey];
    const u = BANK_URLS[bankKey];
    return [
      { id: `bank:${bankKey}:fd`,         url: u.fixedDeposit, sourceType: 'bank', extract: 'fd',         bankSlug: slug },
      { id: `bank:${bankKey}:savings`,    url: u.savings,      sourceType: 'bank', extract: 'savings',    bankSlug: slug },
      { id: `bank:${bankKey}:homeLoan`,   url: u.homeLoan,     sourceType: 'bank', extract: 'homeLoan',   bankSlug: slug },
      { id: `bank:${bankKey}:creditCard`, url: u.creditCard,   sourceType: 'bank', extract: 'creditCard', bankSlug: slug },
      { id: `bank:${bankKey}:funds`,      url: u.funds,        sourceType: 'bank', extract: 'etf',        bankSlug: slug },
    ] satisfies ScrapeSource[];
  },
);

/* ── 2. Aggregator sites (cross-bank, frequently refreshed editorial pages) ──── */

const AGGREGATOR_SOURCES: ScrapeSource[] = [
  {
    id: 'agg:singsaver:fd',
    url: 'https://www.singsaver.com.sg/banking/blog/best-fixed-deposit-singapore',
    sourceType: 'aggregator',
    extract: 'fd',
    note: 'Cross-bank FD league table incl. non-big-7 banks (GXS, CIMB, BOC). Editorial, updated monthly.',
  },
  {
    id: 'agg:moneysmart:savings',
    url: 'https://www.moneysmart.sg/savings-account',
    sourceType: 'aggregator',
    extract: 'savings',
    render: true,
    note: 'Cross-bank savings-account comparison. Bot-protected (403 on plain fetch) — needs headless render.',
  },
  {
    id: 'agg:moneysmart:homeLoan',
    url: 'https://www.moneysmart.sg/home-loan',
    sourceType: 'aggregator',
    extract: 'homeLoan',
    render: true,
    note: 'Cross-bank SORA + fixed mortgage packages. Bot-protected — needs headless render.',
  },
  {
    id: 'agg:moneysmart:creditCard',
    url: 'https://www.moneysmart.sg/credit-cards',
    sourceType: 'aggregator',
    extract: 'creditCard',
    render: true,
    note: 'Cross-bank cashback / miles card league table. Bot-protected — needs headless render.',
  },
  {
    id: 'agg:seedly:fd',
    url: 'https://seedly.sg/reviews/fixed-deposit',
    sourceType: 'aggregator',
    extract: 'fd',
    note: 'Community-sourced FD comparison; good cross-check on promo rates.',
  },
];

/* ── 3. Fund-manager pages (authoritative NAV / returns / yield) ─────────────── */
// Nikko AM rebranded to "Amova Asset Management" in 2025/26; SGX tickers unchanged.

const FUND_MANAGER_SOURCES: ScrapeSource[] = [
  {
    id: 'fm:amova:sti-etf',
    url: 'https://sg.amova-am.com/institutional/funds/detail/amova-singapore-sti-etf-sgd-dist-class',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'G3B.SI — Amova (ex-Nikko AM) Singapore STI ETF. NAV, fund size, TER, NAV-NAV returns table.',
  },
  {
    id: 'fm:amova:abf-bond',
    url: 'https://sg.amova-am.com/institutional/funds/detail/abf-singapore-bond-index-fund',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'A35.SI — ABF Singapore Bond Index Fund. NAV, yield, YTD.',
  },
  {
    id: 'fm:lion:china-leaders',
    url: 'https://www.lionglobalinvestors.com/en/fund-lion-ocbcsec-china-leaders-etf.html',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'YYY.SI — Lion-OCBC China Leaders ETF. NAV, net assets, TER, dividend yield.',
  },
  {
    id: 'fm:lion:hstech',
    url: 'https://www.lionglobalinvestors.com/en/fund-lion-ocbcsec-hangseng-tech-etf.html',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'HST.SI — Lion-OCBC HSTECH ETF. NAV, AUM, TER.',
  },
  {
    id: 'fm:uobam:china-a50',
    url: 'https://www.uobam.com.sg/our-funds/highlights/uobam-ftse-china-a50-index-etf/index.page',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'UA50.SI — UOBAM FTSE China A50 Index ETF.',
  },
  {
    id: 'fm:uobam:asean-dividend',
    url: 'https://www.uobam.com.sg/our-funds/highlights/uobam-ping-an-ftse-asean-dividend-index-etf/index.page',
    sourceType: 'fund-manager',
    extract: 'etf',
    note: 'PASD.SI — UOBAM Ping An FTSE ASEAN Dividend Index ETF (listed Jan 2026; targets ≥6% p.a.).',
  },
];

/* ── 4. SGX (exchange-level ETF + bond market data) ─────────────────────────── */
// The SGX screeners are client-rendered (data arrives via api.sgx.com JSON). The
// scraper falls back to the JSON endpoints below; the HTML pages are kept for reference.

const SGX_SOURCES: ScrapeSource[] = [
  {
    id: 'sgx:etf-screener',
    url: 'https://api.sgx.com/etfs/v1.0?params=nc%2Cnav%2Cnavchange%2Cnavpercentchange%2Cmgrname',
    sourceType: 'sgx',
    extract: 'etf',
    render: true,
    note: 'SGX public ETF JSON feed (NAV + manager). Returns 403 to datacenter IPs on plain fetch; headless render may bypass. Fund-manager pages already cover ETF NAVs if this stays blocked.',
  },
  {
    id: 'sgx:retail-bonds',
    url: 'https://www.sgx.com/securities/bond-screener',
    sourceType: 'sgx',
    extract: 'bond',
    enabled: false,
    note: 'SGX retail bond screener (Astrea, Temasek, SGS). JS-rendered — needs a headless fetch; disabled until a JSON endpoint is wired. Use MAS for SGS yields meanwhile.',
  },
];

/* ── 5. MAS (optional authoritative benchmarks) ─────────────────────────────── */
// Not in the requested set, but the app already tracks SORA-pegged home loans and the
// SGS benchmark curve, so MAS is the correct primary source for those numbers.
// The eservices endpoint can be slow (>30s); keep timeouts generous or run separately.

const MAS_SOURCES: ScrapeSource[] = [
  {
    id: 'mas:sora',
    url: 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf149-308c-4bd2-832d-76c8e6cb47ed&limit=5&sort=end_of_day%20desc',
    sourceType: 'mas',
    extract: 'benchmark',
    enabled: false,
    note: 'MAS Domestic Interest Rates JSON (SORA, compounded SORA). Authoritative but slow; enable when running the updater out-of-band from the page-scrape batch.',
  },
  {
    id: 'mas:sgs-benchmark',
    url: 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=ABF-Bond-Index-resource&limit=10',
    sourceType: 'mas',
    extract: 'bond',
    enabled: false,
    note: 'MAS SGS benchmark yields. Placeholder resource_id — confirm current resource_id at mas.gov.sg/statistics before enabling.',
  },
];

export const SCRAPE_SOURCES: ScrapeSource[] = [
  ...BANK_SOURCES,
  ...AGGREGATOR_SOURCES,
  ...FUND_MANAGER_SOURCES,
  ...SGX_SOURCES,
  ...MAS_SOURCES,
];

/** Sources that actually run on a default scrape pass. */
export const ACTIVE_SOURCES = SCRAPE_SOURCES.filter((s) => s.enabled !== false);

export function sourcesByExtract(kind: ExtractKind): ScrapeSource[] {
  return ACTIVE_SOURCES.filter((s) => s.extract === kind);
}
