/**
 * User-related TypeScript types
 */

import type { Role } from '@/lib/permissions';

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  role?: Role;
  // Optional permission overrides (if user has custom permissions beyond their role)
  permissions?: string[];
}

export interface UserProfile extends User {
  bio?: string;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  language?: string;
}

export interface UserStats {
  conversationsCount: number;
  flashcardsCreated: number;
  roadmapsCompleted: number;
  coursesEnrolled: number;
  studyStreak: number;
}
