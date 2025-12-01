# Admin Panel & Verification System - Complete Guide

## 🎯 Overview

Your AI Tutor platform now has a **complete, secure admin panel** with comprehensive controls for platform management, instructor verification, and course quality assurance. This guide covers everything you need to know about the admin system.

---

## 🔐 Security Architecture

### Multi-Layer Protection

1. **Client-Side Protection** (`nextjs-app/src/app/(admin)/layout.tsx`)
   - Checks user authentication status
   - Verifies user role is 'admin'
   - Automatically redirects non-admins to /dashboard
   - Shows ADMIN MODE badge for visual confirmation

2. **Server-Side Protection** (`backend/middleware/adminMiddleware.js`)
   - **requireAdmin**: Verifies JWT token AND admin role
   - **logAdminAction**: Records all admin operations
   - **IP tracking**: Logs IP address for security audits
   - **Optional email whitelist**: Can restrict to specific emails

3. **Security Audit Trail** (`backend/models/AdminActionLog.js`)
   - Records every admin action with timestamp
   - Tracks: admin user, action type, target resource, IP, user agent
   - Provides suspicious activity detection
   - Auto-cleanup after 2 years

### Access Control

```
Admin ONLY: role === 'admin'
```

No other role (learner, verified_instructor, platform_author) can access admin panel.

---

## 🚀 Getting Started

### 1. Create Your First Admin User

```bash
cd backend
npm run admin:create
```

Follow the prompts:
- Enter admin name
- Enter admin email
- Enter password (min 6 characters)

The script will:
- ✅ Check for existing admins
- ✅ Validate email format
- ✅ Set unlimited AI quotas
- ✅ Create the admin user
- ✅ Show admin access URLs

**Example:**
```
🔐 Admin User Creation Script

📦 Connecting to MongoDB...
✅ Connected to MongoDB

Enter admin name: John Doe
Enter admin email: admin@example.com
Enter admin password (min 6 characters): ******

📝 Creating admin user...

✅ Admin user created successfully!
═══════════════════════════════════════
   Name: John Doe
   Email: admin@example.com
   Role: admin
   ID: 507f1f77bcf86cd799439011
═══════════════════════════════════════

🔐 Admin user can now access:
   - Admin Panel: /admin/dashboard
   - Instructor Verification: /admin/instructors
   - Course Quality Review: /admin/courses
   - User Management: /admin/users
   - Admin API: /api/admin/*
```

### 2. Verify System Configuration

```bash
cd backend
npm run admin:verify
```

This runs comprehensive checks:
- ✅ User model configuration
- ✅ Course model configuration
- ✅ AIUsageLog model
- ✅ AdminActionLog model
- ✅ Admin user existence
- ✅ Database statistics

**Example Output:**
```
🔍 Starting Admin Setup Verification...

📦 Connecting to MongoDB...
✅ Connected to MongoDB

👤 Verifying User Model...
✅ User role enum includes all required roles
✅ User default role is "learner"
✅ User model has approveAsInstructor method
✅ User model has rejectInstructorApplication method

📚 Verifying Course Model...
✅ Course courseType enum includes all required types
✅ Course default courseType is "personal"
✅ Course visibility enum includes all required values
✅ Course model has approveQuality method
✅ Course model has rejectQuality method

🤖 Verifying AIUsageLog Model...
✅ AIUsageLog model exists
✅ AIUsageLog has getPlatformUsage method
✅ AIUsageLog has getUserUsageSummary method

📝 Verifying AdminActionLog Model...
✅ AdminActionLog model exists
✅ AdminActionLog has getRecentActions method
✅ AdminActionLog has getActionsByType method

👑 Checking Admin Users...
✅ Found 1 admin user(s)

📊 Database Statistics...
   Total Users: 42
   Total Courses: 156
   Pending Instructor Applications: 3
   Pending Course Reviews: 8

═══════════════════════════════════════
📋 VERIFICATION SUMMARY
═══════════════════════════════════════
✅ Passed: 14
❌ Failed: 0
⚠️  Warnings: 0
═══════════════════════════════════════

🎉 All checks passed! Admin system is properly configured.
```

