/**
 * Author Layout
 * Layout for all platform author-only pages
 */

'use client';

import { AuthorDashboardLayout } from '@/components/layout/AuthorDashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requiredRole={['platform_author', 'admin']}
      requireVerification={true}
    >
      <AuthorDashboardLayout>{children}</AuthorDashboardLayout>
    </ProtectedRoute>
  );
}
