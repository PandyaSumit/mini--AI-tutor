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
        // Do not construct the ChatGroq client at import time. Create it
        // lazily on first use so that environment loading order (dotenv)
        // or dynamic imports won't cause module-load crashes.
        this.llm = null;
    }

    getLLM() {
        if (this.llm) return this.llm;

        const apiKey = aiConfig.llm.apiKey || process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error(
                'GROQ API key missing. Please set `GROQ_API_KEY` in your .env or environment and restart the server.'
            );
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

        // Check if collection is empty
        if (searchResults.count === 0) {
            return {
                answer: `The ${collectionKey} collection is currently empty. Please add some content first to enable knowledge search.`,
                sources: [],
                confidence: 0,
                collectionEmpty: true,
            };
        }

        // Filter by minimum score
        const relevantDocs = searchResults.results.filter(
            (doc) => doc.score >= aiConfig.rag.minScore
        );

        if (relevantDocs.length === 0) {
            const bestScore = searchResults.results[0]?.score || 0;
            return {
                answer: `I don't have enough information to answer this question accurately. The closest match had a relevance score of ${(bestScore * 100).toFixed(1)}%, but the minimum threshold is ${(aiConfig.rag.minScore * 100)}%.`,
                sources: [],
                confidence: 0,
                bestScore,
                threshold: aiConfig.rag.minScore,
            };
        }

        // Step 3: Format context
        const context = relevantDocs
            .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
            .join('\n\n');

        // Step 4: Generate answer with LLM
        const prompt = formatRAGPrompt(promptTemplate, { context, question });

        const response = await this.getLLM().invoke(prompt);
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