---

## 📱 Admin Panel Features

### 1. Dashboard (`/admin/dashboard`)

**Platform Overview:**
- 👥 Total users with breakdown by role
- 📚 Total courses by type (personal/marketplace/flagship)
- 💰 Revenue statistics (total, platform share, instructor share)
- 🤖 AI usage metrics (messages, voice minutes, generations)
- ⏰ New users this month
- 💵 Revenue this month

**Pending Reviews Alert:**
- Shows count of pending instructor applications
- Shows count of pending course quality reviews
- Links directly to review pages

**Visual Analytics:**
- User distribution by role (learner, verified_instructor, platform_author, admin)
- Course distribution by type and visibility
- AI usage breakdown (chat, voice, course generation)
- Revenue split visualization

### 2. Instructor Verification (`/admin/instructors`)

**Review Pending Applications:**
- View all pending instructor applications
- See applicant profile:
  - Professional title and bio
  - Years of experience
  - Expertise areas with verification scores
  - Certifications (with external links)
  - Social links (LinkedIn, GitHub, website)
  - KYC status and age

**Actions:**
- ✅ **Approve**: Upgrades user to `verified_instructor` role
  - Grants marketplace course creation permission
  - Increases AI usage quotas
  - Enables revenue sharing
- ❌ **Reject**: Rejects application with reason
  - Sends feedback to applicant
  - User can reapply after addressing issues

### 3. Course Quality Review (`/admin/courses`)

**Review Marketplace Submissions:**
- View courses submitted for marketplace approval
- See course details:
  - Title, description, and creator info
  - Module, lesson, and enrollment counts
  - Learning outcomes
  - Prerequisites
  - Previous quality issues (if resubmitted)

**Quality Check Features:**
- **Common Issues Checklist:**
  - Insufficient content (< 10 lessons)
  - Poor description quality
  - Missing learning outcomes
  - Incomplete modules
  - Content misalignment
  - Duplicate/spam content
  - Inappropriate content
  - Missing prerequisites

- **Custom Quality Issues:**
  - Add specific feedback
  - Multiple issues can be selected

**Actions:**
- ✅ **Approve**: Makes course publicly available
  - Sets `marketplace.hasPassedQualityReview = true`
  - Makes course discoverable in marketplace
  - Enables course sales
- ❌ **Reject**: Sends detailed feedback
  - Lists all quality issues
  - Instructor can improve and resubmit

### 4. User Management (`/admin/users`)

**User Directory:**
- **Search**: Find users by name or email
- **Filter**: By role (learner, instructor, author, admin)
- **Pagination**: 20 users per page
- **Information Displayed**:
  - Name and email
  - Role (color-coded badges)
  - Join date
  - Last login date

**Features:**
- Fast search across all users
- Role-based filtering
- Responsive table design
- Quick pagination controls

---

## 🔌 API Endpoints

All endpoints require admin authentication: `Authorization: Bearer <admin_token>`

### Dashboard & Analytics

```javascript
GET /api/admin/dashboard
// Returns: platform overview, statistics, pending reviews

GET /api/admin/analytics/ai-usage?days=30
// Returns: AI usage statistics for specified period

GET /api/admin/analytics/revenue
// Returns: revenue breakdown, platform/instructor shares
```

### Instructor Verification

```javascript
GET /api/admin/instructors/pending
// Returns: { applications: [...] }

POST /api/admin/instructors/:userId/approve
// Approves instructor application

POST /api/admin/instructors/:userId/reject
// Body: { reason: "..." }
// Rejects instructor application with reason
```

### Course Quality Review

