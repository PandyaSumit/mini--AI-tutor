/**
 * Common shared TypeScript types
 */

export type Theme = 'light' | 'dark' | 'system';

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: any; // Lucide React icon
  match: (path: string) => boolean;
  showInBottomNav?: boolean;
  badge?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface DashboardStats {
  conversationsCount: number;
  flashcardsCount: number;
  roadmapsCount: number;
  coursesEnrolled: number;
  studyStreak: number;
}
