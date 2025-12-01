/**
 * Dynamic Sitemap Generator
 * Automatically generates sitemap.xml for SEO
 */

import { MetadataRoute } from 'next';

async function getPublicCourses() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  try {
    const res = await fetch(`${apiUrl}/public/courses?limit=1000`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.data.courses || [];
  } catch (error) {
    console.error('Error fetching courses for sitemap:', error);
    return [];
  }
}

async function getCategories() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  try {
    const res = await fetch(`${apiUrl}/public/categories`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ai-tutor.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Fetch dynamic course pages
  const courses = await getPublicCourses();
  const coursePages = courses.map((course: any) => ({
    url: `${baseUrl}/course/${course._id}`,
    lastModified: new Date(course.updatedAt || course.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch category pages (if categories page exists)
  const categories = await getCategories();
  const categoryPages = categories.map((category: string) => ({
    url: `${baseUrl}/browse?category=${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Combine all pages
  return [...staticPages, ...coursePages, ...categoryPages];
}
