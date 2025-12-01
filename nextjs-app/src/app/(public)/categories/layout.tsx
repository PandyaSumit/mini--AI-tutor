/**
 * Categories Layout
 * SEO metadata for categories page
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Categories',
  description: 'Browse courses by category. Explore programming, business, design, data science, and more. Find the perfect learning path for your goals.',
  keywords: [
    'course categories',
    'online learning topics',
    'programming courses',
    'business courses',
    'design courses',
    'data science',
    'web development',
    'course directory',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-tutor.com/categories',
    siteName: 'AI Tutor',
    title: 'Course Categories | AI Tutor',
    description: 'Browse thousands of courses across diverse categories.',
    images: [
      {
        url: 'https://ai-tutor.com/og-categories.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Tutor Course Categories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Course Categories | AI Tutor',
    description: 'Browse thousands of courses across diverse categories.',
    images: ['https://ai-tutor.com/og-categories.jpg'],
  },
  alternates: {
    canonical: 'https://ai-tutor.com/categories',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
