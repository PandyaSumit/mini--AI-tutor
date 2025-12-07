# Role-Based Access Control (RBAC) System Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Roles & Hierarchy](#roles--hierarchy)
- [Permissions](#permissions)
- [Permission Service](#permission-service)
- [Middleware](#middleware)
- [User Model Methods](#user-model-methods)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

---

## Overview

The Mini AI Tutor RBAC system provides a comprehensive, centralized, and scalable permission management system that:

✅ **Centralized Logic** - All permission checks in one place
✅ **Granular Control** - Fine-grained permissions for specific actions
✅ **Role-Based** - Four-tier role hierarchy with permission inheritance
✅ **Resource Ownership** - Automatic ownership checking
✅ **Flexible** - Easy to add new roles and permissions
✅ **Type-Safe** - Permission constants prevent typos
✅ **Auditable** - Clear permission requirements for all actions

---

## Architecture

The RBAC system consists of 4 main components:

```
┌─────────────────────────────────────────┐
│      1. Permission Definitions          │
│   (config/permissions.js)               │
│   - Define all permissions              │
│   - Map roles to permissions            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      2. Permission Service              │
│   (services/permissionService.js)       │
│   - Check permissions                   │
│   - Check ownership                     │
│   - Validate access                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      3. RBAC Middleware                 │
│   (middleware/rbacMiddleware.js)        │
│   - Route protection                    │
│   - Permission enforcement              │
│   - Resource authorization              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      4. User Model Methods              │
│   (models/User.js)                      │
│   - User permission checks              │
│   - Ownership validation                │
│   - Role helpers                        │
└─────────────────────────────────────────┘
```

---

## Roles & Hierarchy

### Role Definitions

| Role | Level | Description |
|------|-------|-------------|
| **learner** | 1 | Default role - can learn, create study materials, use AI (limited) |
| **verified_instructor** | 2 | Can create courses, earn revenue, higher AI quotas |
| **platform_author** | 3 | Official content creators, unlimited AI, higher privileges |
| **admin** | 4 | Full access to all features and data |

### Role Hierarchy

```
admin (Level 4)
  ↓ inherits from
platform_author (Level 3)
  ↓ inherits from
verified_instructor (Level 2)
  ↓ inherits from
learner (Level 1)
```

**Inheritance Rule:** Higher roles automatically have ALL permissions of lower roles.

---

## Permissions

### Permission Naming Convention

Format: `<resource>:<action>`

Examples:
- `course:create` - Create a course
- `user:view_own_profile` - View own user profile
- `analytics:view_platform` - View platform-wide analytics

### Permission Categories

#### 1. Course Permissions

```javascript
PERMISSIONS.COURSE = {
  VIEW_OWN: 'course:view_own',
  VIEW_ALL: 'course:view_all',
  VIEW_PUBLISHED: 'course:view_published',
  VIEW_DRAFT: 'course:view_draft',
  VIEW_ANALYTICS: 'course:view_analytics',

  CREATE: 'course:create',
  CREATE_MARKETPLACE: 'course:create_marketplace',

  EDIT_OWN: 'course:edit_own',
  EDIT_ALL: 'course:edit_all',
  EDIT_AS_COLLABORATOR: 'course:edit_as_collaborator',

  DELETE_OWN: 'course:delete_own',
  DELETE_ALL: 'course:delete_all',

  PUBLISH: 'course:publish',
  UNPUBLISH: 'course:unpublish',

  MODERATE: 'course:moderate',
  APPROVE: 'course:approve',
  REJECT: 'course:reject',

  INVITE_COLLABORATORS: 'course:invite_collaborators',
  APPROVE_COLLABORATORS: 'course:approve_collaborators',
  MANAGE_REVENUE_SHARE: 'course:manage_revenue_share',
};
```

#### 2. User Permissions

```javascript
PERMISSIONS.USER = {
  VIEW_OWN_PROFILE: 'user:view_own_profile',
  VIEW_ANY_PROFILE: 'user:view_any_profile',
  VIEW_USER_LIST: 'user:view_list',

  EDIT_OWN_PROFILE: 'user:edit_own_profile',
  EDIT_ANY_PROFILE: 'user:edit_any_profile',

  DELETE_OWN_ACCOUNT: 'user:delete_own_account',
  DELETE_ANY_ACCOUNT: 'user:delete_any_account',

  CHANGE_ROLE: 'user:change_role',
  GRANT_PERMISSIONS: 'user:grant_permissions',

  VERIFY_INSTRUCTOR: 'user:verify_instructor',
  VERIFY_KYC: 'user:verify_kyc',
};
```

#### 3. AI Usage Permissions

```javascript
PERMISSIONS.AI = {
  CHAT_BASIC: 'ai:chat_basic',
  CHAT_ADVANCED: 'ai:chat_advanced',
  VOICE_SESSION: 'ai:voice_session',
  GENERATE_COURSE: 'ai:generate_course',
  UNLIMITED_USAGE: 'ai:unlimited_usage',
  VIEW_OWN_USAGE: 'ai:view_own_usage',
  VIEW_ALL_USAGE: 'ai:view_all_usage',
};
```

#### 4. Analytics Permissions

```javascript
PERMISSIONS.ANALYTICS = {
  VIEW_OWN: 'analytics:view_own',
  VIEW_COURSE: 'analytics:view_course',
  VIEW_PLATFORM: 'analytics:view_platform',
};
```

#### 5. Admin Panel Permissions

```javascript
PERMISSIONS.ADMIN = {
  ACCESS_PANEL: 'admin:access_panel',
  MANAGE_USERS: 'admin:manage_users',
  MANAGE_COURSES: 'admin:manage_courses',
  MANAGE_CONTENT: 'admin:manage_content',
  VIEW_LOGS: 'admin:view_logs',
  MODERATE_CONTENT: 'admin:moderate_content',
  MANAGE_BILLING: 'admin:manage_billing',
  MANAGE_SETTINGS: 'admin:manage_settings',
};
```

### Complete Permission List

See `backend/config/permissions.js` for the complete list of all 80+ permissions across:
- Course (17 permissions)
- User (11 permissions)
- Enrollment (6 permissions)
- AI (7 permissions)
- Analytics (3 permissions)
- Admin (8 permissions)
- Content (9 permissions)
- Flashcard (4 permissions)
- Roadmap (5 permissions)
- Conversation (5 permissions)
- Earnings (4 permissions)
- Contributor (4 permissions)

---

## Permission Service

The `permissionService` provides centralized permission checking logic.

### Core Methods

#### hasPermission(user, permission)
Check if a user has a specific permission.

```javascript
import permissionService from '../services/permissionService.js';
import { PERMISSIONS } from '../config/permissions.js';

// Check if user can create courses
if (permissionService.hasPermission(req.user, PERMISSIONS.COURSE.CREATE)) {
  // User can create courses
}
```

#### hasAnyPermission(user, permissions)
Check if user has ANY of the specified permissions.

```javascript
const canView = permissionService.hasAnyPermission(req.user, [
  PERMISSIONS.COURSE.VIEW_OWN,
  PERMISSIONS.COURSE.VIEW_ALL
]);
```

#### hasAllPermissions(user, permissions)
Check if user has ALL of the specified permissions.

```javascript
const canManage = permissionService.hasAllPermissions(req.user, [
  PERMISSIONS.COURSE.EDIT_OWN,
  PERMISSIONS.COURSE.PUBLISH
]);
```

#### isOwner(user, resource)
Check if user owns a resource.

```javascript
if (permissionService.isOwner(req.user, course)) {
  // User owns this course
}
```

#### canEdit(user, resource, editPermission)
Check if user can edit a resource (combines ownership + permission).

```javascript
if (permissionService.canEdit(req.user, course, PERMISSIONS.COURSE.EDIT_OWN)) {
  // User can edit this course
}
```

#### canDelete(user, resource, deletePermission)
Check if user can delete a resource.

```javascript
if (permissionService.canDelete(req.user, course, PERMISSIONS.COURSE.DELETE_OWN)) {
  // User can delete this course
}
```

#### isCourseCollaborator(user, course, allowedTypes)
Check if user is a course collaborator.

```javascript
if (permissionService.isCourseCollaborator(req.user, course, ['founder', 'co-creator'])) {
  // User is founder or co-creator
}
```

#### checkAIQuota(user, quotaType)
Check AI usage quota.

```javascript
const quotaCheck = permissionService.checkAIQuota(req.user, 'chatMessages');
if (quotaCheck.allowed) {
  // User has quota available
  console.log(`Remaining: ${quotaCheck.remaining}`);
}
```

---

## Middleware

The RBAC middleware provides route-level protection.

### Permission-Based Middleware

#### requirePermission(permission, options)

Require a specific permission to access a route.

```javascript
import { requirePermission, PERMISSIONS } from '../middleware/rbacMiddleware.js';

// Only users with course:create permission can access
router.post('/courses',
  protect,
  requirePermission(PERMISSIONS.COURSE.CREATE),
  createCourse
);
```

#### requireAnyPermission(permissions, options)

Require ANY of the specified permissions.

```javascript
import { requireAnyPermission, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.get('/courses/:id',
  protect,
  requireAnyPermission([
    PERMISSIONS.COURSE.VIEW_OWN,
    PERMISSIONS.COURSE.VIEW_ALL
  ]),
  getCourse
);
```

#### requireAllPermissions(permissions, options)

Require ALL of the specified permissions.

```javascript
router.put('/courses/:id/publish',
  protect,
  requireAllPermissions([
    PERMISSIONS.COURSE.EDIT_OWN,
    PERMISSIONS.COURSE.PUBLISH
  ]),
  publishCourse
);
```

### Role-Based Middleware

#### requireRole(role, options)

Require a specific role.

```javascript
import { requireRole, ROLES } from '../middleware/rbacMiddleware.js';

router.get('/admin/dashboard',
  protect,
  requireRole(ROLES.ADMIN),
  getAdminDashboard
);
```

#### requireAnyRole(roles, options)

Require ANY of the specified roles.

```javascript
router.post('/courses',
  protect,
  requireAnyRole([
    ROLES.VERIFIED_INSTRUCTOR,
    ROLES.PLATFORM_AUTHOR,
    ROLES.ADMIN
  ]),
  createCourse
);
```

### Resource Ownership Middleware

#### checkOwnership(fetchResource, options)

Check if user owns a resource.

```javascript
import { checkOwnership } from '../middleware/rbacMiddleware.js';
import Course from '../models/Course.js';

router.put('/courses/:id',
  protect,
  checkOwnership(
    async (req) => await Course.findById(req.params.id)
  ),
  updateCourse
);
```

#### checkCanEdit(fetchResource, editPermission, options)

Check if user can edit a resource.

```javascript
import { checkCanEdit, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.put('/courses/:id',
  protect,
  checkCanEdit(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.EDIT_OWN
  ),
  updateCourse
);
```

#### checkCanDelete(fetchResource, deletePermission, options)

Check if user can delete a resource.

```javascript
router.delete('/courses/:id',
  protect,
  checkCanDelete(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.DELETE_OWN
  ),
  deleteCourse
);
```

### Course-Specific Middleware

#### checkCanEditCourse(options)

Check if user can edit a course (founder, co-creator, or admin).

```javascript
import { checkCanEditCourse } from '../middleware/rbacMiddleware.js';

router.put('/courses/:courseId/modules',
  protect,
  checkCanEditCourse(),
  addModule
);
```

#### checkCourseFounder(options)

Ensure user is the course founder.

```javascript
import { checkCourseFounder } from '../middleware/rbacMiddleware.js';

router.post('/courses/:courseId/approve-co-creator',
  protect,
  checkCourseFounder(),
  approveCoCreator
);
```

### AI Quota Middleware

#### checkAIQuota(quotaType, options)

Check AI usage quota before processing request.

```javascript
import { checkAIQuota } from '../middleware/rbacMiddleware.js';

router.post('/ai/chat',
  protect,
  checkAIQuota('chatMessages'),
  sendAIMessage
);

router.post('/ai/voice',
  protect,
  checkAIQuota('voiceMinutes'),
  startVoiceSession
);
```

---

## User Model Methods

The User model includes RBAC helper methods.

### Permission Checking Methods

```javascript
// Check if user has a permission
if (user.hasPermission(PERMISSIONS.COURSE.CREATE)) {
  // User can create courses
}

// Check if user has any permission
if (user.hasAnyPermission([PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.EDIT_ALL])) {
  // User can edit courses
}

// Check if user has all permissions
if (user.hasAllPermissions([PERMISSIONS.COURSE.CREATE, PERMISSIONS.COURSE.PUBLISH])) {
  // User can create and publish
}
```

### Resource Methods

```javascript
// Check ownership
if (user.ownsResource(course)) {
  // User owns this course
}

// Check if can edit
if (user.canEditResource(course, PERMISSIONS.COURSE.EDIT_OWN)) {
  // User can edit this course
}

// Check if can delete
if (user.canDeleteResource(course, PERMISSIONS.COURSE.DELETE_OWN)) {
  // User can delete this course
}
```

### Role Helper Methods

```javascript
// Check if admin
if (user.isAdmin()) {
  // User is admin
}

// Check if instructor
if (user.isInstructor()) {
  // User is verified_instructor, platform_author, or admin
}

// Check if platform author
if (user.isPlatformAuthor()) {
  // User is platform_author or admin
}
```

### Get All Permissions

```javascript
const permissions = user.getAllPermissions();
// Returns array of all permissions for this user
```

---

## Usage Examples

### Example 1: Create Course Endpoint

```javascript
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.post('/courses',
  protect, // Ensure user is authenticated
  requirePermission(PERMISSIONS.COURSE.CREATE), // Check permission
  async (req, res) => {
    try {
      const course = await Course.create({
        ...req.body,
        instructor: req.user._id
      });

      res.status(201).json({
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
```

### Example 2: Edit Course Endpoint

```javascript
import { checkCanEdit, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.put('/courses/:id',
  protect,
  checkCanEdit(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.EDIT_OWN,
    { message: 'You can only edit your own courses' }
  ),
  async (req, res) => {
    try {
      // req.resource contains the fetched course
      const course = req.resource;

      Object.assign(course, req.body);
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
```

### Example 3: Admin-Only Endpoint

```javascript
import { requireRole, ROLES } from '../middleware/rbacMiddleware.js';

router.get('/admin/users',
  protect,
  requireRole(ROLES.ADMIN),
  async (req, res) => {
    try {
      const users = await User.find();

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);
```

### Example 4: Multiple Role Access

```javascript
import { requireAnyRole, ROLES } from '../middleware/rbacMiddleware.js';

router.post('/courses',
  protect,
  requireAnyRole([
    ROLES.VERIFIED_INSTRUCTOR,
    ROLES.PLATFORM_AUTHOR,
    ROLES.ADMIN
  ]),
  createCourse
);
```

### Example 5: AI Quota Check

```javascript
import { checkAIQuota } from '../middleware/rbacMiddleware.js';

router.post('/ai/chat',
  protect,
  checkAIQuota('chatMessages'),
  async (req, res) => {
    try {
      // req.aiQuota contains quota information
      const { remaining, limit } = req.aiQuota;

      // Process AI request...
      const response = await processAIChat(req.body.message);

      // Consume quota
      await req.user.consumeAIQuota('chatMessages', 1);

      res.json({
        success: true,
        data: response,
        quota: {
          remaining: remaining - 1,
          limit
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
```

### Example 6: Course Collaborator Check

```javascript
import { checkCanEditCourse } from '../middleware/rbacMiddleware.js';

router.post('/courses/:courseId/modules',
  protect,
  checkCanEditCourse({ message: 'Only course collaborators can add modules' }),
  async (req, res) => {
    try {
      const module = await Module.create({
        course: req.course._id,
        ...req.body
      });

      res.status(201).json({
        success: true,
        data: module
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);
```

---

## Best Practices

### 1. Always Use Permission Constants

❌ **Bad:**
```javascript
requirePermission('course:create')
```

✅ **Good:**
```javascript
import { PERMISSIONS } from '../middleware/rbacMiddleware.js';
requirePermission(PERMISSIONS.COURSE.CREATE)
```

### 2. Combine Middleware for Clarity

✅ **Good:**
```javascript
router.put('/courses/:id',
  protect,                                    // Authentication
  checkCanEdit(fetchCourse, PERMISSIONS.COURSE.EDIT_OWN), // Authorization
  updateCourse                                // Handler
);
```

### 3. Use Resource-Specific Middleware

Instead of manual checks in controllers, use middleware:

❌ **Bad:**
```javascript
async function updateCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  // ...
}
```

✅ **Good:**
```javascript
router.put('/courses/:id',
  protect,
  checkOwnership(async (req) => await Course.findById(req.params.id)),
  updateCourse
);

async function updateCourse(req, res) {
  // req.resource already validated and loaded
  const course = req.resource;
  // ...
}
```

### 4. Permission Over Role Checks

Prefer permission checks over role checks for flexibility:

❌ **Less Flexible:**
```javascript
if (user.role === 'admin') {
  // Allow action
}
```

✅ **More Flexible:**
```javascript
if (user.hasPermission(PERMISSIONS.COURSE.EDIT_ALL)) {
  // Allow action - works for any role with this permission
}
```

### 5. Document Permission Requirements

Add comments to explain why a permission is required:

```javascript
router.put('/courses/:id/publish',
  protect,
  // Only founders and admins can publish courses
  checkCourseFounder({ message: 'Only the course founder can publish' }),
  publishCourse
);
```

### 6. Handle Permission Errors Gracefully

Provide clear error messages:

```javascript
requirePermission(PERMISSIONS.COURSE.CREATE, {
  message: 'You need to be a verified instructor to create courses'
})
```

---

## Migration Guide

### Migrating Existing Routes

#### Step 1: Replace Old Auth Middleware

**Before:**
```javascript
import { authorize } from '../middleware/authMiddleware.js';

router.post('/courses', protect, authorize('admin', 'instructor'), createCourse);
```

**After:**
```javascript
import { requirePermission, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.post('/courses',
  protect,
  requirePermission(PERMISSIONS.COURSE.CREATE),
  createCourse
);
```

#### Step 2: Replace Manual Permission Checks

**Before:**
```javascript
async function updateCourse(req, res) {
  const course = await Course.findById(req.params.id);

  if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Update course...
}
```

**After:**
```javascript
import { checkCanEdit, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.put('/courses/:id',
  protect,
  checkCanEdit(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.EDIT_OWN
  ),
  updateCourse
);

async function updateCourse(req, res) {
  // No need for manual checks - middleware handles it
  const course = req.resource;

  // Update course...
}
```

#### Step 3: Add AI Quota Checks

**Before:**
```javascript
async function sendAIMessage(req, res) {
  // No quota check
  const response = await processAI(req.body.message);
  res.json({ data: response });
}
```

**After:**
```javascript
import { checkAIQuota } from '../middleware/rbacMiddleware.js';

router.post('/ai/chat',
  protect,
  checkAIQuota('chatMessages'),
  sendAIMessage
);

async function sendAIMessage(req, res) {
  const response = await processAI(req.body.message);

  // Consume quota after successful request
  await req.user.consumeAIQuota('chatMessages', 1);

  res.json({
    data: response,
    quota: req.aiQuota
  });
}
```

---

## Adding New Permissions

### Step 1: Define the Permission

Add to `backend/config/permissions.js`:

```javascript
export const PERMISSIONS = {
  // ... existing permissions

  QUIZ: {
    CREATE: 'quiz:create',
    EDIT_OWN: 'quiz:edit_own',
    EDIT_ALL: 'quiz:edit_all',
    DELETE_OWN: 'quiz:delete_own',
    TAKE: 'quiz:take',
  },
};
```

### Step 2: Assign to Roles

```javascript
export const ROLE_PERMISSIONS = {
  [ROLES.LEARNER]: [
    // ... existing permissions
    PERMISSIONS.QUIZ.TAKE,
  ],

  [ROLES.VERIFIED_INSTRUCTOR]: [
    ...ROLE_PERMISSIONS[ROLES.LEARNER],
    PERMISSIONS.QUIZ.CREATE,
    PERMISSIONS.QUIZ.EDIT_OWN,
    PERMISSIONS.QUIZ.DELETE_OWN,
  ],

  [ROLES.ADMIN]: [
    ...ROLE_PERMISSIONS[ROLES.PLATFORM_AUTHOR],
    PERMISSIONS.QUIZ.EDIT_ALL,
  ],
};
```

### Step 3: Use in Routes

```javascript
import { requirePermission, PERMISSIONS } from '../middleware/rbacMiddleware.js';

router.post('/quizzes',
  protect,
  requirePermission(PERMISSIONS.QUIZ.CREATE),
  createQuiz
);
```

---

## Security Considerations

### 1. Backend Enforcement

**Always enforce permissions on the backend.** Frontend permission checks are for UX only.

❌ **Bad:**
```javascript
// Only frontend check - users can bypass
if (user.role === 'admin') {
  <AdminPanel />
}
```

✅ **Good:**
```javascript
// Backend enforces with middleware
router.get('/admin/panel', protect, requireRole(ROLES.ADMIN), getAdminPanel);
```

### 2. Resource Ownership

Always verify ownership for user-specific resources:

```javascript
router.delete('/courses/:id',
  protect,
  checkOwnership(async (req) => await Course.findById(req.params.id)),
  deleteCourse
);
```

### 3. Admin Actions

Log all admin actions for audit trail:

```javascript
import { logAdminAction } from '../middleware/adminMiddleware.js';

router.delete('/users/:id',
  protect,
  requireRole(ROLES.ADMIN),
  logAdminAction('delete_user'),
  deleteUser
);
```

### 4. Rate Limiting

Combine RBAC with rate limiting:

```javascript
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

router.post('/ai/chat',
  protect,
  aiLimiter,
  checkAIQuota('chatMessages'),
  sendAIMessage
);
```

---

## Testing RBAC

### Unit Tests

```javascript
import { expect } from 'chai';
import permissionService from '../services/permissionService.js';
import { PERMISSIONS, ROLES } from '../config/permissions.js';

describe('Permission Service', () => {
  it('should grant admin all permissions', () => {
    const adminUser = { role: ROLES.ADMIN };
    expect(permissionService.hasPermission(adminUser, PERMISSIONS.COURSE.CREATE)).to.be.true;
    expect(permissionService.hasPermission(adminUser, PERMISSIONS.USER.DELETE_ANY_ACCOUNT)).to.be.true;
  });

  it('should restrict learner permissions', () => {
    const learner = { role: ROLES.LEARNER };
    expect(permissionService.hasPermission(learner, PERMISSIONS.COURSE.VIEW_PUBLISHED)).to.be.true;
    expect(permissionService.hasPermission(learner, PERMISSIONS.COURSE.CREATE)).to.be.false;
  });

  it('should check ownership correctly', () => {
    const user = { _id: '123', role: ROLES.LEARNER };
    const resource = { user: '123' };
    expect(permissionService.isOwner(user, resource)).to.be.true;
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../server.js';

describe('Course Routes', () => {
  it('should deny course creation for learners', async () => {
    const learnerToken = 'learner_jwt_token';

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ title: 'Test Course' });

    expect(res.status).to.equal(403);
    expect(res.body.error).to.include('permission');
  });

  it('should allow course creation for instructors', async () => {
    const instructorToken = 'instructor_jwt_token';

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Test Course' });

    expect(res.status).to.equal(201);
  });
});
```

---

## Summary

The RBAC system provides:

✅ **80+ Granular Permissions** across 12 resource categories
✅ **4-Tier Role Hierarchy** with automatic inheritance
✅ **Centralized Permission Logic** in one service
✅ **10+ Middleware Functions** for route protection
✅ **User Model Methods** for easy permission checks
✅ **Resource Ownership Validation** built-in
✅ **AI Quota Management** integrated
✅ **Type-Safe Permission Constants** prevent errors
✅ **Flexible & Extensible** - easy to add new permissions

**Questions?** See the inline code documentation in:
- `backend/config/permissions.js`
- `backend/services/permissionService.js`
- `backend/middleware/rbacMiddleware.js`
- `backend/models/User.js`

---

**Last Updated:** December 7, 2025
**Version:** 1.0.0
