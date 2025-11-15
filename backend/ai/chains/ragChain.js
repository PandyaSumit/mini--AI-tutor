/**
 * RAG Chain - Retrieval Augmented Generation
 * Combines vector search with LLM generation
 */

import chromaService from '../vectorstore/chromaService.js';
import vectorCache from '../vectorstore/vectorCache.js';
import { ChatGroq } from '@langchain/groq';
import { formatRAGPrompt, ragPrompts } from '../prompts/ragPrompts.js';
import aiConfig from '../../config/ai.js';

class RAGChain {
  constructor() {
    this.llm = new ChatGroq({
      apiKey: aiConfig.llm.apiKey,
      model: aiConfig.llm.model,
      temperature: aiConfig.llm.temperature,
      maxTokens: aiConfig.llm.maxTokens,
    });
  }

  /**
   * Query with RAG
   */
  async query(question, options = {}) {
    const {
      collectionKey = 'knowledge',
      topK = aiConfig.rag.topK,
      promptTemplate = ragPrompts.qaWithContext,
    } = options;

    // Step 1: Check vector cache
    const cached = await vectorCache.get(question, collectionKey, { topK });
    let searchResults;

    if (cached) {
      searchResults = cached;
    } else {
      // Step 2: Search vector store
      searchResults = await chromaService.search(collectionKey, question, { topK });

      // Cache results
      await vectorCache.set(question, collectionKey, searchResults, { topK });
    }

    // Filter by minimum score
    const relevantDocs = searchResults.results.filter(
      (doc) => doc.score >= aiConfig.rag.minScore
    );

    if (relevantDocs.length === 0) {
      return {
        answer: 'I don\'t have enough information to answer this question accurately.',
        sources: [],
        confidence: 0,
      };
    }

    // Step 3: Format context
    const context = relevantDocs
      .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
      .join('\n\n');

    // Step 4: Generate answer with LLM
    const prompt = formatRAGPrompt(promptTemplate, { context, question });

    const response = await this.llm.invoke(prompt);
    const answer = response.content;

    return {
      answer,
      sources: relevantDocs.map((doc) => ({
        content: doc.content.substring(0, 200) + '...',
        score: doc.score,
        metadata: doc.metadata,
      })),
      confidence: relevantDocs[0]?.score || 0,
      cached: !!cached,
    };
  }

  /**
   * Explain concept with RAG
   */
  async explainConcept(concept, studentLevel = 'beginner') {
    return await this.query(concept, {
      promptTemplate: ragPrompts.explainConcept,
      topK: 3,
    });
  }

  /**
   * Get roadmap guidance
   */
  async getRoadmapGuidance(question, roadmapId, progress) {
    return await this.query(question, {
      collectionKey: 'roadmaps',
      promptTemplate: ragPrompts.roadmapGuidance,
      topK: 5,
    });
  }
}

export default new RAGChain();
