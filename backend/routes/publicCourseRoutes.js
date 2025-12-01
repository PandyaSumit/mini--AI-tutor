/**
 * Public Course Routes
 * No authentication required - for SEO and public discovery
 */

import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

/**
 * @route   GET /api/public/courses
 * @desc    Get all public marketplace courses (no auth required)
 * @access  Public
 */
router.get('/courses', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query for public courses only
    const query = {
      courseType: { $in: ['marketplace', 'flagship'] },
      visibility: 'public',
      'marketplace.hasPassedQualityReview': true,
      isPublished: true
    };

    // Add filters
    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.learningOutcomes': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('createdBy', 'name instructorVerification.portfolio.professionalTitle')
      .select('-aiGeneration -marketplace.qualityIssues') // Hide internal fields
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Course.countDocuments(query);

    // Get enrollment counts for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
          status: { $in: ['active', 'completed'] }
        });

        return {
          ...course,
          statistics: {
            ...course.statistics,
            enrollmentCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasMore: Number(page) * Number(limit) < total
        }
      }
    });
  } catch (error) {
    console.error('Public courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    });
  }
});

/**
 * @route   GET /api/public/courses/:courseId
 * @desc    Get public course details (no auth required)
 * @access  Public
 */
router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find course
    const course = await Course.findOne({
      _id: courseId,
      courseType: { $in: ['marketplace', 'flagship'] },
      visibility: 'public',
      'marketplace.hasPassedQualityReview': true,
      isPublished: true
    })
      .populate('createdBy', 'name email instructorVerification.portfolio')
      .populate({
        path: 'modules',
        select: 'title description order',
        populate: {
          path: 'lessons',
          select: 'title description duration order type isPreview'
        }
      })
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not publicly available'
      });
    }

    // Get enrollment statistics
    const enrollmentCount = await Enrollment.countDocuments({
      course: courseId,
      status: { $in: ['active', 'completed'] }
    });

    // Get average rating (if reviews exist)
    const enrollments = await Enrollment.find({
      course: courseId,
      rating: { $exists: true, $ne: null }
    }).select('rating');

    const averageRating = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.rating, 0) / enrollments.length
      : 0;

    // Calculate total duration
    let totalDuration = 0;
    if (course.modules) {
      course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach(lesson => {
            totalDuration += lesson.duration || 0;
          });
        }
      });
    }

    // Hide internal fields
    delete course.aiGeneration;
    delete course.marketplace.qualityIssues;

    res.json({
      success: true,
      data: {
        course: {
          ...course,
          statistics: {
            ...course.statistics,
            enrollmentCount,
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: enrollments.length,
            totalDuration: Math.ceil(totalDuration / 60) // Convert to minutes
          }
        }
      }
    });
  } catch (error) {
    console.error('Public course detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course details'
    });
  }
});

/**
 * @route   GET /api/public/courses/featured
 * @desc    Get featured courses for homepage
 * @access  Public
 */
router.get('/courses/featured', async (req, res) => {
  try {
    const featuredCourses = await Course.find({
      courseType: { $in: ['marketplace', 'flagship'] },
      visibility: 'public',
      'marketplace.hasPassedQualityReview': true,
      isPublished: true,
      'marketplace.totalSales': { $gt: 0 } // Has sales
    })
      .populate('createdBy', 'name instructorVerification.portfolio.professionalTitle')
      .select('-aiGeneration -marketplace.qualityIssues')
      .sort('-marketplace.totalSales')
      .limit(8)
      .lean();

    // Add enrollment counts
    const coursesWithStats = await Promise.all(
      featuredCourses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
          status: { $in: ['active', 'completed'] }
        });

        return {
          ...course,
          statistics: {
            ...course.statistics,
            enrollmentCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithStats
      }
    });
  } catch (error) {
    console.error('Featured courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured courses'
    });
  }
});

/**
 * @route   GET /api/public/stats
 * @desc    Get platform statistics for marketing
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalCourses, totalEnrollments, totalInstructors] = await Promise.all([
      Course.countDocuments({
        visibility: 'public',
        isPublished: true,
        'marketplace.hasPassedQualityReview': true
      }),
      Enrollment.countDocuments({
        status: { $in: ['active', 'completed'] }
      }),
      User.countDocuments({
        role: { $in: ['verified_instructor', 'platform_author'] }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCourses,
        totalEnrollments,
        totalInstructors
      }
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route   GET /api/public/categories
 * @desc    Get all available categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', {
      visibility: 'public',
      isPublished: true,
      'marketplace.hasPassedQualityReview': true
    });

    res.json({
      success: true,
      data: {
        categories: categories.filter(c => c) // Remove null/undefined
      }
    });
  } catch (error) {
    console.error('Public categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

export default router;
