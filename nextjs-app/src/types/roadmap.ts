/**
 * Roadmap-related TypeScript types
 */

export interface Roadmap {
  _id: string;
  title: string;
  description: string;
  userId: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in weeks
  milestones: Milestone[];
  progress?: number; // 0-100
  isPublic?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  order: number;
  tasks: Task[];
  estimatedDuration?: number; // in days
  completed?: boolean;
  completedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
  completedAt?: string;
  resources?: TaskResource[];
}

export interface TaskResource {
  _id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'practice';
  url: string;
  description?: string;
}

export interface RoadmapProgress {
  roadmapId: string;
  userId: string;
  completedMilestones: string[];
  completedTasks: string[];
  currentMilestone?: string;
  progressPercentage: number;
  lastUpdated: string;
}
