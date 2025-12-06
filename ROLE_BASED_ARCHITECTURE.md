# Role-Based Architecture Design
*Complete system design for strict role separation and secure routing*

---

## 1. Role Definitions & Permissions Matrix

### Roles
| Role | Database Value | Display Name | Primary Purpose |
|------|---------------|--------------|-----------------|
| **Student** | `learner` | Student | Learn courses, chat with AI, track progress |
| **Instructor** | `verified_instructor` | Verified Instructor | Create courses, manage students, earn revenue |
| **Author** | `platform_author` | Platform Author | Create curriculum, write content, publish courses |
| **Admin** | `admin` | Administrator | Platform management, user oversight, analytics |

### Permissions Matrix

| Feature | Student | Instructor | Author | Admin |
|---------|---------|------------|--------|-------|
| **Learning** | | | | |
| View public courses | ✅ | ✅ | ✅ | ✅ |
| Enroll in courses | ✅ | ✅ | ✅ | ✅ |
| AI chat (general) | ✅ | ✅ | ✅ | ✅ |
| AI chat (course-specific) | ✅ (enrolled) | ✅ | ✅ | ✅ |
| Track progress | ✅ | ✅ | ✅ | ✅ |
| Flashcards | ✅ | ✅ | ✅ | ✅ |
| Roadmaps | ✅ | ✅ | ✅ | ✅ |
| **Teaching** | | | | |
| Create courses | ❌ | ✅ | ✅ | ✅ |
| Edit own courses | ❌ | ✅ | ✅ | ✅ |
| View student list | ❌ | ✅ (own courses) | ✅ (own courses) | ✅ (all) |
| View earnings | ❌ | ✅ | ✅ | ✅ |
| Request payouts | ❌ | ✅ | ✅ | ✅ |
| **Content Creation** | | | | |
| Curriculum builder | ❌ | ❌ | ✅ | ✅ |
| Content writing tools | ❌ | ❌ | ✅ | ✅ |
| Publishing workflow | ❌ | ❌ | ✅ | ✅ |
| **Administration** | | | | |
| User management | ❌ | ❌ | ❌ | ✅ |
| Instructor verification | ❌ | ❌ | ❌ | ✅ |
| Platform analytics | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

---

## 2. Frontend Architecture

### Route Structure

```
app/
├── (public)/              # Public pages (no auth required)
│   ├── page.tsx           # Landing page
│   ├── browse/            # Browse courses
│   ├── course/[id]/       # Course details
│   └── ...
│
├── (auth)/                # Authentication pages
│   ├── login/
│   └── register/
│
├── (student)/             # STUDENT-ONLY PAGES
│   ├── layout.tsx         # Student-specific layout
│   ├── dashboard/         # Student dashboard
│   ├── my-courses/        # Enrolled courses
│   ├── chat/              # AI tutor chat
│   ├── progress/          # Learning progress
│   ├── flashcards/        # Flashcard practice
│   ├── roadmaps/          # Learning roadmaps
│   └── profile/           # Student profile
│
├── (instructor)/          # INSTRUCTOR-ONLY PAGES
│   ├── layout.tsx         # Instructor-specific layout
│   ├── dashboard/         # Instructor dashboard
│   ├── courses/           # Course management
│   │   ├── create/        # Create new course
│   │   ├── [id]/edit/     # Edit course
│   │   └── [id]/analytics/# Course analytics
│   ├── students/          # Student management
│   ├── earnings/          # Revenue & payouts
│   ├── verification/      # Verification process
│   └── profile/           # Instructor profile
│
├── (author)/              # AUTHOR-ONLY PAGES
│   ├── layout.tsx         # Author-specific layout
│   ├── dashboard/         # Author dashboard
│   ├── curriculum/        # Curriculum builder
│   │   ├── create/        # Create curriculum
│   │   └── [id]/edit/     # Edit curriculum
│   ├── content/           # Content writing
│   ├── publish/           # Publishing workflow
│   ├── library/           # Content library
│   └── profile/           # Author profile
│
└── (admin)/               # ADMIN-ONLY PAGES
    ├── layout.tsx         # Admin-specific layout
    ├── dashboard/         # Admin dashboard
    ├── users/             # User management
    ├── instructors/       # Instructor verification
    ├── analytics/         # Platform analytics
    └── settings/          # System settings
```

