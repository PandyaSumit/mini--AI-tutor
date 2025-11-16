import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { canEditContent } from '../middleware/courseAuth.js';
import CourseImprovement from '../models/CourseImprovement.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/courses/:courseId/improvements
 * @desc    Submit a course improvement suggestion
 * @access  Private
 */
router.post('/:courseId/improvements', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      improvementType,
      targetSection
    } = req.body;

    const courseId = req.params.courseId;
    const userId = req.user._id;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Create improvement suggestion
    const improvement = await CourseImprovement.create({
      course: courseId,
      suggestedBy: userId,
      title,
      description,
      improvementType,
      targetSection,
      status: 'pending'
    });

    // Update user's contributor activity
    const user = await User.findById(userId);
    await user.recordContribution('suggestion');

    // Populate the response
    await improvement.populate('suggestedBy', 'name email reputation');

    res.status(201).json({
      success: true,
      data: improvement
    });
  } catch (error) {
    console.error('Error creating improvement suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/improvements
 * @desc    Get all improvement suggestions for a course
 * @access  Public
 */
router.get('/:courseId/improvements', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const status = req.query.status; // pending, under_review, implemented, rejected
    const sort = req.query.sort || '-upvotes'; // Sort by upvotes by default

    const query = { course: courseId };
    if (status) {
      query.status = status;
    }

    const improvements = await CourseImprovement.find(query)
      .populate('suggestedBy', 'name reputation')
      .populate('implementedBy', 'name')
      .populate('targetSection.module', 'title')
      .populate('targetSection.lesson', 'title')
      .sort(sort);

    res.json({
      success: true,
      count: improvements.length,
      data: improvements
    });
  } catch (error) {
    console.error('Error fetching improvements:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/improvements/:improvementId/upvote
 * @desc    Upvote an improvement suggestion
 * @access  Private
 */
router.post('/:courseId/improvements/:improvementId/upvote', protect, async (req, res) => {
  try {
    const improvementId = req.params.improvementId;
    const userId = req.user._id;

    const improvement = await CourseImprovement.findById(improvementId);

    if (!improvement) {
      return res.status(404).json({
        success: false,
        error: 'Improvement suggestion not found'
      });
    }

    // Toggle upvote
    await improvement.upvote(userId);

    // Populate for response
    await improvement.populate('suggestedBy', 'name reputation');

    res.json({
      success: true,
      data: improvement
    });
  } catch (error) {
    console.error('Error upvoting improvement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/courses/:courseId/improvements/:improvementId/implement
 * @desc    Mark an improvement as implemented (founders/co-creators only)
 * @access  Private (Founder/Co-creator)
 */
router.put(
  '/:courseId/improvements/:improvementId/implement',
  protect,
  canEditContent,
  async (req, res) => {
    try {
      // Check if user can implement (not just suggest)
      if (req.canOnlySuggest) {
        return res.status(403).json({
          success: false,
          error: 'Only course founders and co-creators can implement improvements'
        });
      }

      const improvementId = req.params.improvementId;
      const { notes } = req.body;
      const implementerId = req.user._id;
      const course = req.course;

      const improvement = await CourseImprovement.findById(improvementId);

      if (!improvement) {
        return res.status(404).json({
          success: false,
          error: 'Improvement suggestion not found'
        });
      }

      // Calculate revenue share for the contributor
      const contributor = await User.findById(improvement.suggestedBy);
      const implementationsCount = contributor.contributorActivity.suggestionsImplemented + 1;
      const revenueShare = course.calculateContributorRevenue(implementationsCount);

      // Mark as implemented
      await improvement.markImplemented(implementerId, revenueShare, notes);

      // Add or update contributor in course
      const existingContributor = course.contributors.find(
        c => c.user.toString() === improvement.suggestedBy.toString()
      );

      if (!existingContributor) {
        course.contributors.push({
          user: improvement.suggestedBy,
          contributionType: 'content_improver',
          contributionDate: new Date(),
          contributionScore: 1,
          revenueShare: revenueShare,
          approvalStatus: 'approved',
          approvedBy: implementerId,
          approvedAt: new Date()
        });
      } else {
        existingContributor.contributionScore += 1;
        existingContributor.revenueShare = Math.max(
          existingContributor.revenueShare,
          revenueShare
        );
      }

      await course.normalizeRevenueShares();

      // Update contributor's activity
      await contributor.recordContribution('suggestion_implemented');

      // Populate for response
      await improvement.populate('suggestedBy', 'name email reputation');
      await improvement.populate('implementedBy', 'name');

      res.json({
        success: true,
        data: improvement,
        contributor: {
          id: contributor._id,
          name: contributor.name,
          revenueShare: revenueShare,
          totalImplementations: contributor.contributorActivity.suggestionsImplemented
        }
      });
    } catch (error) {
      console.error('Error implementing improvement:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/courses/:courseId/improvements/:improvementId/reject
 * @desc    Reject an improvement suggestion (founders/co-creators only)
 * @access  Private (Founder/Co-creator)
 */
router.put(
  '/:courseId/improvements/:improvementId/reject',
  protect,
  canEditContent,
  async (req, res) => {
    try {
      if (req.canOnlySuggest) {
        return res.status(403).json({
          success: false,
          error: 'Only course founders and co-creators can reject improvements'
        });
      }

      const improvementId = req.params.improvementId;
      const { notes } = req.body;

      const improvement = await CourseImprovement.findById(improvementId);

      if (!improvement) {
        return res.status(404).json({
          success: false,
          error: 'Improvement suggestion not found'
        });
      }

      improvement.status = 'rejected';
      improvement.implementedBy = req.user._id;
      improvement.implementationNotes = notes;
      improvement.implementedAt = new Date();

      await improvement.save();

      // Populate for response
      await improvement.populate('suggestedBy', 'name email');
      await improvement.populate('implementedBy', 'name');

      res.json({
        success: true,
        data: improvement
      });
    } catch (error) {
      console.error('Error rejecting improvement:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/contributors/my-suggestions
 * @desc    Get user's own improvement suggestions
 * @access  Private
 */
router.get('/my-suggestions', protect, async (req, res) => {
  try {
    const suggestions = await CourseImprovement.find({ suggestedBy: req.user._id })
      .populate('course', 'title description')
      .populate('implementedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
