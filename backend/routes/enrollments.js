import express from 'express';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/enrollments
 * @desc    Get user's enrollments
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;

    const enrollments = await Enrollment.findByUser(req.user._id, status);

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/enrollments/:courseId
 * @desc    Get specific enrollment details
 * @access  Private
 */
router.get('/:courseId', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    })
      .populate('course')
      .populate('progress.currentLesson')
      .populate('progress.completedLessons.lesson');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enrollments/:courseId/lesson/:lessonId/complete
 * @desc    Mark lesson as completed
 * @access  Private
 */
router.put('/:courseId/lesson/:lessonId/complete', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    const { timeSpent } = req.body;

    await enrollment.completeLesson(req.params.lessonId, timeSpent || 0);

    // Update lesson statistics
    const lesson = await Lesson.findById(req.params.lessonId);
    if (lesson) {
      await lesson.recordCompletion(timeSpent || 0);
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enrollments/:courseId/current-lesson
 * @desc    Update current lesson
 * @access  Private
 */
router.put('/:courseId/current-lesson', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    const { lessonId } = req.body;

    await enrollment.updateCurrentLesson(lessonId);

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/enrollments/:courseId/progress
 * @desc    Get enrollment progress summary
 * @access  Private
 */
router.get('/:courseId/progress', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    }).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    const progressSummary = {
      completionPercentage: enrollment.progress.completionPercentage,
      completedLessons: enrollment.progress.completedLessons.length,
      totalLessons: enrollment.course.statistics.totalLessons,
      totalTimeSpent: enrollment.progress.totalTimeSpent,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
      completedAt: enrollment.completedAt
    };

    res.json({
      success: true,
      data: progressSummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
