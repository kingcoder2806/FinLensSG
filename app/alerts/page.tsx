'use client';

import { useState } from 'react';
import { Bell, Sparkles, Trash2, Plus, Check, Mail, AlertCircle } from 'lucide-react';
import { BANKS, BANK_MAP } from '@/constants/banks';

type Category = 'savings' | 'fixed-deposit' | 'home-loan';

interface AlertRow {
  id: string;
  email: string;
  bank_slug: string | null;
  product_category: string | null;
  target_rate: number | null;
  direction: 'above' | 'below';
  tenor_months: number | null;
  label: string | null;
  last_triggered_at: string | null;
  last_value: number | null;
  active: boolean;
  created_at: string;
}

const CATEGORY_LABEL: Record<Category, string> = {
  'savings': 'Savings account',
  'fixed-deposit': 'Fixed deposit',
  'home-loan': 'Home loan',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  background: 'var(--bg-2)', border: '1px solid var(--line)',
  color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
};

export default function AlertsPage() {
  const [email, setEmail] = useState('');
  const [nlText, setNlText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [category, setCategory] = useState<Category>('fixed-deposit');
  const [bankSlug, setBankSlug] = useState<string>('');
  const [tenor, setTenor] = useState<number>(12);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetRate, setTargetRate] = useState<string>('1.50');

  async function loadAlerts(addr = email) {
    if (!addr) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/alerts?email=${encodeURIComponent(addr)}`);
      const d = await r.json();
      setAlerts(d.alerts ?? []);
      setLoaded(true);
    } catch {
      setMsg({ kind: 'err', text: 'Could not load your alerts.' });
    } finally {
      setLoading(false);
    }
  }

  async function parseNL() {
    if (!nlText.trim()) return;
    setParsing(true);
    setMsg(null);
    try {
      const r = await fetch('/api/alerts/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText }),
      });
      const d = await r.json();
      if (d.alert) {
        const a = d.alert;
        if (['savings', 'fixed-deposit', 'home-loan'].includes(a.productCategory)) setCategory(a.productCategory);
        setBankSlug(a.bankSlug ?? '');
        if (a.tenorMonths) setTenor(a.tenorMonths);
        setDirection(a.direction === 'below' ? 'below' : 'above');
        if (typeof a.targetRate === 'number') setTargetRate(String(a.targetRate));
        setMsg({ kind: 'ok', text: 'Fin filled in the alert below — review and create it.' });
      } else {
        setMsg({ kind: 'err', text: 'Could not understand that — set it manually below.' });
      }
    } catch {
      setMsg({ kind: 'err', text: 'Parsing failed — set it manually below.' });
    } finally {
      setParsing(false);
    }
  }

  async function createAlert() {
    setMsg(null);
    const rate = parseFloat(targetRate);
    if (!email) { setMsg({ kind: 'err', text: 'Enter your email so we can notify you.' }); return; }
    if (Number.isNaN(rate)) { setMsg({ kind: 'err', text: 'Enter a valid target rate.' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productCategory: category,
          bankSlug: bankSlug || null,
          tenorMonths: category === 'fixed-deposit' ? tenor : null,
          direction,
          targetRate: rate,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMsg({ kind: 'err', text: d.error ?? 'Could not save alert.' });
      } else {
        setMsg({ kind: 'ok', text: 'Alert created. We’ll email you when it triggers.' });
        setNlText('');
        await loadAlerts();
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not save alert.' });
    } finally {
      setSaving(false);
    }
  }

  async function removeAlert(id: string) {
    await fetch(`/api/alerts?id=${id}&email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function toggleAlert(a: AlertRow) {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, email, active: !a.active }),
    });
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
  }

  function describe(a: AlertRow): string {
    const cat = a.product_category === 'fixed-deposit'
      ? `${a.tenor_months ?? 12}-month FD`
      : a.product_category === 'home-loan' ? 'home loan' : 'savings';
    const where = a.bank_slug ? (BANK_MAP[a.bank_slug as keyof typeof BANK_MAP]?.shortName ?? a.bank_slug) : 'Any bank';
    return `${where} · ${cat} ${a.direction} ${a.target_rate}% p.a.`;
  }

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 620, marginBottom: 28 }}>
          <span className="eyebrow eyebrow-gold">Rate alerts</span>
          <h1 style={{ fontFamily: 'var(--font-newsreader)', fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.08 }}>
            Get told when a rate moves
          </h1>
          <p style={{ color: 'var(--ink-3)', fontSize: 16, lineHeight: 1.5 }}>
            Set a threshold and we’ll email you when it’s crossed — checked automatically every day against live bank rates.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="alerts-grid">

          {/* ── Create card ─────────────────────────────────────────────── */}
          <div className="card-finlens" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Create an alert</h2>
            </div>

            {/* Natural language */}
            <div>
              <label style={labelStyle}>Describe it in plain English</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') parseNL(); }}
                  placeholder='e.g. "tell me if any 12-month FD beats 1.6%"'
                  style={inputStyle}
                />
                <button onClick={parseNL} disabled={parsing} className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} /> {parsing ? 'Reading…' : 'Fill with Fin'}
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Structured form */}
            <div>
              <label style={labelStyle}>Product</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className="pill" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center', borderColor: category === c ? 'var(--gold-line)' : 'var(--line)', color: category === c ? 'var(--gold)' : 'var(--ink-3)', background: category === c ? 'var(--gold-soft)' : 'var(--surface)' }}>
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Bank</label>
                <select value={bankSlug} onChange={(e) => setBankSlug(e.target.value)} style={inputStyle}>
                  <option value="">Any bank</option>
                  {BANKS.map((b) => <option key={b.slug} value={b.slug}>{b.shortName}</option>)}
                </select>
              </div>
              {category === 'fixed-deposit' && (
                <div style={{ width: 110 }}>
                  <label style={labelStyle}>Tenor</label>
                  <select value={tenor} onChange={(e) => setTenor(Number(e.target.value))} style={inputStyle}>
                    {[3, 6, 12, 24].map((t) => <option key={t} value={t}>{t} months</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Alert me when the rate</label>
                <select value={direction} onChange={(e) => setDirection(e.target.value as 'above' | 'below')} style={inputStyle}>
                  <option value="above">rises to / above</option>
                  <option value="below">falls to / below</option>
                </select>
              </div>
              <div style={{ width: 130 }}>
                <label style={labelStyle}>Target % p.a.</label>
                <input value={targetRate} onChange={(e) => setTargetRate(e.target.value)} inputMode="decimal" style={{ ...inputStyle, fontFamily: 'var(--font-ibm-mono)' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Your email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => loadAlerts()} type="email" placeholder="you@example.com" style={inputStyle} />
            </div>

            {msg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: msg.kind === 'ok' ? 'var(--up)' : 'var(--down)' }}>
                {msg.kind === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
                {msg.text}
              </div>
            )}

            <button onClick={createAlert} disabled={saving} className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={15} /> {saving ? 'Saving…' : 'Create alert'}
            </button>
          </div>

          {/* ── Manage card ─────────────────────────────────────────────── */}
          <div className="card-finlens" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} style={{ color: 'var(--gold)' }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Your alerts</h2>
              </div>
              <button onClick={() => loadAlerts()} disabled={!email || loading} className="btn btn-ghost btn-sm">
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {!email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-4)' }}>
                <Mail size={14} /> Enter your email to see and manage your alerts.
              </div>
            )}

            {email && loaded && alerts.length === 0 && (
              <p style={{ fontSize: 13.5, color: 'var(--ink-4)', padding: '20px 0', textAlign: 'center' }}>
                No alerts yet. Create one on the left.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--line-soft)', opacity: a.active ? 1 : 0.55 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{describe(a)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 2 }}>
                      {a.last_triggered_at
                        ? `Last triggered ${a.last_triggered_at.slice(0, 10)}${a.last_value != null ? ` at ${a.last_value.toFixed(2)}%` : ''}`
                        : 'Watching — not triggered yet'}
                    </div>
                  </div>
                  <button onClick={() => toggleAlert(a)} title={a.active ? 'Pause' : 'Resume'} className="pill" style={{ cursor: 'pointer', fontSize: 11, color: a.active ? 'var(--up)' : 'var(--ink-4)' }}>
                    {a.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => removeAlert(a.id)} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'grid', placeItems: 'center', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.6, marginTop: 'auto', paddingTop: 8 }}>
              Alerts are checked daily against live rates. Email delivery requires the site’s email service to be configured; otherwise alerts are recorded and visible here.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .alerts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
