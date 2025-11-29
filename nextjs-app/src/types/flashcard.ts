/**
 * Flashcard-related TypeScript types
 */

export interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  deck: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FlashcardDeck {
  name: string;
  cards: Flashcard[];
  category?: string;
  description?: string;
  createdAt: string;
}

export interface FlashcardStudySession {
  _id: string;
  userId: string;
  deckName: string;
  cardsStudied: number;
  correctAnswers: number;
  startedAt: string;
  completedAt?: string;
  duration?: number; // in seconds
}

export interface FlashcardProgress {
  cardId: string;
  userId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  nextReview?: string;
  easeFactor?: number;
}
