'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, X, Sparkles, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';

// ── Exported types ─────────────────────────────────────────────────────────────

export interface SelectableBullet {
  label: string;
  value: string;
  highlight?: boolean;
  note?: string;
}

export interface SelectableItem {
  id: string;
  label: string;
  subLabel: string;
  bank?: BankSlug;
  category: string;
  bullets: SelectableBullet[];
  chatContext: string;
}

// ── Internal types ─────────────────────────────────────────────────────────────

type Message = { id: string; role: 'user' | 'assistant'; content: string };

// ── FinAvatar ──────────────────────────────────────────────────────────────────

function FinAvatar() {
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(145deg, var(--gold), var(--gold-deep))',
      display: 'grid', placeItems: 'center',
      color: 'oklch(0.2 0.02 75)',
    }}>
      <Sparkles size={13} strokeWidth={1.8} />
    </span>
  );
}

// ── ItemCard ───────────────────────────────────────────────────────────────────

function ItemCard({ item, accent }: { item: SelectableItem; accent: boolean }) {
  const bank = item.bank ? BANK_MAP[item.bank] : null;
  const initials = bank
    ? bank.shortName.replace('/', '').slice(0, 2).toUpperCase()
    : item.category.slice(0, 2).toUpperCase();

  const accentColor = accent ? 'var(--gold)' : 'var(--info)';
  const accentSoft  = accent ? 'var(--gold-soft)' : 'oklch(0.76 0.075 235 / 0.12)';
  const accentLine  = accent ? 'var(--gold-line)'  : 'oklch(0.76 0.075 235 / 0.30)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accentLine}`,
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Coloured top strip */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${accentColor}, color-mix(in oklab, ${accentColor} 40%, transparent))`,
      }} />

      <div style={{ padding: '22px 22px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 22 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0,
            background: bank
              ? `color-mix(in oklab, ${bank.color} 20%, var(--surface))`
              : accentSoft,
            border: bank
              ? `1px solid color-mix(in oklab, ${bank.color} 32%, var(--line))`
              : `1px solid ${accentLine}`,
            fontFamily: 'var(--font-ibm-mono)', fontWeight: 700, fontSize: 12,
            letterSpacing: '-0.02em',
            color: bank
              ? `color-mix(in oklab, ${bank.color} 70%, var(--ink))`
              : accentColor,
          }}>
            {initials}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 15.5, color: 'var(--ink)',
              lineHeight: 1.25, marginBottom: 5,
              wordBreak: 'break-word',
            }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{item.subLabel}</div>
          </div>

          <span style={{
            flexShrink: 0,
            padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: accentSoft,
            color: accentColor,
            border: `1px solid ${accentLine}`,
          }}>
            {item.category}
          </span>
        </div>

        {/* Bullet list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {item.bullets.map((b, i) => (
            <div key={i} style={{
              borderTop: '1px solid var(--line-soft)',
              padding: '11px 0',
            }}>
              {b.value.length > 42 ? (
                /* Long value: stacked layout */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: b.highlight ? accentColor : 'var(--line)',
                    }} />
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--ink-4)',
                    }}>
                      {b.label}
                    </span>
                  </div>
                  <div style={{
                    paddingLeft: 13, fontSize: 12.5,
                    color: b.highlight ? accentColor : 'var(--ink-2)',
                    fontWeight: b.highlight ? 600 : 400,
                    lineHeight: 1.5,
                  }}>
                    {b.value}
                  </div>
                  {b.note && (
                    <div style={{ paddingLeft: 13, fontSize: 11, color: 'var(--ink-4)', marginTop: 4, lineHeight: 1.4 }}>
                      {b.note}
                    </div>
                  )}
                </div>
              ) : (
                /* Short value: inline layout */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: b.highlight ? accentColor : 'var(--line)',
                    }} />
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--ink-4)',
                    }}>
                      {b.label}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: b.highlight ? 'var(--font-ibm-mono)' : 'inherit',
                    fontWeight: b.highlight ? 700 : 500,
                    fontSize: b.highlight ? 17 : 13.5,
                    color: b.highlight ? accentColor : 'var(--ink-2)',
                    textAlign: 'right', flexShrink: 0,
                  }}>
                    {b.value}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ComparisonChat ─────────────────────────────────────────────────────────────

function ComparisonChat({ items }: { items: [SelectableItem, SelectableItem] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const buildInitialPrompt = useCallback(() =>
    `I'm comparing two financial products and need your help:

Product A — ${items[0].category}: ${items[0].label} (${items[0].subLabel})
${items[0].chatContext}

Product B — ${items[1].category}: ${items[1].label} (${items[1].subLabel})
${items[1].chatContext}

