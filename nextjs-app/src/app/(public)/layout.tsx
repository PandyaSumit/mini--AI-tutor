/**
 * Public Layout
 * For unauthenticated users browsing the marketplace
 */

import { Metadata } from 'next';
import PublicLayoutClient from './PublicLayoutClient';

export const metadata: Metadata = {
  title: {
    default: 'AI Tutor - Personalized AI-Powered Learning',
    template: '%s | AI Tutor',
  },
  description: 'Learn anything with AI-powered personalized education. Discover thousands of courses taught by expert instructors.',
  keywords: ['AI learning', 'online courses', 'AI tutor', 'personalized education', 'adaptive learning'],
  authors: [{ name: 'AI Tutor' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-tutor.com',
    siteName: 'AI Tutor',
    title: 'AI Tutor - Personalized AI-Powered Learning',
    description: 'Learn anything with AI-powered personalized education.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tutor - Personalized AI-Powered Learning',
    description: 'Learn anything with AI-powered personalized education.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>;
}