```javascript
GET /api/admin/courses/pending-review
// Returns: { courses: [...] }

POST /api/admin/courses/:courseId/approve
// Approves course for marketplace

POST /api/admin/courses/:courseId/reject
// Body: { issues: ["issue1", "issue2", ...] }
// Rejects course with quality issues
```

### User Management

```javascript
GET /api/admin/users?role=learner&search=john&page=1&limit=20
// Returns: { users, total, page, totalPages }

GET /api/admin/users/:userId
// Returns: detailed user info + courses + enrollments + AI usage
```

### Audit Logs

```javascript
GET /api/admin/logs/actions?limit=100
// Returns: { logs: [...] }

GET /api/admin/logs/actions?actionType=approve_instructor
// Returns: filtered logs by action type
```

---

## 🎨 Frontend Architecture

### Layout Structure

```
/app
  /(admin)
    layout.tsx          # Admin layout with sidebar
    /admin
      /dashboard
        page.tsx        # Dashboard page
      /instructors
        page.tsx        # Instructor verification page
      /courses
        page.tsx        # Course quality review page
      /users
        page.tsx        # User management page
```

### Services Layer

```typescript
// nextjs-app/src/services/admin/adminService.ts

adminService.getDashboard()
adminService.getAIUsageAnalytics()
adminService.getRevenueAnalytics()
adminService.getPendingInstructors()
adminService.approveInstructor(userId)
adminService.rejectInstructor(userId, reason)
adminService.getPendingCourses()
adminService.approveCourse(courseId)
adminService.rejectCourse(courseId, issues)
adminService.getUsers(params)
adminService.getUserDetail(userId)
adminService.getAdminLogs(params)
```

---

## 🛡️ Role-Based Access Control (RBAC)

### Role Hierarchy

1. **Learner** (default)
   - Create personal courses (private only)
   - Limited AI usage quota
   - Cannot publish to marketplace
   - Cannot earn revenue

2. **Verified Instructor**
   - Create marketplace courses
   - Submit for quality review
   - Publish public courses
   - Earn 70% revenue share
   - Higher AI usage quota
   - Must be 18+, pass KYC, show expertise

3. **Platform Author**
   - Create flagship courses
   - No quality review required
   - Unlimited AI usage
   - Internal experts only

4. **Admin**
   - Full platform control
   - Approve/reject instructors
   - Approve/reject courses
   - Manage all users
   - View all analytics
   - Unlimited AI usage
   - **HIGHEST PRIVILEGE**

### Permission Matrix

| Feature | Learner | Verified Instructor | Platform Author | Admin |
|---------|---------|---------------------|-----------------|-------|
| Create Personal Courses | ✅ | ✅ | ✅ | ✅ |
| Create Marketplace Courses | ❌ | ✅ | ✅ | ✅ |
| Create Flagship Courses | ❌ | ❌ | ✅ | ✅ |
| Publish Public Courses | ❌ | ✅ (after review) | ✅ | ✅ |
| Earn Revenue | ❌ | ✅ | ✅ | ✅ |
| Access Admin Panel | ❌ | ❌ | ❌ | ✅ |
| Verify Instructors | ❌ | ❌ | ❌ | ✅ |
| Review Course Quality | ❌ | ❌ | ❌ | ✅ |
| View Platform Analytics | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |

---

## 📊 Database Models

### User Model - Instructor Verification

```javascript
{
  role: 'learner' | 'verified_instructor' | 'platform_author' | 'admin',

  instructorVerification: {
    status: 'not_applied' | 'pending' | 'approved' | 'rejected',
    kycStatus: 'not_submitted' | 'pending' | 'verified' | 'failed',
    age: Number,  // Must be >= 18
    appliedAt: Date,
    reviewedAt: Date,
    rejectionReason: String,

    expertiseAreas: [{
      subject: String,
      category: String,
      verificationMethod: String,
      verificationScore: Number
    }],

    portfolio: {
      bio: String,
      professionalTitle: String,
      yearsOfExperience: Number,
      certifications: [{
        name: String,
        issuer: String,
        url: String
      }],
      socialLinks: {
        linkedin: String,
        github: String,
        website: String
      }
    }
  },

  // Methods
  approveAsInstructor()
  rejectInstructorApplication(reason)
}
```

