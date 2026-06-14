import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import { SPECIALIZATION_LABELS } from '@/constants/contacts';
import type { ContactSpecialization } from '@/constants/contacts';

export const dynamic = 'force-dynamic';

const SYSTEM = `You write professional bank-enquiry emails for FinLens SG users, in real time.

Output format — follow EXACTLY:
SUBJECT: <a single concise subject line>

<the email body>

Rules for the body:
- Warm but professional tone; 2–3 short paragraphs, under 180 words total.
- Be specific to the bank, the desk, and the user's topic/product.
- End with one clear call to action (confirm a rate, request a callback, ask for a quote, etc.).
- Do NOT write a greeting line — the app adds "Dear <desk> team,".
- Do NOT write a sign-off — the app adds "Best regards, <name>".
- No placeholders like [Your Name], [Date], [Amount].
- Plain text only; separate paragraphs with a blank line.`;

export async function POST(req: Request) {
  const { contactName, contactRole, bankSlug, specializations, userTopic, userEmail } =
    (await req.json()) as {
      contactName: string;
      contactRole: string;
      bankSlug: BankSlug;
      specializations: ContactSpecialization[];
      userTopic?: string;
      userEmail?: string;
    };

  const bank = BANK_MAP[bankSlug];
  const specList = (specializations ?? []).map((s) => SPECIALIZATION_LABELS[s]).join(', ') || 'banking products';

  // No API key — stream a sensible fallback so the client UX is identical.
  if (!process.env.ANTHROPIC_API_KEY) {
    const subject = `Enquiry about ${specList} — FinLens SG`;
    const body = `I'm researching ${specList} at ${bank?.name ?? bankSlug} via FinLens SG and would like to speak with your team.\n\n${userTopic ? `Specifically: ${userTopic}\n\n` : ''}Could you share the latest details and let me know the best way to proceed? I'm happy to arrange a call at your convenience.`;
    return new Response(`SUBJECT: ${subject}\n\n${body}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const prompt = `Write the email from a FinLens SG user to the ${contactName} desk (${contactRole}) at ${bank?.name ?? bankSlug}.
This desk handles: ${specList}.
${userTopic ? `The user wants to ask about: ${userTopic}` : `The user is interested in ${specList}.`}
${userEmail ? `The user's reply-to email is ${userEmail}.` : ''}`;

  const result = streamText({
    model: anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'),
    system: SYSTEM,
    prompt,
    maxTokens: 450,
  });

  return result.toTextStreamResponse();
}
