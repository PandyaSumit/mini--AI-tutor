/**
 * Course Detail Page (Server Component)
 * Generates dynamic metadata for SEO and renders client component
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseDetailClient from './CourseDetailClient';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Server-side fetch function
async function getCourseData(courseId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  try {
    const res = await fetch(`${apiUrl}/public/courses/${courseId}`, {
      cache: 'no-store', // Always fetch fresh data for course details
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const course = await getCourseData(params.id);

  if (!course) {
    return {
      title: 'Course Not Found',
      description: 'The requested course could not be found.',
    };
  }

  const isPaid = course.pricing.model === 'paid';
  const price = isPaid ? `$${(course.pricing.amount / 100).toFixed(2)}` : 'Free';

  return {
    title: course.title,
    description: course.description,
    keywords: [
      course.title,
      course.category,
      course.difficulty,
      'online course',
      'AI learning',
      'personalized education',
      ...(course.metadata.learningOutcomes.slice(0, 3) || []),
    ],
    authors: [{ name: course.createdBy.name }],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `https://ai-tutor.com/course/${params.id}`,
      siteName: 'AI Tutor',
      title: course.title,
      description: course.description,
      images: [
        {
          url: course.thumbnail || 'https://ai-tutor.com/og-course.jpg',
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.description,
      images: [course.thumbnail || 'https://ai-tutor.com/og-course.jpg'],
      creator: `@${course.createdBy.name.replace(/\s+/g, '')}`,
    },
    alternates: {
      canonical: `https://ai-tutor.com/course/${params.id}`,
    },
    other: {
      'course:price': price,
      'course:instructor': course.createdBy.name,
      'course:category': course.category || 'General',
      'course:difficulty': course.difficulty || 'Beginner',
      'course:students': course.statistics.enrollmentCount.toString(),
      'course:rating': course.statistics.averageRating > 0 ? course.statistics.averageRating.toFixed(1) : 'New',
    },
  };
}

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await getCourseData(params.id);

  // Course not found - show error
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Course Not Found</h3>
              <p className="text-red-700">This course does not exist or is not publicly available.</p>
              <Link
                href="/browse"
                className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render client component with course data
  return <CourseDetailClient course={course} courseId={params.id} />;
}
