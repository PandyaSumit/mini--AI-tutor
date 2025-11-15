/**
 * Cache Invalidation Helpers
 * Centralized invalidation logic for different data types
 */

import cacheManager from './CacheManager.js';
import cacheTagManager from './CacheTagManager.js';
import cacheConfig from '../config/cache.js';

/**
 * Invalidate conversation-related caches
 */
async function invalidateConversationCache(conversationId, userId) {
  const keys = [
    // Conversation messages
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.CONVERSATION}:msgs`,
      conversationId
    ),
    // User's conversation list
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:convs`,
      userId,
      'list'
    ),
    // User stats (message count)
    cacheManager.generateKey(
      cacheConfig.PREFIXES.USER,
      userId,
      'stats'
    ),
  ];

  await cacheManager.delMany(keys);
  console.log(`🗑️  Invalidated conversation cache: ${conversationId}`);
}

/**
 * Invalidate roadmap-related caches
 */
async function invalidateRoadmapCache(roadmapId, userId) {
  const keys = [
    // Roadmap detail
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.ROADMAP}:detail`,
      roadmapId
    ),
    // Roadmap stats
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.ROADMAP}:stats`,
      roadmapId
    ),
    // User's roadmap list
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:roadmaps`,
      userId,
      'list'
    ),
    // User stats
    cacheManager.generateKey(
      cacheConfig.PREFIXES.USER,
      userId,
      'stats'
    ),
  ];

  await cacheManager.delMany(keys);
  console.log(`🗑️  Invalidated roadmap cache: ${roadmapId}`);
}

/**
 * Invalidate flashcard-related caches
 */
async function invalidateFlashcardCache(deckId, userId) {
  const keys = [
    // Flashcard deck
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.FLASHCARD}:deck`,
      deckId
    ),
    // User's flashcard list
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:flashcards`,
      userId,
      'list'
    ),
  ];

  await cacheManager.delMany(keys);
  console.log(`🗑️  Invalidated flashcard cache: ${deckId}`);
}

/**
 * Invalidate quiz-related caches
 */
async function invalidateQuizCache(quizId, userId) {
  const keys = [
    // Quiz content
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.QUIZ}:content`,
      quizId
    ),
    // User's quiz attempts
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:quiz:attempts`,
      userId,
      quizId
    ),
    // User stats
    cacheManager.generateKey(
      cacheConfig.PREFIXES.USER,
      userId,
      'stats'
    ),
  ];

  await cacheManager.delMany(keys);
  console.log(`🗑️  Invalidated quiz cache: ${quizId}`);
}

/**
 * Invalidate user profile cache
 */
async function invalidateUserCache(userId) {
  const keys = [
    // User profile
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:profile:public`,
      userId
    ),
    // User stats
    cacheManager.generateKey(
      cacheConfig.PREFIXES.USER,
      userId,
      'stats'
    ),
    // User preferences
    cacheManager.generateKey(
      `${cacheConfig.PREFIXES.USER}:prefs`,
      userId
    ),
  ];

  await cacheManager.delMany(keys);
  console.log(`🗑️  Invalidated user cache: ${userId}`);
}

/**
 * Invalidate all caches for a user (use with caution)
 */
async function invalidateAllUserCaches(userId) {
  await cacheTagManager.invalidateTag(`user:${userId}`);
  console.log(`🗑️  Invalidated all caches for user: ${userId}`);
}

/**
 * Blacklist a JWT token (logout)
 */
async function blacklistToken(tokenId, expirySeconds = cacheConfig.TTL.TOKEN_BLACKLIST) {
  const key = `${cacheConfig.PREFIXES.BLACKLIST}:token:${tokenId}`;
  await cacheManager.set(key, { blacklisted: true }, expirySeconds);
  console.log(`🚫 Blacklisted token: ${tokenId}`);
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(tokenId) {
  const key = `${cacheConfig.PREFIXES.BLACKLIST}:token:${tokenId}`;
  const blacklisted = await cacheManager.get(key);
  return blacklisted !== null;
}

export {
  invalidateConversationCache,
  invalidateRoadmapCache,
  invalidateFlashcardCache,
  invalidateQuizCache,
  invalidateUserCache,
  invalidateAllUserCaches,
  blacklistToken,
  isTokenBlacklisted,
};
