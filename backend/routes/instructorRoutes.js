/**
 * Instructor Routes
 * Handles instructor-specific operations
 * - Verification submission
 * - Earnings management
 * - Student tracking
 * - Analytics
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Configure multer for file uploads (ID, certifications)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/instructor-verification';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
    }
  },
});

/**
 * @route   POST /api/instructor/verification/submit
 * @desc    Submit instructor verification application
 * @access  Private (Instructors only)
 */
router.post(
  '/verification/submit',
  protect,
  upload.fields([
    { name: 'governmentId', maxCount: 1 },
    { name: 'certifications', maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      // Check if user is instructor role
      if (!['verified_instructor', 'platform_author'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only instructor accounts can submit verification',
        });
      }

      // Check if already verified
      if (user.instructorVerification.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Your instructor account is already verified',
        });
      }

      // Parse request body
      const {
        professionalTitle,
        yearsOfExperience,
        bio,
        expertiseAreas, // JSON string of [{subject, category}]
        certifications, // JSON string of [{name, issuer, url}]
        socialLinks, // JSON string of {linkedin, github, website}
      } = req.body;

      // Validate required fields
      if (!professionalTitle || !yearsOfExperience || !bio) {
        return res.status(400).json({
          success: false,
          message: 'Professional title, experience, and bio are required',
        });
      }

      // Parse JSON fields
      let parsedExpertise = [];
      let parsedCertifications = [];
      let parsedSocialLinks = {};

      try {
        if (expertiseAreas) parsedExpertise = JSON.parse(expertiseAreas);
        if (certifications) parsedCertifications = JSON.parse(certifications);
        if (socialLinks) parsedSocialLinks = JSON.parse(socialLinks);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for expertise, certifications, or social links',
        });
      }

      // Validate at least one expertise area
      if (!parsedExpertise || parsedExpertise.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one expertise area is required',
        });
      }

      // Get uploaded file paths
      const governmentIdPath = req.files?.governmentId?.[0]?.path;
      const certificationPaths = req.files?.certifications?.map((f) => f.path) || [];

      // Validate government ID uploaded
      if (!governmentIdPath) {
        return res.status(400).json({
          success: false,
          message: 'Government-issued ID is required for verification',
        });
      }

      // Update instructor verification data
      user.instructorVerification.portfolio.professionalTitle = professionalTitle;
      user.instructorVerification.portfolio.yearsOfExperience = parseInt(yearsOfExperience);
      user.instructorVerification.portfolio.bio = bio;

      // Update expertise areas
      user.instructorVerification.expertiseAreas = parsedExpertise.map((area) => ({
        subject: area.subject,
        category: area.category,
        verificationMethod: 'manual_review', // Admin will review
        verifiedAt: null,
      }));

      // Update certifications
      user.instructorVerification.portfolio.certifications = parsedCertifications.map(
        (cert, index) => ({
          name: cert.name,
          issuer: cert.issuer,
          url: cert.url,
          issuedDate: cert.issuedDate,
          filePath: certificationPaths[index] || null,
        })
      );

      // Update social links
      if (parsedSocialLinks.linkedin) {
        user.instructorVerification.portfolio.socialLinks.linkedin = parsedSocialLinks.linkedin;
      }
      if (parsedSocialLinks.github) {
        user.instructorVerification.portfolio.socialLinks.github = parsedSocialLinks.github;
      }
      if (parsedSocialLinks.website) {
        user.instructorVerification.portfolio.socialLinks.website = parsedSocialLinks.website;
      }

      // Update KYC data
      user.instructorVerification.kyc.governmentIdPath = governmentIdPath;
      user.instructorVerification.kyc.status = 'pending';
      user.instructorVerification.kyc.submittedAt = new Date();

      // Update verification status
      user.instructorVerification.status = 'pending';
      user.instructorVerification.submittedAt = new Date();

      await user.save();

      // TODO: Send notification to admin about new verification request
      // TODO: Send email to instructor confirming submission

      res.json({
        success: true,
        message: 'Verification application submitted successfully',
        data: {
          status: user.instructorVerification.status,
          submittedAt: user.instructorVerification.submittedAt,
        },
      });
    } catch (error) {
      console.error('Verification submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit verification application',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/instructor/verification/status
 * @desc    Get verification status
 * @access  Private (Instructors only)
 */
router.get('/verification/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('instructorVerification role');

    res.json({
      success: true,
      data: {
        status: user.instructorVerification.status,
        submittedAt: user.instructorVerification.submittedAt,
        approvedAt: user.instructorVerification.approvedAt,
        rejectedAt: user.instructorVerification.rejectedAt,
        rejectionReason: user.instructorVerification.rejectionReason,
        role: user.role,
        canCreateCourses: user.instructorVerification.status === 'approved',
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status',
    });
  }
});

/**
 * @route   GET /api/instructor/dashboard/stats
 * @desc    Get instructor dashboard statistics
 * @access  Private (Verified instructors only)
 */
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Verify instructor is approved
    if (user.instructorVerification.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only verified instructors can access dashboard stats',
      });
    }

    // Get instructor's courses
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map((c) => c._id);

    // Get total enrollments across all courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    // Calculate stats
    const totalStudents = new Set(enrollments.map((e) => e.user.toString())).size;
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const totalEnrollments = enrollments.length;

    // Revenue stats
    const totalRevenue = courses.reduce((sum, course) => sum + (course.marketplace.totalRevenue || 0), 0);
    const totalEarnings = user.earnings.totalEarned || 0;
    const availableBalance = user.earnings.availableBalance || 0;
    const pendingBalance = user.earnings.pendingBalance || 0;

    // Course performance
    const courseStats = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.course.toString() === course._id.toString()
      );
      const activeStudents = courseEnrollments.filter((e) => e.status === 'active').length;
      const avgProgress =
        courseEnrollments.reduce((sum, e) => sum + (e.progress.completionPercentage || 0), 0) /
        (courseEnrollments.length || 1);

      return {
        id: course._id,
        title: course.title,
        enrollments: courseEnrollments.length,
        activeStudents,
        revenue: course.marketplace.totalRevenue || 0,
        rating: course.marketplace.averageRating || 0,
        reviews: course.marketplace.totalReviews || 0,
        avgProgress: Math.round(avgProgress),
      };
    });

    // Sort courses by enrollment
    courseStats.sort((a, b) => b.enrollments - a.enrollments);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          totalRevenue,
          totalEarnings,
          availableBalance,
          pendingBalance,
        },
        topCourses: courseStats.slice(0, 5),
        allCourses: courseStats,
      },
    });
  } catch (error) {
    console.error('Get instructor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
    });
  }
});

