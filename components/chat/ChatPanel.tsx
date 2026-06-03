'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, Sparkles, User } from 'lucide-react';
import { QUICK_PROMPTS } from '@/constants/products';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm Fin 👋  I track rates across DBS, OCBC, UOB, Standard Chartered, Citibank, HSBC and Maybank. Tell me your situation and I'll give you a ranked, opinionated answer — not just a table. What are you trying to figure out?",
};

function FinAvatar() {
  return (
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
  );
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = (await res.json()) as { content?: string };
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content ?? 'Sorry, I could not answer that.',
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Chat is unavailable right now, but the comparison pages still use local seed data.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = QUICK_PROMPTS.rates.slice(0, 5);

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 70px)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* ---- Header strip ---- */}
      <div
        style={{
          borderBottom: '1px solid var(--line-soft)',
          background: 'var(--bg-2)',
          flexShrink: 0,
        }}
      >
        <div
          className="wrap row"
          style={{ height: 64, justifyContent: 'space-between', maxWidth: 840 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(145deg, var(--gold), var(--gold-deep))',
                display: 'grid',
                placeItems: 'center',
                color: 'oklch(0.2 0.02 75)',
              }}
            >
              <Sparkles size={18} strokeWidth={1.8} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 15.5, color: 'var(--ink)' }}>Fin</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                <span style={{ color: 'var(--up)' }}>●</span> Your AI rates assistant · powered by
                Claude
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="pill" style={{ fontSize: 12 }}>
              <span className="dot" style={{ background: 'var(--up)' }} />
              Rates as of Jun 2026
            </span>
            <Link href="/compare">
              <button className="btn btn-ghost btn-sm">View tables</button>
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Scroll area ---- */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div
          className="wrap"
          style={{
            maxWidth: 840,
            padding: '30px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {messages.map((message) =>
            message.role === 'user' ? (
              /* User bubble */
              <div
                key={message.id}
                className="rise"
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '78%',
                  display: 'flex',
                  gap: 11,
                  alignItems: 'flex-start',
                  flexDirection: 'row-reverse',
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--ink-3)',
                    flexShrink: 0,
                  }}
                >
                  <User size={14} />
                </span>
                <div
                  style={{
                    background: 'var(--gold-soft)',
                    border: '1px solid var(--gold-line)',
                    borderRadius: '16px 16px 4px 16px',
                    padding: '12px 16px',
                    fontSize: 15,
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                  }}
                >
                  {message.content}
                </div>
              </div>
            ) : (
              /* Fin message */
              <div
                key={message.id}
                className="rise"
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '94%',
                  display: 'flex',
                  gap: 11,
                  alignItems: 'flex-start',
                }}
              >
                <FinAvatar />
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '13px 15px',
                    fontSize: 15,
                    lineHeight: 1.62,
                    color: 'var(--ink-2)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                gap: 11,
              }}
            >
              <FinAvatar />
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '15px 18px',
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
            </div>
          )}
        </div>
      </div>

      {/* ---- Composer ---- */}
      <div
        style={{
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--bg-2)',
          flexShrink: 0,
        }}
      >
        <div
          className="wrap"
          style={{
            maxWidth: 840,
            padding: '16px 28px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Suggestion chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="pill"
                style={{ cursor: 'pointer', color: 'var(--ink-2)' }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: '7px 7px 7px 16px',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask Fin about savings, FDs, loans, cards, ETFs or bonds…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--ink)',
                fontSize: 15,
                height: 40,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-gold"
              style={{
                width: 46,
                height: 40,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>

          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-4)',
              textAlign: 'center',
            }}
          >
            Fin gives general information, not licensed financial advice. Verify rates with the bank
            before transacting.
          </p>
        </div>
      </div>
    </section>
  );
}
