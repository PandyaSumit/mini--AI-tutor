import express from 'express';
import {
  generateFlashcardsController,
  getDueFlashcards,
  reviewFlashcard,
  getDecks,
  exportFlashcards,
  generateQuizController,
  getQuizzes,
  getQuiz,
  submitQuizAttempt,
  exportQuiz
} from '../controllers/studyMaterialController.js';
import { protect } from '../middleware/authMiddleware.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Flashcard routes
router.post('/flashcards/generate', protect, chatLimiter, generateFlashcardsController);
router.get('/flashcards/due', protect, getDueFlashcards);
router.post('/flashcards/:id/review', protect, reviewFlashcard);
router.get('/flashcards/decks', protect, getDecks);
router.get('/flashcards/export', protect, exportFlashcards);

// Quiz routes
router.post('/quizzes/generate', protect, chatLimiter, generateQuizController);
router.get('/quizzes', protect, getQuizzes);
router.get('/quizzes/:id', protect, getQuiz);
router.post('/quizzes/:id/submit', protect, submitQuizAttempt);
router.get('/quizzes/:id/export', protect, exportQuiz);

export default router;