Give me a direct, opinionated comparison. What are the key trade-offs? Who is each best suited for? And which would you lean towards for a typical Singapore retail banking customer?`,
  [items]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;

    const prompt = buildInitialPrompt();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    })
      .then((r) => r.json())
      .then((data: { content?: string }) => {
        setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content ?? 'Ask me anything about these two products.',
        }]);
      })
      .catch(() => {
        setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Chat is unavailable right now. Compare the details in the cards on the left.',
        }]);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const conversationHistory = [
      { role: 'user' as const, content: buildInitialPrompt() },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });
      const data = (await res.json()) as { content?: string };
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.content ?? 'Sorry, I couldn\'t answer that.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Chat is unavailable right now.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', border: '1px solid var(--line-soft)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow)',
      overflow: 'hidden', height: '100%',
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '16px 20px', borderBottom: '1px solid var(--line-soft)',
        flexShrink: 0, background: 'var(--bg-2)',
      }}>
        <FinAvatar />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Ask Fin</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            <span style={{ color: 'var(--up)', marginRight: 5 }}>●</span>
            AI rates assistant · powered by Claude
          </div>
        </div>
      </div>

      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Initial typing indicator */}
        {loading && messages.length === 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <FinAvatar />
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              borderRadius: '14px 14px 14px 4px', padding: '13px 16px',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    animation: `blink 1s ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === 'assistant' ? (
            <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <FinAvatar />
              <div style={{
                background: 'var(--bg-2)', border: '1px solid var(--line)',
                borderRadius: '14px 14px 14px 4px', padding: '13px 16px',
                fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)',
                flex: 1, minWidth: 0,
              }}>
                <div className="prose-dark" style={{ fontSize: 13.5 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div key={msg.id} style={{
              alignSelf: 'flex-end', maxWidth: '84%',
              background: 'var(--gold-soft)', border: '1px solid var(--gold-line)',
              borderRadius: '14px 14px 4px 14px', padding: '10px 14px',
              fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          )
        )}

        {/* Follow-up typing indicator */}
        {loading && messages.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <FinAvatar />
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              borderRadius: '14px 14px 14px 4px', padding: '13px 16px',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    animation: `blink 1s ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {messages.length > 0 && !loading && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[
            'Which suits a conservative investor?',
            'What are the hidden conditions?',
            'How do these compare for S$50k?',
          ].map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="pill"
              style={{ fontSize: 11.5, padding: '4px 10px', cursor: 'pointer', color: 'var(--ink-3)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--line-soft)', flexShrink: 0 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          style={{
            display: 'flex', gap: 7, alignItems: 'center',
            background: 'var(--bg-2)', border: '1px solid var(--line)',
            borderRadius: 11, padding: '5px 5px 5px 13px',
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Fin about these products…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--ink)', fontSize: 13.5, height: 34, fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-gold"
            style={{ width: 36, height: 34, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 8, opacity: loading || !input.trim() ? 0.5 : 1 }}
            aria-label="Send"
          >
            <Send size={13} />
          </button>
        </form>
        <p style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'center', marginTop: 8 }}>
          Fin gives general information, not licensed financial advice.
        </p>
      </div>
    </div>
  );
}

// ── ComparisonPanel (exported) ─────────────────────────────────────────────────

export interface ComparisonPanelProps {
  items: [SelectableItem, SelectableItem];
  onClose: () => void;
}

export function ComparisonPanel({ items, onClose }: ComparisonPanelProps) {
  return (
    <div className="rise" style={{ paddingBottom: 40 }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ArrowLeft size={14} /> Back to tables
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)', fontSize: 13.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{items[0].label}</span>
            <span>vs</span>
            <span style={{ fontWeight: 600, color: 'var(--info)' }}>{items[1].label}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 13px', borderRadius: 8,
            border: '1px solid var(--line)', background: 'transparent',
            color: 'var(--ink-3)', fontSize: 12.5, cursor: 'pointer',
            transition: 'color .15s, border-color .15s',
          }}
        >
          <X size={13} /> Clear comparison
        </button>
      </div>

      {/* Main layout: cards left, chat right */}
      <div
        className="compare-panel-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: 22, alignItems: 'start' }}
      >
        {/* Left: side-by-side item cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0 18px', alignItems: 'start' }}>
          <ItemCard item={items[0]} accent={true} />

          {/* VS divider */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 52, gap: 10, userSelect: 'none',
          }}>
            <div style={{ width: 1, height: 32, background: 'var(--line-soft)' }} />
            <span style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-ibm-mono)', fontWeight: 700,
              fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-4)',
            }}>
              VS
            </span>
            <div style={{ width: 1, height: 32, background: 'var(--line-soft)' }} />
          </div>

          <ItemCard item={items[1]} accent={false} />
        </div>

        {/* Right: AI chat */}
        <div style={{ position: 'sticky', top: 90, height: 'calc(100vh - 280px)', minHeight: 520 }}>
          <ComparisonChat items={items} />
        </div>
      </div>
    </div>
  );
}
