/**
 * Frontend Permission System
 *
 * This file mirrors the backend RBAC system for frontend permission checks.
 * IMPORTANT: These are for UX only - backend always enforces permissions!
 *
 * Keep this in sync with backend/config/permissions.js
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
  },

  // ============ USER PERMISSIONS ============
  USER: {
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
  },

  // ============ ENROLLMENT PERMISSIONS ============
  ENROLLMENT: {
    ENROLL: 'enrollment:enroll',
    VIEW_OWN: 'enrollment:view_own',
    VIEW_ALL: 'enrollment:view_all',
    VIEW_COURSE_ENROLLMENTS: 'enrollment:view_course_enrollments',
    UNENROLL: 'enrollment:unenroll',
    MANAGE: 'enrollment:manage',
  },

  // ============ AI USAGE PERMISSIONS ============
  AI: {
    CHAT_BASIC: 'ai:chat_basic',
    CHAT_ADVANCED: 'ai:chat_advanced',
    VOICE_SESSION: 'ai:voice_session',
    GENERATE_COURSE: 'ai:generate_course',
    UNLIMITED_USAGE: 'ai:unlimited_usage',
    VIEW_OWN_USAGE: 'ai:view_own_usage',
    VIEW_ALL_USAGE: 'ai:view_all_usage',
  },

  // ============ ANALYTICS PERMISSIONS ============
  ANALYTICS: {
    VIEW_OWN: 'analytics:view_own',
    VIEW_COURSE: 'analytics:view_course',
    VIEW_PLATFORM: 'analytics:view_platform',
  },

  // ============ ADMIN PANEL PERMISSIONS ============
  ADMIN: {
    ACCESS_PANEL: 'admin:access_panel',
    MANAGE_USERS: 'admin:manage_users',
    MANAGE_COURSES: 'admin:manage_courses',
    MANAGE_CONTENT: 'admin:manage_content',
    VIEW_LOGS: 'admin:view_logs',
    MODERATE_CONTENT: 'admin:moderate_content',
    MANAGE_BILLING: 'admin:manage_billing',
    MANAGE_SETTINGS: 'admin:manage_settings',
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
} as const;

// ===================================================
// ROLE DEFINITIONS
// ===================================================

export const ROLES = {
  LEARNER: 'learner',
  VERIFIED_INSTRUCTOR: 'verified_instructor',
  PLATFORM_AUTHOR: 'platform_author',
  ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = string;

// ===================================================
// ROLE-TO-PERMISSIONS MAPPING
// ===================================================

/**
 * Maps each role to its permissions
 * Roles inherit permissions from lower roles in the hierarchy
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
    PERMISSIONS.AI.GENERATE_COURSE,

    // Analytics permissions
    PERMISSIONS.ANALYTICS.VIEW_OWN,

    // Content permissions
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
    // Unlimited AI usage
    PERMISSIONS.AI.UNLIMITED_USAGE,

    // Can view more courses
    PERMISSIONS.COURSE.VIEW_ALL,

    // User permissions
    PERMISSIONS.USER.VIEW_ANY_PROFILE,
  ],

  // ============ ADMIN PERMISSIONS ============
  [ROLES.ADMIN]: [
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

// Build complete permission sets with inheritance
const buildRolePermissions = (): Record<Role, Permission[]> => {
  const completePermissions: Record<Role, Permission[]> = {
    [ROLES.LEARNER]: ROLE_PERMISSIONS[ROLES.LEARNER],
    [ROLES.VERIFIED_INSTRUCTOR]: [
      ...ROLE_PERMISSIONS[ROLES.LEARNER],
      ...ROLE_PERMISSIONS[ROLES.VERIFIED_INSTRUCTOR],
    ],
    [ROLES.PLATFORM_AUTHOR]: [
      ...ROLE_PERMISSIONS[ROLES.LEARNER],
      ...ROLE_PERMISSIONS[ROLES.VERIFIED_INSTRUCTOR],
      ...ROLE_PERMISSIONS[ROLES.PLATFORM_AUTHOR],
    ],
    [ROLES.ADMIN]: [
      ...ROLE_PERMISSIONS[ROLES.LEARNER],
      ...ROLE_PERMISSIONS[ROLES.VERIFIED_INSTRUCTOR],
      ...ROLE_PERMISSIONS[ROLES.PLATFORM_AUTHOR],
      ...ROLE_PERMISSIONS[ROLES.ADMIN],
    ],
  };

  // Deduplicate permissions
  Object.keys(completePermissions).forEach((role) => {
    completePermissions[role as Role] = [
      ...new Set(completePermissions[role as Role]),
    ];
  });

  return completePermissions;
};

const COMPLETE_ROLE_PERMISSIONS = buildRolePermissions();

// ===================================================
// HELPER FUNCTIONS
// ===================================================

/**
 * Get all permissions for a role (including inherited)
 * @param role - Role name
 * @returns Array of permission strings
 */
