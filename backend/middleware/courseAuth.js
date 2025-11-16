import Course from '../models/Course.js';
import User from '../models/User.js';

/**
 * Check if user is the course founder
 */
export const isFounder = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId || req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if user is the founder (first contributor with type 'founder')
    const founder = course.contributors.find(c => c.contributionType === 'founder');

    if (!founder || founder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the course founder can perform this action'
      });
    }

    req.course = course;
    req.userRole = 'founder';
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user is a founder or approved co-creator
 */
export const isFounderOrCoCreator = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId || req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Find user's contributor status
    const contributor = course.contributors.find(
      c => c.user.toString() === req.user._id.toString()
    );

    if (!contributor) {
      return res.status(403).json({
        success: false,
        error: 'You must be a course contributor to perform this action'
      });
    }

    // Check if approved founder or co-creator
    const isAuthorized =
      (contributor.contributionType === 'founder') ||
      (contributor.contributionType === 'co-creator' && contributor.approvalStatus === 'approved');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Only approved course founders and co-creators can perform this action'
      });
    }

    req.course = course;
    req.userRole = contributor.contributionType;
    req.contributor = contributor;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user can edit course content (founder, co-creator, or contributor)
 */
export const canEditContent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId || req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const contributor = course.contributors.find(
      c => c.user.toString() === req.user._id.toString()
    );

    // Founders and approved co-creators can edit directly
    if (contributor) {
      const canEdit =
        (contributor.contributionType === 'founder') ||
        (contributor.contributionType === 'co-creator' && contributor.approvalStatus === 'approved');

      if (canEdit) {
        req.course = course;
        req.userRole = contributor.contributionType;
        req.contributor = contributor;
        return next();
      }
    }

    // Contributors can only suggest edits, not edit directly
    req.course = course;
    req.userRole = 'contributor';
    req.canOnlySuggest = true;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user can approve co-creator requests (only founders)
 */
export const canApproveCoCreators = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const founder = course.contributors.find(c => c.contributionType === 'founder');

    if (!founder || founder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the course founder can approve co-creators'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check if user meets requirements to apply as co-creator
 */
export const canApplyAsCoCreator = async (req, res, next) => {
  try {
    const user = req.user;
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if already a contributor
    const existingContributor = course.contributors.find(
      c => c.user.toString() === user._id.toString()
    );

    if (existingContributor) {
      return res.status(400).json({
        success: false,
        error: 'You are already a contributor to this course'
      });
    }

    // Requirements: reputation >= 50 OR has been invited
    const meetsReputationRequirement = user.reputation.score >= 50;
    const hasBeenInvited = user.contributorActivity.invitedToContribute;

    if (!meetsReputationRequirement && !hasBeenInvited) {
      return res.status(403).json({
        success: false,
        error: 'You need at least 50 reputation points to apply as a co-creator'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculate user's contribution level for revenue sharing
 */
export const getUserContributionLevel = (course, userId) => {
  const contributor = course.contributors.find(
    c => c.user.toString() === userId.toString()
  );

  if (!contributor) {
    return { type: 'none', share: 0 };
  }

  return {
    type: contributor.contributionType,
    share: contributor.revenueShare,
    status: contributor.approvalStatus
  };
};

export default {
  isFounder,
  isFounderOrCoCreator,
  canEditContent,
  canApproveCoCreators,
  canApplyAsCoCreator,
  getUserContributionLevel
};
