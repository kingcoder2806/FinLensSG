import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: { default: 'FinLens SG', template: '%s | FinLens SG' },
  description:
    'Real-time financial intelligence for Singapore — compare interest rates, deposits, loans, and investment products across 7 major banks using AI.',
  keywords: [
    'Singapore bank rates',
    'fixed deposit Singapore',
    'savings account rates',
    'home loan rates Singapore',
    'credit card cashback',
    'DBS OCBC UOB rates compare',
  ],
  authors: [{ name: 'FinLens SG' }],
  creator: 'FinLens SG',
  openGraph: {
    type: 'website',
    locale: 'en_SG',
    title: 'FinLens SG — Singapore Bank Rate Intelligence',
    description: 'AI-powered comparison of rates across DBS, OCBC, UOB, StanChart, Citi, HSBC, Maybank.',
    siteName: 'FinLens SG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinLens SG',
    description: 'AI-powered Singapore bank rate comparison',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1813',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG" className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable} dark`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
