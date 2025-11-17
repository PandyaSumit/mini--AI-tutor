/**
 * Platform MCP Tools
 * Connects MCP handler to actual database queries
 */

import User from '../../../models/User.js';
import Course from '../../../models/Course.js';
import Enrollment from '../../../models/Enrollment.js';
import logger from '../../../utils/logger.js';

/**
 * Get user progress across all courses
 */
export async function getUserProgress(params) {
  const { userId } = params;

  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId', 'title description')
      .lean();

    const progress = enrollments.map(enrollment => {
      const totalLessons = enrollment.progress?.length || 0;
      const completedLessons = enrollment.progress?.filter(p => p.completed)?.length || 0;

      return {
        courseId: enrollment.courseId._id,
        courseTitle: enrollment.courseId.title,
        progress: enrollment.progressPercentage || 0,
        completedLessons,
        totalLessons,
        lastAccessed: enrollment.lastAccessed,
        enrolledAt: enrollment.enrolledAt,
      };
    });

    return {
      success: true,
      data: progress,
    };
  } catch (error) {
    logger.error('getUserProgress failed:', error);
    throw error;
  }
}

/**
 * Search courses by query
 */
export async function searchCourses(params) {
  const { query, limit = 5 } = params;

  try {
    const courses = await Course.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [query] } },
      ],
    })
      .limit(limit)
      .select('title description difficulty duration modules lessons')
      .lean();

    return {
      success: true,
      data: courses,
    };
  } catch (error) {
    logger.error('searchCourses failed:', error);
    throw error;
  }
}

/**
 * Get user profile (safe fields only)
 */
export async function getUserProfile(params) {
  const { userId } = params;

  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const user = await User.findById(userId)
      .select('firstName lastName email role')
      .lean();

    if (!user) {
      return {
        success: false,
        data: null,
      };
    }

    // Get enrolled courses
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId', 'title')
      .lean();

    const enrolledCourses = enrollments.map(e => ({
      id: e.courseId._id,
      title: e.courseId.title,
    }));

    return {
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        enrolledCourses,
      },
    };
  } catch (error) {
    logger.error('getUserProfile failed:', error);
    throw error;
  }
}

/**
 * Enroll user in a course
 */
export async function enrollCourse(params) {
  const { userId, courseId } = params;

  if (!userId || !courseId) {
    throw new Error('User ID and Course ID required');
  }

  try {
    // Check if already enrolled
    const existing = await Enrollment.findOne({ userId, courseId });

    if (existing) {
      return {
        success: false,
        message: 'You are already enrolled in this course',
        data: existing,
      };
    }

    // Create enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      enrolledAt: new Date(),
    });

    await enrollment.save();

    return {
      success: true,
      message: 'Successfully enrolled!',
      data: enrollment,
    };
  } catch (error) {
    logger.error('enrollCourse failed:', error);
    throw error;
  }
}

/**
 * Get personalized course recommendations
 */
export async function getRecommendations(params) {
  const { userId, limit = 5 } = params;

  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId', 'tags difficulty')
      .lean();

    // Extract tags and difficulty from enrolled courses
    const userTags = new Set();
    let avgDifficulty = 0;

    enrollments.forEach(e => {
      e.courseId.tags?.forEach(tag => userTags.add(tag));
      avgDifficulty += e.courseId.difficulty || 0;
    });

    avgDifficulty = enrollments.length > 0 ? avgDifficulty / enrollments.length : 1;

    // Find courses matching user's interests but not yet enrolled
    const enrolledIds = enrollments.map(e => e.courseId._id);

    const recommendations = await Course.find({
      _id: { $nin: enrolledIds },
      $or: [
        { tags: { $in: Array.from(userTags) } },
        { difficulty: { $gte: avgDifficulty - 1, $lte: avgDifficulty + 1 } },
      ],
    })
      .limit(limit)
      .select('title description difficulty tags')
      .lean();

    // Add recommendation reasons
    const withReasons = recommendations.map(course => {
      const matchingTags = course.tags?.filter(t => userTags.has(t)) || [];
      const reason = matchingTags.length > 0
        ? `Matches your interests: ${matchingTags.join(', ')}`
        : `Suitable for your skill level (${course.difficulty})`;

      return {
        ...course,
        reason,
      };
    });

    return {
      success: true,
      data: withReasons,
    };
  } catch (error) {
    logger.error('getRecommendations failed:', error);
    throw error;
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(params) {
  const { userId } = params;

  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const enrollments = await Enrollment.find({ userId }).lean();

    const totalCourses = enrollments.length;
    const totalCompleted = enrollments.filter(e => e.progressPercentage === 100).length;
    const avgProgress = enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) / totalCourses || 0;

    return {
      success: true,
      data: {
        totalCourses,
        completedCourses: totalCompleted,
        inProgressCourses: totalCourses - totalCompleted,
        averageProgress: avgProgress.toFixed(1),
      },
    };
  } catch (error) {
    logger.error('getUserAnalytics failed:', error);
    throw error;
  }
}