### Course Model - Quality Review

```javascript
{
  courseType: 'personal' | 'marketplace' | 'flagship',
  visibility: 'private' | 'unlisted' | 'public',
  creatorRole: String,

  marketplace: {
    hasPassedQualityReview: Boolean,
    qualityReviewedBy: ObjectId,
    qualityReviewedAt: Date,
    qualityIssues: [String],
    totalSales: Number,
    totalRevenue: Number  // in cents
  },

  pricing: {
    model: 'free' | 'paid' | 'subscription',
    amount: Number,  // in cents
    platformFeePercentage: 30,
    instructorShare: 70
  },

  // Methods
  approveQuality(reviewerId)
  rejectQuality(reviewerId, issues)
  recordSale(amount)
}
```

### AdminActionLog Model

```javascript
{
  adminUser: ObjectId,
  adminEmail: String,
  actionType: 'approve_instructor' | 'reject_instructor' |
              'approve_course' | 'reject_course' | ...,
  targetResource: String,  // Resource ID
  requestMethod: String,
  requestPath: String,
  requestBody: Mixed,  // Sanitized
  ipAddress: String,
  userAgent: String,
  success: Boolean,
  timestamp: Date
}

// Static Methods
getRecentActions(limit)
getActionsByType(type, limit)
getFailedActions(hours)
detectSuspiciousActivity()
```

### AIUsageLog Model

```javascript
{
  user: ObjectId,
  usageType: 'chat_message' | 'voice_session' | 'course_generation',
  tokensUsed: Number,
  minutesUsed: Number,
  estimatedCost: Number,
  quotaStatus: 'within_quota' | 'over_quota' | 'unlimited',
  timestamp: Date
}

// Static Methods
getUserUsageSummary(userId, startDate, endDate)
getPlatformUsage(startDate, endDate)
trackUsage(data)
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/ai-tutor
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# Optional: Admin email whitelist
ADMIN_EMAIL_WHITELIST=admin@example.com,owner@example.com
```

### Frontend Configuration

```typescript
// nextjs-app/.env.local
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=http://localhost:5000/api
```

---

## 🚨 Security Best Practices

### 1. Admin User Management

- ✅ Use strong passwords (min 8 characters, mixed case, numbers, symbols)
- ✅ Limit number of admin users (1-3 recommended)
- ✅ Use unique email addresses
- ✅ Enable 2FA if implemented
- ❌ Never share admin credentials
- ❌ Don't use personal emails for admin accounts

### 2. Monitoring

- Review admin action logs regularly:
  ```bash
  GET /api/admin/logs/actions?limit=100
  ```
- Check for suspicious activity:
  - Multiple failed actions
  - Actions from unusual IP addresses
  - Actions during odd hours
  - Rapid succession of sensitive actions

### 3. Access Control

- Keep admin email whitelist enabled in production
- Regularly audit admin user list
- Remove admin access when no longer needed
- Review AdminActionLog for unauthorized attempts

---

## 📈 Analytics & Reporting

### Available Metrics

1. **User Growth**
   - Total users by role
   - New users this month
   - Role distribution

2. **Course Statistics**
   - Total courses by type
   - Visibility distribution
   - Pending quality reviews

3. **Revenue Tracking**
   - Total revenue (all time)
   - Platform share (30%)
   - Instructor share (70%)
   - Revenue this month

4. **AI Usage**
   - Chat messages (this month)
   - Voice minutes (this month)
   - Courses generated
   - Estimated cost

### Custom Reports

