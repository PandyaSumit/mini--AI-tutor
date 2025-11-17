/**
 * Unit Tests for Advanced RAG Chain
 */

import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import advancedRagChain from '../../../ai/chains/advancedRagChain.js';

describe('AdvancedRAGChain', () => {
  describe('extractKeywords', () => {
    it('should extract keywords from a question', () => {
      const question = 'How to learn Python programming for beginners?';
      const keywords = advancedRagChain.extractKeywords(question);

      expect(keywords).toContain('learn');
      expect(keywords).toContain('python');
      expect(keywords).toContain('programming');
      expect(keywords).toContain('beginners');
      expect(keywords).not.toContain('how');
      expect(keywords).not.toContain('to');
      expect(keywords).not.toContain('for');
    });

    it('should filter out short words', () => {
      const question = 'Is AI good?';
      const keywords = advancedRagChain.extractKeywords(question);

      expect(keywords).not.toContain('is');
      expect(keywords).toContain('good');
    });
  });

  describe('mergeResults', () => {
    it('should merge and deduplicate search results', () => {
      const searchResults = [
        {
          results: [
            { id: '1', content: 'Result 1', score: 0.9 },
            { id: '2', content: 'Result 2', score: 0.8 },
          ],
        },
        {
          results: [
            { id: '2', content: 'Result 2', score: 0.85 }, // Duplicate with higher score
            { id: '3', content: 'Result 3', score: 0.7 },
          ],
        },
      ];

      const merged = advancedRagChain.mergeResults(searchResults);

      expect(merged).toHaveLength(3);
      expect(merged.find((r) => r.id === '1').score).toBe(0.9);
      expect(merged.find((r) => r.id === '2').score).toBe(0.85); // Higher score kept
      expect(merged.find((r) => r.id === '3').score).toBe(0.7);
    });
  });

  describe('rerankByScore', () => {
    it('should sort results by score and limit', () => {
      const results = [
        { id: '1', score: 0.7 },
        { id: '2', score: 0.9 },
        { id: '3', score: 0.8 },
        { id: '4', score: 0.6 },
      ];

      const reranked = advancedRagChain.rerankByScore(results, 2);

      expect(reranked).toHaveLength(2);
      expect(reranked[0].id).toBe('2'); // Highest score
      expect(reranked[1].id).toBe('3'); // Second highest
    });
  });
});
