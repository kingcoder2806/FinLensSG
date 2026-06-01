'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BrainCircuit, Building2, Bell, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'AI Chat', icon: BrainCircuit },
  { href: '/compare', label: 'Compare', icon: BarChart3 },
  { href: '/banks/dbs', label: 'Banks', icon: Building2 },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-3 bg-surface-0/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple shadow-sm">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">
            <span className="text-gradient-blue">FinLens</span>
            <span className="text-muted-foreground font-light ml-1">SG</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname === href || pathname.startsWith(href.replace('/dbs', ''));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-3 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Live badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="live-dot text-xs text-muted-foreground font-mono">
            Live rates
          </span>
        </div>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname === href || pathname.startsWith(href.replace('/dbs', ''));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-md transition-colors',
                  isActive
                    ? 'bg-surface-3 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
