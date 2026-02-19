/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * This file defines all permissions and their mappings to roles.
 *
 * Permission Naming Convention:
 * - Format: <resource>:<action>
 * - Examples: course:create, user:delete, analytics:view
 *
 * Role Hierarchy (higher roles inherit lower role permissions):
 * admin > platform_author > verified_instructor > learner
 */

// ===================================================
// PERMISSION DEFINITIONS
// ===================================================

/**
 * All available permissions in the system
 * Organized by resource category
 */
export const PERMISSIONS = {
  // ============ COURSE PERMISSIONS ============
  COURSE: {
    // View permissions
    VIEW_OWN: 'course:view_own',              // View own courses
    VIEW_ALL: 'course:view_all',              // View all courses
    VIEW_PUBLISHED: 'course:view_published',  // View published courses
    VIEW_DRAFT: 'course:view_draft',          // View draft courses
    VIEW_ANALYTICS: 'course:view_analytics',  // View course analytics

    // Create permissions
    CREATE: 'course:create',                  // Create new course
    CREATE_MARKETPLACE: 'course:create_marketplace', // Create marketplace course

    // Edit permissions
    EDIT_OWN: 'course:edit_own',              // Edit own courses
    EDIT_ALL: 'course:edit_all',              // Edit any course
    EDIT_AS_COLLABORATOR: 'course:edit_as_collaborator', // Edit as collaborator

    // Delete permissions
    DELETE_OWN: 'course:delete_own',          // Delete own courses
    DELETE_ALL: 'course:delete_all',          // Delete any course

    // Publishing permissions
    PUBLISH: 'course:publish',                // Publish course
    UNPUBLISH: 'course:unpublish',            // Unpublish course

    // Moderation permissions
    MODERATE: 'course:moderate',              // Moderate course content
    APPROVE: 'course:approve',                // Approve course for publication
    REJECT: 'course:reject',                  // Reject course

    // Collaboration permissions
    INVITE_COLLABORATORS: 'course:invite_collaborators', // Invite collaborators
    APPROVE_COLLABORATORS: 'course:approve_collaborators', // Approve collaborator requests
    MANAGE_REVENUE_SHARE: 'course:manage_revenue_share', // Manage revenue distribution
  },

  // ============ USER PERMISSIONS ============
  USER: {
    // View permissions
    VIEW_OWN_PROFILE: 'user:view_own_profile',
    VIEW_ANY_PROFILE: 'user:view_any_profile',
    VIEW_USER_LIST: 'user:view_list',

    // Edit permissions
    EDIT_OWN_PROFILE: 'user:edit_own_profile',
    EDIT_ANY_PROFILE: 'user:edit_any_profile',

    // Delete permissions
    DELETE_OWN_ACCOUNT: 'user:delete_own_account',
    DELETE_ANY_ACCOUNT: 'user:delete_any_account',

    // Role management
    CHANGE_ROLE: 'user:change_role',
    GRANT_PERMISSIONS: 'user:grant_permissions',

    // Verification
    VERIFY_INSTRUCTOR: 'user:verify_instructor',
    VERIFY_KYC: 'user:verify_kyc',
  },

  // ============ ENROLLMENT PERMISSIONS ============
  ENROLLMENT: {
    ENROLL: 'enrollment:enroll',              // Enroll in course
    VIEW_OWN: 'enrollment:view_own',          // View own enrollments
    VIEW_ALL: 'enrollment:view_all',          // View all enrollments
    VIEW_COURSE_ENROLLMENTS: 'enrollment:view_course_enrollments', // View course enrollments (as instructor)
    UNENROLL: 'enrollment:unenroll',          // Unenroll from course
    MANAGE: 'enrollment:manage',              // Manage enrollments (admin)
  },

  // ============ AI USAGE PERMISSIONS ============
  AI: {
    CHAT_BASIC: 'ai:chat_basic',              // Basic AI chat
    CHAT_ADVANCED: 'ai:chat_advanced',        // Advanced AI features
    VOICE_SESSION: 'ai:voice_session',        // Voice AI sessions
    GENERATE_COURSE: 'ai:generate_course',    // AI course generation
    UNLIMITED_USAGE: 'ai:unlimited_usage',    // Unlimited AI usage
    VIEW_OWN_USAGE: 'ai:view_own_usage',      // View own AI usage stats
    VIEW_ALL_USAGE: 'ai:view_all_usage',      // View all users' AI usage
  },

  // ============ ANALYTICS PERMISSIONS ============
  ANALYTICS: {
    VIEW_OWN: 'analytics:view_own',           // View own analytics
    VIEW_COURSE: 'analytics:view_course',     // View course analytics (as instructor)
    VIEW_PLATFORM: 'analytics:view_platform', // View platform-wide analytics
  },

  // ============ ADMIN PANEL PERMISSIONS ============
  ADMIN: {
    ACCESS_PANEL: 'admin:access_panel',       // Access admin panel
    MANAGE_USERS: 'admin:manage_users',       // Manage users
    MANAGE_COURSES: 'admin:manage_courses',   // Manage courses
    MANAGE_CONTENT: 'admin:manage_content',   // Manage content
    VIEW_LOGS: 'admin:view_logs',             // View admin logs
    MODERATE_CONTENT: 'admin:moderate_content', // Moderate content
    MANAGE_BILLING: 'admin:manage_billing',   // Manage billing
    MANAGE_SETTINGS: 'admin:manage_settings', // Manage platform settings
  },

  // ============ CONTENT PERMISSIONS ============
  CONTENT: {
    CREATE_MODULE: 'content:create_module',
    EDIT_MODULE: 'content:edit_module',
    DELETE_MODULE: 'content:delete_module',
    CREATE_LESSON: 'content:create_lesson',
    EDIT_LESSON: 'content:edit_lesson',
    DELETE_LESSON: 'content:delete_lesson',
    CREATE_QUIZ: 'content:create_quiz',
    EDIT_QUIZ: 'content:edit_quiz',
    DELETE_QUIZ: 'content:delete_quiz',
  },

  // ============ FLASHCARD PERMISSIONS ============
  FLASHCARD: {
    CREATE: 'flashcard:create',
    EDIT_OWN: 'flashcard:edit_own',
    DELETE_OWN: 'flashcard:delete_own',
    VIEW_OWN: 'flashcard:view_own',
  },

  // ============ ROADMAP PERMISSIONS ============
  ROADMAP: {
    CREATE: 'roadmap:create',
    EDIT_OWN: 'roadmap:edit_own',
    DELETE_OWN: 'roadmap:delete_own',
    VIEW_OWN: 'roadmap:view_own',
    VIEW_ALL: 'roadmap:view_all',
  },

  // ============ CONVERSATION PERMISSIONS ============
  CONVERSATION: {
    CREATE: 'conversation:create',
    VIEW_OWN: 'conversation:view_own',
    VIEW_ALL: 'conversation:view_all',
    DELETE_OWN: 'conversation:delete_own',
    DELETE_ALL: 'conversation:delete_all',
  },

  // ============ EARNINGS/PAYOUT PERMISSIONS ============
  EARNINGS: {
    VIEW_OWN: 'earnings:view_own',
    VIEW_ALL: 'earnings:view_all',
    REQUEST_PAYOUT: 'earnings:request_payout',
    APPROVE_PAYOUT: 'earnings:approve_payout',
  },

  // ============ CONTRIBUTOR PERMISSIONS ============
  CONTRIBUTOR: {
    SUGGEST_IMPROVEMENT: 'contributor:suggest_improvement',
    VIEW_SUGGESTIONS: 'contributor:view_suggestions',
    APPROVE_SUGGESTIONS: 'contributor:approve_suggestions',
    REJECT_SUGGESTIONS: 'contributor:reject_suggestions',
  },
};

