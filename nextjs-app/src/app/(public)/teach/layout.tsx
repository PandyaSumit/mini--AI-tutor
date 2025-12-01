/**
 * Teach Page Layout
 * SEO metadata for instructor recruitment
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become an Instructor',
  description: 'Teach millions of students worldwide on AI Tutor. Create courses, earn money, and reach a global audience with AI-powered teaching tools. Join our community of expert instructors today.',
  keywords: [
    'become an instructor',
    'teach online',
    'create online courses',
    'earn teaching',
    'online teaching platform',
    'AI teaching tools',
    'instructor opportunities',
    'teach from home',
    'share your knowledge',
    'educational content creation',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-tutor.com/teach',
    siteName: 'AI Tutor',
    title: 'Become an Instructor | AI Tutor',
    description: 'Teach millions of students with AI-powered tools. Join our community of expert instructors.',
    images: [
      {
        url: 'https://ai-tutor.com/og-teach.jpg',
        width: 1200,
        height: 630,
        alt: 'Become an AI Tutor Instructor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become an Instructor | AI Tutor',
    description: 'Teach millions of students with AI-powered tools. Join our community of expert instructors.',
    images: ['https://ai-tutor.com/og-teach.jpg'],
  },
  alternates: {
    canonical: 'https://ai-tutor.com/teach',
  },
};

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
