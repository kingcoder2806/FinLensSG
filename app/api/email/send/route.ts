import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const { to, toName, from, fromName, subject, body, replyTo } =
    (await req.json()) as {
      to: string;
      toName: string;
      from?: string;
      fromName?: string;
      subject: string;
      body: string;
      replyTo?: string;
    };

  // Full email with greeting + sign-off
  const greeting = `Dear ${toName.split(' ')[0]},\n\n`;
  const signOff = `\n\nBest regards,\n${fromName ?? 'FinLens SG User'}\nvia FinLens SG — finlenssg.com`;
  const fullBody = greeting + body + signOff;

  if (!process.env.RESEND_API_KEY) {
    // No email service configured — return the composed email for manual sending
    return NextResponse.json({
      sent: false,
      reason: 'no_api_key',
      composedEmail: { to, subject, body: fullBody },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'FinLens SG <fin@finlenssg.com>';

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      text: fullBody,
      ...(replyTo && { replyTo }),
    });

    if (result.error) {
      return NextResponse.json({ sent: false, reason: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ sent: true, id: result.data?.id });
  } catch (err) {
    return NextResponse.json({ sent: false, reason: String(err) }, { status: 500 });
  }
}
