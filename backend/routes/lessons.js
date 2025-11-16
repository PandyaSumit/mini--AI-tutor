import express from 'express';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/lessons
 * @desc    Get all lessons for a module
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const lessons = await Lesson.find({ module: req.params.moduleId })
      .sort({ order: 1 });

    res.json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/lessons/:id
 * @desc    Get single lesson
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('module', 'title course')
      .populate('metadata.prerequisites', 'title');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/lessons
 * @desc    Create new lesson
 * @access  Private (creator only)
 */
router.post('/', protect, async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create lesson in this module'
      });
    }

    const lessonData = {
      ...req.body,
      module: req.params.moduleId
    };

    const lesson = await Lesson.create(lessonData);

    // Update module and course statistics
    await module.updateStatistics();
    const course = await Course.findById(req.params.courseId);
    await course.updateStatistics();

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/lessons/:id
 * @desc    Update lesson
 * @access  Private (creator only)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id)
      .populate({
        path: 'module',
        populate: { path: 'course' }
      });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check ownership
    if (lesson.module.course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lesson'
      });
    }

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update module and course statistics
    const module = await Module.findById(req.params.moduleId);
    await module.updateStatistics();
    const course = await Course.findById(req.params.courseId);
    await course.updateStatistics();

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/courses/:courseId/modules/:moduleId/lessons/:id
 * @desc    Delete lesson
 * @access  Private (creator only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate({
        path: 'module',
        populate: { path: 'course' }
      });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check ownership
    if (lesson.module.course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lesson'
      });
    }

    await lesson.deleteOne();

    // Update module and course statistics
    const module = await Module.findById(req.params.moduleId);
    await module.updateStatistics();
    const course = await Course.findById(req.params.courseId);
    await course.updateStatistics();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/lessons/:id/ai-context
 * @desc    Get AI context for a lesson (used in sessions)
 * @access  Private
 */
router.get('/:id/ai-context', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    const context = lesson.getAIContext();

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
