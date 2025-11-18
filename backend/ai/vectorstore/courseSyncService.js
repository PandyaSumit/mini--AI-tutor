/**
 * Course Sync Service for ChromaDB
 * Synchronizes course catalog with ChromaDB for semantic search
 *
 * Features:
 * - Initial bulk sync of existing courses
 * - Incremental sync on course creation/update
 * - Semantic search for course discovery
 * - Automatic embedding generation
 */

import chromaService from './chromaService.js';
import embeddingService from '../embeddings/embeddingService.js';
import Course from '../../models/Course.js';
import logger from '../../utils/logger.js';

class CourseSyncService {
  constructor() {
    this.isInitialized = false;
    this.syncInProgress = false;

    this.stats = {
      lastSyncTime: null,
      coursesSynced: 0,
      coursesUpdated: 0,
      coursesDeleted: 0,
      searchesPerformed: 0,
    };
  }

  /**
   * Initialize the course sync service
   */
  async initialize() {
    logger.info('🚀 Initializing Course Sync Service...');

    try {
      // Check if ChromaDB is available
      if (!chromaService.isInitialized) {
        logger.warn('   ChromaDB not initialized - course semantic search disabled');
        return { success: false, error: 'ChromaDB not available' };
      }

      this.isInitialized = true;
      logger.info('✅ Course Sync Service initialized');

      return { success: true };
    } catch (error) {
      logger.error('❌ Course Sync Service initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all published courses to ChromaDB
   * This should be called during application startup or manually triggered
   */
  async syncAllCourses(options = {}) {
    if (!this.isInitialized) {
      throw new Error('Course Sync Service not initialized');
    }

    if (this.syncInProgress) {
      logger.warn('Sync already in progress, skipping...');
      return { success: false, error: 'Sync in progress' };
    }

    this.syncInProgress = true;

    try {
      const {
        force = false,        // Force re-sync even if course already in ChromaDB
        batchSize = 50,       // Process courses in batches
      } = options;

      logger.info('📦 Starting course catalog sync...');

      // Get all published courses from MongoDB
      const courses = await Course.find({
        isPublished: true,
        isDraft: false,
      })
        .select('_id title description category level tags statistics metadata')
        .lean();

      logger.info(`   Found ${courses.length} published courses to sync`);

      if (courses.length === 0) {
        this.syncInProgress = false;
        return {
          success: true,
          synced: 0,
          message: 'No courses to sync',
        };
      }

      // Process courses in batches
      let synced = 0;
      for (let i = 0; i < courses.length; i += batchSize) {
        const batch = courses.slice(i, i + batchSize);

        // Prepare documents for ChromaDB
        const documents = batch.map(course => ({
          id: course._id.toString(),
          text: this.createCourseText(course),
          metadata: {
            courseId: course._id.toString(),
            title: course.title,
            category: course.category,
            level: course.level,
            tags: course.tags.join(','),
            enrollmentCount: course.statistics?.enrollmentCount || 0,
            completionRate: course.statistics?.completionRate || 0,
            rating: course.statistics?.averageRating || 0,
            language: course.metadata?.language || 'en-US',
          },
        }));

        // Add to ChromaDB
        await chromaService.addDocuments('courses', documents);

        synced += documents.length;
        logger.info(`   Synced ${synced}/${courses.length} courses...`);
      }

      this.stats.lastSyncTime = new Date();
      this.stats.coursesSynced = synced;
      this.syncInProgress = false;

      logger.info(`✅ Course sync completed: ${synced} courses synced`);

      return {
        success: true,
        synced,
        timestamp: this.stats.lastSyncTime,
      };
    } catch (error) {
      this.syncInProgress = false;
      logger.error('❌ Course sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Create searchable text from course data
   * Combines title, description, tags, and outcomes for better search
   */
  createCourseText(course) {
    const parts = [
      course.title,
      course.description,
      course.tags?.join(' ') || '',
      course.metadata?.learningOutcomes?.join(' ') || '',
      `Level: ${course.level}`,
      `Category: ${course.category}`,
    ];

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Add or update a single course in ChromaDB
   * Called when a course is created or updated
   */
  async syncCourse(courseId) {
    if (!this.isInitialized) {
      logger.warn('Course Sync Service not initialized, skipping course sync');
      return { success: false };
    }

    try {
      const course = await Course.findById(courseId)
        .select('_id title description category level tags statistics metadata isPublished isDraft')
        .lean();

      if (!course) {
        throw new Error(`Course ${courseId} not found`);
      }

      // Only sync published courses
      if (!course.isPublished || course.isDraft) {
        logger.info(`Skipping sync for unpublished course: ${courseId}`);
        return { success: true, skipped: true };
      }

      const document = {
        id: course._id.toString(),
        text: this.createCourseText(course),
        metadata: {
          courseId: course._id.toString(),
          title: course.title,
          category: course.category,
          level: course.level,
          tags: course.tags.join(','),
          enrollmentCount: course.statistics?.enrollmentCount || 0,
          completionRate: course.statistics?.completionRate || 0,
          rating: course.statistics?.averageRating || 0,
          language: course.metadata?.language || 'en-US',
        },
      };

      // Check if course already exists in ChromaDB
      try {
        // Try to update first
        await chromaService.updateDocuments('courses', [document]);
        this.stats.coursesUpdated++;
        logger.info(`✅ Updated course in ChromaDB: ${course.title}`);
      } catch (updateError) {
        // If update fails, add as new
        await chromaService.addDocuments('courses', [document]);
        this.stats.coursesSynced++;
        logger.info(`✅ Added course to ChromaDB: ${course.title}`);
      }

      return {
        success: true,
        courseId: course._id.toString(),
        title: course.title,
      };
    } catch (error) {
      logger.error(`❌ Failed to sync course ${courseId}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove a course from ChromaDB
   * Called when a course is deleted or unpublished
   */
  async removeCourse(courseId) {
    if (!this.isInitialized) {
      return { success: false };
    }

    try {
      await chromaService.deleteDocuments('courses', [courseId.toString()]);
      this.stats.coursesDeleted++;

      logger.info(`✅ Removed course from ChromaDB: ${courseId}`);

      return {
        success: true,
        courseId: courseId.toString(),
      };
    } catch (error) {
      logger.error(`❌ Failed to remove course ${courseId}:`, error.message);
      throw error;
    }
  }

  /**
   * Semantic search for courses
   * Uses ChromaDB for similarity-based course discovery
   */
  async searchCourses(query, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Course Sync Service not initialized');
    }

    try {
      const {
        topK = 10,
        level = null,
        category = null,
        minRating = null,
        minEnrollment = null,
      } = options;

      // Build metadata filter
      const where = {};
      if (level) where.level = level;
      if (category) where.category = category;
      if (minRating) where.rating = { '$gte': minRating };
      if (minEnrollment) where.enrollmentCount = { '$gte': minEnrollment };

      // Search in ChromaDB
      const results = await chromaService.search('courses', query, {
        topK,
        where: Object.keys(where).length > 0 ? where : null,
      });

      this.stats.searchesPerformed++;

      // Format results for API response
      const formattedResults = results.results.map(result => ({
        courseId: result.metadata.courseId,
        title: result.metadata.title,
        category: result.metadata.category,
        level: result.metadata.level,
        tags: result.metadata.tags.split(',').filter(Boolean),
        enrollmentCount: result.metadata.enrollmentCount,
        completionRate: result.metadata.completionRate,
        rating: result.metadata.rating,
        similarityScore: Math.round(result.score * 100),
        matchReason: this.generateMatchReason(result.score, query),
      }));

      logger.info(`🔍 Course search: "${query}" - ${formattedResults.length} results`);

      return {
        success: true,
        query,
        results: formattedResults,
        count: formattedResults.length,
        queryCached: results.queryCached,
      };
    } catch (error) {
      logger.error('❌ Course search failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate human-readable match reason
   */
  generateMatchReason(score, query) {
    if (score >= 0.9) {
      return `Excellent match for "${query}"`;
    } else if (score >= 0.8) {
      return `Highly relevant to "${query}"`;
    } else if (score >= 0.7) {
      return `Good match for "${query}"`;
    } else if (score >= 0.6) {
      return `Moderately relevant to "${query}"`;
    } else {
      return `Some relevance to "${query}"`;
    }
  }

  /**
   * Find similar courses to a given course
   */
  async findSimilarCourses(courseId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Course Sync Service not initialized');
    }

    try {
      const { topK = 5 } = options;

      // Get the course
      const course = await Course.findById(courseId)
        .select('title description tags level category')
        .lean();

      if (!course) {
        throw new Error(`Course ${courseId} not found`);
      }

      // Create search query from course data
      const query = this.createCourseText(course);

      // Search excluding the current course
      const results = await chromaService.search('courses', query, {
        topK: topK + 1, // Get one extra to exclude current course
      });

      // Filter out the current course
      const similarCourses = results.results
        .filter(result => result.metadata.courseId !== courseId.toString())
        .slice(0, topK)
        .map(result => ({
          courseId: result.metadata.courseId,
          title: result.metadata.title,
          category: result.metadata.category,
          level: result.metadata.level,
          tags: result.metadata.tags.split(',').filter(Boolean),
          similarityScore: Math.round(result.score * 100),
          matchReason: result.score >= 0.85 ? 'Very similar content' : 'Related topics',
        }));

      logger.info(`🔍 Similar courses for ${course.title}: ${similarCourses.length} results`);

      return {
        success: true,
        courseId: courseId.toString(),
        similarCourses,
        count: similarCourses.length,
      };
    } catch (error) {
      logger.error(`❌ Find similar courses failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get recommended courses based on user's learning history
   */
  async getRecommendations(userId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Course Sync Service not initialized');
    }

    try {
      const { topK = 10 } = options;

      // This would integrate with user learning history
      // For now, return popular courses
      const results = await chromaService.search('courses', 'popular courses', {
        topK,
        where: {
          enrollmentCount: { '$gte': 10 },
        },
      });

      const recommendations = results.results.map(result => ({
        courseId: result.metadata.courseId,
        title: result.metadata.title,
        category: result.metadata.category,
        level: result.metadata.level,
        rating: result.metadata.rating,
        enrollmentCount: result.metadata.enrollmentCount,
        recommendationScore: Math.round(result.score * 100),
      }));

      return {
        success: true,
        userId,
        recommendations,
        count: recommendations.length,
      };
    } catch (error) {
      logger.error(`❌ Get recommendations failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      syncInProgress: this.syncInProgress,
      stats: this.stats,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          message: 'Course Sync Service not initialized',
        };
      }

      // Check ChromaDB collection
      const count = await chromaService.getCount('courses');

      return {
        status: 'healthy',
        coursesInChroma: count,
        lastSync: this.stats.lastSyncTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

// Singleton instance
const courseSyncService = new CourseSyncService();

export default courseSyncService;
