/**
 * Dashboard Layout
 * Layout for all authenticated dashboard pages
 */

'use client';

import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
