/**
 * Root Layout
 * The main layout wrapper for the entire application
 */

import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import '@/styles/globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mini AI Tutor - Learn Smarter, Not Harder',
  description:
    'Transform your study sessions with AI-powered tutoring, personalized roadmaps, and interactive flashcards. Achieve your learning goals faster than ever before.',
  keywords: [
    'AI tutor',
    'learning platform',
    'study helper',
    'flashcards',
    'roadmaps',
    'personalized learning',
    'AI education',
  ],
  authors: [{ name: 'Mini AI Tutor Team' }],
  openGraph: {
    title: 'Mini AI Tutor - Learn Smarter, Not Harder',
    description:
      'AI-powered education platform helping learners achieve their goals faster with personalized study paths and intelligent tutoring.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mini AI Tutor - Learn Smarter, Not Harder',
    description:
      'AI-powered education platform helping learners achieve their goals faster.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
