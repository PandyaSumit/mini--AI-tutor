/**
 * Course-related TypeScript types
 */

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  lessons: Lesson[];
  enrolledStudents?: number;
  rating?: number;
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content: string;
  duration: number; // in minutes
  order: number;
  videoUrl?: string;
  resources?: LessonResource[];
  quiz?: Quiz;
  completed?: boolean;
}

export interface LessonResource {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
  description?: string;
}

export interface Quiz {
  _id: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
}

export interface CourseEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // 0-100
  completedLessons: string[];
  lastAccessedAt?: string;
}

export interface CourseRole {
  courseId: string;
  role: 'student' | 'instructor' | 'admin';
}
