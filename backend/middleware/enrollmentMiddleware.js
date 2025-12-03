/**
 * Enrollment Middleware
 * SECURITY: Verifies user has access to course (either free or paid)
 * Cannot be bypassed - all validation server-side
 */

import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

/**
 * Check if user is enrolled in course
 * Used for AI tutor access, content access, etc.
 */
export const requireEnrollment = async (req, res, next) => {
  try {
    const { course_id, courseId } = req.body;
    const userId = req.user._id;
    const checkCourseId = course_id || courseId;

    if (!checkCourseId) {
      return res.status(400).json({
        success: false,
        error: 'COURSE_ID_REQUIRED',
        message: 'Course ID is required',
      });
    }

    // SECURITY: Check if course exists
    const course = await Course.findById(checkCourseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    // SECURITY: Check enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: checkCourseId,
      status: 'active',
    });

    if (!enrollment) {
      // Check if course is free
      if (course.pricing.model === 'free') {
        // Auto-enroll in free course
        await Enrollment.create({
          user: userId,
          course: checkCourseId,
          enrolledAt: new Date(),
          status: 'active',
          paymentStatus: 'free',
        });

        // Continue to next middleware
        return next();
      }

      // Paid course - user must purchase
      return res.status(403).json({
        success: false,
        error: 'ENROLLMENT_REQUIRED',
        message: 'You must enroll in this course to access it',
        requiresPayment: true,
        courseId: checkCourseId,
        courseTitle: course.title,
        price: course.pricing.amount,
      });
    }

    // User is enrolled - add enrollment to request
    req.enrollment = enrollment;
    req.course = course;
    next();
  } catch (error) {
    console.error('Enrollment check error:', error);
    res.status(500).json({
      success: false,
      error: 'ENROLLMENT_CHECK_FAILED',
      message: 'Failed to verify enrollment',
    });
  }
};

/**
 * Check if user can create paid courses
 * Only verified instructors can publish marketplace courses
 */
export const requireVerifiedInstructor = async (req, res, next) => {
  try {
    const user = req.user;

    // SECURITY: Check role
    if (user.role !== 'verified_instructor' && user.role !== 'platform_author') {
      return res.status(403).json({
        success: false,
        error: 'INSTRUCTOR_ROLE_REQUIRED',
        message: 'Only verified instructors can create marketplace courses',
      });
    }

    // SECURITY: Check verification status for instructors
    if (user.role === 'verified_instructor') {
      if (user.instructorVerification.status !== 'approved') {
        return res.status(403).json({
          success: false,
          error: 'VERIFICATION_INCOMPLETE',
          message: 'Your instructor verification is pending approval',
          verificationStatus: user.instructorVerification.status,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Instructor verification check error:', error);
    res.status(500).json({
      success: false,
      error: 'VERIFICATION_CHECK_FAILED',
      message: 'Failed to verify instructor status',
    });
  }
};

export default { requireEnrollment, requireVerifiedInstructor };
