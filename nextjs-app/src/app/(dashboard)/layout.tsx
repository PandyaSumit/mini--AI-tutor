/**
 * Dashboard Layout
 * Layout for all authenticated dashboard pages
 */

'use client';

import { DashboardLayout } from '@/components/layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
