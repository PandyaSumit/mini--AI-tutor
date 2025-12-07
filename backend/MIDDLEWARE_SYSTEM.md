# Authentication & Authorization Middleware Documentation

**Comprehensive Guide to Enhanced Security Middleware**

This document covers the enhanced authentication, authorization, rate limiting, and audit logging middleware systems.

---

## Table of Contents

1. [Overview](#overview)
2. [Enhanced Authentication](#enhanced-authentication)
3. [Role-Based Rate Limiting](#role-based-rate-limiting)
4. [Audit Logging](#audit-logging)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Security Considerations](#security-considerations)

---

## Overview

The middleware system provides four layers of security:

```
┌─────────────────────────────────────────────────────────────┐
│                      Request Flow                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         1. AUTHENTICATION (Enhanced Auth Middleware)        │
│  - Extract & verify JWT token                               │
│  - Load user with role & permissions                        │
│  - Attach request context (IP, user agent)                  │
│  - Handle expired tokens gracefully                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         2. RATE LIMITING (Role-Based Limits)                │
│  - Check request count against role-based limits            │
│  - Different limits for different user roles                │
│  - Stricter limits on expensive operations                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         3. AUTHORIZATION (RBAC Middleware)                  │
│  - Check user permissions                                   │
│  - Verify resource ownership                                │
│  - Enforce role requirements                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         4. AUDIT LOGGING (Audit Middleware)                 │
│  - Log sensitive actions                                    │
│  - Track who did what, when, from where                     │
│  - Create compliance audit trail                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    Controller Handler
```

---

## Enhanced Authentication

### Files
- **Middleware**: `backend/middleware/enhancedAuthMiddleware.js`
- **Original**: `backend/middleware/authMiddleware.js` (preserved for compatibility)

### Features

✅ Token extraction from cookies or Authorization header
✅ Graceful error handling with specific error codes
✅ Optional authentication for public routes
✅ Request context tracking (IP, user agent, path)
✅ User enrichment with role and permissions
✅ Token expiration warnings
✅ Account status checking (banned/inactive)

### Core Middleware

#### 1. `protect` - Required Authentication

Validates token, loads user, attaches context.

```javascript
import { protect } from '../middleware/enhancedAuthMiddleware.js';

// Protect a route
router.get('/dashboard', protect, getDashboard);

// After protect middleware:
// req.user - User object (without password)
// req.context - Request context (ip, userAgent, method, path, timestamp)
```

**Error Responses:**

```javascript
// No token
{
  "success": false,
  "error": "Authentication required",
  "code": "NO_TOKEN",
  "message": "Please provide a valid authentication token"
}

// Token expired
{
  "success": false,
  "error": "Token has expired",
  "code": "TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again."
}

// Invalid token
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}

// User not found
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}

// Account inactive/banned
{
  "success": false,
  "error": "Account is banned",
  "code": "ACCOUNT_INACTIVE"
}
```

#### 2. `optionalAuth` - Optional Authentication

Attaches user if token is valid, continues if not.

```javascript
import { optionalAuth } from '../middleware/enhancedAuthMiddleware.js';

// Public route with enhanced features for logged-in users
router.get('/courses', optionalAuth, async (req, res) => {
  const courses = await Course.find({ isPublished: true });

  // Show additional details if user is logged in
  if (req.user) {
    courses.forEach(course => {
      course.isEnrolled = course.students.includes(req.user._id);
      course.canEdit = req.user.ownsResource(course);
    });
  }

  res.json({ success: true, data: courses });
});

// After optionalAuth:
// req.user - User object if authenticated, null otherwise
// req.context - Request context (always available)
```

#### 3. `attachRequestContext` - Add Context to Request

Adds IP, user agent, and other metadata to request.

```javascript
import { attachRequestContext } from '../middleware/enhancedAuthMiddleware.js';

// Use globally or on specific routes
app.use(attachRequestContext);

// After middleware:
// req.context = {
//   ip: '192.168.1.1',
//   userAgent: 'Mozilla/5.0...',
//   method: 'POST',
//   path: '/api/courses',
//   timestamp: Date
// }
```

#### 4. `tokenRefreshWarning` - Token Expiration Warning

Adds header if token expires soon.

```javascript
import { tokenRefreshWarning } from '../middleware/enhancedAuthMiddleware.js';

router.use(tokenRefreshWarning);

// Response includes header if token expires within 15 minutes:
// X-Token-Expiring-Soon: true
// Frontend can use this to trigger token refresh
```

### Helper Functions

```javascript
import {
  extractToken,
  verifyToken,
  loadUser,
  getRequestContext,
  isTokenExpiringSoon,
} from '../middleware/enhancedAuthMiddleware.js';

// Extract token from request
const token = extractToken(req);

// Verify token (throws error if invalid)
const decoded = verifyToken(token);

// Load user from database
const user = await loadUser(decoded.id);

// Get request context
const context = getRequestContext(req);

// Check if token expires soon
const expiringSoon = isTokenExpiringSoon(token, 15); // 15 minutes
```

### Error Codes

```javascript
import { AUTH_ERROR_CODES } from '../middleware/enhancedAuthMiddleware.js';

// Available codes:
AUTH_ERROR_CODES.NO_TOKEN              // 'NO_TOKEN'
AUTH_ERROR_CODES.TOKEN_EXPIRED         // 'TOKEN_EXPIRED'
AUTH_ERROR_CODES.INVALID_TOKEN         // 'INVALID_TOKEN'
AUTH_ERROR_CODES.VERIFICATION_FAILED   // 'VERIFICATION_FAILED'
AUTH_ERROR_CODES.USER_NOT_FOUND        // 'USER_NOT_FOUND'
AUTH_ERROR_CODES.ACCOUNT_INACTIVE      // 'ACCOUNT_INACTIVE'
AUTH_ERROR_CODES.AUTH_SERVER_ERROR     // 'AUTH_SERVER_ERROR'
```

---

## Role-Based Rate Limiting

### Files
- **Middleware**: `backend/middleware/rateLimitMiddleware.js`

### Features

✅ Different limits for different user roles
✅ Role hierarchy: Learner < Instructor < Platform Author < Admin
✅ Stricter limits on expensive operations (AI, voice, bulk)
✅ IP-based limiting for anonymous users
✅ Automatic cleanup of expired entries
✅ Rate limit status in response headers

### Rate Limit Tiers

| Operation | Learner | Instructor | Platform Author | Admin |
|-----------|---------|------------|-----------------|-------|
| **General API** (15 min) | 100 | 300 | 500 | 1000 |
| **AI Requests** (1 hour) | 20 | 100 | 500 | Unlimited |
| **Voice Sessions** (24 hours) | 30 | 100 | 300 | Unlimited |
| **Course Creation** (24 hours) | 0* | 5 | 20 | Unlimited |
| **Bulk Operations** (1 hour) | 3 | 10 | 50 | Unlimited |
| **Login Attempts** (15 min) | 5 (all users, IP-based) | 5 | 5 | 5 |

*Learners cannot create courses

### Predefined Rate Limiters

#### 1. `apiRateLimit` - General API Limits

```javascript
import { apiRateLimit } from '../middleware/rateLimitMiddleware.js';

// Apply to all routes
app.use('/api', apiRateLimit);

// Or specific routes
router.get('/data', protect, apiRateLimit, getData);
```

#### 2. `aiRateLimit` - AI Operation Limits

```javascript
import { aiRateLimit } from '../middleware/rateLimitMiddleware.js';

router.post('/ai/chat', protect, aiRateLimit, handleAIChat);
router.post('/ai/generate-flashcards', protect, aiRateLimit, generateFlashcards);
```

#### 3. `voiceRateLimit` - Voice Interaction Limits

```javascript
import { voiceRateLimit } from '../middleware/rateLimitMiddleware.js';

router.post('/ai/voice/start', protect, voiceRateLimit, startVoiceSession);
```

#### 4. `courseCreateRateLimit` - Course Creation Limits

```javascript
import { courseCreateRateLimit } from '../middleware/rateLimitMiddleware.js';

router.post('/courses', protect, courseCreateRateLimit, createCourse);
```

#### 5. `bulkOperationRateLimit` - Bulk Operation Limits

```javascript
import { bulkOperationRateLimit } from '../middleware/rateLimitMiddleware.js';

router.post('/courses/bulk-update', protect, bulkOperationRateLimit, bulkUpdate);
router.get('/courses/export', protect, bulkOperationRateLimit, exportCourses);
```

#### 6. `loginRateLimit` - Login Attempt Limits

```javascript
import { loginRateLimit } from '../middleware/rateLimitMiddleware.js';

router.post('/auth/login', loginRateLimit, login);
```

### Custom Rate Limiters

```javascript
import { createRateLimit } from '../middleware/rateLimitMiddleware.js';

// Create custom rate limiter
const customRateLimit = createRateLimit('CUSTOM_OPERATION');

// Configure in RATE_LIMITS object in rateLimitMiddleware.js
```

### Response Headers

Rate limit middleware adds these headers:

```
X-RateLimit-Limit: 100          # Total requests allowed
X-RateLimit-Remaining: 75       # Requests remaining
X-RateLimit-Reset: 2025-12-07T04:30:00.000Z  # Reset time
```

### Rate Limit Exceeded Response

```javascript
{
  "success": false,
  "error": "AI usage limit exceeded. Please upgrade or wait.",
  "code": "RATE_LIMIT_EXCEEDED",
  "rateLimit": {
    "limit": 20,
    "remaining": 0,
    "resetTime": "2025-12-07T04:30:00.000Z",
    "retryAfter": 1800  // seconds until reset
  }
}
```

### Utility Functions

```javascript
import {
  resetUserRateLimit,
  getRateLimitStatus,
} from '../middleware/rateLimitMiddleware.js';

// Reset rate limit for a user (admin only)
resetUserRateLimit(userId, 'AI');

// Get current rate limit status
const status = getRateLimitStatus(userId, 'AI', 'learner');
// Returns: { limit, current, remaining, resetTime }
```

---

## Audit Logging

### Files
- **Model**: `backend/models/AuditLog.js`
- **Middleware**: `backend/middleware/auditMiddleware.js`

### Features

✅ Automatic logging of sensitive actions
✅ Track who, what, when, where
✅ IP address and user agent tracking
✅ Before/after state tracking
✅ Severity levels (low, medium, high, critical)
✅ Query and analytics functions
✅ Compliance audit trail

### Audit Log Schema

```javascript
{
  user: ObjectId,              // Who performed the action
  userEmail: String,           // Email (denormalized for history)
  userRole: String,            // Role at time of action

  action: String,              // What was done (LOGIN, ROLE_CHANGE, etc.)

  resource: {
    type: String,              // Resource type (User, Course, etc.)
    id: ObjectId,              // Resource ID
    name: String,              // Human-readable name
  },

  changes: {
    before: Mixed,             // State before change
    after: Mixed,              // State after change
  },

  context: {
    ip: String,                // IP address
    userAgent: String,         // Browser/client info
    method: String,            // HTTP method
    path: String,              // Request path
    statusCode: Number,        // HTTP status code
  },

  metadata: Mixed,             // Additional context-specific data

  severity: String,            // low, medium, high, critical
  status: String,              // success, failure, partial

  error: {
    message: String,
    code: String,
    stack: String,
  },

  timestamp: Date,
}
```

### Audit Actions

```javascript
import { AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';

// Authentication
AUDIT_ACTIONS.LOGIN
AUDIT_ACTIONS.LOGOUT
AUDIT_ACTIONS.LOGIN_FAILED
AUDIT_ACTIONS.PASSWORD_RESET
AUDIT_ACTIONS.PASSWORD_CHANGE

// User management
AUDIT_ACTIONS.USER_CREATE
AUDIT_ACTIONS.USER_UPDATE
AUDIT_ACTIONS.USER_DELETE
AUDIT_ACTIONS.USER_BAN
AUDIT_ACTIONS.USER_UNBAN

// Role and permission changes
AUDIT_ACTIONS.ROLE_CHANGE
AUDIT_ACTIONS.PERMISSION_GRANT
AUDIT_ACTIONS.PERMISSION_REVOKE
AUDIT_ACTIONS.INSTRUCTOR_VERIFY

// Course management
AUDIT_ACTIONS.COURSE_CREATE
AUDIT_ACTIONS.COURSE_UPDATE
AUDIT_ACTIONS.COURSE_DELETE
AUDIT_ACTIONS.COURSE_PUBLISH

// Admin actions
AUDIT_ACTIONS.ADMIN_SETTINGS_CHANGE
AUDIT_ACTIONS.BULK_UPDATE
AUDIT_ACTIONS.BULK_DELETE
AUDIT_ACTIONS.DATA_EXPORT

// Suspicious activity
AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED
AUDIT_ACTIONS.UNAUTHORIZED_ACCESS
AUDIT_ACTIONS.PERMISSION_DENIED
```

### Automatic Logging

#### 1. `auditLog` - Middleware

Automatically log actions after route handler completes.

```javascript
import { auditLog, AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';

// Log after successful action
router.post('/users',
  protect,
  createUser,
  auditLog(AUDIT_ACTIONS.USER_CREATE, {
    resourceType: 'User',
    getResourceId: (req, res) => res.locals.createdUser?._id,
    getResourceName: (req, res) => res.locals.createdUser?.email,
  })
);

// Log course creation
router.post('/courses',
  protect,
  createCourse,
  auditLog(AUDIT_ACTIONS.COURSE_CREATE, {
    resourceType: 'Course',
    getResourceId: (req, res) => res.locals.course?._id,
    getResourceName: (req, res) => res.locals.course?.title,
    getChanges: (req, res) => ({
      before: null,
      after: res.locals.course,
    }),
  })
);
```

#### 2. Manual Logging

Log from within controller.

```javascript
import { manualAuditLog, AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create({
      ...req.body,
      instructor: req.user._id,
    });

    // Manual audit log
    await manualAuditLog(req, AUDIT_ACTIONS.COURSE_CREATE, {
      resourceType: 'Course',
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        before: null,
        after: course,
      },
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Specialized Loggers

#### 1. `logAuth` - Authentication Events

```javascript
import { logAuth } from '../middleware/auditMiddleware.js';

// Successful login
await logAuth(req, user, true);

// Failed login
await logAuth(req, null, false);
```

#### 2. `logRoleChange` - Role Changes

```javascript
import { logRoleChange } from '../middleware/auditMiddleware.js';

const oldRole = user.role;
user.role = 'verified_instructor';
await user.save();

await logRoleChange(req, user, oldRole, user.role);
```

#### 3. `logDeletion` - Resource Deletion

```javascript
import { logDeletion } from '../middleware/auditMiddleware.js';

const course = await Course.findById(req.params.id);
await logDeletion(req, 'Course', course);
await course.deleteOne();
```

#### 4. `logUnauthorizedAccess` - Access Denials

```javascript
import { logUnauthorizedAccess } from '../middleware/auditMiddleware.js';

if (!user.hasPermission(PERMISSIONS.COURSE.DELETE_OWN)) {
  await logUnauthorizedAccess(req, 'Missing course:delete_own permission');
  return res.status(403).json({ error: 'Access denied' });
}
```

#### 5. `logRateLimitExceeded` - Rate Limit Violations

```javascript
import { logRateLimitExceeded } from '../middleware/auditMiddleware.js';

// Automatically called by rate limit middleware
await logRateLimitExceeded(req, 'AI');
```

### Query Functions

```javascript
import AuditLog from '../models/AuditLog.js';

// Get user's audit logs
const userLogs = await AuditLog.getUserLogs(userId, {
  limit: 50,
  skip: 0,
  action: AUDIT_ACTIONS.LOGIN, // Optional filter
});

// Get logs for a specific resource
const courseLogs = await AuditLog.getResourceLogs('Course', courseId, {
  limit: 50,
});

// Get high-severity logs
const criticalLogs = await AuditLog.getHighSeverityLogs({
  limit: 100,
  since: new Date('2025-01-01'),
});

// Get failed actions
const failures = await AuditLog.getFailedActions({
  limit: 100,
  since: new Date('2025-12-01'),
});

// Get statistics
const stats = await AuditLog.getStatistics(new Date('2025-12-01'));
// Returns: { total, byAction, bySeverity, byStatus, byResource }
```

---

## Usage Examples

### Example 1: Protected Route with Rate Limiting and Audit Logging

```javascript
import { protect } from '../middleware/enhancedAuthMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { aiRateLimit } from '../middleware/rateLimitMiddleware.js';
import { auditLog, AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';

router.post('/ai/generate-course',
  protect,                                    // 1. Authenticate
  requirePermission(PERMISSIONS.AI.GENERATE_COURSES), // 2. Authorize
  aiRateLimit,                                // 3. Rate limit
  generateCourse,                             // 4. Handle request
  auditLog(AUDIT_ACTIONS.AI_GENERATION, {    // 5. Log action
    resourceType: 'AI',
    getMetadata: (req, res) => ({
      prompt: req.body.prompt,
      generatedContent: res.locals.content,
    }),
  })
);
```

### Example 2: Optional Auth for Public Routes

```javascript
import { optionalAuth } from '../middleware/enhancedAuthMiddleware.js';

router.get('/courses/:id', optionalAuth, async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Show published courses to everyone
  if (course.isPublished) {
    return res.json({ success: true, data: course });
  }

  // Show unpublished courses only to owner/admins
  if (req.user && (req.user.ownsResource(course) || req.user.isAdmin())) {
    return res.json({ success: true, data: course });
  }

  return res.status(403).json({ error: 'Course not published' });
});
```

### Example 3: Admin Route with Full Protection

```javascript
import { protect } from '../middleware/enhancedAuthMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { bulkOperationRateLimit } from '../middleware/rateLimitMiddleware.js';
import { manualAuditLog, AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';
import { ROLES } from '../config/permissions.js';

router.delete('/admin/users/bulk',
  protect,
  requireRole(ROLES.ADMIN),
  bulkOperationRateLimit,
  async (req, res) => {
    try {
      const { userIds } = req.body;

      const users = await User.find({ _id: { $in: userIds } });

      // Log each deletion
      for (const user of users) {
        await manualAuditLog(req, AUDIT_ACTIONS.USER_DELETE, {
          resourceType: 'User',
          resourceId: user._id,
          resourceName: user.email,
          severity: 'critical',
        });
      }

      await User.deleteMany({ _id: { $in: userIds } });

      res.json({ success: true, deleted: userIds.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Example 4: Login with Rate Limiting and Audit Logging

```javascript
import { loginRateLimit } from '../middleware/rateLimitMiddleware.js';
import { logAuth } from '../middleware/auditMiddleware.js';
import { attachRequestContext } from '../middleware/enhancedAuthMiddleware.js';

router.post('/auth/login',
  attachRequestContext,
  loginRateLimit,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        // Log failed login
        await logAuth(req, { email }, false);

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate token
      const token = user.generateToken();

      // Log successful login
      await logAuth(req, user, true);

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Example 5: Course Update with Full Middleware Stack

```javascript
import { protect } from '../middleware/enhancedAuthMiddleware.js';
import { checkCanEdit } from '../middleware/rbacMiddleware.js';
import { apiRateLimit } from '../middleware/rateLimitMiddleware.js';
import { manualAuditLog, AUDIT_ACTIONS } from '../middleware/auditMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';
import Course from '../models/Course.js';

router.put('/courses/:id',
  protect,
  apiRateLimit,
  checkCanEdit(
    async (req) => await Course.findById(req.params.id),
    PERMISSIONS.COURSE.EDIT_OWN,
    { message: 'You cannot edit this course' }
  ),
  async (req, res) => {
    try {
      const course = req.resource; // Attached by checkCanEdit

      // Capture before state
      const beforeState = course.toObject();

      // Update course
      Object.assign(course, req.body);
      await course.save();

      // Log the update with changes
      await manualAuditLog(req, AUDIT_ACTIONS.COURSE_UPDATE, {
        resourceType: 'Course',
        resourceId: course._id,
        resourceName: course.title,
        changes: {
          before: beforeState,
          after: course.toObject(),
        },
        severity: 'medium',
      });

      res.json({
        success: true,
        data: course,
        message: 'Course updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## Best Practices

### 1. Always Use Enhanced Auth Middleware

```javascript
// ✅ Good - Use enhanced auth for better error handling
import { protect } from '../middleware/enhancedAuthMiddleware.js';

// ❌ Avoid - Old middleware lacks context tracking
import { protect } from '../middleware/authMiddleware.js';
```

### 2. Layer Middleware in Correct Order

```javascript
// ✅ Correct order
router.post('/resource',
  protect,              // 1. Authenticate first
  requirePermission(),  // 2. Then authorize
  apiRateLimit,         // 3. Then rate limit
  controller,           // 4. Handle request
  auditLog()            // 5. Log after completion
);

// ❌ Wrong order - rate limit before auth allows anonymous users to exhaust limits
router.post('/resource', apiRateLimit, protect, controller);
```

### 3. Log Sensitive Actions

Always log these actions:
- User role changes
- Permission grants/revokes
- Deletions (especially bulk)
- Admin setting changes
- Login failures
- Unauthorized access attempts

```javascript
// ✅ Good - log critical actions
await logRoleChange(req, user, oldRole, newRole);

// ✅ Good - log deletions
await logDeletion(req, 'Course', course);
```

### 4. Use Appropriate Rate Limits

```javascript
// ✅ Good - AI operations have AI rate limit
router.post('/ai/chat', protect, aiRateLimit, handleChat);

// ✅ Good - Expensive operations have bulk rate limit
router.get('/export/all', protect, bulkOperationRateLimit, exportAll);

// ❌ Bad - No rate limit on expensive operation
router.post('/ai/generate-100-courses', protect, generateCourses);
```

### 5. Provide Context in Audit Logs

```javascript
// ✅ Good - detailed metadata
await manualAuditLog(req, AUDIT_ACTIONS.COURSE_DELETE, {
  resourceType: 'Course',
  resourceId: course._id,
  resourceName: course.title,
  metadata: {
    studentCount: course.students.length,
    wasPublished: course.isPublished,
    revenue: course.revenue,
  },
});

// ❌ Less useful - minimal context
await manualAuditLog(req, AUDIT_ACTIONS.COURSE_DELETE, {
  resourceId: course._id,
});
```

### 6. Handle Rate Limit Errors Gracefully

```javascript
// Frontend should check for rate limit errors
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  const retryAfter = error.rateLimit.retryAfter;
  toast.error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);

  // Show countdown timer
  showRetryCountdown(retryAfter);
}
```

### 7. Monitor Audit Logs Regularly

```javascript
// Admin dashboard - show recent critical actions
const criticalLogs = await AuditLog.getHighSeverityLogs({ limit: 20 });

// Show failed actions
const failures = await AuditLog.getFailedActions({ limit: 20 });

// Alert on suspicious patterns
const recentUnauthorized = await AuditLog.find({
  action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
  timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
});

if (recentUnauthorized.length > 10) {
  alertAdmin('Suspicious activity detected: Multiple unauthorized access attempts');
}
```

---

## Security Considerations

### 1. Token Security

✅ **DO:**
- Use HTTP-only cookies for web clients
- Set secure flag in production
- Use short expiration times (7 days max)
- Implement token refresh warnings
- Clear tokens on logout

❌ **DON'T:**
- Store tokens in localStorage (XSS vulnerable)
- Use overly long expiration times
- Send tokens in URL parameters
- Log full token values

### 2. Rate Limiting

✅ **DO:**
- Implement rate limiting on all public endpoints
- Use stricter limits for expensive operations
- Monitor for rate limit abuse
- Use distributed rate limiting (Redis) in production

❌ **DON'T:**
- Skip rate limiting on "internal" endpoints
- Use same limits for all user types
- Ignore rate limit exceeded patterns

### 3. Audit Logging

✅ **DO:**
- Log all sensitive actions
- Include enough context for investigation
- Protect audit logs (admin-only access)
- Regularly review high-severity logs
- Set up alerts for critical actions

❌ **DON'T:**
- Log sensitive data (passwords, tokens)
- Allow users to delete audit logs
- Skip logging for "minor" actions
- Let audit log failures break the application

### 4. Error Messages

✅ **DO:**
- Use specific error codes for different scenarios
- Provide helpful messages for expired tokens
- Log detailed errors server-side

❌ **DON'T:**
- Expose sensitive information in error messages
- Return different messages for "user not found" vs "wrong password" (timing attacks)
- Include stack traces in production errors

### 5. Context Tracking

✅ **DO:**
- Track IP addresses for suspicious activity
- Log user agents to detect bots
- Monitor for unusual access patterns
- Implement geolocation blocking if needed

❌ **DON'T:**
- Trust client-provided IP headers without validation
- Store personally identifiable information unnecessarily
- Skip context tracking for "trusted" users

---

## Migration from Old Middleware

### Step 1: Update Imports

```javascript
// Before
import { protect } from '../middleware/authMiddleware.js';

// After
import { protect } from '../middleware/enhancedAuthMiddleware.js';
```

### Step 2: Add Context Middleware

```javascript
// Add to app.js
import { attachRequestContext } from './middleware/enhancedAuthMiddleware.js';

app.use(attachRequestContext);
```

### Step 3: Add Rate Limiting

```javascript
// Add to routes
import { apiRateLimit, aiRateLimit } from './middleware/rateLimitMiddleware.js';

app.use('/api', apiRateLimit);
router.post('/ai/chat', protect, aiRateLimit, handleChat);
```

### Step 4: Add Audit Logging

```javascript
// Add to sensitive routes
import { auditLog, AUDIT_ACTIONS } from './middleware/auditMiddleware.js';

router.delete('/users/:id',
  protect,
  deleteUser,
  auditLog(AUDIT_ACTIONS.USER_DELETE, {
    resourceType: 'User',
    getResourceId: (req) => req.params.id,
  })
);
```

---

## Summary

The enhanced middleware system provides:

✅ **Better Authentication**
- Graceful error handling
- Request context tracking
- Optional authentication support
- Token expiration warnings

✅ **Role-Based Rate Limiting**
- Different limits for different roles
- Protection against abuse
- Automatic cleanup

✅ **Comprehensive Audit Logging**
- Track all sensitive actions
- Compliance audit trail
- Query and analytics
- Severity-based filtering

✅ **Security Best Practices**
- Defense in depth
- Detailed logging
- Rate limiting
- Context tracking

**All middleware works together to create a robust, secure, and auditable API.**

---

## Quick Reference

### Enhanced Authentication
```javascript
import { protect, optionalAuth, attachRequestContext } from '../middleware/enhancedAuthMiddleware.js';
```

### Rate Limiting
```javascript
import {
  apiRateLimit,
  aiRateLimit,
  voiceRateLimit,
  courseCreateRateLimit,
  bulkOperationRateLimit,
  loginRateLimit
} from '../middleware/rateLimitMiddleware.js';
```

### Audit Logging
```javascript
import {
  auditLog,
  manualAuditLog,
  logAuth,
  logRoleChange,
  logDeletion,
  AUDIT_ACTIONS
} from '../middleware/auditMiddleware.js';
```

### RBAC (from previous implementation)
```javascript
import {
  requirePermission,
  requireAnyPermission,
  requireRole,
  checkOwnership,
  checkCanEdit,
  PERMISSIONS,
  ROLES
} from '../middleware/rbacMiddleware.js';
```

---

**For more information, see:**
- RBAC System Documentation: `backend/RBAC_SYSTEM.md`
- Permission Configuration: `backend/config/permissions.js`
- User Model: `backend/models/User.js`
- Audit Log Model: `backend/models/AuditLog.js`