export function getRolePermissions(role: Role): Permission[] {
  return COMPLETE_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 * @param role - Role name
 * @param permission - Permission to check
 * @returns True if role has permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  // Admins have all permissions
  if (role === ROLES.ADMIN) {
    return true;
  }

  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if user with role has permission
 * @param role - User's role
 * @param permission - Permission to check
 * @param customPermissions - Optional custom permissions for this user
 * @returns True if user has permission
 */
export function hasPermission(
  role: Role | undefined,
  permission: Permission,
  customPermissions?: Permission[]
): boolean {
  if (!role) return false;

  // Admins have all permissions
  if (role === ROLES.ADMIN) {
    return true;
  }

  // Check role permissions
  if (roleHasPermission(role, permission)) {
    return true;
  }

  // Check custom permissions (if any)
  if (customPermissions && customPermissions.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if user has ANY of the specified permissions
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @param customPermissions - Optional custom permissions
 * @returns True if user has at least one permission
 */
export function hasAnyPermission(
  role: Role | undefined,
  permissions: Permission[],
  customPermissions?: Permission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, permission, customPermissions)
  );
}

/**
 * Check if user has ALL of the specified permissions
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @param customPermissions - Optional custom permissions
 * @returns True if user has all permissions
 */
export function hasAllPermissions(
  role: Role | undefined,
  permissions: Permission[],
  customPermissions?: Permission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, permission, customPermissions)
  );
}

/**
 * Check if user has a specific role
 * @param userRole - User's role
 * @param requiredRole - Required role
 * @returns True if user has the required role
 */
export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user has ANY of the specified roles
 * @param userRole - User's role
 * @param requiredRoles - Array of acceptable roles
 * @returns True if user has one of the roles
 */
export function hasAnyRole(
  userRole: Role | undefined,
  requiredRoles: Role[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Get all permissions (flattened array)
 * @returns All permission strings
 */
export function getAllPermissions(): Permission[] {
  const allPerms: Permission[] = [];
  Object.values(PERMISSIONS).forEach((category) => {
    Object.values(category).forEach((perm) => {
      allPerms.push(perm);
    });
  });
  return allPerms;
}

/**
 * Check if user is owner of a resource
 * @param userId - Current user's ID
 * @param resource - Resource to check
 * @returns True if user owns the resource
 */
export function isOwner(userId: string | undefined, resource: any): boolean {
  if (!userId || !resource) return false;

  const ownerId = resource.userId || resource.user?._id || resource.user || resource.instructor?._id || resource.instructor;

  if (!ownerId) return false;

  return ownerId.toString() === userId.toString();
}

/**
 * Role hierarchy helpers
 */
export function isAdmin(role: Role | undefined): boolean {
  return role === ROLES.ADMIN;
}

export function isInstructor(role: Role | undefined): boolean {
  return [
    ROLES.VERIFIED_INSTRUCTOR,
    ROLES.PLATFORM_AUTHOR,
    ROLES.ADMIN,
  ].includes(role as Role);
}

export function isPlatformAuthor(role: Role | undefined): boolean {
  return [ROLES.PLATFORM_AUTHOR, ROLES.ADMIN].includes(role as Role);
}

export default {
  PERMISSIONS,
  ROLES,
  getRolePermissions,
  roleHasPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  getAllPermissions,
  isOwner,
  isAdmin,
  isInstructor,
  isPlatformAuthor,
};
