/**
 * AI Orchestrator Service
 * Main service that coordinates all AI operations
 */

import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import embeddingService from '../ai/embeddings/embeddingService.js';
import chromaService from '../ai/vectorstore/chromaService.js';
import ingestionService from '../ai/vectorstore/ingestion.js';
import ragChain from '../ai/chains/ragChain.js';
import sanitizer from '../ai/security/sanitizer.js';
import envValidator from '../config/envValidator.js';
import aiConfig from '../config/ai.js';
import thinkingGenerator from '../ai/thinking/thinkingGenerator.js';
import tutorPrompts from '../ai/prompts/tutorPrompts.js';
import queryClassifier from '../ai/classifiers/queryClassifier.js';
import semanticQueryClassifier from '../ai/classifiers/semanticQueryClassifier.js';
import mcpHandler from '../ai/handlers/mcpHandler.js';
import logger from '../utils/logger.js';

class AIOrchestrator {
    constructor() {
        // Lazily initialize the ChatGroq client to avoid throwing during module
        // import if environment variables are not yet loaded.
        this.llm = null;
        this.isInitialized = false;
    }

    getLLM() {
        if (this.llm) return this.llm;

        const apiKey = aiConfig.llm.apiKey || process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ API key missing. Please set `GROQ_API_KEY` in your .env or environment and restart the server.');
        }

        this.llm = new ChatGroq({
            apiKey,
            model: aiConfig.llm.model,
            temperature: aiConfig.llm.temperature,
            maxTokens: aiConfig.llm.maxTokens,
            streaming: aiConfig.llm.streaming,
        });

