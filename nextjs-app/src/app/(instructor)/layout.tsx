/**
 * Instructor Layout
 * Layout for all instructor-only pages
 */

'use client';

import { InstructorDashboardLayout } from '@/components/layout/InstructorDashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requiredRole={['verified_instructor', 'platform_author', 'admin']}
      requireVerification={true}
    >
      <InstructorDashboardLayout>{children}</InstructorDashboardLayout>
    </ProtectedRoute>
  );
}
