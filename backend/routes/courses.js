import express from 'express';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Enrollment from '../models/Enrollment.js';
import { protect } from '../middleware/authMiddleware.js';
import courseGenerator from '../services/courseGenerator.js';

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all published courses or user's courses
 * @access  Public/Private
 */
router.get('/', async (req, res) => {
  try {
    const { category, level, search, myCreated } = req.query;

    let query = {};

    // If fetching user's created courses (requires auth)
    if (myCreated && req.user) {
      query.createdBy = req.user._id;
    } else {
      // Public courses must be published
      query.isPublished = true;
    }

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .populate('contributors.user', 'name email')
      .sort({ 'statistics.enrollmentCount': -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course with modules
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('contributors.user', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get modules with lessons
    const modules = await Module.findByCourseWithLessons(course._id);

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        modules
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
 * @route   POST /api/courses/generate
 * @desc    Generate course using AI
 * @access  Private
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { prompt, level, numModules, lessonsPerModule } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await courseGenerator.generateCourse(prompt, req.user._id, {
      level,
      numModules,
      lessonsPerModule
    });

    res.status(201).json({
      success: true,
      data: result.course,
      message: 'Course generated successfully. You can now review and publish it.'
    });
  } catch (error) {
    console.error('Error in AI course generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate course'
    });
  }
});

/**
 * @route   POST /api/courses/generate/preview
 * @desc    Generate course preview (without saving)
 * @access  Private
 */
router.post('/generate/preview', protect, async (req, res) => {
  try {
    const { prompt, level, numModules } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const preview = await courseGenerator.generatePreview(prompt, level, numModules);

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate preview'
    });
  }
});

/**
 * @route   POST /api/courses/check-similar
 * @desc    Check for similar existing courses
 * @access  Private
 */
router.post('/check-similar', protect, async (req, res) => {
  try {
    const { prompt, level } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const similarCourses = await courseGenerator.findSimilarCourses(prompt, level);

    res.json({
      success: true,
      data: {
        similarCourses,
        hasSimilarCourses: similarCourses.length > 0,
        highSimilarity: similarCourses.some(c => c.similarityScore >= 85)
      }
    });
  } catch (error) {
    console.error('Error checking similar courses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check similar courses'
    });
  }
});

/**
 * @route   POST /api/courses
 * @desc    Create new course manually
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user._id,
      // Automatically add the creator as the founder
      contributors: [{
        user: req.user._id,
        contributionType: 'founder',
        contributionDate: new Date(),
        contributionScore: 100,
        revenueShare: 60, // Founders start at 60%
        approvalStatus: 'approved'
      }]
    };

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (creator only)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (creator only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this course'
      });
    }

    await course.deleteOne();

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
 * @route   POST /api/courses/:id/publish
 * @desc    Publish course
 * @access  Private (creator only)
 */
router.post('/:id/publish', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to publish this course'
      });
    }

    await course.publish();

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in course
 * @access  Private
 */
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        error: 'Course is not published'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: course._id
    });

    // Update course enrollment count
    course.statistics.enrollmentCount += 1;
    await course.save();

    res.status(201).json({
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

export default router;
