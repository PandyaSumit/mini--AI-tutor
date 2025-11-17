/**
 * MCP Platform Server
 * Exposes standardized tools for platform operations
 */

import { MCPServer } from '../core/mcpServer.js';
import User from '../../../models/User.js';
import Course from '../../../models/Course.js';
import Enrollment from '../../../models/Enrollment.js';
import {
  getUserProfileSchema,
  updateUserProfileSchema,
  getCourseSchema,
  listCoursesSchema,
  enrollInCourseSchema,
  updateCourseProgressSchema,
  getLearningAnalyticsSchema,
  getCourseAnalyticsSchema,
} from '../schemas/toolSchemas.js';
import logger from '../../../utils/logger.js';

class PlatformServer extends MCPServer {
  constructor() {
    super('platform', 'Platform operations and user management');
    this.registerTools();
  }

  registerTools() {
    // User tools
    this.registerTool({
      name: 'get_user_profile',
      description: 'Retrieve user profile and learning statistics',
      inputSchema: getUserProfileSchema,
      auth: ['self', 'admin'],
      handler: this.getUserProfile.bind(this),
    });

    this.registerTool({
      name: 'update_user_profile',
      description: 'Update user profile information',
      inputSchema: updateUserProfileSchema,
      auth: ['self', 'admin'],
      handler: this.updateUserProfile.bind(this),
    });

    // Course tools
    this.registerTool({
      name: 'get_course',
      description: 'Get detailed information about a course',
      inputSchema: getCourseSchema,
      auth: ['any'],
      handler: this.getCourse.bind(this),
    });

    this.registerTool({
      name: 'list_courses',
      description: 'Browse available courses with filters',
      inputSchema: listCoursesSchema,
      auth: ['any'],
      handler: this.listCourses.bind(this),
    });

    this.registerTool({
      name: 'enroll_in_course',
      description: 'Enroll user in a course',
      inputSchema: enrollInCourseSchema,
      auth: ['self', 'admin'],
      handler: this.enrollInCourse.bind(this),
    });

    this.registerTool({
      name: 'update_course_progress',
      description: 'Update user progress in a course',
      inputSchema: updateCourseProgressSchema,
      auth: ['self', 'admin'],
      handler: this.updateCourseProgress.bind(this),
    });

    // Analytics tools
    this.registerTool({
      name: 'get_learning_analytics',
      description: 'Retrieve learning analytics and insights',
      inputSchema: getLearningAnalyticsSchema,
      auth: ['self', 'admin'],
      handler: this.getLearningAnalytics.bind(this),
    });

    this.registerTool({
      name: 'get_course_analytics',
      description: 'Get course-level analytics',
      inputSchema: getCourseAnalyticsSchema,
      auth: ['creator', 'admin'],
      handler: this.getCourseAnalytics.bind(this),
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(input, context) {
    try {
      const { userId } = input;

      // Check authorization
      if (!this.checkAuth(context.user, userId, ['self', 'admin'])) {
        throw new Error('Unauthorized: Can only access own profile');
      }

      const user = await User.findById(userId).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      // Get enrollment count
      const enrollmentCount = await Enrollment.countDocuments({ user: userId });

      // Get completed courses
      const completedCourses = await Enrollment.countDocuments({
        user: userId,
        'progress.overallProgress': 100,
      });

      return {
        success: true,
        data: {
          profile: {
            id: user._id,
            name: user.name,
            email: user.email,
            learningGoals: user.learningGoals,
            createdAt: user.createdAt,
          },
          statistics: {
            enrollments: enrollmentCount,
            completedCourses,
            studyStreak: user.statistics?.studyStreak || 0,
            totalStudyTime: user.statistics?.totalStudyTime || 0,
            averageScore: user.statistics?.averageQuizScore || 0,
          },
        },
      };
    } catch (error) {
      logger.error('Get user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(input, context) {
    try {
      const { userId, updates } = input;

      // Check authorization
      if (!this.checkAuth(context.user, userId, ['self', 'admin'])) {
        throw new Error('Unauthorized: Can only update own profile');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, select: '-password' }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: {
          profile: {
            id: user._id,
            name: user.name,
            email: user.email,
            learningGoals: user.learningGoals,
          },
        },
      };
    } catch (error) {
      logger.error('Update user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get course details
   */
  async getCourse(input, context) {
    try {
      const { courseId } = input;

      const course = await Course.findById(courseId)
        .populate('modules')
        .populate('contributors.user', 'name email');

      if (!course) {
        throw new Error('Course not found');
      }

      // Check if user is enrolled (if authenticated)
      let enrollment = null;
      if (context.user) {
        enrollment = await Enrollment.findOne({
          user: context.user.id,
          course: courseId,
        });
      }

      return {
        success: true,
        data: {
          course: {
            id: course._id,
            title: course.title,
            description: course.description,
            difficulty: course.difficulty,
            modules: course.modules,
            contributors: course.contributors,
            published: course.published,
          },
          enrollment: enrollment
            ? {
                id: enrollment._id,
                progress: enrollment.progress,
                enrolledAt: enrollment.enrolledAt,
              }
            : null,
        },
      };
    } catch (error) {
      logger.error('Get course error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List courses with filters
   */
  async listCourses(input, context) {
    try {
      const { filters = {}, limit = 20, offset = 0 } = input;

      const query = {};

      if (filters.difficulty) {
        query.difficulty = filters.difficulty;
      }

      if (filters.topic) {
        query.$or = [
          { title: { $regex: filters.topic, $options: 'i' } },
          { description: { $regex: filters.topic, $options: 'i' } },
        ];
      }

      if (filters.published !== undefined) {
        query.published = filters.published;
      }

      const courses = await Course.find(query)
        .select('title description difficulty published createdAt')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments(query);

      return {
        success: true,
        data: {
          courses: courses.map((c) => ({
            id: c._id,
            title: c.title,
            description: c.description,
            difficulty: c.difficulty,
            published: c.published,
            createdAt: c.createdAt,
          })),
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      };
    } catch (error) {
      logger.error('List courses error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(input, context) {
    try {
      const { userId, courseId } = input;

      // Check authorization
      if (!this.checkAuth(context.user, userId, ['self', 'admin'])) {
        throw new Error('Unauthorized: Can only enroll self');
      }

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already enrolled
      const existing = await Enrollment.findOne({
        user: userId,
        course: courseId,
      });

      if (existing) {
        return {
          success: false,
          error: 'Already enrolled in this course',
        };
      }

      // Create enrollment
      const enrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        enrolledAt: new Date(),
        progress: {
          overallProgress: 0,
          completedModules: [],
        },
      });

      return {
        success: true,
        data: {
          enrollment: {
            id: enrollment._id,
            courseId,
            enrolledAt: enrollment.enrolledAt,
          },
        },
      };
    } catch (error) {
      logger.error('Enroll in course error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update course progress
   */
  async updateCourseProgress(input, context) {
    try {
      const { enrollmentId, moduleId, progress, completed = false } = input;

      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Check authorization
      if (!this.checkAuth(context.user, enrollment.user.toString(), ['self', 'admin'])) {
        throw new Error('Unauthorized: Can only update own progress');
      }

      // Update module progress
      const moduleProgress = enrollment.progress.moduleProgress || {};
      moduleProgress[moduleId] = progress;

      // Update completed modules
      if (completed && !enrollment.progress.completedModules.includes(moduleId)) {
        enrollment.progress.completedModules.push(moduleId);
      }

      // Calculate overall progress
      const totalModules = Object.keys(moduleProgress).length;
      const overallProgress = totalModules > 0
        ? Math.round(
            Object.values(moduleProgress).reduce((sum, p) => sum + p, 0) / totalModules
          )
        : 0;

      enrollment.progress.moduleProgress = moduleProgress;
      enrollment.progress.overallProgress = overallProgress;
      enrollment.lastAccessed = new Date();

      await enrollment.save();

      return {
        success: true,
        data: {
          progress: {
            moduleId,
            progress,
            overallProgress,
            completedModules: enrollment.progress.completedModules.length,
          },
        },
      };
    } catch (error) {
      logger.error('Update course progress error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get learning analytics
   */
  async getLearningAnalytics(input, context) {
    try {
      const { userId, timeRange = 'month', metrics = [] } = input;

      // Check authorization
      if (!this.checkAuth(context.user, userId, ['self', 'admin'])) {
        throw new Error('Unauthorized: Can only access own analytics');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate date range
      const now = new Date();
      const ranges = {
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        all: new Date(0),
      };

      const startDate = ranges[timeRange];

      // Get enrollments in time range
      const enrollments = await Enrollment.find({
        user: userId,
        enrolledAt: { $gte: startDate },
      });

      const analytics = {
        timeRange,
        period: {
          start: startDate,
          end: now,
        },
        summary: {
          totalCourses: enrollments.length,
          completedCourses: enrollments.filter((e) => e.progress.overallProgress === 100).length,
          averageProgress: enrollments.length > 0
            ? Math.round(
                enrollments.reduce((sum, e) => sum + (e.progress.overallProgress || 0), 0) /
                  enrollments.length
              )
            : 0,
          studyStreak: user.statistics?.studyStreak || 0,
          totalStudyTime: user.statistics?.totalStudyTime || 0,
        },
      };

      // Add requested metrics
      if (metrics.length === 0 || metrics.includes('time_spent')) {
        analytics.timeSpent = user.statistics?.totalStudyTime || 0;
      }

      if (metrics.length === 0 || metrics.includes('topics_mastered')) {
        analytics.topicsMastered = user.statistics?.topicsMastered || [];
      }

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Get learning analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(input, context) {
    try {
      const { courseId, metrics = ['enrollments', 'completion_rate'] } = input;

      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check authorization (course creator or admin)
      const isCreator = course.contributors.some(
        (c) => c.user.toString() === context.user.id && c.role === 'creator'
      );

      if (!isCreator && !context.user.isAdmin) {
        throw new Error('Unauthorized: Must be course creator or admin');
      }

      const enrollments = await Enrollment.find({ course: courseId });

      const analytics = {
        courseId,
        course: {
          title: course.title,
          createdAt: course.createdAt,
        },
      };

      if (metrics.includes('enrollments')) {
        analytics.enrollments = {
          total: enrollments.length,
          active: enrollments.filter((e) => e.progress.overallProgress > 0 && e.progress.overallProgress < 100).length,
          completed: enrollments.filter((e) => e.progress.overallProgress === 100).length,
        };
      }

      if (metrics.includes('completion_rate')) {
        analytics.completionRate = enrollments.length > 0
          ? Math.round(
              (enrollments.filter((e) => e.progress.overallProgress === 100).length / enrollments.length) * 100
            )
          : 0;
      }

      if (metrics.includes('average_score')) {
        // This would aggregate quiz scores - simplified for now
        analytics.averageScore = 0;
      }

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Get course analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check authorization
   */
  checkAuth(user, targetUserId, allowedRoles) {
    if (!user) return false;

    if (allowedRoles.includes('any')) return true;
    if (allowedRoles.includes('admin') && user.isAdmin) return true;
    if (allowedRoles.includes('self') && user.id === targetUserId) return true;

    return false;
  }
}

export default new PlatformServer();
