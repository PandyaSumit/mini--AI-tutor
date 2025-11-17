import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  canApplyAsCoCreator,
  canApproveCoCreators
} from '../middleware/courseAuth.js';
import CoCreatorRequest from '../models/CoCreatorRequest.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/courses/:courseId/co-creators/apply
 * @desc    Apply to become a co-creator
 * @access  Private
 */
router.post('/:courseId/co-creators/apply', protect, canApplyAsCoCreator, async (req, res) => {
  try {
    const { message, proposedContributions, requestedRevenueShare } = req.body;
    const course = req.course;
    const userId = req.user._id;

    // Check for existing pending request
    const existingRequest = await CoCreatorRequest.findOne({
      course: course._id,
      requester: userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending co-creator request for this course'
      });
    }

    // Validate requested revenue share
    const requestedShare = requestedRevenueShare || 15; // Default 15%
    if (requestedShare < 10 || requestedShare > 20) {
      return res.status(400).json({
        success: false,
        error: 'Requested revenue share must be between 10% and 20%'
      });
    }

    // Create co-creator request
    const request = await CoCreatorRequest.create({
      course: course._id,
      requester: userId,
      message,
      proposedContributions,
      requestedRevenueShare: requestedShare,
      status: 'pending'
    });

    // Populate the request with user and course details
    await request.populate('requester', 'name email reputation');
    await request.populate('course', 'title');

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error submitting co-creator application:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/co-creators/requests
 * @desc    Get all co-creator requests for a course (founders only)
 * @access  Private (Founder only)
 */
router.get('/:courseId/co-creators/requests', protect, canApproveCoCreators, async (req, res) => {
  try {
    const course = req.course;
    const status = req.query.status || 'pending';

    const requests = await CoCreatorRequest.find({
      course: course._id,
      status
    })
      .populate('requester', 'name email reputation contributorActivity')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching co-creator requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/courses/:courseId/co-creators/requests/:requestId/approve
 * @desc    Approve a co-creator request
 * @access  Private (Founder only)
 */
router.put(
  '/:courseId/co-creators/requests/:requestId/approve',
  protect,
  canApproveCoCreators,
  async (req, res) => {
    try {
      const { approvedRevenueShare, notes } = req.body;
      const course = req.course;
      const requestId = req.params.requestId;

      // Find the request
      const request = await CoCreatorRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Co-creator request not found'
        });
      }

      // Verify request is for this course
      if (request.course.toString() !== course._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'This request is not for this course'
        });
      }

      // Validate approved revenue share
      const share = approvedRevenueShare || request.requestedRevenueShare;
      if (share < 10 || share > 20) {
        return res.status(400).json({
          success: false,
          error: 'Approved revenue share must be between 10% and 20%'
        });
      }

      // Approve the request
      await request.approve(req.user._id, share, notes);

      // Add contributor to course
      course.contributors.push({
        user: request.requester,
        contributionType: 'co-creator',
        contributionDate: new Date(),
        contributionScore: 0,
        revenueShare: share,
        approvalStatus: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      });

      // Update founder's revenue share
      await course.updateFounderRevenue();
      await course.normalizeRevenueShares();

      // Update user's reputation
      const user = await User.findById(request.requester);
      user.reputation.coursesCoCreated += 1;
      await user.awardReputation(100, 'co_creator_approved');

      // Populate the request for response
      await request.populate('requester', 'name email');
      await request.populate('reviewedBy', 'name');

      res.json({
        success: true,
        data: request,
        course: {
          id: course._id,
          founderRevenue: course.getFounderRevenue(),
          totalAllocated: course.contributors.reduce((sum, c) => sum + c.revenueShare, 0)
        }
      });
    } catch (error) {
      console.error('Error approving co-creator request:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/courses/:courseId/co-creators/requests/:requestId/reject
 * @desc    Reject a co-creator request
 * @access  Private (Founder only)
 */
router.put(
  '/:courseId/co-creators/requests/:requestId/reject',
  protect,
  canApproveCoCreators,
  async (req, res) => {
    try {
      const { notes } = req.body;
      const course = req.course;
      const requestId = req.params.requestId;

      // Find the request
      const request = await CoCreatorRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Co-creator request not found'
        });
      }

      // Verify request is for this course
      if (request.course.toString() !== course._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'This request is not for this course'
        });
      }

      // Reject the request
      await request.reject(req.user._id, notes);

      // Populate for response
      await request.populate('requester', 'name email');
      await request.populate('reviewedBy', 'name');

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('Error rejecting co-creator request:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/courses/:courseId/co-creators
 * @desc    Get all approved co-creators for a course
 * @access  Public
 */
router.get('/:courseId/co-creators', async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId)
      .populate({
        path: 'contributors.user',
        select: 'name email reputation'
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Filter for approved co-creators
    const coCreators = course.contributors.filter(
      c => c.contributionType === 'co-creator' && c.approvalStatus === 'approved'
    );

    res.json({
      success: true,
      count: coCreators.length,
      data: coCreators.map(c => ({
        user: c.user,
        contributionDate: c.contributionDate,
        contributionScore: c.contributionScore,
        revenueShare: c.revenueShare
      }))
    });
  } catch (error) {
    console.error('Error fetching co-creators:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/co-creators/my-requests
 * @desc    Get user's own co-creator requests
 * @access  Private
 */
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await CoCreatorRequest.find({ requester: req.user._id })
      .populate('course', 'title description')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
