import express from 'express';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/courses/:courseId/modules
 * @desc    Get all modules for a course
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .sort({ order: 1 });

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:courseId/modules/:id
 * @desc    Get single module with lessons
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate({
        path: 'lessons',
        options: { sort: { order: 1 } }
      });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/courses/:courseId/modules
 * @desc    Create new module
 * @access  Private (instructor only)
 */
router.post('/', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create module in this course'
      });
    }

    const moduleData = {
      ...req.body,
      course: req.params.courseId
    };

    const module = await Module.create(moduleData);

    // Update course statistics
    await course.updateStatistics();

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/courses/:courseId/modules/:id
 * @desc    Update module
 * @access  Private (instructor only)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this module'
      });
    }

    module = await Module.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update course statistics
    const course = await Course.findById(req.params.courseId);
    await course.updateStatistics();

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/courses/:courseId/modules/:id
 * @desc    Delete module
 * @access  Private (instructor only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this module'
      });
    }

    await module.deleteOne();

    // Update course statistics
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

export default router;