### Protected Route Component

Create a `ProtectedRoute` component that:
1. Checks authentication status
2. Validates user role matches required role(s)
3. Redirects to login if not authenticated
4. Redirects to unauthorized page if wrong role
5. Shows loading state during verification

### Role-Based Layouts

Each role group has its own layout with:
- Custom navigation (different links per role)
- Role-specific header
- Different sidebar content
- Unique styling/branding per role

---

## 3. Backend Architecture

### Middleware Chain

```javascript
// Authentication + Role Authorization
protect → authorize([roles]) → routeHandler

// Example:
router.post('/courses/create',
  protect,                                    // Must be logged in
  authorize(['verified_instructor', 'platform_author', 'admin']),  // Must be instructor/author/admin
  courseController.createCourse              // Handler
);
```

### API Route Protection

| Endpoint Pattern | Allowed Roles |
|-----------------|---------------|
| `/api/students/*` | `learner`, `admin` |
| `/api/instructor/*` | `verified_instructor`, `platform_author`, `admin` |
| `/api/author/*` | `platform_author`, `admin` |
| `/api/admin/*` | `admin` |
| `/api/courses` (GET) | ALL (public) |
| `/api/courses` (POST) | `verified_instructor`, `platform_author`, `admin` |
| `/api/courses/:id` (PUT/DELETE) | Owner, `admin` |

### Enhanced Middleware

**`requireRole.js`** - Strict role validation with detailed errors
**`requireOwnership.js`** - Verify user owns resource (courses, content)
**`requireVerification.js`** - Check instructor verification status

---

## 4. User Flow After Login

### Login Flow Diagram

```
User Login
    ↓
[Authentication]
    ↓
[Get User Role]
    ↓
    ├─→ learner? → /student/dashboard
    ├─→ verified_instructor? → Check verification
    │       ↓
    │       ├─→ Approved? → /instructor/dashboard
    │       └─→ Not approved? → /instructor/verification
    ├─→ platform_author? → /author/dashboard
    └─→ admin? → /admin/dashboard
```

### Role-Specific First Experience

**Student Login:**
1. Redirects to `/student/dashboard`
2. Sees: Enrolled courses, progress, AI chat access
3. Navigation: My Courses, Chat, Progress, Flashcards

**Instructor Login:**
1. Checks verification status
2. If approved → `/instructor/dashboard`
3. If not approved → `/instructor/verification`
4. Sees: Course analytics, student list, earnings
5. Navigation: Courses, Students, Earnings, Analytics

**Author Login:**
1. Redirects to `/author/dashboard`
2. Sees: Curriculum builder, content library, publishing queue
3. Navigation: Curriculum, Content, Publish, Library

**Admin Login:**
1. Redirects to `/admin/dashboard`
2. Sees: Platform analytics, user stats, verification queue
3. Navigation: Users, Instructors, Analytics, Settings

---

## 5. Security Implementation

### Frontend Security

1. **Route Guards:**
   - Every role-specific page wrapped in `ProtectedRoute`
   - Automatic redirect on unauthorized access
   - Loading states during auth check

2. **Component-Level Protection:**
   - `<RoleGate>` component for conditional rendering
   - `useRequireRole()` hook for page-level protection
   - `hasPermission()` utility for feature checks

3. **Navigation Filtering:**
   - Sidebar shows only role-appropriate links
   - Hidden links are also blocked at route level
   - No "forbidden" links visible to users

### Backend Security

1. **Middleware Stack:**
   ```javascript
   // Every protected route
   protect                    // Authentication
   → authorize([roles])       // Role validation
   → checkOwnership (if needed)  // Resource ownership
   → routeHandler            // Business logic
   ```

