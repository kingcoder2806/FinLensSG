'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Mail, Phone, X, Sparkles, Send, Check,
  ChevronRight, Users, Copy, ExternalLink, RefreshCw, Clock, Globe,
} from 'lucide-react';
import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import { BankLogo } from '@/components/banks/BankLogo';
import {
  BANK_CONTACTS,
  SPECIALIZATION_LABELS,
  SPECIALIZATION_COLORS,
  type BankContact,
  type ContactSpecialization,
} from '@/constants/contacts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  const words = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
  return (words.slice(0, 2).map((n) => n[0]).join('') || name.slice(0, 2)).toUpperCase();
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function SpecBadge({ spec }: { spec: ContactSpecialization }) {
  const c = SPECIALIZATION_COLORS[spec];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {SPECIALIZATION_LABELS[spec]}
    </span>
  );
}

// ── Contact card ──────────────────────────────────────────────────────────────

function ContactCard({
  contact, isSelected, onSelect,
}: {
  contact: BankContact;
  isSelected: boolean;
  onSelect: (c: BankContact) => void;
}) {
  const bank = BANK_MAP[contact.bank];

  return (
    <div
      onClick={() => onSelect(contact)}
      style={{
        background: isSelected ? `color-mix(in oklab, ${bank.color} 6%, var(--surface))` : 'var(--surface)',
        border: `1px solid ${isSelected ? `color-mix(in oklab, ${bank.color} 35%, var(--line))` : 'var(--line-soft)'}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: isSelected ? `0 0 0 1px color-mix(in oklab, ${bank.color} 25%, transparent), var(--shadow)` : 'var(--shadow)',
        padding: '22px 22px 18px',
        cursor: 'pointer',
        transition: 'border-color .18s, background .18s, box-shadow .18s',
        display: 'flex', flexDirection: 'column', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Bank accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${bank.color}, color-mix(in oklab, ${bank.color} 40%, transparent))`,
        opacity: isSelected ? 1 : 0.5, transition: 'opacity .18s',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 4 }}>
        <BankLogo bank={bank} size={48} rounded={13} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 4 }}>
            {contact.name}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 5 }}>{contact.role}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, display: 'grid', placeItems: 'center',
              background: `color-mix(in oklab, ${bank.color} 20%, var(--surface))`,
              fontSize: 9, fontFamily: 'var(--font-ibm-mono)', fontWeight: 700,
              color: `color-mix(in oklab, ${bank.color} 70%, var(--ink))`,
            }}>
              {bank.shortName.slice(0, 2).toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{bank.shortName}</span>
            {contact.hours && (
              <span style={{ fontSize: 11, color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                · <Clock size={10} /> {contact.hours}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          style={{ color: 'var(--ink-4)', flexShrink: 0, opacity: isSelected ? 0 : 1, transition: 'opacity .15s' }}
        />
      </div>

      {/* Specializations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {contact.specializations.map((s) => <SpecBadge key={s} spec={s} />)}
      </div>

      {/* Description */}
      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {contact.description}
      </p>

      {/* CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid var(--line-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {contact.phone ? (
            <>
              <Phone size={12} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--font-ibm-mono)' }}>
                {contact.phone}
              </span>
            </>
          ) : (
            <>
              <Globe size={12} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>Callback / online</span>
            </>
          )}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12.5, fontWeight: 600, color: isSelected ? bank.color : 'var(--gold)',
          transition: 'color .15s',
        }}>
          {contact.email ? <><Sparkles size={12} /> Draft email</> : <>View contact <ChevronRight size={12} /></>}
        </span>
      </div>
    </div>
  );
}

// ── Contact / email panel ───────────────────────────────────────────────────

type SendState = 'idle' | 'generating' | 'ready' | 'sending' | 'sent' | 'error' | 'no_key';

function ContactPanel({
  contact, onClose,
}: {
  contact: BankContact;
  onClose: () => void;
}) {
  const bank = BANK_MAP[contact.bank];
  const hasEmail = Boolean(contact.email);
  const [topic, setTopic] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<SendState>('idle');
  const [composedEmail, setComposedEmail] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const salutation = `Dear ${contact.name} team`;

  useEffect(() => {
    if (bodyRef.current && body) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px';
    }
  }, [body]);

  async function generateEmail() {
    setState('generating');
    setSubject('');
    setBody('');
    try {
      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contact.name,
          contactRole: contact.role,
          bankSlug: contact.bank,
          specializations: contact.specializations,
          userTopic: topic || undefined,
          userEmail: userEmail || undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error('stream failed');

      // Read the stream and update subject/body live as Fin writes.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const nl = buf.indexOf('\n');
        if (nl === -1) {
          // Still streaming the SUBJECT line.
          setSubject(buf.replace(/^subject:\s*/i, '').trim());
        } else {
          setSubject(buf.slice(0, nl).replace(/^subject:\s*/i, '').trim());
          setBody(buf.slice(nl + 1).replace(/^\s+/, ''));
        }
      }
      // Safeguard if the model didn't emit a SUBJECT line.
      if (buf && buf.indexOf('\n') === -1) {
        setSubject('Enquiry — FinLens SG');
        setBody(buf.trim());
      }
      setState('ready');
    } catch {
      setState('error');
    }
  }

  async function sendEmail() {
    if (!subject || !body || !contact.email) return;
    setState('sending');
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.email,
          toName: contact.name,
          fromName: userName || undefined,
          subject,
          body,
          replyTo: userEmail || undefined,
        }),
      });
      const data = (await res.json()) as { sent: boolean; reason?: string; composedEmail?: typeof composedEmail };
      if (data.sent) setState('sent');
      else if (data.reason === 'no_api_key') { setComposedEmail(data.composedEmail ?? null); setState('no_key'); }
      else setState('error');
    } catch {
      setState('error');
    }
  }

  function copyEmail() {
    const text = `To: ${contact.email}\nSubject: ${subject}\n\n${composedEmail?.body ?? body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line-soft)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', maxHeight: '86vh', width: '100%',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--line-soft)',
        background: 'var(--bg-2)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BankLogo bank={bank} size={36} rounded={10} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{contact.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{contact.role} · {bank.shortName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)',
            background: 'transparent', display: 'grid', placeItems: 'center',
            color: 'var(--ink-3)', cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Contact meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-4)', textDecoration: 'none' }}>
              <Mail size={11} /> {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={telHref(contact.phone)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-4)', textDecoration: 'none' }}>
              <Phone size={11} /> {contact.phone}
            </a>
          )}
          {contact.hours && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-4)' }}>
              <Clock size={11} /> {contact.hours}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

        {/* About */}
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
          borderRadius: 10, padding: '13px 15px', marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6 }}>What this desk handles</div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>{contact.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {contact.specializations.map((s) => <SpecBadge key={s} spec={s} />)}
          </div>
        </div>

        {/* Quick actions — always available */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: hasEmail ? 20 : 4 }}>
          {contact.phone && (
            <a href={telHref(contact.phone)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
              <Phone size={14} /> Call {contact.phone}
              {contact.phoneOverseas && <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>· {contact.phoneOverseas} overseas</span>}
            </a>
          )}
          <a href={contact.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
            <ExternalLink size={14} /> {contact.phone ? 'Official contact page' : 'Request a callback'}
          </a>
        </div>

        {/* Email compose — only for desks with a published email */}
        {!hasEmail && (
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--line-soft)',
            borderRadius: 10, padding: '13px 15px', marginTop: 16, marginBottom: 20,
          }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              This desk takes enquiries by phone or the bank’s online callback form — it doesn’t publish a public email address. Use the buttons above to reach them.
            </div>
          </div>
        )}

        {hasEmail && (state === 'idle' || state === 'generating' || state === 'ready' || state === 'error') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
              Or let Fin draft an email
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your name
              </label>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex Tan"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your email <span style={{ color: 'var(--ink-4)', textTransform: 'none', fontWeight: 400 }}>(for replies)</span>
              </label>
              <input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What do you want to ask? <span style={{ color: 'var(--ink-4)', textTransform: 'none', fontWeight: 400 }}>(optional — Fin fills in the rest)</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`e.g. "I have S$50k for a 12-month fixed deposit — what's your current promotional rate and minimum placement?"`}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            <button
              onClick={generateEmail}
              disabled={state === 'generating'}
              className="btn btn-gold"
              style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: state === 'generating' ? 0.7 : 1 }}
            >
              {state === 'generating' ? (
                <>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.2 0.02 75)', animation: `blink 1s ${i * 0.18}s infinite` }} />
                    ))}
                  </div>
                  Fin is writing your email…
                </>
              ) : state === 'ready' ? (
                <><RefreshCw size={14} /> Regenerate email</>
              ) : (
                <><Sparkles size={14} /> Generate email with Fin AI</>
              )}
            </button>

            {state === 'error' && (
              <p style={{ fontSize: 13, color: 'var(--down)', textAlign: 'center' }}>
                Could not generate email. Please try again.
              </p>
            )}

            {(state === 'ready' || (state === 'generating' && (!!subject || !!body))) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                <div style={{ height: 1, background: 'var(--line-soft)' }} />
                {state === 'generating' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gold)' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', animation: `blink 1s ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                    Fin is writing your email in real time…
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Email body
                    </label>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Greeting & sign-off added automatically</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ padding: '10px 12px 8px', borderRadius: '9px 9px 0 0', background: 'var(--surface-2)', border: '1px solid var(--line)', borderBottom: 'none', fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-ibm-mono)' }}>
                      {salutation},
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px', borderRadius: '0 0 9px 9px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderTop: 'none', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6, minHeight: 120, overflow: 'hidden' }}
                    />
                    <div style={{ padding: '8px 12px 10px', borderRadius: '0 0 9px 9px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderTop: 'none', fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-ibm-mono)' }}>
                      Best regards, {userName || '[Your Name]'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sent confirmation */}
        {state === 'sent' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 0', textAlign: 'center' }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--up-soft)', border: '2px solid var(--up)', display: 'grid', placeItems: 'center' }}>
              <Check size={24} style={{ color: 'var(--up)' }} strokeWidth={2.5} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>Email sent!</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Your enquiry has been sent to {contact.name}.<br />
                Replies typically arrive within 1–2 business days.
              </div>
            </div>
            <button onClick={() => { setState('idle'); setSubject(''); setBody(''); setTopic(''); }} className="btn btn-ghost btn-sm">
              Send another
            </button>
          </div>
        )}

        {/* No API key — show composed email for manual send */}
        {state === 'no_key' && composedEmail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold-line)', borderRadius: 10, padding: '13px 15px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>
                Email sending not configured
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Add <code style={{ fontFamily: 'var(--font-ibm-mono)', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>RESEND_API_KEY</code> to enable automatic sending. For now, copy the email below and send manually.
              </div>
            </div>

            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4, fontFamily: 'var(--font-ibm-mono)' }}>To: {composedEmail.to}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 12, fontFamily: 'var(--font-ibm-mono)' }}>Subject: {composedEmail.subject}</div>
              <pre style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {composedEmail.body}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={copyEmail} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy email</>}
              </button>
              <a href={`mailto:${composedEmail.to}?subject=${encodeURIComponent(composedEmail.subject)}&body=${encodeURIComponent(composedEmail.body)}`} className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, textDecoration: 'none' }}>
                <ExternalLink size={13} /> Open in Mail
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Send button footer */}
      {hasEmail && state === 'ready' && (
        <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--line-soft)', flexShrink: 0 }}>
          <button
            onClick={sendEmail}
            disabled={!subject || !body}
            className="btn btn-gold"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Send size={15} /> Send to {contact.name}
          </button>
        </div>
      )}

      {state === 'sending' && (
        <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--line-soft)', flexShrink: 0 }}>
          <button disabled className="btn btn-gold" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.7 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.2 0.02 75)', animation: `blink 1s ${i * 0.18}s infinite` }} />
              ))}
            </div>
            Sending…
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_BANKS = ['all', 'dbs', 'ocbc', 'uob', 'standard-chartered', 'citibank', 'hsbc', 'maybank'] as const;
const ALL_SPECS: Array<'all' | ContactSpecialization> = ['all', 'savings', 'fixed-deposit', 'home-loan', 'credit-card', 'investments', 'general'];

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [bankFilter, setBankFilter] = useState<typeof ALL_BANKS[number]>('all');
  const [specFilter, setSpecFilter] = useState<typeof ALL_SPECS[number]>('all');
  const [selected, setSelected] = useState<BankContact | null>(null);

  // Close the pop-up on Escape and lock background scroll while it's open.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    return BANK_CONTACTS.filter((c) => {
      const matchBank = bankFilter === 'all' || c.bank === bankFilter;
      const matchSpec = specFilter === 'all' || c.specializations.includes(specFilter as ContactSpecialization);
      const q = query.toLowerCase();
      const matchQuery = !q
        || c.name.toLowerCase().includes(q)
        || c.role.toLowerCase().includes(q)
        || BANK_MAP[c.bank].shortName.toLowerCase().includes(q)
        || c.specializations.some((s) => SPECIALIZATION_LABELS[s].toLowerCase().includes(q))
        || c.description.toLowerCase().includes(q);
      return matchBank && matchSpec && matchQuery;
    });
  }, [query, bankFilter, specFilter]);

  return (
    <div className="rise" style={{ position: 'relative', zIndex: 1 }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 580 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="eyebrow eyebrow-gold">Bank contacts</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-newsreader)', fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.08 }}>
              Reach the right desk at every bank
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 16, lineHeight: 1.5 }}>
              Real, official contact points — customer-service hotlines, priority &amp; wealth desks, and mortgage lines. Call directly, or let Fin draft an email where the bank publishes one.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pill" style={{ fontSize: 12 }}>
              <Users size={12} />
              {BANK_CONTACTS.length} contact points across 7 banks
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 18, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12 }}>
          <Search size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by bank, desk, or topic…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-4)', display: 'grid', placeItems: 'center' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ALL_BANKS.map((b) => {
              const active = bankFilter === b;
              const bank = b === 'all' ? null : BANK_MAP[b as BankSlug];
              return (
                <button
                  key={b}
                  onClick={() => setBankFilter(b)}
                  className="pill"
                  style={{
                    cursor: 'pointer',
                    borderColor: active ? (bank ? `color-mix(in oklab, ${bank.color} 40%, var(--line))` : 'var(--gold-line)') : 'var(--line)',
                    color: active ? (bank ? `color-mix(in oklab, ${bank.color} 70%, var(--ink))` : 'var(--gold)') : 'var(--ink-3)',
                    background: active ? (bank ? `color-mix(in oklab, ${bank.color} 10%, var(--surface))` : 'var(--gold-soft)') : 'var(--surface)',
                  }}
                >
                  {b === 'all' ? 'All banks' : bank?.shortName}
                </button>
              );
            })}
          </div>
          <div style={{ width: 1, background: 'var(--line-soft)', margin: '0 4px', alignSelf: 'stretch' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ALL_SPECS.map((s) => {
              const active = specFilter === s;
              const c = s === 'all' ? null : SPECIALIZATION_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setSpecFilter(s)}
                  className="pill"
                  style={{
                    cursor: 'pointer',
                    borderColor: active ? (c?.border ?? 'var(--gold-line)') : 'var(--line)',
                    color: active ? (c?.text ?? 'var(--gold)') : 'var(--ink-3)',
                    background: active ? (c?.bg ?? 'var(--gold-soft)') : 'var(--surface)',
                  }}
                >
                  {s === 'all' ? 'All topics' : SPECIALIZATION_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 18 }}>
          {filtered.length} contact{filtered.length !== 1 ? 's' : ''} found
          {(bankFilter !== 'all' || specFilter !== 'all' || query) && (
            <button
              onClick={() => { setQuery(''); setBankFilter('all'); setSpecFilter('all'); }}
              style={{ marginLeft: 10, fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Contact grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="contacts-grid">
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--ink-4)' }}>
                <Users size={32} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
                <div style={{ fontSize: 15, marginBottom: 6 }}>No contacts match your search</div>
                <div style={{ fontSize: 13 }}>Try adjusting your filters or search terms</div>
              </div>
            ) : (
              filtered.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  isSelected={selected?.id === c.id}
                  onSelect={(contact) => setSelected(selected?.id === contact.id ? null : contact)}
                />
              ))
            )}
        </div>

      </div>

      {/* Pop-up modal — portaled to <body> so it centers on the viewport,
          escaping the page wrapper's transform/animation. */}
      {selected && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'color-mix(in oklab, var(--bg) 50%, rgba(0,0,0,0.65))',
            backdropFilter: 'blur(5px)',
            display: 'grid', placeItems: 'center', padding: 20,
            animation: 'fadeIn .15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(480px, 100%)', display: 'flex', animation: 'popIn .18s ease' }}
          >
            <ContactPanel
              key={selected.id}
              contact={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
        @media (max-width: 1100px) {
          .contacts-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .contacts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
