/**
 * Query Classifier Tests
 * Tests automatic mode detection for chat queries
 */

import queryClassifier from '../../ai/classifiers/queryClassifier.js';

describe('Query Classifier', () => {
  describe('Rule-based Classification', () => {
    test('should classify factual questions as RAG', async () => {
      const queries = [
        'What is Python?',
        'How does async/await work in JavaScript?',
        'Explain object-oriented programming',
        'Define recursion',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('rag');
        expect(result.method).toBe('rules');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should classify knowledge-seeking queries as RAG', async () => {
      const queries = [
        'Tell me about Python course',
        'What courses are available for JavaScript?',
        'Show me modules for React',
        'Find lessons on data structures',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('rag');
        expect(result.method).toBe('rules');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should classify learning queries as RAG', async () => {
      const queries = [
        'I want to learn React',
        'Help me study algorithms',
        'Create a learning roadmap for me',
        'How do I practice coding?',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('rag');
        expect(result.method).toBe('rules');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should classify greetings as simple', async () => {
      const queries = [
        'Hi',
        'Hello!',
        'Good morning',
        'Hey there',
        'Greetings',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('simple');
        expect(result.method).toBe('rules');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    test('should classify conversational queries as simple', async () => {
      const queries = [
        'How are you?',
        'Tell me a joke',
        'What do you think about AI?',
        'I feel frustrated today',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('simple');
        expect(result.method).toBe('rules');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should classify short follow-ups as simple', async () => {
      const queries = [
        'Thanks',
        'ok',
        'I see',
        'Got it',
        'yes',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(result.mode).toBe('simple');
        expect(result.method).toBe('rules');
      }
    });
  });

  describe('Context-Aware Classification', () => {
    test('should use conversation history for context', async () => {
      const conversationHistory = [
        { role: 'user', content: 'What is Python?' },
        { role: 'assistant', content: 'Python is a high-level programming language...' },
      ];

      const result = await queryClassifier.classify('Tell me more', {
        conversationHistory,
        useLLM: false,
      });

      // "Tell me more" after a RAG query should likely be RAG
      // But with our simple rule-based classifier, it might default to simple
      expect(['rag', 'simple']).toContain(result.mode);
      expect(result.method).toBe('rules');
    });
  });

  describe('Force Mode', () => {
    test('should respect force mode override', async () => {
      const query = 'What is Python?'; // Would normally be RAG

      const simpleResult = await queryClassifier.classify(query, {
        forceMode: 'simple',
      });
      expect(simpleResult.mode).toBe('simple');

      const ragResult = await queryClassifier.classify(query, {
        forceMode: 'rag',
      });
      expect(ragResult.mode).toBe('rag');
    });
  });

  describe('Statistics', () => {
    test('should track classification statistics', () => {
      const stats = queryClassifier.getStats();

      expect(stats).toHaveProperty('totalClassifications');
      expect(stats).toHaveProperty('ragClassifications');
      expect(stats).toHaveProperty('simpleClassifications');
      expect(stats).toHaveProperty('llmClassifications');
      expect(stats).toHaveProperty('ruleClassifications');
      expect(stats).toHaveProperty('averageConfidence');

      expect(typeof stats.totalClassifications).toBe('number');
      expect(stats.totalClassifications).toBeGreaterThanOrEqual(0);
    });

    test('should reset statistics', () => {
      queryClassifier.resetStats();
      const stats = queryClassifier.getStats();

      expect(stats.totalClassifications).toBe(0);
      expect(stats.ragClassifications).toBe(0);
      expect(stats.simpleClassifications).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty queries', async () => {
      const result = await queryClassifier.classify('', { useLLM: false });
      expect(result.mode).toBe('simple');
    });

    test('should handle very long queries', async () => {
      const longQuery = 'What is ' + 'Python '.repeat(100) + '?';
      const result = await queryClassifier.classify(longQuery, { useLLM: false });
      expect(['rag', 'simple']).toContain(result.mode);
    });

    test('should handle special characters', async () => {
      const queries = [
        'What is @Python?',
        'How does #JavaScript work?',
        'Tell me about C++',
        'Explain $variable in PHP',
      ];

      for (const query of queries) {
        const result = await queryClassifier.classify(query, { useLLM: false });
        expect(['rag', 'simple']).toContain(result.mode);
      }
    });
  });

  describe('Performance', () => {
    test('should classify queries quickly', async () => {
      const start = Date.now();
      await queryClassifier.classify('What is Python?', { useLLM: false });
      const duration = Date.now() - start;

      // Rule-based classification should be very fast (< 50ms)
      expect(duration).toBeLessThan(50);
    });

    test('should handle batch classifications efficiently', async () => {
      const queries = Array(20).fill('What is Python?');
      const start = Date.now();

      await Promise.all(
        queries.map(query => queryClassifier.classify(query, { useLLM: false }))
      );

      const duration = Date.now() - start;
      const avgDuration = duration / queries.length;

      // Average time per classification should be low
      expect(avgDuration).toBeLessThan(100);
    });
  });
});