/**
 * @route   GET /api/instructor/students
 * @desc    Get list of students enrolled in instructor's courses
 * @access  Private (Verified instructors only)
 */
router.get('/students', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.instructorVerification.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only verified instructors can view students',
      });
    }

    // Get instructor's courses
    const courses = await Course.find({ instructor: req.user._id }).select('_id title');
    const courseIds = courses.map((c) => c._id);

    // Get enrollments with student details
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    // Group by student
    const studentMap = new Map();

    enrollments.forEach((enrollment) => {
      const studentId = enrollment.user._id.toString();

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId: enrollment.user._id,
          studentName: enrollment.user.name,
          studentEmail: enrollment.user.email,
          totalCourses: 0,
          courses: [],
          totalProgress: 0,
          enrolledAt: enrollment.createdAt,
        });
      }

      const student = studentMap.get(studentId);
      student.totalCourses += 1;
      student.courses.push({
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress.completionPercentage || 0,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        lastActivityAt: enrollment.lastActivityAt,
      });
      student.totalProgress += enrollment.progress.completionPercentage || 0;
    });

    // Convert to array and calculate average progress
    const students = Array.from(studentMap.values()).map((student) => ({
      ...student,
      avgProgress: Math.round(student.totalProgress / student.totalCourses),
    }));

    res.json({
      success: true,
      total: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get instructor students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student list',
    });
  }
});

/**
 * @route   GET /api/instructor/earnings
 * @desc    Get instructor earnings details
 * @access  Private (Verified instructors only)
 */
router.get('/earnings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.instructorVerification.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only verified instructors can view earnings',
      });
    }

    // Get courses for revenue breakdown
    const courses = await Course.find({ instructor: req.user._id }).select(
      'title marketplace.totalRevenue marketplace.instructorRevenue'
    );

    const revenueByCourse = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.title,
      totalRevenue: course.marketplace.totalRevenue || 0,
      instructorRevenue: course.marketplace.instructorRevenue || 0,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalEarned: user.earnings.totalEarned || 0,
          availableBalance: user.earnings.availableBalance || 0,
          pendingBalance: user.earnings.pendingBalance || 0,
          totalWithdrawn: user.earnings.totalWithdrawn || 0,
          nextPayoutDate: user.earnings.nextPayoutDate,
          lastPayoutDate: user.earnings.lastPayoutDate,
        },
        payoutMethod: user.earnings.payoutMethod || 'not_set',
        revenueByCourserevenueBySource: revenueBySource,
      },
    });
  } catch (error) {
    console.error('Get instructor earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings data',
    });
  }
});

/**
 * @route   POST /api/instructor/earnings/payout-request
 * @desc    Request payout of available balance
 * @access  Private (Verified instructors only)
 */
router.post('/earnings/payout-request', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (user.instructorVerification.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only verified instructors can request payouts',
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount',
      });
    }

    // Check if sufficient balance
    if (amount > user.earnings.availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available balance',
        availableBalance: user.earnings.availableBalance,
      });
    }

    // Check payout method configured
    if (!user.earnings.payoutMethod || user.earnings.payoutMethod === 'not_set') {
      return res.status(400).json({
        success: false,
        message: 'Please configure payout method first',
      });
    }

    // Request payout (moves to pending)
    await user.requestPayout(amount);

    // TODO: Create payout record in database
    // TODO: Send notification to admin
    // TODO: Integrate with Stripe Connect or PayPal

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        amount,
        availableBalance: user.earnings.availableBalance,
        pendingBalance: user.earnings.pendingBalance,
      },
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payout request',
    });
  }
});

export default router;