        return this.llm;
    }

    /**
     * Initialize all AI services
     */
    async initialize() {
        console.log('🚀 Initializing AI Pipeline...');

        try {
            // Validate environment variables
            const validation = envValidator.validate();
            if (!validation.valid) {
                console.error('❌ Environment validation failed - AI pipeline may not work correctly');
                return { success: false, error: 'Environment validation failed', details: validation.errors };
            }

            // Initialize embedding service (required)
            await embeddingService.initialize();

            // Initialize ChromaDB (optional - graceful degradation)
            const chromaResult = await chromaService.initialize();
            const chromaAvailable = chromaResult.success;

            // Initialize semantic query classifier embeddings (async, non-blocking)
            semanticQueryClassifier.initializeIntentEmbeddings().catch(error => {
                console.warn('⚠️  Semantic classifier initialization failed, will use pattern-based:', error.message);
            });

            this.isInitialized = true;
            console.log('✅ AI Pipeline initialized successfully');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📋 AI Pipeline Ready:');
            console.log('   ✓ Local embeddings (BGE-small, FREE)');
            console.log(`   ${chromaAvailable ? '✓' : '✗'} Vector store (ChromaDB) ${chromaAvailable ? '' : '- DISABLED'}`);
            console.log(`   ${chromaAvailable ? '✓' : '✗'} RAG pipeline ${chromaAvailable ? '' : '- LIMITED'}`);
            console.log('   ✓ LLM (Groq)');
            console.log('   ✓ Security layer');
            console.log('   Cost: $0 embeddings + Groq LLM only');
            if (!chromaAvailable) {
                console.log('   ⚠️  Note: Some features require ChromaDB server');
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return { success: true, chromaAvailable };
        } catch (error) {
            console.error('❌ AI Pipeline initialization failed:', error.message);
            this.isInitialized = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Chat with AI (simple completion)
     */
    async chat(message, context = {}) {
        const startTime = Date.now();

        // Security check
        const injectionCheck = sanitizer.detectInjection(message);
        if (injectionCheck.detected) {
            throw new Error('Potential prompt injection detected');
        }

        const sanitizedMessage = sanitizer.sanitizeText(message);

        // Generate thinking steps
        const thinkingSteps = thinkingGenerator.generateThinkingSteps(sanitizedMessage, {
            mode: 'simple',
            hasRAG: false
        });

        const response = await this.getLLM().invoke(sanitizedMessage);

        const thinkingSummary = thinkingGenerator.generateSummary(thinkingSteps);

        return {
            response: response.content,
            model: aiConfig.llm.model,
            sanitized: message !== sanitizedMessage,
            thinking: {
                steps: thinkingSteps,
                summary: thinkingSummary,
                totalDuration: Date.now() - startTime
            }
        };
    }

    /**
     * Chat with RAG (context-aware)
     */
    async chatWithRAG(question, options = {}) {
        const startTime = Date.now();

        if (!chromaService.isInitialized) {
            throw new Error('RAG features require ChromaDB server. Please start ChromaDB server first.');
        }

        const injectionCheck = sanitizer.detectInjection(question);
        if (injectionCheck.detected) {
            throw new Error('Potential prompt injection detected');
        }

        const sanitizedQuestion = sanitizer.sanitizeText(question);

        const result = await ragChain.query(sanitizedQuestion, options);

        // Generate thinking steps with RAG context
        const thinkingSteps = thinkingGenerator.generateThinkingSteps(sanitizedQuestion, {
            mode: 'rag',
            hasRAG: true,
            sources: result.sources || []
        });

        const thinkingSummary = thinkingGenerator.generateSummary(thinkingSteps);

        return {
            ...result,
            question: sanitizedQuestion,
            model: aiConfig.llm.model,
            thinking: {
                steps: thinkingSteps,
                summary: thinkingSummary,
                totalDuration: Date.now() - startTime
            }
        };
    }

    /**
     * Smart Chat - Automatic Mode Detection
     * Intelligently routes to RAG or simple chat based on query analysis
     */
    async smartChat(message, options = {}) {
        const startTime = Date.now();

        const {
            conversationHistory = [],
            forceMode = null, // For testing/override
            useLLMClassifier = false, // Use LLM for classification (more accurate but slower)
            useSemanticClassifier = true, // Use semantic embeddings instead of patterns (recommended)
        } = options;

        // Security check
        const injectionCheck = sanitizer.detectInjection(message);
        if (injectionCheck.detected) {
            throw new Error('Potential prompt injection detected');
        }

        const sanitizedMessage = sanitizer.sanitizeText(message);

        // Step 1: Classify the query to determine mode
        // Use semantic classifier (embeddings-based) or pattern-based classifier
        let classification;
        let classifierUsed = useSemanticClassifier ? 'semantic' : 'pattern';

        try {
            const classifier = useSemanticClassifier ? semanticQueryClassifier : queryClassifier;
            classification = await classifier.classify(sanitizedMessage, {
                conversationHistory,
                forceMode,
                useLLM: useLLMClassifier, // Only used by pattern-based classifier
            });
        } catch (error) {
            // Fallback to pattern-based classifier if semantic fails
            if (useSemanticClassifier) {
                logger.warn('Semantic classifier failed, falling back to pattern-based:', error.message);
                classifierUsed = 'pattern';

                classification = await queryClassifier.classify(sanitizedMessage, {
                    conversationHistory,
                    forceMode,
                    useLLM: useLLMClassifier,
                });
            } else {
                throw error; // Re-throw if pattern-based also fails
            }
        }

        logger.info('Smart chat mode selected:', {
            query: sanitizedMessage.substring(0, 50),
            mode: classification.mode,
            confidence: classification.confidence,
            method: classification.method,
            classifier: classifierUsed,
            reasoning: classification.reasoning,
        });

        // Step 2: Route to appropriate handler based on classification

        // Handle session memory queries (references to previous messages)
        if (classification.mode === 'sessionMemory') {
            logger.info('Session memory query detected');

            // Use simple chat with conversation history context
            const result = await this.chat(sanitizedMessage, options);

            return {
                ...result,
                modeDetection: {
                    ...classification,
                    selectedMode: 'sessionMemory',
                    actualMode: 'simple',
                    fallback: false,
                    note: 'Session memory handled via conversation context',
                },
            };
        }

        // Handle platform action requests
        if (classification.mode === 'platformAction') {
            logger.info('Platform action detected:', classification.action);

            try {
                // Attempt to handle via MCP tools
                const mcpResult = await mcpHandler.handlePlatformAction(sanitizedMessage, {
                    userId: options.userId,
                    conversationHistory,
                });

                if (mcpResult.handled && mcpResult.success) {
                    // MCP tool successfully handled the request
                    return {
                        response: mcpResult.message,
                        data: mcpResult.data,
                        model: aiConfig.llm.model,
                        platformAction: true,
                        tool: mcpResult.tool,
                        modeDetection: {
                            ...classification,
                            selectedMode: 'platformAction',
                            actualMode: 'mcp',
                            fallback: false,
                            tool: mcpResult.tool,
                            confidence: mcpResult.confidence,
                        },
                    };
                }

                // MCP couldn't handle or tools not available - fallback to LLM
                logger.warn('MCP handler could not process platform action, falling back to LLM');

                const result = await this.chat(sanitizedMessage, options);

                return {
                    ...result,
                    modeDetection: {
                        ...classification,
                        selectedMode: 'platformAction',
                        actualMode: 'simple',
                        fallback: true,
                        reason: mcpResult.message || 'MCP tools not available',
                    },
                };
            } catch (error) {
                logger.error('Platform action handling failed:', error);

                // Error fallback to simple chat
                const result = await this.chat(sanitizedMessage, options);

                return {
                    ...result,
                    modeDetection: {
                        ...classification,
                        selectedMode: 'platformAction',
                        actualMode: 'simple',
                        fallback: true,
                        reason: 'MCP error: ' + error.message,
                    },
                };
            }
        }

        // Handle RAG queries
        if (classification.mode === 'rag') {
            // Use RAG mode - but gracefully fallback to simple if ChromaDB unavailable
            if (!chromaService.isInitialized) {
                logger.warn('RAG mode selected but ChromaDB not available, falling back to simple chat');

                const result = await this.chat(sanitizedMessage, options);

                return {
                    ...result,
                    modeDetection: {
                        ...classification,
                        selectedMode: 'rag',
                        actualMode: 'simple',
                        fallback: true,
                        reason: 'ChromaDB not available',
                    },
                };
            }

            // Execute RAG query
            const result = await this.chatWithRAG(sanitizedMessage, {
                topK: 5,
                collectionKey: 'knowledge',
            });

            // Check if knowledge collection is empty or no relevant docs - fallback to simple chat
            if (result.collectionEmpty || (result.confidence === 0 && result.sources?.length === 0)) {
                const reason = result.collectionEmpty
                    ? 'Knowledge collection empty'
                    : 'No relevant documents found';

                logger.warn(`${reason}, falling back to simple chat`);

                const simpleResult = await this.chat(sanitizedMessage, options);

                return {
                    ...simpleResult,
                    modeDetection: {
                        ...classification,
                        selectedMode: 'rag',
                        actualMode: 'simple',
                        fallback: true,
                        reason,
                    },
                };
            }

            return {
                ...result,
                modeDetection: {
                    ...classification,
                    selectedMode: 'rag',
                    actualMode: 'rag',
                    fallback: false,
                },
            };
        } else {
            // Use simple chat mode
            const result = await this.chat(sanitizedMessage, options);

            return {
                ...result,
                modeDetection: {
                    ...classification,
                    selectedMode: 'simple',
                    actualMode: 'simple',
                    fallback: false,
                },
            };
        }
    }

    /**
     * Tutor Chat - Socratic teaching method
     * Uses comprehensive tutor system prompt for educational conversations
     */
    async tutorChat(message, options = {}) {
        const startTime = Date.now();

        const {
            subject = 'general',
            level = 'intermediate',
            phase = 'introduction',
            conversationHistory = []
        } = options;

        // Security check
        const injectionCheck = sanitizer.detectInjection(message);
        if (injectionCheck.detected) {
            throw new Error('Potential prompt injection detected');
        }

        const sanitizedMessage = sanitizer.sanitizeText(message);

        // Generate tutor system prompt
        const systemPrompt = tutorPrompts.generate({
            subject,
            level,
            phase,
            sessionContext: conversationHistory.length > 0
                ? `Previous exchanges: ${conversationHistory.slice(-3).map(h => `Student: ${h.question}\nTutor: ${h.answer}`).join('\n')}`
                : null
        });

        // Generate thinking steps for tutor mode
        const thinkingSteps = thinkingGenerator.generateThinkingSteps(sanitizedMessage, {
            mode: 'tutor',
            hasRAG: false,
            subject,
            phase
        });

        // Create messages with system prompt
        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(sanitizedMessage)
        ];

        const response = await this.getLLM().invoke(messages);

        const thinkingSummary = thinkingGenerator.generateSummary(thinkingSteps);

        return {
            response: response.content,
            model: aiConfig.llm.model,
            sanitized: message !== sanitizedMessage,
            tutorMode: true,
            subject,
            level,
            phase,
            thinking: {
                steps: thinkingSteps,
                summary: thinkingSummary,
                totalDuration: Date.now() - startTime
            }
        };
    }

    /**
     * Generate embeddings
     */
    async generateEmbeddings(texts) {
        if (!Array.isArray(texts)) {
            texts = [texts];
        }

        return await embeddingService.embedBatch(texts);
    }

    /**
     * Semantic search
     */
    async semanticSearch(query, options = {}) {
        if (!chromaService.isInitialized) {
            throw new Error('Search features require ChromaDB server. Please start ChromaDB server first.');
        }

        const { collectionKey = 'knowledge', topK = 5 } = options;

        const results = await chromaService.search(collectionKey, query, { topK });

        return {
            query,
            results: results.results,
            count: results.count,
            cached: results.queryCached,
        };
    }

    /**
     * Ingest content into vector store
     */
    async ingestContent(type, content, metadata = {}) {
        if (!chromaService.isInitialized) {
            throw new Error('Content ingestion requires ChromaDB server. Please start ChromaDB server first.');
        }

        return await ingestionService.ingestContent(type, content, metadata);
    }

    /**
     * Calculate text similarity
     */
    async calculateSimilarity(text1, text2) {
        return await embeddingService.similarity(text1, text2);
    }

    /**
     * Get AI pipeline statistics
     */
    async getStats() {
        const embeddingStats = embeddingService.getStats();
        const chromaStats = await chromaService.getStats();
        const classifierStats = queryClassifier.getStats();

        return {
            initialized: this.isInitialized,
            embeddings: embeddingStats,
            vectorStore: chromaStats,
            classifier: classifierStats,
            model: aiConfig.llm.model,
            cost: {
                embeddings: 0, // Always $0
                total: embeddingStats.service.totalCost || 0,
            },
        };
    }

    /**
     * Get query classifier statistics
     */
    getClassifierStats(useSemanticClassifier = true) {
        const classifier = useSemanticClassifier ? semanticQueryClassifier : queryClassifier;
        return {
            ...classifier.getStats(),
            classifierType: useSemanticClassifier ? 'semantic' : 'pattern',
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        const embeddingHealth = await embeddingService.healthCheck();
        const chromaHealth = await chromaService.healthCheck();

        return {
            status: this.isInitialized ? 'healthy' : 'not_initialized',
            embeddings: embeddingHealth,
            vectorStore: chromaHealth,
            model: aiConfig.llm.model,
        };
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('🧹 Cleaning up AI Pipeline...');
        await embeddingService.cleanup();
        await chromaService.cleanup();
        this.isInitialized = false;
        console.log('✅ AI Pipeline cleaned up');
    }
}

// Singleton instance
const aiOrchestrator = new AIOrchestrator();

export default aiOrchestrator;