2. **Database Queries:**
   - Filter by user role automatically
   - Instructors see only their students
   - Authors see only their content
   - Students see only enrolled courses

3. **Response Filtering:**
   - Different data returned based on role
   - Sensitive fields hidden from non-admins
   - Error messages don't leak role info

---

## 6. Implementation Checklist

### Phase 1: Backend Security ✅
- [ ] Enhance `authorize` middleware with better error messages
- [ ] Create `requireOwnership` middleware
- [ ] Create `requireVerification` middleware
- [ ] Protect all API routes with proper role checks
- [ ] Add role-based query filters

### Phase 2: Frontend Infrastructure ✅
- [ ] Create `ProtectedRoute` component
- [ ] Create `RoleGate` component
- [ ] Create `useRequireRole` hook
- [ ] Create `hasPermission` utility
- [ ] Update `AuthProvider` with role detection

### Phase 3: Folder Restructuring ✅
- [ ] Rename `(dashboard)` to `(student)`
- [ ] Create `(instructor)` route group
- [ ] Create `(author)` route group
- [ ] Move existing pages to correct folders
- [ ] Update imports and links

### Phase 4: Role-Specific Layouts ✅
- [ ] Create `StudentLayout` component
- [ ] Create `InstructorLayout` component
- [ ] Create `AuthorLayout` component
- [ ] Keep `AdminLayout` (already exists)
- [ ] Create role-specific navigation configs

### Phase 5: Dashboards ✅
- [ ] Build Student Dashboard
- [ ] Build Instructor Dashboard (already exists)
- [ ] Build Author Dashboard
- [ ] Update Admin Dashboard

### Phase 6: Testing & Validation ✅
- [ ] Test all route protections
- [ ] Test role-based redirects
- [ ] Test API authorization
- [ ] Test ownership checks
- [ ] Test cross-role access attempts

---

## 7. Migration Strategy

### Step 1: Add New Structure (No Breaking Changes)
- Create new route groups alongside existing
- Build protected route components
- Implement middleware enhancements

### Step 2: Migrate Pages Gradually
- Copy pages to new locations
- Update internal links
- Test each role's experience

### Step 3: Update AuthProvider
- Implement new role-based routing
- Add verification checks
- Update redirect logic

### Step 4: Clean Up
- Remove old dashboard folder
- Update all documentation
- Remove redundant code

---

## 8. Developer Guidelines

### Creating New Protected Pages

```typescript
// 1. Choose correct route group
app/(student)/new-feature/page.tsx

// 2. Wrap in ProtectedRoute
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function NewFeaturePage() {
  return (
    <ProtectedRoute requiredRole="learner">
      <div>Feature content</div>
    </ProtectedRoute>
  );
}

// 3. Protect backend API
router.post('/api/feature',
  protect,
  authorize(['learner']),
  handler
);
```

### Adding New Permissions

1. Update permissions matrix in this doc
2. Update `hasPermission` utility
3. Add middleware if needed
4. Update navigation config
5. Add tests

---

## 9. Error Handling

### Unauthorized Access

**Frontend:**
```
User tries to access /instructor/dashboard
→ Check role: learner
→ Redirect to /unauthorized
→ Show message: "This page is only accessible to verified instructors"
```

**Backend:**
```
POST /api/courses/create
→ protect: ✅ Authenticated
→ authorize: ❌ Role 'learner' not in ['verified_instructor', 'platform_author', 'admin']
→ Response: 403 Forbidden with message
```

### Not Authenticated

**Frontend:**
```
Unauthenticated user tries /student/dashboard
→ Redirect to /login?redirect=/student/dashboard
→ After login, redirect back
```

---

## 10. Future Enhancements

- [ ] Fine-grained permissions system (beyond roles)
- [ ] Role hierarchies (admin inherits all permissions)
- [ ] Custom role creation
- [ ] Permission groups
- [ ] Audit logging for role-based actions
- [ ] Multi-role support (user can be both student and instructor)

---

**Status:** Ready for Implementation
**Last Updated:** 2025-12-06
**Version:** 1.0
