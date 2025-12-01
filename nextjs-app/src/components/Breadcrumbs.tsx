'use client';

/**
 * Breadcrumbs Component
 * Provides contextual navigation and improves SEO
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      {/* JSON-LD Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://ai-tutor.com',
              },
              ...breadcrumbs.map((item, idx) => ({
                '@type': 'ListItem',
                position: idx + 2,
                name: item.label,
                item: `https://ai-tutor.com${item.href}`,
              })),
            ],
          }),
        }}
      />

      <ol className="flex items-center space-x-2 text-sm">
        {/* Home */}
        <li>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <li key={item.href} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split path
  const segments = pathname.replace(/^\/|\/$/g, '').split('/');

  if (segments.length === 0 || segments[0] === '') {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  // Path label mapping for better readability
  const labelMap: { [key: string]: string } = {
    browse: 'Browse Courses',
    course: 'Course',
    categories: 'Categories',
    teach: 'Become an Instructor',
    login: 'Login',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    courses: 'Courses',
    profile: 'Profile',
  };

  segments.forEach((segment, idx) => {
    currentPath += `/${segment}`;

    // Skip certain segments (like IDs)
    if (isUUID(segment) || isObjectId(segment)) {
      // For IDs, we might want to fetch the title dynamically
      // For now, we'll skip them or use a generic label
      return;
    }

    const label = labelMap[segment] || capitalizeFirstLetter(segment.replace(/-/g, ' '));

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}

// Helper to check if string is a UUID
function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// Helper to check if string is a MongoDB ObjectId
function isObjectId(str: string): boolean {
  const objectIdPattern = /^[0-9a-f]{24}$/i;
  return objectIdPattern.test(str);
}

// Helper to capitalize first letter
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
