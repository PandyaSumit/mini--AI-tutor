/**
 * Browse Layout
 * Provides SEO metadata for course browsing
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Courses',
  description: 'Discover thousands of AI-powered online courses. Learn from expert instructors across programming, business, design, and more. Filter by category, difficulty, and price.',
  keywords: [
    'online courses',
    'AI learning',
    'programming courses',
    'business courses',
    'design courses',
    'data science courses',
    'web development',
    'online education',
    'learn online',
    'educational platform',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-tutor.com/browse',
    siteName: 'AI Tutor',
    title: 'Browse Courses | AI Tutor',
    description: 'Discover thousands of AI-powered online courses taught by expert instructors.',
    images: [
      {
        url: 'https://ai-tutor.com/og-browse.jpg',
        width: 1200,
        height: 630,
        alt: 'Browse AI Tutor Courses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Courses | AI Tutor',
    description: 'Discover thousands of AI-powered online courses taught by expert instructors.',
    images: ['https://ai-tutor.com/og-browse.jpg'],
  },
  alternates: {
    canonical: 'https://ai-tutor.com/browse',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
