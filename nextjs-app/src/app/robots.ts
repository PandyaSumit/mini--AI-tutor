/**
 * Robots.txt Generator
 * Configures search engine crawling rules
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ai-tutor.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/browse',
          '/course/*',
          '/categories',
          '/login',
          '/signup',
        ],
        disallow: [
          '/dashboard/*',
          '/admin/*',
          '/api/*',
          '/_next/*',
          '/static/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/browse',
          '/course/*',
          '/categories',
        ],
        disallow: [
          '/dashboard/*',
          '/admin/*',
          '/api/*',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
