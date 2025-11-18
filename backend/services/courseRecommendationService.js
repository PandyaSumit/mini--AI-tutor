import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import courseSyncService from '../ai/vectorstore/courseSyncService.js';
import logger from '../utils/logger.js';

/**
 * Intelligent Course Recommendation Service
 * Analyzes user queries and recommends relevant courses/lessons from the platform
 */
class CourseRecommendationService {
  /**
   * Extract learning intent from user query
   * Returns: { topic: string, skillLevel: string, type: 'course' | 'lesson' | 'concept' }
   */
  extractLearningIntent(query) {
    const normalizedQuery = query.toLowerCase();

    // Detect learning keywords
    const learningKeywords = [
      'learn', 'study', 'understand', 'know about', 'teach me',
      'explain', 'help me with', 'course on', 'tutorial on'
    ];

    const isLearningQuery = learningKeywords.some(keyword =>
      normalizedQuery.includes(keyword)
    );

    if (!isLearningQuery) {
      return null; // Not a learning-related query
    }

    // Extract topic (what they want to learn)
    let topic = query;
    learningKeywords.forEach(keyword => {
      topic = topic.replace(new RegExp(keyword, 'gi'), '').trim();
    });

    // Remove common words
    const stopWords = ['i want to', 'i need to', 'how to', 'what is', 'about', 'the'];
    stopWords.forEach(word => {
      topic = topic.replace(new RegExp(word, 'gi'), '').trim();
    });

    // Detect skill level indicators
    let skillLevel = 'all';
    if (normalizedQuery.match(/beginner|basic|start|new to|never|first time/)) {
      skillLevel = 'beginner';
    } else if (normalizedQuery.match(/advanced|expert|deep|master|complex/)) {
      skillLevel = 'advanced';
    } else if (normalizedQuery.match(/intermediate|some experience|already know/)) {
      skillLevel = 'intermediate';
    }

    // Detect if looking for specific lesson vs full course
    const isLessonQuery = normalizedQuery.match(/lesson|chapter|topic|section|specific/);
    const type = isLessonQuery ? 'lesson' : 'course';

    return {
      topic: topic.trim(),
      skillLevel,
      type,
      originalQuery: query
    };
  }

  /**
   * Format course recommendations as a text response
   */
  formatCourseResponse(recommendations) {
    let response = recommendations.message + '\n\n';

    // Add courses
    if (recommendations.courses.length > 0) {
      recommendations.courses.forEach((course, index) => {
        response += `**${index + 1}. ${course.title}** (${course.level})\n`;
        response += `   ${course.description.substring(0, 150)}${course.description.length > 150 ? '...' : ''}\n`;
        response += `   📚 ${course.lessonsCount} lessons • ⏱️ ${course.duration} hours • 👥 ${course.enrollmentCount} students\n`;
        response += `   [View Course](/courses/${course.id})\n\n`;
      });
    }

    // Add lessons
    if (recommendations.lessons.length > 0) {
      response += '\n**Specific Lessons:**\n\n';
      recommendations.lessons.forEach((lesson, index) => {
        response += `**${index + 1}. ${lesson.title}**\n`;
        response += `   From: ${lesson.courseTitle}\n`;
        response += `   Duration: ${lesson.duration} minutes\n`;
        response += `   [Start Lesson](/courses/${lesson.courseId}?lesson=${lesson.id})\n\n`;
      });
    }

    return response;
  }

  /**
   * Get user's existing skills from their enrollments and progress
   */
  async getUserSkills(userId) {
    try {
      const enrollments = await Enrollment.find({ user: userId })
        .populate('course', 'title category tags')
        .select('progress');

      const skills = {
        completedCourses: [],
        inProgressCourses: [],
        knownTopics: new Set(),
        skillLevel: 'beginner'
      };

      enrollments.forEach(enrollment => {
        if (enrollment.progress.completionPercentage === 100) {
          skills.completedCourses.push(enrollment.course.title);
          enrollment.course.tags?.forEach(tag => skills.knownTopics.add(tag));
        } else if (enrollment.progress.completionPercentage > 0) {
          skills.inProgressCourses.push(enrollment.course.title);
        }
      });

      // Determine overall skill level based on completed courses
      if (skills.completedCourses.length > 5) {
        skills.skillLevel = 'advanced';
      } else if (skills.completedCourses.length > 2) {
        skills.skillLevel = 'intermediate';
      }

      skills.knownTopics = Array.from(skills.knownTopics);
      return skills;
    } catch (error) {
      console.error('Error getting user skills:', error);
      return { completedCourses: [], inProgressCourses: [], knownTopics: [], skillLevel: 'beginner' };
    }
  }

