'use client';

import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { QUICK_PROMPTS } from '@/constants/products';
import { detectAgentType } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask about Singapore savings rates, fixed deposits, home loans, or bank comparisons.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const agent = useMemo(() => detectAgentType(input || messages.at(-1)?.content || ''), [input, messages]);

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
          content: 'Chat is unavailable right now, but the comparison pages still use local seed data.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financial Intelligence Chat</h1>
            <p className="text-sm text-muted-foreground">Seed-rate mode with Claude API fallback when configured.</p>
          </div>
          <Badge variant={agent === 'compare' ? 'purple' : 'blue'}>
            {agent === 'compare' ? 'Compare Agent' : 'Rates Agent'}
          </Badge>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.rates.slice(0, 4).map((prompt) => (
            <Button key={prompt} type="button" variant="outline" size="sm" onClick={() => sendMessage(prompt)}>
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-surface-3 bg-surface-1 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-primary-foreground' : 'max-w-[85%] rounded-lg bg-surface-2 p-3'}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Thinking...</p>}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Compare OCBC and UOB savings rates"
            className="min-h-11 resize-none"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
