/**
 * TutoringAgent - Handles all AI tutoring interactions
 * Uses multi-layer caching strategy to minimize costs
 * Leverages existing RAGChain infrastructure
 */

import BaseAgent from './BaseAgent.js';
import Course from '../../models/Course.js';
import User from '../../models/User.js';
import AIConversation from '../../models/AIConversation.js';
import { ragPrompts } from '../prompts/ragPrompts.js';

class TutoringAgent extends BaseAgent {
  constructor() {
    super('TutoringAgent', {
      cacheFirst: true,
      costBudget: 0.05, // Max $0.05 per query
      maxTokens: 500
    });

    // Cache for frequently asked questions (in-memory + DB)
    this.quickCache = new Map();
  }

  /**
   * Main execution: Answer student question with multi-layer strategy
   */
  async execute(task) {
    const {
      user_id,
      course_id,
      topic_id,
      query,
      conversation_id,
      context = {}
    } = task;

    // LAYER 1: Check user quota first (cost control!)
    const quotaCheck = await this.checkUserQuota(user_id);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        answer: `You've reached your usage limit. ${quotaCheck.message}`,
        error: 'QUOTA_EXCEEDED',
        upgrade_url: '/pricing',
        cost: 0
      };
    }

    // LAYER 2: Check exact cache (in-memory)
    const cacheKey = `${course_id}:${topic_id}:${query}`;
    if (this.quickCache.has(cacheKey)) {
      const cached = this.quickCache.get(cacheKey);
      this.log('info', 'Cache hit (in-memory)', { cacheKey });

      return {
        answer: cached.answer,
        routing_decision: 'cache_hit',
        cost: 0.0001,
        cached: true
      };
    }

    // LAYER 3: Check semantic cache (database)
    const similarQuestion = await this.findSimilarQuestion(query, course_id, topic_id);
    if (similarQuestion && similarQuestion.similarity > 0.95) {
      this.log('info', 'Semantic cache hit', {
        similarity: similarQuestion.similarity
      });

      // Store in quick cache
      this.quickCache.set(cacheKey, { answer: similarQuestion.answer });

      return {
        answer: similarQuestion.answer,
        routing_decision: 'semantic_cache_hit',
        cost: 0.001, // Just embedding cost
        cached: true
      };
    }

    // LAYER 4: Use RAG + LLM (expensive)
    const courseContext = await this.buildCourseContext(course_id, topic_id);

    // Get conversation history (last 3 messages only)
    const conversationHistory = await this.getConversationHistory(
      conversation_id,
      limit = 3
    );

    // Use existing RAGChain
    const collectionKey = `course_${course_id}`;
    const ragResult = await this.dependencies.ragChain.query(query, {
      collectionKey,
      topK: 3,
      promptTemplate: this.buildTutorPrompt(courseContext, conversationHistory)
    });

    const answer = ragResult.answer;
    const cost = this.estimateCost(ragResult);

    // Cache this for future
    await this.cacheAnswer(query, answer, course_id, topic_id, cost);

    // Save to conversation
    await this.saveToConversation(conversation_id, user_id, query, answer, cost);

    // Increment user usage
    await this.incrementUserUsage(user_id, cost);

    return {
      answer,
      sources: ragResult.sources,
      routing_decision: ragResult.model || 'rag_llm',
      cost,
      cached: false
    };
  }

  /**
   * Check if user has quota remaining
   */
  async checkUserQuota(user_id) {
    const user = await User.findById(user_id).select('tier usage');

    const limits = {
      free: { daily: 10, monthly: 50 },
      basic: { daily: 30, monthly: 500 },
      pro: { daily: 100, monthly: 2000 }
    };

    const userLimits = limits[user.tier] || limits.free;

    // Check daily limit
    if (user.usage.ai_messages_today >= userLimits.daily) {
      return {
        allowed: false,
        reason: 'daily_limit',
        message: `Daily limit of ${userLimits.daily} messages reached. Resets tomorrow or upgrade to continue.`
      };
    }

    // Check monthly limit
    if (user.usage.ai_messages_this_month >= userLimits.monthly) {
      return {
        allowed: false,
        reason: 'monthly_limit',
        message: `Monthly limit of ${userLimits.monthly} messages reached. Upgrade for more.`
      };
    }

    return { allowed: true };
  }

  /**
   * Find similar question in database (semantic search)
   */
  async findSimilarQuestion(query, course_id, topic_id) {
    try {
      // Get query embedding
      const queryEmbedding = await this.dependencies.embeddingService.embed(query);

      // Search in course's cached Q&A
      const course = await Course.findById(course_id)
        .select('ai_preparation.common_questions');

      if (!course?.ai_preparation?.common_questions) {
        return null;
      }

      // Find most similar question using cosine similarity
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const qa of course.ai_preparation.common_questions) {
        const similarity = this.cosineSimilarity(queryEmbedding, qa.embedding);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = qa;
        }
      }

      if (bestMatch && highestSimilarity > 0.85) {
        // Increment usage count
        await Course.updateOne(
          {
            _id: course_id,
            'ai_preparation.common_questions._id': bestMatch._id
          },
          {
            $inc: { 'ai_preparation.common_questions.$.used_count': 1 }
          }
        );

        return {
          question: bestMatch.question,
          answer: bestMatch.answer,
          similarity: highestSimilarity
        };
      }

      return null;

    } catch (error) {
      this.log('error', 'Semantic search failed', { error: error.message });
      return null;
    }
  }

  /**
   * Build course context for AI
   */
  async buildCourseContext(course_id, topic_id) {
    const course = await Course.findById(course_id)
      .select('title description modules');

    if (!course) {
      return {};
    }

    // Find the specific topic
    let topic = null;
    for (const module of course.modules) {
      topic = module.topics.find(t => t._id.toString() === topic_id);
      if (topic) break;
    }

    return {
      course_title: course.title,
      course_description: course.description,
      topic_title: topic?.title || 'Unknown',
      learning_objectives: topic?.learning_objectives || [],
      key_concepts: topic?.key_concepts || []
    };
  }

  /**
   * Build tutor-specific prompt
   */
  buildTutorPrompt(courseContext, conversationHistory) {
    return (context, question) => `You are an AI tutor for the course "${courseContext.course_title}".

Current topic: ${courseContext.topic_title}

Learning objectives:
${courseContext.learning_objectives.map(obj => `- ${obj}`).join('\n')}

Key concepts to cover:
${courseContext.key_concepts.join(', ')}

Relevant course materials:
${context}

Recent conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

IMPORTANT RULES:
1. Be concise and clear (2-3 paragraphs max)
2. Use examples from the course materials above
3. Stay focused on the current topic
4. Encourage the student to practice
5. If unsure, admit it and suggest resources

Student question: ${question}

Your answer:`;
  }

  /**
   * Get recent conversation history
   */
  async getConversationHistory(conversation_id, limit = 3) {
    if (!conversation_id) {
      return [];
    }

    try {
      const conversation = await AIConversation.findById(conversation_id)
        .select('messages')
        .lean();

      if (!conversation) {
        return [];
      }

      // Get last N messages
      return conversation.messages.slice(-limit).map(msg => ({
        role: msg.role,
        content: msg.content.slice(0, 200) // Truncate long messages
      }));

    } catch (error) {
      this.log('error', 'Failed to get conversation history', { error: error.message });
      return [];
    }
  }

  /**
   * Cache answer for future use
   */
  async cacheAnswer(query, answer, course_id, topic_id, cost) {
    try {
      // Generate embedding
      const embedding = await this.dependencies.embeddingService.embed(query);

      // Add to course's common questions
      await Course.updateOne(
        { _id: course_id },
        {
          $push: {
            'ai_preparation.common_questions': {
              question: query,
              answer,
              embedding,
              used_count: 1
            }
          }
        }
      );

      // Also cache in memory
      const cacheKey = `${course_id}:${topic_id}:${query}`;
      this.quickCache.set(cacheKey, { answer });

      // Limit in-memory cache size
      if (this.quickCache.size > 1000) {
        const firstKey = this.quickCache.keys().next().value;
        this.quickCache.delete(firstKey);
      }

    } catch (error) {
      this.log('error', 'Failed to cache answer', { error: error.message });
    }
  }

  /**
   * Save interaction to conversation
   */
  async saveToConversation(conversation_id, user_id, query, answer, cost) {
    try {
      if (!conversation_id) {
        // Create new conversation
        const conversation = await AIConversation.create({
          student_id: user_id,
          messages: [
            { role: 'user', content: query },
            {
              role: 'assistant',
              content: answer,
              cost,
              timestamp: new Date()
            }
          ],
          total_cost: cost
        });

        return conversation._id;
      }

      // Append to existing conversation
      await AIConversation.updateOne(
        { _id: conversation_id },
        {
          $push: {
            messages: [
              { role: 'user', content: query },
              {
                role: 'assistant',
                content: answer,
                cost,
                timestamp: new Date()
              }
            ]
          },
          $inc: {
            total_messages: 2,
            total_cost: cost
          },
          $set: {
            last_message_at: new Date()
          }
        }
      );

      return conversation_id;

    } catch (error) {
      this.log('error', 'Failed to save conversation', { error: error.message });
    }
  }

  /**
   * Increment user usage tracking
   */
  async incrementUserUsage(user_id, cost) {
    const today = new Date().toDateString();

    await User.updateOne(
      { _id: user_id },
      {
        $inc: {
          'usage.ai_messages_today': 1,
          'usage.ai_messages_this_month': 1,
          'usage.estimated_cost_this_month': cost,
          'usage.total_cost_lifetime': cost
        },
        $set: {
          'usage.last_reset_date': new Date()
        }
      }
    );
  }

  /**
   * Estimate cost from RAG result
   */
  estimateCost(ragResult) {
    // Simple heuristic based on model used
    const baseCosts = {
      'llama-3.1-70b': 0.01, // Groq pricing
      'llama-3.1-8b': 0.005,
      'mixtral-8x7b': 0.008
    };

    const model = ragResult.model || 'llama-3.1-70b';
    return baseCosts[model] || 0.01;
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}

export default TutoringAgent;