```javascript
// AI Usage for specific period
GET /api/admin/analytics/ai-usage?days=90

// User detail with all activity
GET /api/admin/users/:userId
// Returns: courses, enrollments, AI usage summary
```

---

## 🐛 Troubleshooting

### Admin Panel Not Accessible

1. **Check user role:**
   ```javascript
   // In MongoDB
   db.users.findOne({ email: "your-email@example.com" })
   // Should show: role: "admin"
   ```

2. **Verify authentication:**
   - Ensure you're logged in
   - Check JWT token is valid
   - Clear cookies and login again

3. **Check console for errors:**
   - Open browser DevTools (F12)
   - Look for 403 Forbidden errors
   - Check Network tab for failed requests

### API Returning 403 Forbidden

1. **Verify middleware order in server.js:**
   ```javascript
   router.use(protect);      // Must be first
   router.use(requireAdmin); // Must be second
   ```

2. **Check adminMiddleware.js:**
   - Ensure requireAdmin is exported
   - Check email whitelist (if enabled)

### Statistics Not Loading

1. **Check database connection:**
   ```bash
   npm run admin:verify
   ```

2. **Verify models exist:**
   - User, Course, Enrollment, AIUsageLog

3. **Check backend logs:**
   ```bash
   npm run dev
   # Watch for errors in admin routes
   ```

---

## 🎯 Next Steps

### For Development

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../nextjs-app && npm install
   ```

2. **Create admin user:**
   ```bash
   cd backend
   npm run admin:create
   ```

3. **Verify setup:**
   ```bash
   npm run admin:verify
   ```

4. **Start servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd nextjs-app && npm run dev
   ```

5. **Access admin panel:**
   - Navigate to: http://localhost:3000/admin/dashboard
   - Login with admin credentials

### For Production

1. **Security hardening:**
   - Enable admin email whitelist
   - Use environment variables for secrets
   - Enable HTTPS
   - Implement rate limiting on admin routes
   - Add 2FA for admin users

2. **Monitoring:**
   - Set up log aggregation
   - Configure alerts for suspicious activity
   - Regular security audits
   - Monitor admin action logs

3. **Backup:**
   - Regular database backups
   - AdminActionLog retention
   - Audit trail preservation

---

## 📚 Resources

### Documentation Files

- `ARCHITECTURE_DUAL_LAYER.md` - Complete system architecture
- `backend/routes/admin.js` - All admin API endpoints
- `backend/middleware/adminMiddleware.js` - Security middleware
- `nextjs-app/src/app/(admin)/layout.tsx` - Admin UI layout
- `nextjs-app/src/services/admin/adminService.ts` - Frontend service

### Helper Scripts

- `backend/scripts/verify-admin-setup.js` - System verification
- `backend/scripts/create-admin.js` - Admin user creation

### Commands

```bash
# Backend
npm run admin:verify    # Verify system configuration
npm run admin:create    # Create admin user
npm run dev            # Start development server

# Frontend
npm run dev            # Start Next.js dev server
npm run build          # Build for production
```

---

## ✅ Verification Checklist

Before going to production, ensure:

- [ ] At least one admin user exists
- [ ] All verification checks pass (`npm run admin:verify`)
- [ ] Admin panel accessible at `/admin/dashboard`
- [ ] Instructor verification working
- [ ] Course quality review working
- [ ] User management working
- [ ] Security logging enabled
- [ ] Email whitelist configured (if needed)
- [ ] Strong admin passwords set
- [ ] Backend and frontend properly connected
- [ ] HTTPS enabled in production
- [ ] Environment variables secured

---

## 🆘 Support

If you encounter issues:

1. Run verification script: `npm run admin:verify`
2. Check console logs (browser DevTools)
3. Check backend logs (`npm run dev`)
4. Review AdminActionLog for errors
5. Verify database connectivity
6. Check environment variables

---

**Admin panel is now fully functional and ready for platform management!** 🎉