// ===================================================
// ROLE DEFINITIONS
// ===================================================

export const ROLES = {
  LEARNER: 'learner',
  VERIFIED_INSTRUCTOR: 'verified_instructor',
  PLATFORM_AUTHOR: 'platform_author',
  ADMIN: 'admin',
};

// ===================================================
// ROLE-TO-PERMISSIONS MAPPING
// ===================================================

/**
 * Maps each role to its permissions
 * Roles inherit permissions from lower roles in the hierarchy
 */
export const ROLE_PERMISSIONS = {
  // ============ LEARNER PERMISSIONS ============
  [ROLES.LEARNER]: [
    // Course permissions
    PERMISSIONS.COURSE.VIEW_PUBLISHED,
    PERMISSIONS.COURSE.VIEW_OWN,

    // User permissions
    PERMISSIONS.USER.VIEW_OWN_PROFILE,
    PERMISSIONS.USER.EDIT_OWN_PROFILE,
    PERMISSIONS.USER.DELETE_OWN_ACCOUNT,

    // Enrollment permissions
    PERMISSIONS.ENROLLMENT.ENROLL,
    PERMISSIONS.ENROLLMENT.VIEW_OWN,
    PERMISSIONS.ENROLLMENT.UNENROLL,

    // AI permissions (with quotas)
    PERMISSIONS.AI.CHAT_BASIC,
    PERMISSIONS.AI.VOICE_SESSION,
    PERMISSIONS.AI.VIEW_OWN_USAGE,
    PERMISSIONS.AI.GENERATE_COURSE, // Limited by quota

    // Analytics permissions
    PERMISSIONS.ANALYTICS.VIEW_OWN,

    // Content permissions (for own study materials)
    PERMISSIONS.FLASHCARD.CREATE,
    PERMISSIONS.FLASHCARD.EDIT_OWN,
    PERMISSIONS.FLASHCARD.DELETE_OWN,
    PERMISSIONS.FLASHCARD.VIEW_OWN,

    // Roadmap permissions
    PERMISSIONS.ROADMAP.CREATE,
    PERMISSIONS.ROADMAP.EDIT_OWN,
    PERMISSIONS.ROADMAP.DELETE_OWN,
    PERMISSIONS.ROADMAP.VIEW_OWN,

    // Conversation permissions
    PERMISSIONS.CONVERSATION.CREATE,
    PERMISSIONS.CONVERSATION.VIEW_OWN,
    PERMISSIONS.CONVERSATION.DELETE_OWN,

    // Contributor permissions
    PERMISSIONS.CONTRIBUTOR.SUGGEST_IMPROVEMENT,
    PERMISSIONS.CONTRIBUTOR.VIEW_SUGGESTIONS,
  ],

  // ============ VERIFIED INSTRUCTOR PERMISSIONS ============
  [ROLES.VERIFIED_INSTRUCTOR]: [
    // Inherits all learner permissions
    ...ROLE_PERMISSIONS[ROLES.LEARNER],

    // Additional course permissions
    PERMISSIONS.COURSE.CREATE,
    PERMISSIONS.COURSE.CREATE_MARKETPLACE,
    PERMISSIONS.COURSE.EDIT_OWN,
    PERMISSIONS.COURSE.DELETE_OWN,
    PERMISSIONS.COURSE.PUBLISH,
    PERMISSIONS.COURSE.UNPUBLISH,
    PERMISSIONS.COURSE.VIEW_DRAFT,
    PERMISSIONS.COURSE.VIEW_ANALYTICS,
    PERMISSIONS.COURSE.INVITE_COLLABORATORS,
    PERMISSIONS.COURSE.APPROVE_COLLABORATORS,
    PERMISSIONS.COURSE.MANAGE_REVENUE_SHARE,

    // Enhanced AI permissions
    PERMISSIONS.AI.CHAT_ADVANCED,
    // Note: Has higher quotas, not unlimited

    // Enrollment permissions
    PERMISSIONS.ENROLLMENT.VIEW_COURSE_ENROLLMENTS,

    // Analytics permissions
    PERMISSIONS.ANALYTICS.VIEW_COURSE,

    // Earnings permissions
    PERMISSIONS.EARNINGS.VIEW_OWN,
    PERMISSIONS.EARNINGS.REQUEST_PAYOUT,

    // Content permissions
    PERMISSIONS.CONTENT.CREATE_MODULE,
    PERMISSIONS.CONTENT.EDIT_MODULE,
    PERMISSIONS.CONTENT.DELETE_MODULE,
    PERMISSIONS.CONTENT.CREATE_LESSON,
    PERMISSIONS.CONTENT.EDIT_LESSON,
    PERMISSIONS.CONTENT.DELETE_LESSON,
    PERMISSIONS.CONTENT.CREATE_QUIZ,
    PERMISSIONS.CONTENT.EDIT_QUIZ,
    PERMISSIONS.CONTENT.DELETE_QUIZ,

    // Contributor permissions
    PERMISSIONS.CONTRIBUTOR.APPROVE_SUGGESTIONS,
    PERMISSIONS.CONTRIBUTOR.REJECT_SUGGESTIONS,
  ],

  // ============ PLATFORM AUTHOR PERMISSIONS ============
  [ROLES.PLATFORM_AUTHOR]: [
    // Inherits all verified instructor permissions
    ...ROLE_PERMISSIONS[ROLES.VERIFIED_INSTRUCTOR],

    // Unlimited AI usage
    PERMISSIONS.AI.UNLIMITED_USAGE,

    // Can view more courses
    PERMISSIONS.COURSE.VIEW_ALL,

    // User permissions
    PERMISSIONS.USER.VIEW_ANY_PROFILE,
  ],

  // ============ ADMIN PERMISSIONS ============
  [ROLES.ADMIN]: [
    // Inherits all platform author permissions
    ...ROLE_PERMISSIONS[ROLES.PLATFORM_AUTHOR],

    // Full course permissions
    PERMISSIONS.COURSE.EDIT_ALL,
    PERMISSIONS.COURSE.DELETE_ALL,
    PERMISSIONS.COURSE.MODERATE,
    PERMISSIONS.COURSE.APPROVE,
    PERMISSIONS.COURSE.REJECT,

    // Full user permissions
    PERMISSIONS.USER.VIEW_USER_LIST,
    PERMISSIONS.USER.EDIT_ANY_PROFILE,
    PERMISSIONS.USER.DELETE_ANY_ACCOUNT,
    PERMISSIONS.USER.CHANGE_ROLE,
    PERMISSIONS.USER.GRANT_PERMISSIONS,
    PERMISSIONS.USER.VERIFY_INSTRUCTOR,
    PERMISSIONS.USER.VERIFY_KYC,

    // Full enrollment permissions
    PERMISSIONS.ENROLLMENT.VIEW_ALL,
    PERMISSIONS.ENROLLMENT.MANAGE,

    // Full AI permissions
    PERMISSIONS.AI.VIEW_ALL_USAGE,

    // Full analytics permissions
    PERMISSIONS.ANALYTICS.VIEW_PLATFORM,

    // Admin panel permissions
    PERMISSIONS.ADMIN.ACCESS_PANEL,
    PERMISSIONS.ADMIN.MANAGE_USERS,
    PERMISSIONS.ADMIN.MANAGE_COURSES,
    PERMISSIONS.ADMIN.MANAGE_CONTENT,
    PERMISSIONS.ADMIN.VIEW_LOGS,
    PERMISSIONS.ADMIN.MODERATE_CONTENT,
    PERMISSIONS.ADMIN.MANAGE_BILLING,
    PERMISSIONS.ADMIN.MANAGE_SETTINGS,

    // Full conversation permissions
    PERMISSIONS.CONVERSATION.VIEW_ALL,
    PERMISSIONS.CONVERSATION.DELETE_ALL,

    // Full earnings permissions
    PERMISSIONS.EARNINGS.VIEW_ALL,
    PERMISSIONS.EARNINGS.APPROVE_PAYOUT,

    // Full roadmap permissions
    PERMISSIONS.ROADMAP.VIEW_ALL,
  ],
};

