/**
 * User-related TypeScript types
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  role?: 'learner' | 'verified_instructor' | 'platform_author' | 'admin';
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
