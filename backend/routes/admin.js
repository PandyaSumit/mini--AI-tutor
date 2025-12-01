import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin, logAdminAction } from '../middleware/adminMiddleware.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import AIUsageLog from '../models/AIUsageLog.js';
import AdminActionLog from '../models/AdminActionLog.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// ALL routes require admin authentication
router.use(protect);
router.use(requireAdmin);

// ====================================
// DASHBOARD & ANALYTICS
// ====================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get comprehensive platform overview
 * @access  Admin only
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get platform statistics
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      pendingInstructors,
      pendingCourseReviews,
      recentAIUsage,
      platformRevenue
    ] = await Promise.all([
      // Total users by role
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),

      // Total courses by type and visibility
      Course.aggregate([
        {
          $group: {
            _id: {
              courseType: '$courseType',
              visibility: '$visibility'
            },
            count: { $sum: 1 }
          }
        }
      ]),

      // Total enrollments
      Enrollment.countDocuments(),

      // Pending instructor applications
      User.countDocuments({
        'instructorVerification.status': 'pending'
      }),

      // Pending course quality reviews
      Course.countDocuments({
        courseType: 'marketplace',
        'marketplace.hasPassedQualityReview': false,
        'marketplace.qualityIssues.0': { $exists: false } // No issues
      }),

      // AI usage in last 30 days
      AIUsageLog.getPlatformUsage(thirtyDaysAgo, now),

      // Platform revenue
      Course.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$marketplace.totalRevenue' },
            totalSales: { $sum: '$marketplace.totalSales' }
          }
        }
      ])
    ]);

    // Format user stats
    const byRole = {
      learner: 0,
      verified_instructor: 0,
      platform_author: 0,
      admin: 0
    };
    let totalUserCount = 0;

    totalUsers.forEach(stat => {
      totalUserCount += stat.count;
      if (byRole.hasOwnProperty(stat._id)) {
        byRole[stat._id] = stat.count;
      }
    });

    // Count new users this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });

    const userStats = {
      total: totalUserCount,
      byRole,
      newThisMonth
    };

    // Format course stats
    const byType = {
      personal: 0,
      marketplace: 0,
      flagship: 0
    };
    const byVisibility = {
      private: 0,
      unlisted: 0,
      public: 0
    };
    let totalCourseCount = 0;

    totalCourses.forEach(stat => {
      totalCourseCount += stat.count;
      if (byType.hasOwnProperty(stat._id.courseType)) {
        byType[stat._id.courseType] = (byType[stat._id.courseType] || 0) + stat.count;
      }
      if (byVisibility.hasOwnProperty(stat._id.visibility)) {
        byVisibility[stat._id.visibility] = (byVisibility[stat._id.visibility] || 0) + stat.count;
      }
    });

    const courseStats = {
      total: totalCourseCount,
      byType,
      byVisibility
    };

    // Count revenue this month
    const thisMonthRevenue = await Course.aggregate([
      {
        $match: {
          'marketplace.totalRevenue': { $gt: 0 },
          updatedAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          thisMonth: { $sum: '$marketplace.totalRevenue' }
        }
      }
    ]);

    const totalRevenue = platformRevenue[0]?.totalRevenue || 0;

    res.json({
      success: true,
      data: {
        users: userStats,
        courses: courseStats,
        pendingReviews: {
          instructorApplications: pendingInstructors,
          courseQualityReviews: pendingCourseReviews
        },
        aiUsage: {
          totalMessagesThisMonth: recentAIUsage[0]?.totalRequests || 0,
          totalVoiceMinutesThisMonth: recentAIUsage[0]?.totalMinutes || 0,
          totalCoursesGenerated: recentAIUsage[0]?.courseGenerations || 0,
          estimatedCost: recentAIUsage[0]?.totalCost || 0
        },
        revenue: {
          totalRevenue,
          platformShare: totalRevenue * 0.3, // 30% platform fee
          instructorShare: totalRevenue * 0.7, // 70% to instructors
          thisMonth: thisMonthRevenue[0]?.thisMonth || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// INSTRUCTOR VERIFICATION
// ====================================

/**
 * @route   GET /api/admin/instructors/pending
 * @desc    Get pending instructor applications
 * @access  Admin only
 */
router.get('/instructors/pending', async (req, res) => {
  try {
    const pendingInstructors = await User.find({
      'instructorVerification.status': 'pending'
    })
      .select('name email instructorVerification createdAt')
      .sort({ 'instructorVerification.appliedAt': -1 });

    res.json({
      success: true,
      data: {
        applications: pendingInstructors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/instructors/:userId/approve
 * @desc    Approve instructor application
 * @access  Admin only
 */
router.post(
  '/instructors/:userId/approve',
  logAdminAction('approve_instructor'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if already approved
      if (user.role === 'verified_instructor') {
        return res.status(400).json({
          success: false,
          error: 'User is already a verified instructor'
        });
      }

      // Approve as instructor
      await user.approveAsInstructor();

      res.json({
        success: true,
        message: `${user.name} approved as verified instructor`,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/admin/instructors/:userId/reject
 * @desc    Reject instructor application
 * @access  Admin only
 */
router.post(
  '/instructors/:userId/reject',
  logAdminAction('reject_instructor'),
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }

      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.rejectInstructorApplication(reason);

      res.json({
        success: true,
        message: `Instructor application rejected`,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ====================================
// COURSE QUALITY REVIEW
// ====================================

/**
 * @route   GET /api/admin/courses/pending-review
 * @desc    Get courses pending quality review
 * @access  Admin only
 */
router.get('/courses/pending-review', async (req, res) => {
  try {
    const pendingCourses = await Course.find({
      courseType: { $in: ['marketplace', 'flagship'] },
      'marketplace.hasPassedQualityReview': false,
      'marketplace.qualityIssues.0': { $exists: false }
    })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        courses: pendingCourses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/courses/:courseId/approve
 * @desc    Approve course quality
 * @access  Admin only
 */
router.post(
  '/courses/:courseId/approve',
  logAdminAction('approve_course'),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      await course.approveQuality(req.user._id);

      res.json({
        success: true,
        message: 'Course approved for marketplace',
        data: course
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/admin/courses/:courseId/reject
 * @desc    Reject course quality
 * @access  Admin only
 */
router.post(
  '/courses/:courseId/reject',
  logAdminAction('reject_course'),
  async (req, res) => {
    try {
      const { issues } = req.body;

      if (!issues || !Array.isArray(issues) || issues.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Quality issues are required'
        });
      }

      const course = await Course.findById(req.params.courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      await course.rejectQuality(req.user._id, issues);

      res.json({
        success: true,
        message: 'Course quality review rejected',
        data: course
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ====================================
// USER MANAGEMENT
// ====================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Admin only
 */
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed user information
 * @access  Admin only
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's courses
    const courses = await Course.find({ createdBy: user._id });

    // Get user's enrollments
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('course', 'title')
      .limit(10);

    // Get user's AI usage
    const aiUsage = await AIUsageLog.getUserUsageSummary(
      user._id,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    res.json({
      success: true,
      data: {
        user,
        courses: {
          count: courses.length,
          items: courses
        },
        enrollments: {
          count: enrollments.length,
          recent: enrollments
        },
        aiUsage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// AI USAGE & ANALYTICS
// ====================================

/**
 * @route   GET /api/admin/analytics/ai-usage
 * @desc    Get AI usage analytics
 * @access  Admin only
 */
router.get('/analytics/ai-usage', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const now = new Date();

    const usage = await AIUsageLog.getPlatformUsage(since, now);

    res.json({
      success: true,
      data: usage[0] || {
        totalUsers: 0,
        totalRequests: 0,
        totalTokens: 0,
        totalMinutes: 0,
        totalCost: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Admin only
 */
router.get('/analytics/revenue', async (req, res) => {
  try {
    const revenue = await Course.aggregate([
      {
        $match: {
          'marketplace.totalRevenue': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$marketplace.totalRevenue' },
          totalSales: { $sum: '$marketplace.totalSales' },
          courses: { $sum: 1 }
        }
      }
    ]);

    const platformShare = (revenue[0]?.totalRevenue || 0) * 0.3; // 30% platform fee
    const instructorShare = (revenue[0]?.totalRevenue || 0) * 0.7; // 70% to instructors

    res.json({
      success: true,
      data: {
        totalRevenue: revenue[0]?.totalRevenue || 0,
        totalSales: revenue[0]?.totalSales || 0,
        revenueGeneratingCourses: revenue[0]?.courses || 0,
        platformShare,
        instructorShare
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/logs/actions
 * @desc    Get admin action logs
 * @access  Admin only
 */
router.get('/logs/actions', async (req, res) => {
  try {
    const { limit = 100, actionType } = req.query;

    let logs;
    if (actionType) {
      logs = await AdminActionLog.getActionsByType(actionType, Number(limit));
    } else {
      logs = await AdminActionLog.getRecentActions(Number(limit));
    }

    res.json({
      success: true,
      data: {
        logs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