// ===================================================
// PERMISSION INHERITANCE
// ===================================================

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit all permissions from lower roles
 */
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.PLATFORM_AUTHOR, ROLES.VERIFIED_INSTRUCTOR, ROLES.LEARNER],
  [ROLES.PLATFORM_AUTHOR]: [ROLES.VERIFIED_INSTRUCTOR, ROLES.LEARNER],
  [ROLES.VERIFIED_INSTRUCTOR]: [ROLES.LEARNER],
  [ROLES.LEARNER]: [],
};

// ===================================================
// HELPER FUNCTIONS
// ===================================================

/**
 * Get all permissions for a role (including inherited)
 * @param {string} role - Role name
 * @returns {string[]} Array of permission strings
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export function roleHasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Get all permissions (flattened array)
 * @returns {string[]} All permission strings
 */
export function getAllPermissions() {
  const allPerms = [];
  Object.values(PERMISSIONS).forEach(category => {
    Object.values(category).forEach(perm => {
      allPerms.push(perm);
    });
  });
  return allPerms;
}

/**
 * Validate if a permission exists
 * @param {string} permission - Permission to validate
 * @returns {boolean} True if permission exists
 */
export function isValidPermission(permission) {
  return getAllPermissions().includes(permission);
}

/**
 * Get permissions by category
 * @param {string} category - Category name (e.g., 'COURSE', 'USER')
 * @returns {object} Permissions in that category
 */
export function getPermissionsByCategory(category) {
  return PERMISSIONS[category] || {};
}

export default {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  getRolePermissions,
  roleHasPermission,
  getAllPermissions,
  isValidPermission,
  getPermissionsByCategory,
};
