# Admin Setup and Testing Guide

**Date:** 2025-12-01
**Purpose:** Complete guide for setting up and testing admin functionality

---

## 🔒 Security Overview

The admin system has **multi-layer security**:

### Layer 1: Next.js Middleware
- **Route Protection:** `/admin/*` routes require authentication
- **Cookie Validation:** Checks for valid `authToken` cookie
- **Redirect:** Unauthenticated users redirected to `/login`

### Layer 2: Frontend Layout Guard
- **Role Check:** `AdminLayout` verifies `user.role === 'admin'`
- **Auto-redirect:** Non-admin users redirected to `/dashboard`
- **Loading State:** Shows verification screen while checking

### Layer 3: Backend Middleware
- **Authentication:** `protect` middleware verifies JWT token
- **Authorization:** `requireAdmin` middleware checks admin role
- **Audit Logging:** All admin actions logged for security
- **Role Escalation Prevention:** Users can't change their own role

### Layer 4: Optional Whitelist
- **Email Whitelist:** Can enable admin email whitelist for extra security
- **Configuration:** Edit `backend/middleware/adminMiddleware.js`

---

## 📋 Admin Routes

### Frontend Routes (Protected)
All require authentication + admin role:

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Platform overview & stats |
| `/admin/users` | User management |
| `/admin/instructors` | Instructor verification |
| `/admin/courses` | Course quality review |
| `/admin/analytics` | Platform analytics |
| `/admin/logs` | Audit logs |

### Backend API Routes (Protected)
All require authentication + admin role:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/dashboard` | GET | Get platform stats |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id` | GET | Get user details |
| `/api/admin/users/:id` | PUT | Update user |
| `/api/admin/users/:id` | DELETE | Delete user |
| `/api/admin/instructors/pending` | GET | Pending instructor applications |
| `/api/admin/instructors/:id/approve` | POST | Approve instructor |
| `/api/admin/instructors/:id/reject` | POST | Reject instructor |
| `/api/admin/courses/review` | GET | Courses needing review |
| `/api/admin/courses/:id/approve` | POST | Approve course |
| `/api/admin/courses/:id/reject` | POST | Reject course |
| `/api/admin/logs` | GET | Get audit logs |

---

## 🔧 Creating an Admin User

### Method 1: Using the Admin Creation Script (Recommended)

**On Windows:**
```bash
cd "C:\SUMIT\Mini - AI tutor\backend"
npm run admin:create
```

**Follow the prompts:**
```
🔐 Admin User Creation Script

Enter admin name: John Admin
Enter admin email: admin@example.com
Enter admin password (min 6 characters): ********

✅ Admin user created successfully!
═══════════════════════════════════════
   Name: John Admin
   Email: admin@example.com
   Role: admin
   ID: 507f1f77bcf86cd799439011
═══════════════════════════════════════
```

### Method 2: Upgrade Existing User to Admin

```bash
npm run admin:create
```

If user exists:
```
⚠️  User with email admin@example.com exists with role "learner".
Upgrade to admin? (yes/no): yes

✅ User John Admin upgraded to admin!
```

### Method 3: Direct Database Update (MongoDB)

```javascript
// Connect to MongoDB
use mini-ai-tutor

// Update user to admin
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 🧪 Testing Admin Functionality

### Test 1: Admin Login ✅

1. **Create admin user** (use script above)
2. **Login** at `http://localhost:3000/login`
3. **Verify redirect** to `/dashboard` (not `/admin`)
4. **Navigate to admin** panel manually: `http://localhost:3000/admin/dashboard`
5. **Expected:** Access granted, admin panel loads

### Test 2: Non-Admin Access Blocked ✅

1. **Create regular user** (role: learner)
2. **Login** with regular user
3. **Try to access** `http://localhost:3000/admin/dashboard`
4. **Expected:**
   - Frontend redirects to `/dashboard`
   - Shows "You don't have permission" or similar message

### Test 3: Unauthenticated Access Blocked ✅

1. **Logout** completely
2. **Try to access** `http://localhost:3000/admin/dashboard`
3. **Expected:** Redirected to `/login?redirect=/admin/dashboard`

### Test 4: Backend API Protection ✅

**Without Auth:**
```bash
curl http://localhost:5000/api/admin/dashboard
# Expected: 401 Unauthorized
```

**With Non-Admin User:**
```bash
# Login as regular user first, then:
curl http://localhost:5000/api/admin/dashboard \
  -H "Cookie: authToken=<regular-user-token>"
# Expected: 403 Forbidden
```

**With Admin User:**
```bash
# Login as admin, then:
curl http://localhost:5000/api/admin/dashboard \
  -H "Cookie: authToken=<admin-token>"
# Expected: 200 OK with dashboard data
```

### Test 5: Role Protection ✅

**Try to change own role:**
```bash
PUT /api/admin/users/<own-user-id>
Body: { "role": "learner" }

# Expected: 403 Forbidden
# Message: "You cannot modify your own role for security reasons"
```

### Test 6: Audit Logging ✅

1. **Login as admin**
2. **Perform admin action** (e.g., approve instructor)
3. **Check logs:**
   ```bash
   GET /api/admin/logs
   ```
4. **Expected:** Action logged with timestamp, admin email, IP address

