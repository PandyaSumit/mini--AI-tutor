/**
 * Example Routes with RBAC Implementation
 *
 * This file demonstrates how to use the RBAC system in your routes
 * Copy these patterns to your actual route files
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  checkOwnership,
  checkCanEdit,
  checkCanDelete,
  checkCanEditCourse,
  checkCourseFounder,
  checkAIQuota,
  requirePermissionOrOwnership,
  PERMISSIONS,
  ROLES,
} from '../middleware/rbacMiddleware.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Flashcard from '../models/Flashcard.js';

const router = express.Router();

// ===================================================
// EXAMPLE 1: Simple Permission Check
// ===================================================

/**
 * Create a new course
 * Requires: course:create permission
 * Allowed roles: verified_instructor, platform_author, admin
 */
router.post('/courses',
  protect, // Ensure user is authenticated
  requirePermission(PERMISSIONS.COURSE.CREATE), // Check permission
  async (req, res) => {
    try {
      const course = await Course.create({
        ...req.body,
        instructor: req.user._id,
        contributors: [{
          user: req.user._id,
          contributionType: 'founder',
          revenueShare: 100
        }]
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 2: Multiple Permission Options (OR logic)
// ===================================================

/**
 * View a course
 * Requires: ANY of (course:view_own, course:view_all, course:view_published)
 */
router.get('/courses/:id',
  protect,
  requireAnyPermission([
    PERMISSIONS.COURSE.VIEW_OWN,
    PERMISSIONS.COURSE.VIEW_ALL,
    PERMISSIONS.COURSE.VIEW_PUBLISHED
  ]),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

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
  }
);

// ===================================================
// EXAMPLE 3: Multiple Permissions Required (AND logic)
// ===================================================

/**
 * Publish a course
 * Requires: BOTH course:edit_own AND course:publish permissions
 */
router.put('/courses/:id/publish',
  protect,
  requireAllPermissions([
    PERMISSIONS.COURSE.EDIT_OWN,
    PERMISSIONS.COURSE.PUBLISH
  ]),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      // Additional check: user must own the course
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only publish your own courses'
        });
      }

      course.isPublished = true;
      course.publishedAt = new Date();
      await course.save();

      res.json({
        success: true,
        data: course,
        message: 'Course published successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 4: Role-Based Access
// ===================================================

/**
 * Access admin dashboard
 * Requires: admin role
 */
router.get('/admin/dashboard',
  protect,
  requireRole(ROLES.ADMIN),
  async (req, res) => {
    try {
      // Fetch admin dashboard data
      const stats = {
        totalUsers: await User.countDocuments(),
        totalCourses: await Course.countDocuments(),
        // ... more stats
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * Access instructor panel
 * Requires: ANY of (verified_instructor, platform_author, admin) roles
 */
router.get('/instructor/dashboard',
  protect,
  requireAnyRole([
    ROLES.VERIFIED_INSTRUCTOR,
    ROLES.PLATFORM_AUTHOR,
    ROLES.ADMIN
  ]),
  async (req, res) => {
    try {
      // Fetch instructor-specific data
      const courses = await Course.find({ instructor: req.user._id });

      res.json({
        success: true,
        data: {
          courses,
          instructorStats: {
            totalCourses: courses.length,
            totalStudents: courses.reduce((sum, c) => sum + c.enrollmentCount, 0)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 5: Ownership Check
// ===================================================

/**
 * Update a course
 * Requires: User must own the course
 * Middleware handles resource fetching and ownership verification
 */
router.put('/courses/:id',
  protect,
  checkOwnership(
    async (req) => await Course.findById(req.params.id),
    { message: 'You can only update your own courses' }
  ),
  async (req, res) => {
    try {
      // req.resource contains the validated course
      const course = req.resource;

      // Update course
      Object.assign(course, req.body);
      await course.save();

      res.json({
        success: true,
        data: course,
        message: 'Course updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 6: Advanced - Edit Permission + Ownership
// ===================================================

/**
 * Edit a course
 * Combines ownership check with edit permission
 * Admins can edit any course, others can only edit their own
 */
router.put('/courses/:id/content',
  protect,
  checkCanEdit(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.EDIT_OWN,
    { message: 'You don\'t have permission to edit this course' }
  ),
  async (req, res) => {
    try {
      const course = req.resource;

      // Update specific content
      course.content = req.body.content;
      await course.save();

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
  }
);

// ===================================================
// EXAMPLE 7: Delete Permission + Ownership
// ===================================================

/**
 * Delete a course
 * Combines ownership check with delete permission
 */
router.delete('/courses/:id',
  protect,
  checkCanDelete(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.DELETE_OWN,
    { message: 'You don\'t have permission to delete this course' }
  ),
  async (req, res) => {
    try {
      const course = req.resource;

      await course.deleteOne();

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 8: Course Collaborator Check
// ===================================================

/**
 * Add a module to a course
 * Requires: User must be course founder, co-creator, or admin
 */
router.post('/courses/:courseId/modules',
  protect,
  checkCanEditCourse({ message: 'Only course collaborators can add modules' }),
  async (req, res) => {
    try {
      // req.course contains the validated course
      const course = req.course;

      // Create and add module
      const module = {
        title: req.body.title,
        description: req.body.description,
        order: course.modules.length + 1
      };

      course.modules.push(module);
      await course.save();

      res.status(201).json({
        success: true,
        data: module,
        message: 'Module added successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 9: Founder-Only Action
// ===================================================

/**
 * Approve a co-creator request
 * Requires: User must be the course founder
 */
router.put('/courses/:courseId/co-creator/:userId/approve',
  protect,
  checkCourseFounder({ message: 'Only the course founder can approve co-creators' }),
  async (req, res) => {
    try {
      const course = req.course;
      const { userId } = req.params;

      // Find and approve contributor
      const contributor = course.contributors.find(
        c => c.user.toString() === userId && c.contributionType === 'co-creator'
      );

      if (!contributor) {
        return res.status(404).json({
          success: false,
          error: 'Co-creator request not found'
        });
      }

      contributor.approvalStatus = 'approved';
      contributor.approvedAt = new Date();

      await course.save();

      res.json({
        success: true,
        data: contributor,
        message: 'Co-creator approved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 10: AI Quota Check
// ===================================================

/**
 * Send AI chat message
 * Requires: User must have available AI quota
 */
router.post('/ai/chat',
  protect,
  checkAIQuota('chatMessages'),
  async (req, res) => {
    try {
      // req.aiQuota contains quota information
      const { remaining, limit } = req.aiQuota;

      // Process AI request
      const response = await processAIChat(req.body.message, req.user);

      // Consume quota
      await req.user.consumeAIQuota('chatMessages', 1);

      res.json({
        success: true,
        data: {
          response,
          quota: {
            remaining: remaining - 1,
            limit,
            percentage: ((remaining - 1) / limit) * 100
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * Start AI voice session
 * Requires: User must have available voice minutes quota
 */
router.post('/ai/voice/start',
  protect,
  checkAIQuota('voiceMinutes'),
  async (req, res) => {
    try {
      // Start voice session
      const session = await startVoiceSession(req.user);

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          quota: req.aiQuota
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 11: Permission OR Ownership
// ===================================================

/**
 * View user profile
 * Allows: User viewing own profile OR users with view_any_profile permission
 */
router.get('/users/:userId/profile',
  protect,
  requirePermissionOrOwnership(
    async (req) => await User.findById(req.params.userId),
    PERMISSIONS.USER.VIEW_ANY_PROFILE,
    { message: 'You can only view your own profile unless you have admin permissions' }
  ),
  async (req, res) => {
    try {
      const user = req.resource || await User.findById(req.params.userId);

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          reputation: user.reputation,
          // ... other profile fields
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 12: Custom Permission Logic in Controller
// ===================================================

/**
 * View flashcard deck
 * Custom permission check inside controller for complex logic
 */
router.get('/flashcards/:deckId',
  protect, // Only authenticate, permission check in controller
  async (req, res) => {
    try {
      const deck = await Flashcard.findById(req.params.deckId);

      if (!deck) {
        return res.status(404).json({
          success: false,
          error: 'Deck not found'
        });
      }

      // Custom permission logic
      const canView =
        req.user.ownsResource(deck) || // Owner can view
        req.user.hasPermission(PERMISSIONS.FLASHCARD.VIEW_OWN) || // Has view permission
        req.user.isAdmin() || // Admin can view all
        deck.isPublic; // Public decks visible to all

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'You don\'t have permission to view this deck'
        });
      }

      res.json({
        success: true,
        data: deck
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// EXAMPLE 13: Combining Multiple Middleware
// ===================================================

/**
 * Perform privileged course operation
 * Requires: Admin role AND specific permission AND AI quota check
 */
router.post('/courses/:courseId/generate-content',
  protect,
  requireRole(ROLES.ADMIN), // Must be admin
  requirePermission(PERMISSIONS.COURSE.EDIT_ALL), // Must have edit all permission
  checkAIQuota('courseGenerations'), // Must have AI quota
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      // Generate content with AI
      const generatedContent = await generateCourseContent(course, req.body.prompt);

      // Consume AI quota
      await req.user.consumeAIQuota('courseGenerations', 1);

      res.json({
        success: true,
        data: generatedContent,
        quota: req.aiQuota
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ===================================================
// HELPER FUNCTIONS (for demonstration)
// ===================================================

async function processAIChat(message, user) {
  // AI processing logic
  return {
    response: `AI response to: ${message}`,
    timestamp: new Date()
  };
}

async function startVoiceSession(user) {
  // Voice session logic
  return {
    id: Date.now().toString(),
    userId: user._id
  };
}

async function generateCourseContent(course, prompt) {
  // AI content generation logic
  return {
    content: 'Generated content...',
    prompt
  };
}

export default router;
