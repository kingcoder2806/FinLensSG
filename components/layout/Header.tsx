'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Sparkles,
  BarChart3,
  Building2,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Layers },
  { href: '/chat', label: 'Ask Fin', icon: Sparkles },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/banks/dbs', label: 'Banks', icon: Building2 },
  { href: '/alerts', label: 'Alerts', icon: Bell, soon: true },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    if (href === '/banks/dbs') return pathname.startsWith('/banks');
    return pathname.startsWith(href);
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled
          ? 'color-mix(in oklab, var(--bg) 82%, transparent)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(1.3)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--line-soft)' : 'transparent'}`,
        transition: 'background .25s, border-color .25s, backdrop-filter .25s',
      }}
    >
      <div
        className="wrap row"
        style={{ height: 70, justifyContent: 'space-between' }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(145deg, var(--gold), var(--gold-deep))',
              boxShadow: '0 4px 14px -6px var(--gold-line)',
              flexShrink: 0,
            }}
          >
            <Search
              size={16}
              style={{ color: 'oklch(0.20 0.02 75)', strokeWidth: 2.2 }}
            />
          </span>
          <span
            style={{
              fontFamily: 'var(--font-newsreader)',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
            }}
          >
            FinLens
            <span style={{ color: 'var(--gold)' }}> SG</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="nav-desktop row"
          style={{ gap: 4 }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="row"
                style={{
                  gap: 7,
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--ink)' : 'var(--ink-3)',
                  background: active ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${active ? 'var(--line)' : 'transparent'}`,
                  transition: 'color .15s, background .15s',
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: active ? 'var(--gold)' : 'inherit' }}>
                  <Icon size={15} />
                </span>
                {label}
                {soon && (
                  <span
                    className="tag tag-flat"
                    style={{ padding: '1px 6px', fontSize: 9.5 }}
                  >
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="nav-desktop row" style={{ gap: 10 }}>
          <Link href="/compare">
            <button className="btn btn-ghost btn-sm">Compare rates</button>
          </Link>
          <Link href="/chat">
            <button className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={14} />
              Ask Fin
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ display: 'none', padding: 8, color: 'var(--ink)' }}
          className="nav-mobile-btn"
          aria-label="Toggle navigation"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          style={{
            borderTop: '1px solid var(--line-soft)',
            background: 'var(--bg)',
          }}
          className="nav-mobile-menu"
        >
          <div className="wrap col" style={{ padding: '14px 0 20px', gap: 4 }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="row"
                  style={{
                    gap: 12,
                    padding: '13px 8px',
                    fontSize: 16,
                    color: active ? 'var(--gold)' : 'var(--ink-2)',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={18} />
                  {label}
                  {soon && (
                    <span className="tag tag-flat" style={{ padding: '1px 6px', fontSize: 9.5 }}>
                      SOON
                    </span>
                  )}
                </Link>
              );
            })}
            <Link href="/chat" onClick={() => setOpen(false)}>
              <button
                className="btn btn-gold"
                style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Sparkles size={15} />
                Ask Fin
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
