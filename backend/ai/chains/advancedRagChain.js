/**
 * Advanced RAG Chain with Multi-Query Retrieval
 * Implements sophisticated retrieval strategies for better accuracy
 */

import { ChatGroq } from '@langchain/groq';
import chromaService from '../vectorstore/chromaService.js';
import vectorCache from '../vectorstore/vectorCache.js';
import embeddingService from '../embeddings/embeddingService.js';
import { formatRAGPrompt, ragPrompts } from '../prompts/ragPrompts.js';
import aiConfig from '../../config/ai.js';
import logger from '../../utils/logger.js';

class AdvancedRAGChain {
  constructor() {
    this.llm = null;
  }

  getLLM() {
    if (this.llm) return this.llm;

    const apiKey = aiConfig.llm.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ API key missing');
    }

    this.llm = new ChatGroq({
      apiKey,
      model: aiConfig.llm.model,
      temperature: aiConfig.llm.temperature,
      maxTokens: aiConfig.llm.maxTokens,
    });

    return this.llm;
  }

  /**
   * Multi-Query Retrieval: Generate query variations for better recall
   */
  async multiQueryRetrieval(question, options = {}) {
    const {
      collectionKey = 'knowledge',
      topK = aiConfig.rag.topK,
      numQueries = 3,
    } = options;

    try {
      // Step 1: Generate query variations
      const queryVariations = await this.generateQueryVariations(
        question,
        numQueries
      );

      logger.debug('Generated query variations:', queryVariations);

      // Step 2: Search with each query variation in parallel
      const searchPromises = queryVariations.map((query) =>
        chromaService.search(collectionKey, query, { topK })
      );

      const searchResults = await Promise.all(searchPromises);

      // Step 3: Merge and deduplicate results
      const mergedResults = this.mergeResults(searchResults);

      // Step 4: Re-rank by relevance score
      const reranked = this.rerankByScore(mergedResults, topK * 2);

      // Step 5: Filter by minimum score
      const relevantDocs = reranked.filter(
        (doc) => doc.score >= aiConfig.rag.minScore
      );

      if (relevantDocs.length === 0) {
        return {
          answer: `I don't have enough information to answer this question accurately.`,
          sources: [],
          confidence: 0,
          queries: queryVariations,
          strategy: 'multi-query',
        };
      }

      // Step 6: Generate answer with LLM
      const context = relevantDocs
        .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
        .join('\n\n');

      const prompt = formatRAGPrompt(ragPrompts.qaWithContext, {
        context,
        question,
      });

      const response = await this.getLLM().invoke(prompt);

      return {
        answer: response.content,
        sources: relevantDocs.map((doc) => ({
          content: doc.content.substring(0, 200) + '...',
          score: doc.score,
          metadata: doc.metadata,
        })),
        confidence: relevantDocs[0]?.score || 0,
        queries: queryVariations,
        strategy: 'multi-query',
        resultsBeforeDedup: searchResults.reduce(
          (sum, r) => sum + r.count,
          0
        ),
        resultsAfterDedup: mergedResults.length,
      };
    } catch (error) {
      logger.error('Multi-query retrieval error:', error);
      throw error;
    }
  }

  /**
   * Generate variations of the query using LLM
   */
  async generateQueryVariations(question, numQueries = 3) {
    const prompt = `You are an AI assistant generating alternative phrasings of a user's question to improve information retrieval.

Original question: "${question}"

Generate ${numQueries} alternative phrasings of this question. Each should ask the same thing but with different wording. Return ONLY the questions, one per line, without numbering or explanations.`;

    try {
      const response = await this.getLLM().invoke(prompt);
      const variations = response.content
        .split('\n')
        .filter((q) => q.trim().length > 0)
        .map((q) => q.trim().replace(/^\d+\.\s*/, ''));

      // Include original question as well
      return [question, ...variations.slice(0, numQueries - 1)];
    } catch (error) {
      logger.warn('Failed to generate query variations, using original:', error);
      return [question];
    }
  }

  /**
   * Merge results from multiple searches and deduplicate
   */
  mergeResults(searchResults) {
    const allResults = searchResults.flatMap((r) => r.results);

    // Deduplicate by ID, keeping highest score
    const resultMap = new Map();

    for (const result of allResults) {
      const existing = resultMap.get(result.id);

      if (!existing || result.score > existing.score) {
        resultMap.set(result.id, result);
      }
    }

    return Array.from(resultMap.values());
  }

  /**
   * Re-rank results by score
   */
  rerankByScore(results, limit) {
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Conversational RAG: Maintain context from conversation history
   */
  async conversationalRAG(question, options = {}) {
    const {
      collectionKey = 'knowledge',
      topK = aiConfig.rag.topK,
      conversationHistory = [],
    } = options;

    try {
      // Step 1: Contextualize the question using conversation history
      const contextualizedQuestion = await this.contextualizeQuestion(
        question,
        conversationHistory
      );

      logger.debug('Contextualized question:', contextualizedQuestion);

      // Step 2: Search with contextualized question
      const searchResults = await chromaService.search(
        collectionKey,
        contextualizedQuestion,
        { topK }
      );

      // Step 3: Filter by minimum score
      const relevantDocs = searchResults.results.filter(
        (doc) => doc.score >= aiConfig.rag.minScore
      );

      if (relevantDocs.length === 0) {
        return {
          answer: `I don't have enough information to answer this question accurately.`,
          sources: [],
          confidence: 0,
          contextualizedQuestion,
          strategy: 'conversational',
        };
      }

      // Step 4: Generate answer with conversation context
      const context = relevantDocs
        .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
        .join('\n\n');

      const conversationContext = conversationHistory
        .slice(-3)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = formatRAGPrompt(ragPrompts.qaWithContext, {
        context,
        question,
        conversationContext,
      });

      const response = await this.getLLM().invoke(prompt);

      return {
        answer: response.content,
        sources: relevantDocs.map((doc) => ({
          content: doc.content.substring(0, 200) + '...',
          score: doc.score,
          metadata: doc.metadata,
        })),
        confidence: relevantDocs[0]?.score || 0,
        contextualizedQuestion,
        strategy: 'conversational',
      };
    } catch (error) {
      logger.error('Conversational RAG error:', error);
      throw error;
    }
  }

  /**
   * Contextualize current question using conversation history
   */
  async contextualizeQuestion(question, conversationHistory) {
    if (conversationHistory.length === 0) {
      return question;
    }

    const recentHistory = conversationHistory
      .slice(-3)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that contains all necessary context.

Conversation history:
${recentHistory}

Follow-up question: ${question}

Standalone question:`;

    try {
      const response = await this.getLLM().invoke(prompt);
      return response.content.trim();
    } catch (error) {
      logger.warn('Failed to contextualize question, using original:', error);
      return question;
    }
  }

  /**
   * Self-Query RAG: Extract metadata filters from natural language query
   */
  async selfQueryRAG(question, options = {}) {
    const { collectionKey = 'knowledge', topK = aiConfig.rag.topK } = options;

    try {
      // Step 1: Extract metadata filters from query
      const filters = await this.extractMetadataFilters(question);

      logger.debug('Extracted metadata filters:', filters);

      // Step 2: Search with semantic query + metadata filters
      const searchResults = await chromaService.search(
        collectionKey,
        filters.semanticQuery || question,
        {
          topK,
          where: filters.where,
        }
      );

      // Step 3: Filter by minimum score
      const relevantDocs = searchResults.results.filter(
        (doc) => doc.score >= aiConfig.rag.minScore
      );

      if (relevantDocs.length === 0) {
        return {
          answer: `I don't have enough information to answer this question accurately.`,
          sources: [],
          confidence: 0,
          filters,
          strategy: 'self-query',
        };
      }

      // Step 4: Generate answer
      const context = relevantDocs
        .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
        .join('\n\n');

      const prompt = formatRAGPrompt(ragPrompts.qaWithContext, {
        context,
        question,
      });

      const response = await this.getLLM().invoke(prompt);

      return {
        answer: response.content,
        sources: relevantDocs.map((doc) => ({
          content: doc.content.substring(0, 200) + '...',
          score: doc.score,
          metadata: doc.metadata,
        })),
        confidence: relevantDocs[0]?.score || 0,
        filters,
        strategy: 'self-query',
      };
    } catch (error) {
      logger.error('Self-query RAG error:', error);
      throw error;
    }
  }

  /**
   * Extract metadata filters from natural language query
   */
  async extractMetadataFilters(question) {
    const prompt = `Extract structured metadata filters from the following question. Return a JSON object with:
- "semanticQuery": The core semantic part of the question
- "where": Metadata filters as key-value pairs (topic, difficulty, tags, etc.)

Question: "${question}"

Return ONLY valid JSON, no explanations:`;

    try {
      const response = await this.getLLM().invoke(prompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          semanticQuery: parsed.semanticQuery || question,
          where: parsed.where || {},
        };
      }

      return { semanticQuery: question, where: {} };
    } catch (error) {
      logger.warn('Failed to extract metadata filters:', error);
      return { semanticQuery: question, where: {} };
    }
  }

  /**
   * Hybrid Search: Combine semantic search with keyword matching
   */
  async hybridSearch(question, options = {}) {
    const { collectionKey = 'knowledge', topK = aiConfig.rag.topK, alpha = 0.7 } = options;

    try {
      // Step 1: Semantic search
      const semanticResults = await chromaService.search(
        collectionKey,
        question,
        { topK: topK * 2 }
      );

      // Step 2: Keyword search (using ChromaDB whereDocument)
      const keywords = this.extractKeywords(question);
      const keywordFilter = keywords
        .map((kw) => `{$contains: "${kw}"}`)
        .join(', ');

      // For now, we'll use semantic only (keyword search requires whereDocument support)
      // In production, implement BM25 or TF-IDF scoring

      // Step 3: Combine scores with hybrid weighting (alpha for semantic, 1-alpha for keyword)
      const hybridResults = semanticResults.results.map((doc) => ({
        ...doc,
        hybridScore: alpha * doc.score + (1 - alpha) * 0.5, // Placeholder keyword score
      }));

      // Step 4: Re-rank by hybrid score
      const reranked = hybridResults
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, topK);

      // Step 5: Filter by minimum score
      const relevantDocs = reranked.filter(
        (doc) => doc.hybridScore >= aiConfig.rag.minScore
      );

      if (relevantDocs.length === 0) {
        return {
          answer: `I don't have enough information to answer this question accurately.`,
          sources: [],
          confidence: 0,
          strategy: 'hybrid',
        };
      }

      // Step 6: Generate answer
      const context = relevantDocs
        .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
        .join('\n\n');

      const prompt = formatRAGPrompt(ragPrompts.qaWithContext, {
        context,
        question,
      });

      const response = await this.getLLM().invoke(prompt);

      return {
        answer: response.content,
        sources: relevantDocs.map((doc) => ({
          content: doc.content.substring(0, 200) + '...',
          score: doc.hybridScore,
          metadata: doc.metadata,
        })),
        confidence: relevantDocs[0]?.hybridScore || 0,
        strategy: 'hybrid',
        alpha,
      };
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from question
   */
  extractKeywords(question) {
    // Simple keyword extraction (in production, use NLP library)
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'from', 'by', 'how', 'what',
      'where', 'when', 'why', 'who', 'i', 'you', 'we', 'they', 'it',
    ]);

    return question
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }
}

export default new AdvancedRAGChain();
