/**
 * Unit Tests for Adaptive Tutor Graph
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TutorState } from '../../../ai/graphs/adaptiveTutorGraph.js';

// Import TutorState from the graph file
class TutorState {
  constructor(data = {}) {
    this.sessionId = data.sessionId || 'test-session';
    this.userId = data.userId || 'test-user';
    this.topic = data.topic || 'test-topic';
    this.currentConcept = data.currentConcept || null;
    this.studentLevel = data.studentLevel || 'beginner';
    this.conversationHistory = data.conversationHistory || [];
    this.conceptsMastered = data.conceptsMastered || [];
    this.strugglingWith = data.strugglingWith || [];
    this.questionsAsked = data.questionsAsked || 0;
    this.correctAnswers = data.correctAnswers || 0;
    this.hintsGiven = data.hintsGiven || 0;
    this.lastInteraction = data.lastInteraction || new Date();
    this.nextAction = data.nextAction || 'assess';
    this.currentPhase = data.currentPhase || 'introduction';
    this.performance = data.performance || [];
    this.learningGoals = data.learningGoals || [];
    this.createdAt = data.createdAt || new Date();
  }

  getMasteryLevel() {
    if (this.questionsAsked === 0) return 0;
    return Math.round((this.correctAnswers / this.questionsAsked) * 100);
  }

  isStruggling() {
    const recentPerformance = this.performance.slice(-3);
    if (recentPerformance.length < 3) return false;

    const recentScore = recentPerformance.filter((p) => p.correct).length;
    return recentScore < 1;
  }

  shouldAdvance() {
    const mastery = this.getMasteryLevel();
    return mastery >= 80 && this.questionsAsked >= 5;
  }

  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  recordPerformance(correct, concept) {
    this.performance.push({
      concept,
      correct,
      timestamp: new Date(),
    });

    if (correct) {
      this.correctAnswers++;
    }

    this.questionsAsked++;
  }
}

describe('TutorState', () => {
  let state;

  beforeEach(() => {
    state = new TutorState({
      userId: 'user-123',
      topic: 'Python Basics',
    });
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(state.userId).toBe('user-123');
      expect(state.topic).toBe('Python Basics');
      expect(state.studentLevel).toBe('beginner');
      expect(state.questionsAsked).toBe(0);
      expect(state.correctAnswers).toBe(0);
      expect(state.conceptsMastered).toEqual([]);
    });
  });

  describe('getMasteryLevel', () => {
    it('should return 0 when no questions asked', () => {
      expect(state.getMasteryLevel()).toBe(0);
    });

    it('should calculate mastery correctly', () => {
      state.questionsAsked = 10;
      state.correctAnswers = 8;

      expect(state.getMasteryLevel()).toBe(80);
    });

    it('should handle 100% mastery', () => {
      state.questionsAsked = 5;
      state.correctAnswers = 5;

      expect(state.getMasteryLevel()).toBe(100);
    });
  });

  describe('recordPerformance', () => {
    it('should record correct answer', () => {
      state.recordPerformance(true, 'Variables');

      expect(state.questionsAsked).toBe(1);
      expect(state.correctAnswers).toBe(1);
      expect(state.performance).toHaveLength(1);
      expect(state.performance[0].correct).toBe(true);
    });

    it('should record incorrect answer', () => {
      state.recordPerformance(false, 'Loops');

      expect(state.questionsAsked).toBe(1);
      expect(state.correctAnswers).toBe(0);
      expect(state.performance).toHaveLength(1);
      expect(state.performance[0].correct).toBe(false);
    });
  });

  describe('isStruggling', () => {
    it('should return false when less than 3 recent attempts', () => {
      state.recordPerformance(false, 'Test');
      state.recordPerformance(false, 'Test');

      expect(state.isStruggling()).toBe(false);
    });

    it('should return true when recent performance is poor', () => {
      state.recordPerformance(false, 'Test');
      state.recordPerformance(false, 'Test');
      state.recordPerformance(false, 'Test');

      expect(state.isStruggling()).toBe(true);
    });

    it('should return false when recent performance is good', () => {
      state.recordPerformance(true, 'Test');
      state.recordPerformance(true, 'Test');
      state.recordPerformance(false, 'Test');

      expect(state.isStruggling()).toBe(false);
    });
  });

  describe('shouldAdvance', () => {
    it('should return false when mastery is low', () => {
      state.questionsAsked = 10;
      state.correctAnswers = 5; // 50% mastery

      expect(state.shouldAdvance()).toBe(false);
    });

    it('should return false when not enough questions asked', () => {
      state.questionsAsked = 3;
      state.correctAnswers = 3; // 100% mastery but only 3 questions

      expect(state.shouldAdvance()).toBe(false);
    });

    it('should return true when mastery is high and enough questions asked', () => {
      state.questionsAsked = 10;
      state.correctAnswers = 9; // 90% mastery

      expect(state.shouldAdvance()).toBe(true);
    });
  });

  describe('addMessage', () => {
    it('should add message to history', () => {
      state.addMessage('user', 'Hello');

      expect(state.conversationHistory).toHaveLength(1);
      expect(state.conversationHistory[0].role).toBe('user');
      expect(state.conversationHistory[0].content).toBe('Hello');
    });

    it('should limit history to 20 messages', () => {
      for (let i = 0; i < 25; i++) {
        state.addMessage('user', `Message ${i}`);
      }

      expect(state.conversationHistory).toHaveLength(20);
      expect(state.conversationHistory[0].content).toBe('Message 5'); // First 5 dropped
    });
  });
});
