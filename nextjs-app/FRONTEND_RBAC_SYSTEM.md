# Frontend RBAC System Documentation

**Next.js Frontend Role-Based Access Control**

This document provides comprehensive documentation for the frontend RBAC (Role-Based Access Control) system that mirrors the backend permission model.

> **IMPORTANT:** Frontend permission checks are for **UX only**. They improve user experience by hiding inaccessible features and reducing failed API calls. The backend **always** enforces actual security.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Permission Constants](#permission-constants)
5. [Usage Methods](#usage-methods)
   - [Using Permission Hooks](#using-permission-hooks)
   - [Using Permission Gate Components](#using-permission-gate-components)
   - [Using AuthProvider Permission Functions](#using-authprovider-permission-functions)
6. [Real-World Examples](#real-world-examples)
7. [Migration Guide](#migration-guide)
8. [Best Practices](#best-practices)
9. [TypeScript Support](#typescript-support)

---

## Overview

The frontend RBAC system provides:

- **Permission Constants** - Exact mirror of backend permissions
- **React Hooks** - For permission checks in components
- **UI Components** - Conditional rendering based on permissions
- **AuthProvider Integration** - Permission functions available throughout the app
- **TypeScript Support** - Full type safety for permissions and roles

### Permission Model

The system uses a **4-tier role hierarchy** that matches the backend:

```
learner → verified_instructor → platform_author → admin
```

Each role inherits permissions from lower tiers, with 80+ permissions across 12 categories.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Components                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Use Hooks    │  │ Use Gates    │  │ Use Auth     │      │
│  │              │  │              │  │ Context      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Checking Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  usePermissions.ts - React Hooks                     │   │
│  │  PermissionGate.tsx - UI Components                  │   │
│  │  AuthProvider.tsx - Context with Permission Checks   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Utilities                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  permissions.ts - Constants & Helper Functions       │   │
│  │  - PERMISSIONS object (80+ permissions)              │   │
│  │  - ROLES object                                      │   │
│  │  - hasPermission(), isOwner(), canEdit(), etc.      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              User State (from AuthProvider)                 │
│  { _id, name, email, role, permissions? }                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Import Permission Constants

```typescript
import { PERMISSIONS, ROLES } from '@/lib/permissions';
```

### 2. Choose Your Method

**Method A: Use Hooks (Recommended for Most Cases)**

```tsx
import { usePermission } from '@/hooks/usePermissions';

function CreateCourseButton() {
  const { hasPermission, loading } = usePermission(PERMISSIONS.COURSE.CREATE);

  if (loading) return <Spinner />;
  if (!hasPermission) return null;

  return <button>Create Course</button>;
}
```

**Method B: Use Permission Gates (Best for Layout/Wrapping)**

```tsx
import { RequirePermission } from '@/components/auth/PermissionGate';

function CourseActions() {
  return (
    <RequirePermission permission={PERMISSIONS.COURSE.CREATE}>
      <button>Create Course</button>
    </RequirePermission>
  );
}
```

**Method C: Use Auth Context Directly (Best for Imperative Checks)**

```tsx
import { useAuth } from '@/components/providers/AuthProvider';

function MyComponent() {
  const { permissions } = useAuth();

  const handleAction = () => {
    if (!permissions.hasPermission(PERMISSIONS.COURSE.CREATE)) {
      toast.error('You do not have permission to create courses');
      return;
    }
    // Proceed with action
  };
}
```

---

## Permission Constants

All permissions are defined in `src/lib/permissions.ts` and mirror the backend exactly.

### Available Permissions

```typescript
PERMISSIONS = {
  // Course Permissions (17 permissions)
  COURSE: {
    VIEW_OWN: 'course:view_own',
    VIEW_ALL: 'course:view_all',
    VIEW_PUBLISHED: 'course:view_published',
    CREATE: 'course:create',
    EDIT_OWN: 'course:edit_own',
    EDIT_ALL: 'course:edit_all',
    DELETE_OWN: 'course:delete_own',
    DELETE_ALL: 'course:delete_all',
    PUBLISH: 'course:publish',
    MANAGE_CONTRIBUTORS: 'course:manage_contributors',
    VIEW_ANALYTICS: 'course:view_analytics',
    MANAGE_PRICING: 'course:manage_pricing',
    APPROVE_REVIEWS: 'course:approve_reviews',
    FEATURE: 'course:feature',
    EXPORT: 'course:export',
    BULK_EDIT: 'course:bulk_edit',
    FORCE_DELETE: 'course:force_delete',
  },

  // User Permissions (11 permissions)
  USER: {
    VIEW_OWN_PROFILE: 'user:view_own_profile',
    VIEW_ANY_PROFILE: 'user:view_any_profile',
    EDIT_OWN_PROFILE: 'user:edit_own_profile',
    EDIT_ANY_PROFILE: 'user:edit_any_profile',
    DELETE_OWN_ACCOUNT: 'user:delete_own_account',
    DELETE_ANY_ACCOUNT: 'user:delete_any_account',
    VERIFY_INSTRUCTOR: 'user:verify_instructor',
    CHANGE_ROLE: 'user:change_role',
    VIEW_ALL_USERS: 'user:view_all_users',
    BAN_USER: 'user:ban_user',
    RESTORE_USER: 'user:restore_user',
  },

  // AI Permissions (7 permissions)
  AI: {
    BASIC_CHAT: 'ai:basic_chat',
    ADVANCED_CHAT: 'ai:advanced_chat',
    VOICE_INTERACTION: 'ai:voice_interaction',
    GENERATE_FLASHCARDS: 'ai:generate_flashcards',
    GENERATE_ROADMAPS: 'ai:generate_roadmaps',
    GENERATE_COURSES: 'ai:generate_courses',
    UNLIMITED_USAGE: 'ai:unlimited_usage',
  },

  // ... 9 more categories (Enrollment, Flashcard, Roadmap, Analytics, Admin, Content, Payment, Platform, Community)
  // See src/lib/permissions.ts for complete list
};
```

### Available Roles

```typescript
ROLES = {
  LEARNER: 'learner',
  VERIFIED_INSTRUCTOR: 'verified_instructor',
  PLATFORM_AUTHOR: 'platform_author',
  ADMIN: 'admin',
};
```

---

## Usage Methods

### Using Permission Hooks

Import hooks from `@/hooks/usePermissions`:

#### 1. Check Single Permission

```tsx
import { usePermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function CreateCourseButton() {
  const { hasPermission, loading } = usePermission(PERMISSIONS.COURSE.CREATE);

  if (loading) return <Spinner />;
  if (!hasPermission) return null;

  return <button onClick={handleCreate}>Create New Course</button>;
}
```

#### 2. Check Multiple Permissions (ANY)

```tsx
import { useAnyPermission } from '@/hooks/usePermissions';

function ViewCoursesButton() {
  const { hasAnyPermission, loading } = useAnyPermission([
    PERMISSIONS.COURSE.VIEW_OWN,
    PERMISSIONS.COURSE.VIEW_ALL,
    PERMISSIONS.COURSE.VIEW_PUBLISHED,
  ]);

  if (!hasAnyPermission) return null;
  return <Link href="/courses">View Courses</Link>;
}
```

#### 3. Check Multiple Permissions (ALL)

```tsx
import { useAllPermissions } from '@/hooks/usePermissions';

function PublishButton({ courseId }: { courseId: string }) {
  const { hasAllPermissions } = useAllPermissions([
    PERMISSIONS.COURSE.EDIT_OWN,
    PERMISSIONS.COURSE.PUBLISH,
  ]);

  if (!hasAllPermissions) return null;
  return <button onClick={() => publishCourse(courseId)}>Publish</button>;
}
```

#### 4. Check User Role

```tsx
import { useRole } from '@/hooks/usePermissions';
import { ROLES } from '@/lib/permissions';

function AdminPanel() {
  const { hasRole } = useRole(ROLES.ADMIN);

  if (!hasRole) return <div>Access Denied</div>;
  return <AdminDashboard />;
}
```

#### 5. Check Resource Ownership

```tsx
import { useIsOwner } from '@/hooks/usePermissions';

function EditCourseButton({ course }: { course: Course }) {
  const { isOwner } = useIsOwner(course);

  if (!isOwner) return null;
  return <button>Edit Course</button>;
}
```

#### 6. Check Can Edit Resource

```tsx
import { useCanEdit } from '@/hooks/usePermissions';

function CourseEditor({ course }: { course: Course }) {
  const { canEdit, loading } = useCanEdit(course, PERMISSIONS.COURSE.EDIT_OWN);

  if (loading) return <Spinner />;
  if (!canEdit) return <div>You cannot edit this course</div>;

  return <CourseEditForm course={course} />;
}
```

#### 7. Role Helper Hooks

```tsx
import { useIsAdmin, useIsInstructor } from '@/hooks/usePermissions';

function Navigation() {
  const { isAdmin } = useIsAdmin();
  const { isInstructor } = useIsInstructor();

  return (
    <nav>
      <Link href="/">Home</Link>
      {isInstructor && <Link href="/instructor">Instructor Dashboard</Link>}
      {isAdmin && <Link href="/admin">Admin Panel</Link>}
    </nav>
  );
}
```

#### 8. Comprehensive Permission Hook

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function ComplexComponent() {
  const {
    hasPermission,
    hasAnyPermission,
    isOwner,
    canEdit,
    isAdmin,
  } = usePermissions();

  // Use all permission checking functions
  const canCreateCourse = hasPermission(PERMISSIONS.COURSE.CREATE);
  const canViewCourses = hasAnyPermission([
    PERMISSIONS.COURSE.VIEW_OWN,
    PERMISSIONS.COURSE.VIEW_ALL,
  ]);

  // ... etc
}
```

---

### Using Permission Gate Components

Import components from `@/components/auth/PermissionGate`:

#### 1. Require Single Permission

```tsx
import { RequirePermission } from '@/components/auth/PermissionGate';

function CoursePage() {
  return (
    <div>
      <h1>Courses</h1>
      <RequirePermission permission={PERMISSIONS.COURSE.CREATE}>
        <button>Create New Course</button>
      </RequirePermission>
    </div>
  );
}
```

#### 2. With Fallback UI

```tsx
<RequirePermission
  permission={PERMISSIONS.COURSE.CREATE}
  fallback={<div>You need instructor permissions to create courses</div>}
>
  <CreateCourseForm />
</RequirePermission>
```

#### 3. With Loading State

```tsx
<RequirePermission
  permission={PERMISSIONS.COURSE.CREATE}
  loadingFallback={<Spinner />}
  fallback={<UpgradePrompt />}
>
  <CreateCourseButton />
</RequirePermission>
```

#### 4. Require ANY Permission

```tsx
import { RequireAnyPermission } from '@/components/auth/PermissionGate';

<RequireAnyPermission
  permissions={[
    PERMISSIONS.COURSE.VIEW_OWN,
    PERMISSIONS.COURSE.VIEW_ALL,
    PERMISSIONS.COURSE.VIEW_PUBLISHED,
  ]}
>
  <CourseList />
</RequireAnyPermission>
```

#### 5. Require ALL Permissions

```tsx
import { RequireAllPermissions } from '@/components/auth/PermissionGate';

<RequireAllPermissions
  permissions={[PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.PUBLISH]}
>
  <PublishCourseButton />
</RequireAllPermissions>
```

#### 6. Require Role

```tsx
import { RequireRole } from '@/components/auth/PermissionGate';

<RequireRole role={ROLES.ADMIN}>
  <AdminPanel />
</RequireRole>
```

#### 7. Require ANY Role

```tsx
import { RequireAnyRole } from '@/components/auth/PermissionGate';

<RequireAnyRole roles={[ROLES.VERIFIED_INSTRUCTOR, ROLES.PLATFORM_AUTHOR, ROLES.ADMIN]}>
  <InstructorDashboard />
</RequireAnyRole>
```

#### 8. Require Resource Ownership

```tsx
import { RequireOwnership } from '@/components/auth/PermissionGate';

<RequireOwnership resource={course}>
  <EditCourseButton />
</RequireOwnership>
```

#### 9. Require Can Edit

```tsx
import { RequireCanEdit } from '@/components/auth/PermissionGate';

<RequireCanEdit resource={course} permission={PERMISSIONS.COURSE.EDIT_OWN}>
  <CourseEditor />
</RequireCanEdit>
```

#### 10. Compound Permission Gate

```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

// Single permission
<PermissionGate config={{ permission: PERMISSIONS.COURSE.CREATE }}>
  <CreateButton />
</PermissionGate>

// Multiple permissions (ANY)
<PermissionGate
  config={{
    permissions: [PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.EDIT_ALL],
  }}
>
  <EditButton />
</PermissionGate>

// Multiple permissions (ALL)
<PermissionGate
  config={{
    permissions: [PERMISSIONS.COURSE.EDIT_OWN, PERMISSIONS.COURSE.PUBLISH],
    requireAll: true,
  }}
>
  <PublishButton />
</PermissionGate>

// Role check
<PermissionGate config={{ role: ROLES.ADMIN }}>
  <AdminPanel />
</PermissionGate>

// Ownership check
<PermissionGate config={{ resource: course, requireOwnership: true }}>
  <OwnerActions />
</PermissionGate>

// Can edit check
<PermissionGate
  config={{
    resource: course,
    canEdit: true,
    editPermission: PERMISSIONS.COURSE.EDIT_OWN,
  }}
>
  <EditButton />
</PermissionGate>
```

---

### Using AuthProvider Permission Functions

The enhanced `AuthProvider` now includes a `permissions` object with all permission checking functions:

```tsx
import { useAuth } from '@/components/providers/AuthProvider';
import { PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const { user, permissions } = useAuth();

  const handleCreateCourse = () => {
    // Check permission before action
    if (!permissions.hasPermission(PERMISSIONS.COURSE.CREATE)) {
      toast.error('You do not have permission to create courses');
      return;
    }

    // Proceed with course creation
    createCourse();
  };

  const handleEditCourse = (course: Course) => {
    // Check if user can edit this specific course
    if (!permissions.canEdit(course, PERMISSIONS.COURSE.EDIT_OWN)) {
      toast.error('You cannot edit this course');
      return;
    }

    // Proceed with edit
    editCourse(course);
  };

  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      {permissions.isAdmin() && <AdminBadge />}
      <button onClick={handleCreateCourse}>Create Course</button>
    </div>
  );
}
```

**Available Functions:**

```typescript
permissions.hasPermission(permission: Permission): boolean
permissions.hasAnyPermission(permissions: Permission[]): boolean
permissions.hasAllPermissions(permissions: Permission[]): boolean
permissions.hasRole(role: Role): boolean
permissions.hasAnyRole(roles: Role[]): boolean
permissions.isOwner(resource: any): boolean
permissions.canEdit(resource: any, editPermission: Permission): boolean
permissions.canDelete(resource: any, deletePermission: Permission): boolean
permissions.isAdmin(): boolean
permissions.isInstructor(): boolean
permissions.isPlatformAuthor(): boolean
permissions.getUserPermissions(): Permission[]
```

---

## Real-World Examples

### Example 1: Course List Page with Conditional Actions

```tsx
'use client';

import { usePermission, useIsOwner } from '@/hooks/usePermissions';
import { RequirePermission } from '@/components/auth/PermissionGate';
import { PERMISSIONS } from '@/lib/permissions';

function CoursesPage({ courses }: { courses: Course[] }) {
  const { hasPermission: canCreate } = usePermission(PERMISSIONS.COURSE.CREATE);

  return (
    <div>
      <div className="header">
        <h1>My Courses</h1>
        {canCreate && (
          <Link href="/courses/create">
            <button>Create New Course</button>
          </Link>
        )}
      </div>

      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const { isOwner } = useIsOwner(course);
  const { hasPermission: canDelete } = usePermission(PERMISSIONS.COURSE.DELETE_OWN);

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>

      <div className="actions">
        {/* Everyone can view */}
        <Link href={`/courses/${course._id}`}>View</Link>

        {/* Only owners can edit */}
        {isOwner && <Link href={`/courses/${course._id}/edit`}>Edit</Link>}

        {/* Only owners with delete permission can delete */}
        {isOwner && canDelete && (
          <button onClick={() => deleteCourse(course._id)}>Delete</button>
        )}
      </div>
    </div>
  );
}
```

### Example 2: Navigation with Role-Based Links

```tsx
'use client';

import { useIsAdmin, useIsInstructor, usePermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function Navigation() {
  const { isAdmin } = useIsAdmin();
  const { isInstructor } = useIsInstructor();
  const { hasPermission: canViewAnalytics } = usePermission(
    PERMISSIONS.ANALYTICS.VIEW_OWN
  );

  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/courses">Courses</Link>
      <Link href="/chat">AI Tutor</Link>

      {/* Instructor-only links */}
      {isInstructor && (
        <>
          <Link href="/instructor/dashboard">My Courses</Link>
          <Link href="/courses/create">Create Course</Link>
        </>
      )}

      {/* Analytics for those with permission */}
      {canViewAnalytics && <Link href="/analytics">Analytics</Link>}

      {/* Admin-only links */}
      {isAdmin && (
        <>
          <Link href="/admin/dashboard">Admin Dashboard</Link>
          <Link href="/admin/users">Manage Users</Link>
          <Link href="/admin/courses">Manage Courses</Link>
        </>
      )}
    </nav>
  );
}
```

### Example 3: Course Editor with Permission Checks

```tsx
'use client';

import { useCanEdit, usePermission } from '@/hooks/usePermissions';
import { RequireCanEdit } from '@/components/auth/PermissionGate';
import { PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/components/providers/AuthProvider';

function CourseEditor({ course }: { course: Course }) {
  const { canEdit, loading } = useCanEdit(course, PERMISSIONS.COURSE.EDIT_OWN);
  const { hasPermission: canPublish } = usePermission(PERMISSIONS.COURSE.PUBLISH);
  const { permissions } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!canEdit) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You do not have permission to edit this course.</p>
      </div>
    );
  }

  const handleSave = async (data: CourseData) => {
    // Additional runtime check
    if (!permissions.canEdit(course, PERMISSIONS.COURSE.EDIT_OWN)) {
      toast.error('You lost permission to edit this course');
      return;
    }

    await updateCourse(course._id, data);
    toast.success('Course updated');
  };

  const handlePublish = async () => {
    if (!canPublish) {
      toast.error('You do not have permission to publish courses');
      return;
    }

    await publishCourse(course._id);
    toast.success('Course published');
  };

  return (
    <div>
      <h1>Edit Course: {course.title}</h1>

      <CourseForm course={course} onSave={handleSave} />

      {/* Only show publish button if user has permission */}
      {canPublish && !course.isPublished && (
        <button onClick={handlePublish}>Publish Course</button>
      )}
    </div>
  );
}
```

### Example 4: Settings Page with Multiple Permission Checks

```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function SettingsPage() {
  const {
    hasPermission,
    isAdmin,
    getUserPermissions,
  } = usePermissions();

  const canManageUsers = hasPermission(PERMISSIONS.USER.VIEW_ALL_USERS);
  const canViewAnalytics = hasPermission(PERMISSIONS.ANALYTICS.VIEW_ALL);
  const canManagePlatform = hasPermission(PERMISSIONS.PLATFORM.MANAGE_SETTINGS);

  return (
    <div>
      <h1>Settings</h1>

      {/* Profile settings (everyone) */}
      <Section title="Profile">
        <ProfileSettings />
      </Section>

      {/* Instructor settings */}
      {hasPermission(PERMISSIONS.COURSE.CREATE) && (
        <Section title="Instructor Settings">
          <InstructorPreferences />
        </Section>
      )}

      {/* Analytics settings */}
      {canViewAnalytics && (
        <Section title="Analytics">
          <AnalyticsSettings />
        </Section>
      )}

      {/* Admin-only settings */}
      {isAdmin && (
        <>
          <Section title="User Management">
            <UserManagement />
          </Section>

          <Section title="Platform Settings">
            <PlatformSettings />
          </Section>
        </>
      )}

      {/* Debug info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <Section title="Debug Info">
          <pre>
            {JSON.stringify(
              {
                permissions: getUserPermissions(),
              },
              null,
              2
            )}
          </pre>
        </Section>
      )}
    </div>
  );
}
```

### Example 5: Conditional Form Fields Based on Permissions

```tsx
'use client';

import { usePermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function CourseForm() {
  const { hasPermission: canSetPricing } = usePermission(
    PERMISSIONS.COURSE.MANAGE_PRICING
  );
  const { hasPermission: canFeatureCourse } = usePermission(
    PERMISSIONS.COURSE.FEATURE
  );

  return (
    <form>
      {/* Basic fields (everyone) */}
      <input name="title" placeholder="Course Title" />
      <textarea name="description" placeholder="Description" />

      {/* Pricing (only if user has permission) */}
      {canSetPricing && (
        <div className="pricing-section">
          <h3>Pricing</h3>
          <input name="price" type="number" placeholder="Price (USD)" />
          <input name="discountPrice" type="number" placeholder="Discount Price" />
        </div>
      )}

      {/* Featured course checkbox (admin/platform author only) */}
      {canFeatureCourse && (
        <label>
          <input type="checkbox" name="isFeatured" />
          Feature this course on homepage
        </label>
      )}

      <button type="submit">Save Course</button>
    </form>
  );
}
```

---

## Migration Guide

### Migrating Existing Components to Use RBAC

#### Before (Hard-coded Role Checks)

```tsx
// ❌ Old way - hard-coded role checks
function CreateCourseButton() {
  const { user } = useAuth();

  // Hard-coded role logic scattered throughout app
  if (!user || user.role === 'learner') {
    return null;
  }

  return <button>Create Course</button>;
}
```

#### After (Permission-based Checks)

```tsx
// ✅ New way - permission-based
import { usePermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function CreateCourseButton() {
  const { hasPermission } = usePermission(PERMISSIONS.COURSE.CREATE);

  if (!hasPermission) return null;

  return <button>Create Course</button>;
}
```

**Benefits:**
- If roles change, no code updates needed
- Centralized permission logic
- Easier to add new roles
- Type-safe with TypeScript

### Migration Steps

1. **Identify Hard-coded Checks**

```bash
# Search for hard-coded role checks
grep -r "user.role ===" src/
grep -r "role === 'admin'" src/
```

2. **Replace with Permission Checks**

```tsx
// Old
if (user.role === 'admin' || user.role === 'verified_instructor')

// New
if (permissions.hasAnyRole([ROLES.ADMIN, ROLES.VERIFIED_INSTRUCTOR]))
// OR better
if (permissions.hasPermission(PERMISSIONS.COURSE.CREATE))
```

3. **Update Navigation Components**

```tsx
// Old
{user?.role === 'admin' && <AdminLink />}

// New
import { RequireRole } from '@/components/auth/PermissionGate';

<RequireRole role={ROLES.ADMIN}>
  <AdminLink />
</RequireRole>
```

4. **Update Action Handlers**

```tsx
// Old
const handleDelete = () => {
  if (user.role !== 'admin' && course.instructor !== user._id) {
    toast.error('Access denied');
    return;
  }
  deleteCourse();
};

// New
const { canDelete } = useCanDelete(course, PERMISSIONS.COURSE.DELETE_OWN);

const handleDelete = () => {
  if (!canDelete) {
    toast.error('Access denied');
    return;
  }
  deleteCourse();
};
```

---

## Best Practices

### 1. Always Prefer Permissions Over Roles

```tsx
// ❌ Bad - role-based check
if (user.role === 'admin' || user.role === 'verified_instructor')

// ✅ Good - permission-based check
if (permissions.hasPermission(PERMISSIONS.COURSE.CREATE))
```

**Why?** If you add a new role that should be able to create courses, you'd have to update every role check. With permissions, you just update the role configuration.

### 2. Use Permission Gates for Layout, Hooks for Logic

```tsx
// ✅ Use Gates for JSX structure
<RequirePermission permission={PERMISSIONS.COURSE.CREATE}>
  <CreateCourseButton />
</RequirePermission>

// ✅ Use Hooks for conditional logic
const { hasPermission } = usePermission(PERMISSIONS.COURSE.CREATE);

const handleAction = () => {
  if (!hasPermission) {
    toast.error('Access denied');
    return;
  }
  // ...
};
```

### 3. Provide Meaningful Fallbacks

```tsx
// ✅ Good - explain why access is denied
<RequirePermission
  permission={PERMISSIONS.COURSE.CREATE}
  fallback={
    <div>
      <p>Only verified instructors can create courses.</p>
      <Link href="/become-instructor">Apply to become an instructor</Link>
    </div>
  }
>
  <CreateCourseForm />
</RequirePermission>
```

### 4. Always Enforce on Backend

```tsx
// Frontend (UX only)
const { hasPermission } = usePermission(PERMISSIONS.COURSE.DELETE_OWN);

const deleteCourse = async () => {
  if (!hasPermission) {
    toast.error('No permission'); // UX feedback
    return;
  }

  // Backend will ALSO check permissions
  try {
    await api.delete(`/courses/${id}`);
  } catch (err) {
    // Backend rejected - handle error
    toast.error(err.message);
  }
};
```

**Frontend checks are for UX. Backend checks are for security.**

### 5. Use Loading States

```tsx
const { hasPermission, loading } = usePermission(PERMISSIONS.COURSE.CREATE);

if (loading) {
  return <Spinner />; // Better UX
}

return hasPermission ? <CreateButton /> : null;
```

### 6. Combine Checks When Needed

```tsx
// Check ownership AND permission
const { canEdit } = useCanEdit(course, PERMISSIONS.COURSE.EDIT_OWN);

// This checks:
// 1. User has COURSE.EDIT_OWN permission (or COURSE.EDIT_ALL)
// 2. User owns the course (or is admin)
```

### 7. Use TypeScript for Safety

```tsx
import { PERMISSIONS, type Permission } from '@/lib/permissions';

// TypeScript will catch typos
const perm: Permission = PERMISSIONS.COURSE.CREATE; // ✅
const perm2: Permission = 'course:creat'; // ❌ Type error
```

### 8. Debug Permissions in Development

```tsx
// Add debug info in development
{process.env.NODE_ENV === 'development' && (
  <div className="debug">
    <h4>Current Permissions:</h4>
    <pre>{JSON.stringify(permissions.getUserPermissions(), null, 2)}</pre>
  </div>
)}
```

---

## TypeScript Support

The RBAC system is fully typed for safety and autocompletion.

### Type Definitions

```typescript
import type { Role, Permission } from '@/lib/permissions';

// Role is a union of valid role strings
type Role = 'learner' | 'verified_instructor' | 'platform_author' | 'admin';

// Permission is a string (all permission constants)
type Permission = string;

// User interface includes role
interface User {
  _id: string;
  name: string;
  email: string;
  role?: Role;
  permissions?: Permission[];
}
```

### Type-Safe Permission Checks

```typescript
import { PERMISSIONS, type Permission } from '@/lib/permissions';

// TypeScript ensures you use valid permission constants
const checkPermission = (perm: Permission) => {
  // ...
};

checkPermission(PERMISSIONS.COURSE.CREATE); // ✅ Valid
checkPermission('course:create'); // ✅ Valid (string literal)
checkPermission('invalid:permission'); // ⚠️ No type error (string is assignable)

// For stricter typing, use the constant directly
const { hasPermission } = usePermission(PERMISSIONS.COURSE.CREATE);
```

### Extending Types

If you add custom permissions:

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // ... existing permissions
  CUSTOM: {
    MY_PERMISSION: 'custom:my_permission',
  },
} as const;

// TypeScript will infer the type automatically
```

---

## Summary

The frontend RBAC system provides:

✅ **Type-safe** permission checking
✅ **React hooks** for component logic
✅ **UI components** for conditional rendering
✅ **AuthProvider integration** for global access
✅ **Exact mirror** of backend permissions
✅ **Better UX** by hiding inaccessible features

**Remember:** Frontend permissions are for **user experience**. Backend permissions are for **security**. Always enforce permissions on both sides.

---

## Quick Reference

### Imports

```typescript
// Permission constants and types
import { PERMISSIONS, ROLES, type Permission, type Role } from '@/lib/permissions';

// React hooks
import {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useRole,
  useAnyRole,
  useIsOwner,
  useCanEdit,
  useCanDelete,
  useIsAdmin,
  useIsInstructor,
  usePermissions,
} from '@/hooks/usePermissions';

// UI components
import {
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireAnyRole,
  RequireOwnership,
  RequireCanEdit,
  RequireCanDelete,
  ConditionalRender,
  PermissionGate,
} from '@/components/auth/PermissionGate';

// Auth context with permissions
import { useAuth } from '@/components/providers/AuthProvider';
```

### Common Patterns

```typescript
// Pattern 1: Simple permission check
const { hasPermission } = usePermission(PERMISSIONS.COURSE.CREATE);

// Pattern 2: Role check
const { hasRole } = useRole(ROLES.ADMIN);

// Pattern 3: Ownership check
const { isOwner } = useIsOwner(resource);

// Pattern 4: Can edit check
const { canEdit } = useCanEdit(resource, PERMISSIONS.COURSE.EDIT_OWN);

// Pattern 5: Using auth context
const { permissions } = useAuth();
permissions.hasPermission(PERMISSIONS.COURSE.CREATE);

// Pattern 6: Permission gate
<RequirePermission permission={PERMISSIONS.COURSE.CREATE}>
  <CreateButton />
</RequirePermission>
```

---

**For more information, see:**
- Backend RBAC Documentation: `backend/RBAC_SYSTEM.md`
- Permission Constants: `nextjs-app/src/lib/permissions.ts`
- Permission Hooks: `nextjs-app/src/hooks/usePermissions.ts`
- Permission Gates: `nextjs-app/src/components/auth/PermissionGate.tsx`