  /**
   * Search for relevant courses based on query and user profile
   * Uses semantic search via ChromaDB for better relevance
   */
  async searchCourses(intent, userSkills) {
    const { topic, skillLevel, type } = intent;

    try {
      // Try semantic search first if courseSyncService is initialized
      if (courseSyncService.isInitialized) {
        logger.info(`🔍 Using semantic search for: "${topic}"`);

        const semanticResults = await courseSyncService.searchCourses(topic, {
          topK: 10,
          level: skillLevel !== 'all' ? skillLevel : null,
        });

        // Fetch full course details from MongoDB
        const courseIds = semanticResults.results.map(r => r.courseId);
        const courses = await Course.find({ _id: { $in: courseIds } })
          .populate('createdBy', 'name')
          .lean();

        // Maintain semantic search ranking order
        const orderedCourses = courseIds
          .map(id => courses.find(c => c._id.toString() === id))
          .filter(Boolean)
          .slice(0, 5);

        logger.info(`   ✅ Semantic search found ${orderedCourses.length} courses`);
        return orderedCourses;
      }
    } catch (error) {
      logger.warn(`⚠️  Semantic search failed, falling back to regex: ${error.message}`);
    }

    // Fallback to regex-based search if ChromaDB not available
    logger.info(`🔍 Using regex-based search for: "${topic}"`);

    const searchQuery = {
      isPublished: true,
      $or: [
        { title: { $regex: topic, $options: 'i' } },
        { description: { $regex: topic, $options: 'i' } },
        { tags: { $in: [new RegExp(topic, 'i')] } },
        { category: { $regex: topic, $options: 'i' } }
      ]
    };

    // Filter by skill level if specified
    if (skillLevel !== 'all') {
      searchQuery.level = skillLevel;
    }

    const courses = await Course.find(searchQuery)
      .populate('createdBy', 'name')
      .sort({ 'statistics.enrollmentCount': -1 })
      .limit(5);

    return courses;
  }

  /**
   * Search for specific lessons matching the query
   */
  async searchLessons(intent, userSkills) {
    const { topic } = intent;

    const lessons = await Lesson.find({
      $or: [
        { title: { $regex: topic, $options: 'i' } },
        { description: { $regex: topic, $options: 'i' } },
        { objectives: { $in: [new RegExp(topic, 'i')] } }
      ]
    })
      .populate({
        path: 'module',
        populate: {
          path: 'course',
          match: { isPublished: true }
        }
      })
      .limit(10);

    // Filter out lessons where course is null (unpublished)
    return lessons.filter(lesson => lesson.module?.course);
  }

  /**
   * Generate intelligent recommendation response
   */
  async getRecommendations(query, userId) {
    try {
      // Extract learning intent
      const intent = this.extractLearningIntent(query);

      if (!intent) {
        return {
          type: 'no_learning_intent',
          message: null
        };
      }

      // Get user's existing skills
      const userSkills = await this.getUserSkills(userId);

      // Search for relevant content
      let courses = [];
      let lessons = [];

      if (intent.type === 'lesson') {
        lessons = await this.searchLessons(intent, userSkills);
      }

      courses = await this.searchCourses(intent, userSkills);

      // No results found
      if (courses.length === 0 && lessons.length === 0) {
        return {
          type: 'no_results',
          intent,
          message: `I couldn't find any courses or lessons specifically about "${intent.topic}" on our platform yet. Would you like me to suggest related topics or help you request this course?`
        };
      }

      // Build personalized response
      return {
        type: 'recommendations',
        intent,
        userSkills,
        courses: courses.map(course => ({
          id: course._id,
          title: course.title,
          description: course.description,
          level: course.level,
          category: course.category,
          instructor: course.createdBy?.name,
          duration: Math.ceil(course.statistics.totalDuration / 60),
          enrollmentCount: course.statistics.enrollmentCount,
          lessonsCount: course.statistics.totalLessons,
          url: `/courses/${course._id}`
        })),
        lessons: lessons.map(lesson => ({
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          courseTitle: lesson.module?.course?.title,
          courseId: lesson.module?.course?._id,
          url: `/courses/${lesson.module?.course?._id}?lesson=${lesson._id}`
        })),
        message: this.generatePersonalizedMessage(intent, userSkills, courses, lessons)
      };

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return {
        type: 'error',
        message: 'I encountered an error while searching for courses. Please try again.'
      };
    }
  }

  /**
   * Generate personalized message based on user's skills and query
   */
  generatePersonalizedMessage(intent, userSkills, courses, lessons) {
    const { topic, skillLevel } = intent;
    let message = '';

    // Acknowledge user's existing knowledge
    if (userSkills.knownTopics.length > 0) {
      const relatedKnowledge = userSkills.knownTopics.filter(known =>
        topic.toLowerCase().includes(known.toLowerCase()) ||
        known.toLowerCase().includes(topic.toLowerCase())
      );

      if (relatedKnowledge.length > 0) {
        message += `Great! I see you already have experience with ${relatedKnowledge.join(', ')}. `;
      }
    }

    // Main recommendation
    if (lessons.length > 0) {
      message += `I found ${lessons.length} specific lesson${lessons.length > 1 ? 's' : ''} about **${topic}** that might help you:\n\n`;
    } else if (courses.length > 0) {
      message += `I found ${courses.length} course${courses.length > 1 ? 's' : ''} about **${topic}** on our platform:\n\n`;
    }

    // Skill level guidance
    if (skillLevel !== 'all') {
      message += `These are filtered for **${skillLevel}** level. `;
    }

    return message.trim();
  }
}

export default new CourseRecommendationService();