---

## 🔐 Security Features

### 1. Role-Based Access Control (RBAC)
- ✅ Admin role required for all admin routes
- ✅ Non-admins automatically blocked
- ✅ Role check happens on both frontend and backend

### 2. Audit Trail
- ✅ All admin actions logged
- ✅ Includes: timestamp, admin email, action type, IP address
- ✅ Stored in `AdminActionLog` collection

### 3. Prevent Role Escalation
- ✅ Only admins can change user roles
- ✅ Admins cannot change their own role
- ✅ Role changes logged for audit

### 4. Session Management
- ✅ HTTP-only cookies (XSS-resistant)
- ✅ Automatic session validation
- ✅ Token expiration after 7 days

### 5. Security Logging
- ✅ Unauthorized access attempts logged
- ✅ Console warnings for security events
- ✅ IP address tracking

---

## 📊 Admin Dashboard Features

### Platform Statistics
- Total users by role
- Total courses by type
- Total enrollments
- Pending instructor applications
- Pending course reviews
- AI usage metrics
- Platform revenue

### User Management
- View all users
- Edit user details
- Delete users
- Change user roles
- View user activity

### Instructor Verification
- View pending applications
- Review KYC documents
- Approve/reject applications
- Set rejection reasons

### Course Quality Review
- View marketplace courses
- Check for quality issues
- Approve/reject courses
- Provide feedback

---

## 🚨 Common Issues

### Issue: "Access denied" for admin user

**Cause:** User role not set to 'admin'

**Fix:**
```bash
npm run admin:verify
# Or use admin:create to upgrade user
```

### Issue: Admin panel redirects to dashboard

**Cause:** User doesn't have admin role

**Fix:**
1. Verify user role in database
2. Run `npm run admin:create` to upgrade user
3. Logout and login again (refresh token)

### Issue: Backend returns 403 Forbidden

**Cause:**
- User not authenticated
- User role is not admin
- Token expired

**Fix:**
1. Login again to refresh token
2. Verify user has admin role
3. Check backend logs for specific error

### Issue: Can't create admin user

**Cause:** Database connection issue

**Fix:**
```bash
# Check MongoDB is running
# Verify MONGODB_URI in backend/.env
# Try script again
npm run admin:create
```

---

## 🔍 Verifying Admin Setup

### Quick Verification Script

```bash
cd backend
npm run admin:verify
```

**Expected output:**
```
✅ Admin user found: admin@example.com
✅ Role: admin
✅ User ID: 507f1f77bcf86cd799439011
✅ Admin setup verified
```

### Manual Verification

**Check database:**
```javascript
// MongoDB shell
use mini-ai-tutor
db.users.find({ role: "admin" })
```

**Check via API:**
```bash
# Login as admin first, then:
curl http://localhost:5000/api/auth/me \
  -H "Cookie: authToken=<admin-token>"

# Response should include:
# { "role": "admin" }
```

---

## 📝 Best Practices

### 1. Admin User Management
- ✅ Use strong passwords (12+ characters)
- ✅ Limit number of admin users
- ✅ Review admin audit logs regularly
- ✅ Remove inactive admin accounts

### 2. Security
- ✅ Enable email whitelist in production
- ✅ Use environment variables for sensitive data
- ✅ Enable 2FA for admin accounts (future enhancement)
- ✅ Regular security audits

### 3. Monitoring
- ✅ Monitor admin action logs
- ✅ Set up alerts for suspicious activity
- ✅ Track failed login attempts
- ✅ Review user role changes

---

## 🚀 Production Deployment

### Before Deploying:

1. **Create admin user in production database**
   ```bash
   NODE_ENV=production npm run admin:create
   ```

2. **Enable email whitelist**
   ```javascript
   // backend/middleware/adminMiddleware.js
   // Uncomment whitelist check (lines 53-62)
   if (!ADMIN_EMAIL_WHITELIST.includes(req.user.email)) {
     // Block access
   }
   ```

3. **Set admin email in environment**
   ```env
   ADMIN_EMAIL=your-admin@yourdomain.com
   ```

4. **Test admin access in production**
   - Login as admin
   - Access admin panel
   - Verify all routes work
   - Check audit logging

5. **Set up monitoring**
   - Admin action alerts
   - Failed login alerts
   - Unusual activity detection

---

## 📖 Documentation

### Admin API Documentation
See `backend/routes/admin.js` for complete API reference

### Frontend Components
- `src/app/(admin)/layout.tsx` - Admin layout with role guard
- `src/app/(admin)/admin/*` - Admin pages

### Backend Components
- `backend/middleware/adminMiddleware.js` - Authorization
- `backend/routes/admin.js` - Admin API routes
- `backend/models/AdminActionLog.js` - Audit logging

---

## ✅ Admin Setup Checklist

- [ ] MongoDB connected
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Admin user created (`npm run admin:create`)
- [ ] Admin can login
- [ ] Admin can access `/admin/dashboard`
- [ ] Non-admin users blocked from admin panel
- [ ] Backend API routes protected
- [ ] Audit logging working
- [ ] Role escalation prevention working

---

**Last Updated:** 2025-12-01
**Status:** ✅ Admin system secure and ready for use
