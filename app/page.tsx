'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Building2,
  BarChart3,
  Layers,
  Star,
  Shield,
  Crosshair,
  ChevronRight,
} from 'lucide-react';
import { SEED_RATES } from '@/constants/products';
import { BANKS } from '@/constants/banks';

/* ---- FinPreview animated card ---- */
function FinPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="card-finlens rise" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 18px',
          borderBottom: '1px solid var(--line-soft)',
          background: 'var(--bg-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'linear-gradient(145deg, var(--gold), var(--gold-deep))',
              display: 'grid',
              placeItems: 'center',
              color: 'oklch(0.2 0.02 75)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={14} strokeWidth={1.8} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Fin</span>
            <span style={{ fontSize: 11, color: 'var(--up)' }}>● online · powered by Claude</span>
          </div>
        </div>
        <span className="pill" style={{ fontSize: 12 }}>
          <span className="dot" style={{ background: 'var(--up)' }} />
          Rates as of Jun 2026
        </span>
      </div>

      {/* messages */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 18px', gap: 14, minHeight: 280 }}>
        {/* user bubble */}
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '82%',
            background: 'var(--gold-soft)',
            border: '1px solid var(--gold-line)',
            borderRadius: '14px 14px 4px 14px',
            padding: '11px 14px',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          Which savings account is best if I earn S$4,000/month?
        </div>

        {/* typing dots or Fin response */}
        {step >= 1 && step < 2 && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '14px 14px 14px 4px',
              padding: '13px 16px',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    animation: `blink 1s ${i * 0.18}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step >= 2 && (
          <div
            className="rise"
            style={{
              alignSelf: 'flex-start',
              maxWidth: '90%',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '14px 14px 14px 4px',
              padding: '13px 15px',
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
            }}
          >
            At S$4,000/month you&apos;re in the sweet spot. My top pick is the{' '}
            <strong style={{ color: 'var(--ink)' }}>OCBC 360</strong> —
          </div>
        )}

        {step >= 3 && (
          <div className="rise" style={{ alignSelf: 'flex-start', width: '92%' }}>
            <div
              className="card-finlens"
              style={{
                padding: 13,
                background: 'var(--bg-2)',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span
                className="tag tag-gold"
                style={{ borderRadius: 8, width: 26, height: 26, justifyContent: 'center', padding: 0, flexShrink: 0 }}
              >
                1
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'color-mix(in oklab, #c7a84a 22%, var(--surface))',
                  borderColor: 'color-mix(in oklab, #c7a84a 35%, var(--line))',
                  border: '1px solid',
                  fontFamily: 'var(--font-ibm-mono)',
                  fontWeight: 600,
                  fontSize: 11,
                  color: 'color-mix(in oklab, #c7a84a 60%, var(--ink))',
                  flexShrink: 0,
                }}
              >
                OCBC
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>OCBC 360</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>salary + save + spend</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-ibm-mono)',
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--gold)',
                  }}
                >
                  4.45%
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>max p.a.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* input bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--bg-2)',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '9px 13px',
            color: 'var(--ink-4)',
            fontSize: 13.5,
          }}
        >
          Ask Fin anything about SG rates…
        </div>
        <Link href="/chat">
          <button
            className="btn btn-gold btn-sm"
            style={{ width: 40, padding: 0, display: 'grid', placeItems: 'center' }}
          >
            <ChevronRight size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ---- Mini ranked recommendation ---- */
function MiniRecommendation() {
  const picks = [
    { abbr: 'MB', name: 'Maybank 6-mo FD', rate: '1.30%', tag: 'Top rate' },
    { abbr: 'UOB', name: 'UOB 6-mo FD', rate: '1.10%', tag: 'Min S$10k' },
    { abbr: 'OCBC', name: 'OCBC 6-mo FD', rate: '0.20%', tag: 'Board rate' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>You asked:</span>{' '}
        &quot;Where should I park S$50k for 6 months?&quot;
      </div>
      {picks.map((p, i) => (
        <div
          key={p.abbr}
          className="card-finlens"
          style={{ padding: 14, display: 'flex', gap: 13, alignItems: 'center', background: 'var(--surface)' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: 15,
              color: 'var(--ink-4)',
              width: 18,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--font-ibm-mono)',
              fontWeight: 600,
              fontSize: 11,
              color: 'var(--ink-2)',
              flexShrink: 0,
            }}
          >
            {p.abbr}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
            <span className="tag tag-flat" style={{ marginTop: 3, display: 'inline-flex' }}>
              {p.tag}
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              fontSize: 19,
              fontWeight: 600,
              color: i === 0 ? 'var(--gold)' : 'var(--ink)',
            }}
          >
            {p.rate}
          </span>
        </div>
      ))}
      <Link
        href="/chat"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--gold)',
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        See Fin&apos;s full reasoning
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

/* ---- Footer ---- */
function Footer() {
  const bankNames = BANKS.slice(0, 5).map((b) => b.shortName);
  const cols = [
    {
      h: 'Compare',
      links: ['Savings accounts', 'Fixed deposits', 'SGX ETFs', 'Government bonds', 'Credit cards'],
      href: '/compare',
    },
    {
      h: 'Banks',
      links: bankNames,
      href: '/banks/dbs',
    },
    {
      h: 'Product',
      links: ['Ask Fin', 'Rate alerts', 'Methodology', 'About'],
      href: '/chat',
    },
  ];

  return (
    <footer
      style={{
        borderTop: '1px solid var(--line-soft)',
        marginTop: 90,
        background: 'var(--bg-2)',
      }}
    >
      <div className="wrap" style={{ padding: '54px 28px 30px' }}>
        <div
          className="foot-grid"
          style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(145deg, var(--gold), var(--gold-deep))',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: 'oklch(0.20 0.02 75)', fontSize: 14 }}>⌕</span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-newsreader)',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                }}
              >
                FinLens<span style={{ color: 'var(--gold)' }}> SG</span>
              </span>
            </Link>
            <p style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.6 }}>
              Singapore&apos;s independent retail-banking comparison desk, with Fin — an AI assistant powered by Claude — to make the rate tables make sense.
            </p>
            <span className="pill" style={{ fontSize: 12, alignSelf: 'flex-start' }}>
              <span className="dot" style={{ background: 'var(--up)' }} />
              Rates as of Jun 2026
            </span>
          </div>

          {cols.map((col) => (
            <div key={col.h} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="eyebrow">{col.h}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map((l) => (
                  <Link
                    key={l}
                    href={col.href}
                    style={{ color: 'var(--ink-3)', fontSize: 13.5 }}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '34px 0 22px' }} />

        <p style={{ color: 'var(--ink-4)', fontSize: 11.5, lineHeight: 1.7, maxWidth: 920 }}>
          <strong style={{ color: 'var(--ink-3)' }}>Important:</strong> FinLens SG is an independent information service and is not a financial adviser, bank, or MAS-licensed entity. All rates, yields and figures shown are illustrative and may not reflect live market pricing. Information does not constitute financial advice or an offer of any product. Deposit products of MAS-licensed full banks are insured up to S$100,000 by the Singapore Deposit Insurance Corporation (SDIC). Investment products including ETFs and bonds are not deposits, are not SDIC-insured, and may lose value. Always verify rates with the bank before transacting.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 22,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>© 2026 FinLens SG · A demonstration product</span>
          <div style={{ display: 'flex', gap: 24, color: 'var(--ink-4)', fontSize: 12 }}>
            <Link href="/">Privacy</Link>
            <Link href="/">Terms</Link>
            <Link href="/">Methodology</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Home page
   ============================================================ */
export default function HomePage() {
  const fd12rates = SEED_RATES.fixedDeposit[12];

  const categories = [
    {
      href: '/savings',
      icon: Crosshair,
      name: 'Savings accounts',
      desc: 'Bonus-interest accounts',
      stat: '5.85%',
      statLabel: 'top effective rate',
      tint: 'var(--gold)',
    },
    {
      href: '/compare',
      icon: Shield,
      name: 'Fixed deposits',
      desc: 'Promo & board rates',
      stat: '1.30%',
      statLabel: 'best 12-month',
      tint: 'var(--up)',
    },
    {
      href: '/chat',
      icon: Building2,
      name: 'Home loans',
      desc: 'Fixed & SORA packages',
      stat: '2.55%',
      statLabel: 'lowest 2Y fixed',
      tint: 'var(--info)',
    },
    {
      href: '/chat',
      icon: Star,
      name: 'Credit cards',
      desc: 'Cashback & miles',
      stat: '6%',
      statLabel: 'top cashback',
      tint: 'var(--gold)',
    },
    {
      href: '/etfs-bonds',
      icon: BarChart3,
      name: 'SGX ETFs',
      desc: 'Equity, REITs, bonds',
      stat: '0.24%',
      statLabel: 'lowest TER',
      tint: 'var(--up)',
    },
    {
      href: '/etfs-bonds',
      icon: Layers,
      name: 'SG & Corporate Bonds',
      desc: 'SSB, SGS, Astrea',
      stat: '5.34%',
      statLabel: 'top corporate yield',
      tint: 'var(--info)',
    },
  ];

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      {/* ===================== HERO ===================== */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 32 }}>
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 54,
            alignItems: 'center',
          }}
        >
          {/* Left: pitch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span
              className="pill"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', marginBottom: 20 }}
            >
              <span className="dot" />
              Independent · 7 banks · 5 categories
            </span>

            <h1
              style={{
                fontFamily: 'var(--font-newsreader)',
                fontSize: 'clamp(38px, 5.6vw, 64px)',
                fontWeight: 600,
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
                marginBottom: 20,
                color: 'var(--ink)',
              }}
            >
              The smartest way to read
              <br />
              Singapore&apos;s{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>banking rates</em>.
            </h1>

            <p
              style={{
                fontSize: 18,
                color: 'var(--ink-2)',
                lineHeight: 1.55,
                maxWidth: 520,
                marginBottom: 28,
              }}
            >
              Compare savings, fixed deposits, home loans, cards, ETFs and bonds across DBS, OCBC,
              UOB and four more — then ask{' '}
              <strong style={{ color: 'var(--ink)' }}>Fin</strong>, our AI assistant, for an
              opinionated answer.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 28,
              }}
            >
              <Link href="/chat">
                <button
                  className="btn btn-gold btn-lg"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Sparkles size={16} />
                  Ask Fin a question
                </button>
              </Link>
              <Link href="/compare">
                <button className="btn btn-ghost btn-lg">Browse rate tables →</button>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                ['7', 'Major SG banks'],
                ['5', 'Product categories'],
                ['S$0', 'Always free'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ibm-mono)',
                      fontSize: 26,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {n}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Fin preview card */}
          <FinPreview />
        </div>
      </section>

      {/* ===================== RATE TICKER ===================== */}
      <section className="wrap" style={{ paddingTop: 8, paddingBottom: 44 }}>
        <div className="card-finlens" style={{ padding: '4px 0', overflow: 'hidden' }}>
          <div className="ticker-wrap">
            <div className="ticker-track">
              {[...fd12rates, ...fd12rates].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px 22px',
                    borderRight: '1px solid var(--line-soft)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ibm-mono)',
                      fontSize: 12.5,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {item.bank.toUpperCase()} · FD 12M
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-ibm-mono)',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--gold)',
                    }}
                  >
                    {item.rate.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORY GRID ===================== */}
      <section className="wrap" style={{ paddingBottom: 30 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 26,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
            <span className="eyebrow eyebrow-gold">Compare</span>
            <h2
              style={{
                fontFamily: 'var(--font-newsreader)',
                fontSize: 'clamp(26px, 3.4vw, 38px)',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Five categories, one clear view
            </h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 16, lineHeight: 1.5 }}>
              Every table is sortable, side-by-side, and refreshed with the latest published rates.
            </p>
          </div>
          <span className="pill" style={{ fontSize: 12 }}>
            <span className="dot" style={{ background: 'var(--up)' }} />
            Rates as of Jun 2026
          </span>
        </div>

        <div
          className="cat-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}
        >
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.name} href={c.href} style={{ textDecoration: 'none' }}>
                <div
                  className="card-finlens"
                  style={{
                    padding: 22,
                    textAlign: 'left',
                    transition: 'transform .16s, border-color .16s, background .16s',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--line)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--line-soft)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        display: 'grid',
                        placeItems: 'center',
                        background: `color-mix(in oklab, ${c.tint} 16%, var(--surface))`,
                        color: c.tint,
                        border: `1px solid color-mix(in oklab, ${c.tint} 26%, var(--line))`,
                      }}
                    >
                      <Icon size={20} strokeWidth={1.6} />
                    </span>
                    <span style={{ color: 'var(--ink-4)' }}>
                      <ChevronRight size={18} />
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, marginTop: 16, fontWeight: 600, color: 'var(--ink)' }}>
                    {c.name}
                  </h3>
                  <p style={{ color: 'var(--ink-3)', fontSize: 13.5, marginTop: 3 }}>{c.desc}</p>
                  <div className="divider" style={{ margin: '16px 0 12px' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-ibm-mono)',
                        fontSize: 22,
                        fontWeight: 600,
                        color: c.tint,
                      }}
                    >
                      {c.stat}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.statLabel}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===================== MEET FIN ===================== */}
      <section className="wrap" style={{ paddingTop: 56 }}>
        <div
          className="card-finlens"
          style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-2)' }}
        >
          <div
            className="fin-band"
            style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr' }}
          >
            {/* Left: pitch */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                padding: '48px 44px',
                justifyContent: 'center',
              }}
            >
              <span className="eyebrow eyebrow-gold">Meet Fin</span>
              <h2
                style={{
                  fontFamily: 'var(--font-newsreader)',
                  fontSize: 'clamp(26px, 3vw, 34px)',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                }}
              >
                Not another chatbot. An opinionated guide.
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.6 }}>
                Fin reads every rate table so you don&apos;t have to. Tell it your situation and it
                returns a ranked shortlist — with the reasoning and the numbers behind each pick.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                {[
                  [
                    'Personalised',
                    'Factors in your income, balance, horizon and risk appetite.',
                  ],
                  [
                    'Grounded in real rates',
                    'Every recommendation cites the live figure it\'s based on.',
                  ],
                  [
                    'Plain English',
                    "Ask the way you'd ask a friend who happens to work in banking.",
                  ],
                ].map(([h, d]) => (
                  <div key={h} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }}>
                      <Sparkles size={16} strokeWidth={1.6} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
                        {h}
                      </div>
                      <div style={{ color: 'var(--ink-3)', fontSize: 13.5 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/chat" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <button
                  className="btn btn-gold"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Sparkles size={15} />
                  Start a conversation
                </button>
              </Link>
            </div>

            {/* Right: mini recommendation */}
            <div
              style={{
                background: 'var(--bg)',
                borderLeft: '1px solid var(--line-soft)',
                padding: '36px 34px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <MiniRecommendation />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
