import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { BANK_MAP } from '@/constants/banks';
import type { BankSlug } from '@/constants/banks';
import { SPECIALIZATION_LABELS } from '@/constants/contacts';
import type { ContactSpecialization } from '@/constants/contacts';

const EMAIL_SYSTEM = `You are a professional financial email writer for FinLens SG.
Your job is to write concise, professional inquiry emails on behalf of a user to a bank advisor.

Guidelines:
- Warm but professional tone
- 2–3 short paragraphs, under 180 words in the body
- Specific to the topic and product mentioned
- End with a clear, single call to action (schedule a call, get a quote, clarify a rate, etc.)
- Do NOT include a greeting line (that is added by the app)
- Do NOT include a sign-off (that is added by the app)
- Do NOT use placeholders like [Your Name] or [Date]

Return ONLY valid JSON in this exact format:
{"subject":"...","body":"..."}
The body uses \\n for paragraph breaks. No HTML.`;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallbackSubject = `Enquiry about ${SPECIALIZATION_LABELS[specializations[0]] ?? 'banking products'} — FinLens SG`;
    const fallbackBody = `I recently used FinLens SG to research financial products and came across your profile as a specialist in ${SPECIALIZATION_LABELS[specializations[0]] ?? 'banking'}.\n\nI have some questions about ${userTopic || `${SPECIALIZATION_LABELS[specializations[0]] ?? 'your products'} at ${BANK_MAP[bankSlug]?.name}`} and would appreciate the opportunity to speak with you at your earliest convenience.\n\nCould we schedule a brief call or meeting to discuss this further?`;
    return NextResponse.json({ subject: fallbackSubject, body: fallbackBody });
  }

  const bank = BANK_MAP[bankSlug];
  const specList = specializations.map((s) => SPECIALIZATION_LABELS[s]).join(', ');
  const prompt = `Write a professional email inquiry from a FinLens SG user to ${contactName}, ${contactRole} at ${bank?.name ?? bankSlug}.

This advisor specialises in: ${specList}.
${userTopic ? `The user wants to ask about: ${userTopic}` : `The user is interested in ${specList} products at ${bank?.name ?? bankSlug}.`}
${userEmail ? `The user's email: ${userEmail}` : ''}

Remember: return only valid JSON with "subject" and "body" fields.`;

  try {
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
    const result = await generateText({
      model: anthropic(model),
      system: EMAIL_SYSTEM,
      prompt,
      maxTokens: 400,
    });

    const json = JSON.parse(result.text.trim().replace(/^```json\n?|```$/g, ''));
    return NextResponse.json({ subject: json.subject, body: json.body });
  } catch {
    const fallbackSubject = `Enquiry about ${specList} — FinLens SG`;
    const fallbackBody = `I have been researching ${specList} products on FinLens SG and would love to discuss my options with you.\n\n${userTopic ? `Specifically, I have a question about: ${userTopic}\n\n` : ''}Could we schedule a call at your convenience? I am flexible and happy to work around your availability.`;
    return NextResponse.json({ subject: fallbackSubject, body: fallbackBody });
  }
}
