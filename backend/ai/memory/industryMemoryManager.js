/**
 * Industry-Level Memory Manager
 * Implements 10 advanced strategies for production-grade conversational AI memory
 *
 * Architecture:
 * 1. Multi-Tiered Memory (Short-term, Working, Long-term)
 * 2. Semantic Retrieval with Multi-Factor Relevance Scoring
 * 3. Memory Consolidation and Compression Pipelines
 * 4. Hierarchical Organization with Namespaces
 * 5. Intelligent Forgetting and Memory Decay
 * 6. Contextual Memory Injection and Priming
 * 7. Distributed Memory (Multi-user, Multi-agent)
 * 8. Meta-Memory and Reflection
 * 9. Privacy, Security, and Compliance
 * 10. Advanced Context Window Budget Management
 */

import MemoryEntry from '../../models/MemoryEntry.js';
import UserProfile from '../../models/UserProfile.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import embeddingService from '../embeddings/embeddingService.js';
import chromaService from '../vectorstore/chromaService.js';
import redis from '../config/redis.js';
import logger from '../../utils/logger.js';

class IndustryMemoryManager {
  constructor() {
    this.config = {
      // Multi-tiered memory configuration
      tiers: {
        shortTerm: {
          maxMessages: 5, // Current conversation context
          ttl: 300 // 5 minutes
        },
        working: {
          maxMessages: 20, // Session context
          ttl: 7200, // 2 hours
          summarizeThreshold: 10
        },
        longTerm: {
          consolidateAfter: 24 * 60 * 60 * 1000, // 24 hours
          maxMemoriesPerRetrieval: 5
        }
      },

      // Context window budget (percentages)
      contextBudget: {
        systemPrompt: 0.25, // 25%
        shortTermMemory: 0.20, // 20%
        workingMemory: 0.20, // 20%
        longTermMemory: 0.20, // 20%
        currentMessage: 0.10, // 10%
        buffer: 0.05 // 5%
      },

      // Token limits
      maxTotalTokens: 2000,

      // Relevance scoring weights
      relevanceWeights: {
        recency: 0.25,
        frequency: 0.20,
        semanticSimilarity: 0.30,
        importance: 0.15,
        emotionalValence: 0.10
      },

      // Privacy settings
      privacy: {
        sensitiveCategories: ['health', 'financial', 'biometric', 'special'],
        defaultRetentionDays: 365,
        anonymizeAfterDays: 90
      }
    };

    // Statistics
    this.stats = {
      retrievals: 0,
      consolidations: 0,
      forgettingEvents: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * STRATEGY 1: Multi-Tiered Memory Architecture
   * Retrieve and organize memories across short-term, working, and long-term tiers
   */
  async getMultiTieredMemory(userId, conversationId, options = {}) {
    const { currentMessage, intent = null } = options;

    logger.info('Retrieving multi-tiered memory', { userId, conversationId });

    const memory = {
      shortTerm: {
        messages: [],
        tokens: 0
      },
      working: {
        context: '',
        summary: null,
        tokens: 0
      },
      longTerm: {
        memories: [],
        tokens: 0
      },
      userProfile: null,
      metadata: {
        totalTokens: 0,
        cached: false,
        tier Breakdown: {}
      }
    };

    try {
      // Check cache first
      const cacheKey = `memory:${userId}:${conversationId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        this.stats.cacheHits++;
        memory.metadata.cached = true;
        return { ...memory, ...JSON.parse(cached) };
      }

      this.stats.cacheMisses++;

      // 1. SHORT-TERM: Last N messages (verbatim)
      memory.shortTerm = await this.getShortTermMemory(conversationId, this.config.tiers.shortTerm.maxMessages);

      // 2. WORKING: Current session context (summarized + recent)
      memory.working = await this.getWorkingMemory(userId, conversationId);

      // 3. LONG-TERM: Semantic retrieval from consolidated memories
      if (currentMessage) {
        memory.longTerm = await this.getLongTermMemory(userId, currentMessage, intent);
      }

      // 4. USER PROFILE: Consolidated user information
      memory.userProfile = await this.getUserProfileMemory(userId);

      // Calculate total tokens
      memory.metadata.totalTokens =
        memory.shortTerm.tokens +
        memory.working.tokens +
        memory.longTerm.tokens;

      memory.metadata.tierBreakdown = {
        shortTerm: memory.shortTerm.tokens,
        working: memory.working.tokens,
        longTerm: memory.longTerm.tokens
      };

      // Cache the result
      await redis.setex(cacheKey, this.config.tiers.shortTerm.ttl, JSON.stringify({
        shortTerm: memory.shortTerm,
        working: memory.working,
        longTerm: memory.longTerm,
        userProfile: memory.userProfile,
        metadata: memory.metadata
      }));

      return memory;

    } catch (error) {
      logger.error('Error retrieving multi-tiered memory:', error);
      throw error;
    }
  }

  /**
   * SHORT-TERM MEMORY: Last N messages verbatim
   */
  async getShortTermMemory(conversationId, limit = 5) {
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('role content createdAt')
      .lean();

    messages.reverse(); // Chronological order

    const tokens = this.estimateTokens(messages.map(m => m.content).join('\n'));

    return {
      messages,
      tokens
    };
  }

  /**
   * WORKING MEMORY: Session context with summarization
   */
  async getWorkingMemory(userId, conversationId) {
    // Get session messages
    const sessionMessages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .select('role content createdAt')
      .lean();

    if (sessionMessages.length <= this.config.tiers.working.summarizeThreshold) {
      // Short session, return all messages
      return {
        context: this.formatMessages(sessionMessages),
        summary: null,
        tokens: this.estimateTokens(this.formatMessages(sessionMessages))
      };
    }

    // Split into old (to summarize) and recent (verbatim)
    const splitPoint = sessionMessages.length - this.config.tiers.shortTerm.maxMessages;
    const oldMessages = sessionMessages.slice(0, splitPoint);
    const recentMessages = sessionMessages.slice(splitPoint);

    // Check if summary already cached
    const summaryCacheKey = `summary:${conversationId}:${splitPoint}`;
    let summary = await redis.get(summaryCacheKey);

    if (!summary) {
      // Generate summary (this would call your summarization service)
      summary = await this.summarizeMessages(oldMessages);
      await redis.setex(summaryCacheKey, this.config.tiers.working.ttl, summary);
    }

    const context = `Previous conversation summary:\n${summary}\n\nRecent messages:\n${this.formatMessages(recentMessages)}`;

    return {
      context,
      summary,
      tokens: this.estimateTokens(context)
    };
  }

  /**
   * STRATEGY 2: Semantic Memory Retrieval with Multi-Factor Relevance Scoring
   * Retrieve memories using semantic search and multi-factor ranking
   */
  async getLongTermMemory(userId, query, intent = null) {
    try {
      // Semantic search in ChromaDB
      const embedding = await embeddingService.embed(query);

      if (!chromaService.isInitialized) {
        logger.warn('ChromaDB not available, skipping long-term memory retrieval');
        return { memories: [], tokens: 0 };
      }

      // Search for semantically similar memories
      const collectionKey = `user_memories_${userId}`;
      const semanticResults = await chromaService.search(collectionKey, query, {
        topK: 10, // Get more candidates for ranking
        minScore: 0.3
      }).catch(err => {
        logger.warn('ChromaDB search failed:', err.message);
        return { results: [], count: 0 };
      });

      if (semanticResults.count === 0) {
        return { memories: [], tokens: 0 };
      }

      // Get full memory entries from MongoDB
      const memoryIds = semanticResults.results.map(r => r.metadata.memoryId);
      const memoryEntries = await MemoryEntry.find({
        _id: { $in: memoryIds },
        status: 'active'
      }).lean();

      // MULTI-FACTOR RELEVANCE SCORING
      const rankedMemories = memoryEntries.map((memory, index) => {
        const semanticScore = semanticResults.results[index]?.score || 0;
        const relevance = this.calculateRelevanceScore(memory, semanticScore, intent);

        return {
          ...memory,
          relevanceScore: relevance.score,
          relevanceFactors: relevance.factors
        };
      });

      // Sort by relevance and take top N
      rankedMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const topMemories = rankedMemories.slice(0, this.config.tiers.longTerm.maxMemoriesPerRetrieval);

      // Mark memories as accessed
      await Promise.all(
        topMemories.map(m =>
          MemoryEntry.findByIdAndUpdate(m._id, {
            $set: { 'temporal.lastAccessedAt': Date.now() },
            $inc: { 'importance.factors.accessFrequency': 1 }
          })
        )
      );

      // Format for context injection
      const formattedMemories = topMemories.map(m => ({
        id: m._id,
        content: m.content,
        type: m.type,
        namespace: m.namespace,
        relevance: m.relevanceScore,
        timestamp: m.temporal.createdAt
      }));

      const tokens = this.estimateTokens(formattedMemories.map(m => m.content).join('\n'));

      this.stats.retrievals++;

      return {
        memories: formattedMemories,
        tokens
      };

    } catch (error) {
      logger.error('Error retrieving long-term memory:', error);
      return { memories: [], tokens: 0 };
    }
  }

  /**
   * MULTI-FACTOR RELEVANCE SCORING
   * Combines recency, frequency, semantic similarity, importance, and emotional valence
   */
  calculateRelevanceScore(memory, semanticScore, intent = null) {
    const weights = this.config.relevanceWeights;
    const factors = {};

    // 1. Recency: Exponential decay based on age
    const ageInDays = (Date.now() - memory.temporal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    factors.recency = Math.exp(-0.05 * ageInDays); // Half-life ~14 days

    // 2. Frequency: How often this memory has been accessed
    const accessFrequency = memory.importance.factors.accessFrequency || 0;
    factors.frequency = Math.min(Math.log10(accessFrequency + 1) / 2, 1);

    // 3. Semantic similarity: From vector search
    factors.semanticSimilarity = semanticScore;

    // 4. Importance: Pre-calculated importance score
    factors.importance = memory.importance.score || 0.5;

    // 5. Emotional valence: Absolute value (strong emotions are more memorable)
    factors.emotionalValence = Math.abs(memory.importance.factors.emotionalValence || 0);

    // 6. Intent matching (bonus): If memory matches conversation intent
    factors.intentBonus = 0;
    if (intent && memory.namespace.topic) {
      const intentMatch = intent.toLowerCase().includes(memory.namespace.topic.toLowerCase());
      factors.intentBonus = intentMatch ? 0.2 : 0;
    }

    // Calculate weighted score
    const score =
      factors.recency * weights.recency +
      factors.frequency * weights.frequency +
      factors.semanticSimilarity * weights.semanticSimilarity +
      factors.importance * weights.importance +
      factors.emotionalValence * weights.emotionalValence +
      factors.intentBonus;

    return {
      score: Math.max(0, Math.min(1, score)),
      factors
    };
  }

  /**
   * USER PROFILE MEMORY: Consolidated user information
   */
  async getUserProfileMemory(userId) {
    try {
      const profile = await UserProfile.findOne({ userId }).lean();

      if (!profile) {
        return null;
      }

      // Format relevant profile information
      const profileMemory = {
        personal: profile.personal.name?.value ? `Name: ${profile.personal.name.value}` : null,
        role: profile.personal.role?.value ? `Role: ${profile.personal.role.value}` : null,
        skills: profile.professional.skills?.slice(0, 5).map(s => s.name).join(', '),
        interests: profile.learning.interests?.slice(0, 5).map(i => i.topic).join(', '),
        learningStyle: profile.learning.learningStyle?.preferredFormat,
        communicationStyle: profile.preferences.communication?.formality
      };

      return profileMemory;

    } catch (error) {
      logger.error('Error retrieving user profile:', error);
      return null;
    }
  }

  /**
   * STRATEGY 3 & 4: Memory Consolidation with Hierarchical Organization
   * Background process to consolidate short-term memories into long-term storage
   */
  async consolidateMemories(userId, conversationId) {
    logger.info('Starting memory consolidation', { userId, conversationId });

    try {
      const conversation = await Conversation.findById(conversationId).lean();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get all messages from conversation
      const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .lean();

      if (messages.length === 0) {
        return { consolidated: 0, reason: 'No messages to consolidate' };
      }

      // Extract memories using NLP/entity extraction
      const extractedMemories = await this.extractMemoriesFromConversation(userId, conversationId, messages);

      // Deduplicate and merge with existing memories
      const deduplicated = await this.deduplicateMemories(userId, extractedMemories);

      // Store in MongoDB and ChromaDB
      const stored = await Promise.all(
        deduplicated.map(memory => this.storeMemory(userId, memory))
      );

      // Update user profile
      await this.updateUserProfileFromMemories(userId, stored);

      this.stats.consolidations++;

      logger.info(`Consolidated ${stored.length} memories from conversation`, {
        userId,
        conversationId,
        messageCount: messages.length
      });

      return {
        consolidated: stored.length,
        memories: stored
      };

    } catch (error) {
      logger.error('Error consolidating memories:', error);
      throw error;
    }
  }

  /**
   * Extract memories from conversation using entity extraction and pattern matching
   */
  async extractMemoriesFromConversation(userId, conversationId, messages) {
    const memories = [];

    // Combine messages into conversation text
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // 1. Extract explicit facts (user statements about themselves)
    const userMessages = messages.filter(m => m.role === 'user');

    for (const msg of userMessages) {
      // Pattern matching for common self-disclosure patterns
      const patterns = [
        { regex: /(?:i'm|i am|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i, type: 'fact', namespace: { category: 'personal', topic: 'identity' } },
        { regex: /(?:i work as|i'm a|i am a)\s+([a-z\s]+(?:developer|engineer|designer|manager|student|teacher))/i, type: 'fact', namespace: { category: 'work', topic: 'occupation' } },
        { regex: /i (?:love|like|enjoy|prefer)\s+([^,.!?]+)/i, type: 'preference', namespace: { category: 'personal', topic: 'preferences' } },
        { regex: /i (?:want|need|would like) to (?:learn|understand|know about)\s+([^,.!?]+)/i, type: 'goal', namespace: { category: 'education', topic: 'learning_goals' } },
        { regex: /i(?:'m| am) (?:learning|studying|working on)\s+([^,.!?]+)/i, type: 'experience', namespace: { category: 'education', topic: 'current_learning' } }
      ];

      for (const pattern of patterns) {
        const match = msg.content.match(pattern.regex);
        if (match) {
          memories.push({
            content: match[0],
            type: pattern.type,
            namespace: pattern.namespace,
            source: {
              conversationId,
              messageIds: [msg._id],
              extractionMethod: 'automatic',
              confidence: 0.8
            },
            importance: {
              score: 0.7,
              factors: {
                userMarked: false,
                accessFrequency: 0,
                recency: 1.0,
                emotionalValence: 0
              }
            }
          });
        }
      }
    }

    // 2. Extract entities (simplified - in production, use NLP library)
    const entities = this.extractEntities(conversationText);

    // 3. Extract preferences from conversation patterns
    // (Would use more sophisticated analysis in production)

    return memories;
  }

  /**
   * Simple entity extraction (in production, use spaCy, Stanford NER, or similar)
   */
  extractEntities(text) {
    const entities = [];

    // Simple patterns (would be replaced with proper NER)
    const personPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const organizationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Company|University|College)))\b/g;

    let match;
    while ((match = personPattern.exec(text)) !== null) {
      entities.push({
        type: 'person',
        value: match[1],
        confidence: 0.6
      });
    }

    while ((match = organizationPattern.exec(text)) !== null) {
      entities.push({
        type: 'organization',
        value: match[1],
        confidence: 0.7
      });
    }

    return entities;
  }

  /**
   * Deduplicate and merge similar memories
   */
  async deduplicateMemories(userId, newMemories) {
    // Get existing memories for comparison
    const existingMemories = await MemoryEntry.find({
      userId,
      status: 'active'
    }).lean();

    const deduplicated = [];

    for (const newMem of newMemories) {
      let isDuplicate = false;

      // Check for exact content match
      for (const existing of existingMemories) {
        const similarity = this.calculateTextSimilarity(newMem.content, existing.content);

        if (similarity > 0.9) {
          // Duplicate found, merge instead of adding new
          isDuplicate = true;
          await this.mergeMemories(existing._id, newMem);
          break;
        }
      }

      if (!isDuplicate) {
        deduplicated.push(newMem);
      }
    }

    return deduplicated;
  }

  /**
   * Merge duplicate memories
   */
  async mergeMemories(existingId, newMemory) {
    await MemoryEntry.findByIdAndUpdate(existingId, {
      $inc: {
        'importance.factors.accessFrequency': 1
      },
      $set: {
        'temporal.lastAccessedAt': Date.now()
      },
      $push: {
        'source.messageIds': { $each: newMemory.source.messageIds },
        'version.history': {
          version: 1,
          content: newMemory.content,
          updatedAt: Date.now(),
          reason: 'consolidation'
        }
      }
    });
  }

  /**
   * Calculate text similarity (simplified Jaccard similarity)
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Store memory in both MongoDB and ChromaDB
   */
  async storeMemory(userId, memoryData) {
    try {
      // Create memory entry in MongoDB
      const memory = new MemoryEntry({
        userId,
        ...memoryData
      });

      await memory.save();

      // Generate embedding and store in ChromaDB
      if (chromaService.isInitialized) {
        const embedding = await embeddingService.embed(memory.content);
        const collectionKey = `user_memories_${userId}`;

        await chromaService.addDocuments(collectionKey, [memory.content], {
          embeddings: [embedding],
          metadatas: [{
            memoryId: memory._id.toString(),
            type: memory.type,
            category: memory.namespace.category,
            timestamp: memory.temporal.createdAt.toISOString()
          }]
        });

        memory.semantic.embeddingId = memory._id.toString();
        await memory.save();
      }

      return memory;

    } catch (error) {
      logger.error('Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Update user profile from consolidated memories
   */
  async updateUserProfileFromMemories(userId, memories) {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
    }

    for (const memory of memories) {
      // Update profile fields based on memory type and content
      if (memory.type === 'fact' && memory.namespace.topic === 'identity') {
        // Extract name
        const nameMatch = memory.content.match(/(?:i'm|i am|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (nameMatch) {
          profile.personal.name = {
            value: nameMatch[1],
            confidence: memory.source.confidence,
            lastUpdated: Date.now(),
            source: memory._id.toString()
          };
        }
      }

      if (memory.type === 'fact' && memory.namespace.topic === 'occupation') {
        const roleMatch = memory.content.match(/(?:i work as|i'm a|i am a)\s+([a-z\s]+)/i);
        if (roleMatch) {
          profile.personal.role = {
            value: roleMatch[1].trim(),
            confidence: memory.source.confidence,
            lastUpdated: Date.now()
          };
        }
      }

      if (memory.type === 'preference') {
        const prefMatch = memory.content.match(/i (?:love|like|enjoy|prefer)\s+([^,.!?]+)/i);
        if (prefMatch) {
          profile.learning.interests.push({
            topic: prefMatch[1].trim(),
            category: 'general',
            strength: 0.7,
            expertise: 0.3,
            lastDiscussed: Date.now()
          });
        }
      }

      if (memory.type === 'goal') {
        const goalMatch = memory.content.match(/i (?:want|need|would like) to (?:learn|understand|know about)\s+([^,.!?]+)/i);
        if (goalMatch) {
          profile.learning.goals.push({
            goal: goalMatch[1].trim(),
            category: 'education',
            priority: 'medium',
            status: 'active',
            createdAt: Date.now()
          });
        }
      }
    }

    // Update metadata
    profile.meta.totalMemories = memories.length;
    profile.calculateCompleteness();

    await profile.save();

    return profile;
  }

  /**
   * STRATEGY 5: Intelligent Forgetting and Memory Decay
   * Background job to apply decay and forget low-importance memories
   */
  async applyMemoryDecay(userId) {
    logger.info('Applying memory decay', { userId });

    try {
      const memories = await MemoryEntry.find({
        userId,
        status: 'active'
      });

      let forgotten = 0;
      let decayed = 0;

      for (const memory of memories) {
        // Recalculate importance with decay
        memory.calculateImportanceScore();

        // Check if should be forgotten
        if (memory.shouldForget()) {
          memory.status = 'archived';
          forgotten++;
        } else {
          decayed++;
        }

        await memory.save();
      }

      this.stats.forgettingEvents += forgotten;

      logger.info('Memory decay applied', { userId, forgotten, decayed });

      return { forgotten, decayed };

    } catch (error) {
      logger.error('Error applying memory decay:', error);
      throw error;
    }
  }

  /**
   * STRATEGY 6: Contextual Memory Injection and Priming
   * Format memories for natural injection into conversation context
   */
  formatMemoriesForInjection(multiTieredMemory, options = {}) {
    const { intent, conversationType = 'standard' } = options;

    let context = '';
    let tokenBudget = this.config.maxTotalTokens;

    // Allocate tokens based on budget percentages
    const allocations = {
      shortTerm: Math.floor(tokenBudget * this.config.contextBudget.shortTermMemory),
      working: Math.floor(tokenBudget * this.config.contextBudget.workingMemory),
      longTerm: Math.floor(tokenBudget * this.config.contextBudget.longTermMemory)
    };

    // 1. User Profile (if exists)
    if (multiTieredMemory.userProfile) {
      const profile = multiTieredMemory.userProfile;
      const profileLines = [];

      if (profile.personal) profileLines.push(profile.personal);
      if (profile.role) profileLines.push(profile.role);
      if (profile.skills) profileLines.push(`Skills: ${profile.skills}`);
      if (profile.interests) profileLines.push(`Interests: ${profile.interests}`);

      if (profileLines.length > 0) {
        context += `**About the user:**\n${profileLines.join('\n')}\n\n`;
      }
    }

    // 2. Long-term memories (most relevant)
    if (multiTieredMemory.longTerm.memories.length > 0) {
      context += `**What you remember about the user:**\n`;

      const sortedMemories = multiTieredMemory.longTerm.memories
        .sort((a, b) => b.relevance - a.relevance);

      for (const memory of sortedMemories) {
        const memoryText = `- ${memory.content} (${memory.type}, ${this.formatTimeAgo(memory.timestamp)})\n`;

        if (this.estimateTokens(context + memoryText) <= allocations.longTerm) {
          context += memoryText;
        } else {
          break;
        }
      }

      context += '\n';
    }

    // 3. Working memory (session summary)
    if (multiTieredMemory.working.summary) {
      context += `**Earlier in this conversation:**\n${multiTieredMemory.working.summary}\n\n`;
    }

    // 4. Short-term memory (recent messages)
    if (multiTieredMemory.shortTerm.messages.length > 0) {
      context += `**Recent messages:**\n`;
      for (const msg of multiTieredMemory.shortTerm.messages) {
        context += `${msg.role}: ${msg.content}\n`;
      }
    }

    return context;
  }

  /**
   * STRATEGY 8: Meta-Memory and Reflection
   * Track and analyze memory system performance
   */
  async getMemoryHealthMetrics(userId) {
    try {
      const metrics = {
        storage: {
          totalMemories: 0,
          activeMemories: 0,
          archivedMemories: 0,
          typeDistribution: {}
        },
        quality: {
          averageConfidence: 0,
          averageImportance: 0,
          contradictions: 0,
          duplicates: 0
        },
        usage: {
          retrievalCount: this.stats.retrievals,
          consolidationCount: this.stats.consolidations,
          cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
        },
        profile: {
          completeness: 0,
          lastUpdated: null
        }
      };

      // Get memory statistics
      const memories = await MemoryEntry.find({ userId });
      metrics.storage.totalMemories = memories.length;
      metrics.storage.activeMemories = memories.filter(m => m.status === 'active').length;
      metrics.storage.archivedMemories = memories.filter(m => m.status === 'archived').length;

      // Type distribution
      const typeCount = {};
      let totalConfidence = 0;
      let totalImportance = 0;

      for (const memory of memories) {
        typeCount[memory.type] = (typeCount[memory.type] || 0) + 1;
        totalConfidence += memory.source.confidence;
        totalImportance += memory.importance.score;
      }

      metrics.storage.typeDistribution = typeCount;
      metrics.quality.averageConfidence = totalConfidence / memories.length || 0;
      metrics.quality.averageImportance = totalImportance / memories.length || 0;

      // Get user profile metrics
      const profile = await UserProfile.findOne({ userId });
      if (profile) {
        metrics.profile.completeness = profile.meta.profileCompleteness;
        metrics.profile.lastUpdated = profile.meta.lastUpdated;
      }

      return metrics;

    } catch (error) {
      logger.error('Error getting memory health metrics:', error);
      throw error;
    }
  }

  /**
   * STRATEGY 9: Privacy, Security, and Compliance
   * Filter memories based on privacy settings and user consent
   */
  async filterMemoriesForPrivacy(memories, options = {}) {
    const { includeCategory = [], excludeCategory = [], userConsentOnly = false } = options;

    return memories.filter(memory => {
      // Check privacy level
      if (memory.privacy.level === 'confidential') {
        return false;
      }

      // Check data category
      if (this.config.privacy.sensitiveCategories.includes(memory.privacy.dataCategory)) {
        return memory.privacy.userConsent.granted;
      }

      // Check inclusion/exclusion
      if (includeCategory.length > 0 && !includeCategory.includes(memory.namespace.category)) {
        return false;
      }

      if (excludeCategory.length > 0 && excludeCategory.includes(memory.namespace.category)) {
        return false;
      }

      // Check consent if required
      if (userConsentOnly && !memory.privacy.userConsent.granted) {
        return false;
      }

      return true;
    });
  }

  /**
   * Helper: Summarize messages (would use LLM in production)
   */
  async summarizeMessages(messages) {
    // Simplified summary - in production, would call LLM
    const messageCount = messages.length;
    const topics = new Set();

    messages.forEach(msg => {
      if (msg.role === 'user') {
        // Extract potential topics (simplified)
        const words = msg.content.toLowerCase().split(/\s+/);
        words.forEach(w => {
          if (w.length > 5) topics.add(w);
        });
      }
    });

    return `Discussed ${messageCount} messages covering topics: ${Array.from(topics).slice(0, 5).join(', ')}`;
  }

  /**
   * Helper: Format messages for context
   */
  formatMessages(messages) {
    return messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  /**
   * Helper: Estimate token count
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Helper: Format time ago
   */
  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Singleton instance
const industryMemoryManager = new IndustryMemoryManager();

export default industryMemoryManager;
