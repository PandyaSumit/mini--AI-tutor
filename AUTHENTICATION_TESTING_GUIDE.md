# Authentication Flow Testing Guide

**Purpose:** Verify that the authentication system works correctly after security improvements

---

## Prerequisites

### Backend Setup

1. **Install dependencies** (includes new cookie-parser):
   ```bash
   cd backend
   npm install
   ```

2. **Verify environment variables** in `backend/.env`:
   ```env
   JWT_SECRET=<your-strong-secret-32+-chars>
   JWT_EXPIRE=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

3. **Start backend server:**
   ```bash
   npm run dev
   ```

   **Expected output:**
   ```
   ✅ MongoDB Connected
   ✅ AI Service is ready
   ✅ WebSocket (Socket.IO) initialized
   Server running on port 5000
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd nextjs-app
   npm install
   ```

2. **Verify environment variables** in `nextjs-app/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_WS_URL=http://localhost:5000
   ```

3. **Start frontend dev server:**
   ```bash
   npm run dev
   ```

   **Expected output:**
   ```
   ▲ Next.js 14.2.33
   - Local:        http://localhost:3000
   ✓ Ready in 2.8s
   ```

---

## Test Cases

### Test 1: User Registration ✅

**Steps:**
1. Open browser to `http://localhost:3000/register`
2. Fill in registration form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test123!"
3. Click "Register"

**Expected Results:**
- ✅ Registration successful
- ✅ Redirected to `/dashboard`
- ✅ User information displayed
- ✅ **No "authToken" in localStorage** (check DevTools)
- ✅ **authToken cookie present with HttpOnly flag** (check DevTools → Application → Cookies)

**Verification Commands:**
```javascript
// Open browser console
localStorage.getItem('authToken')
// Expected: null ✅

// Check cookies (will NOT show value due to HttpOnly)
document.cookie
// Expected: Should NOT contain authToken value ✅
```

---

### Test 2: User Login ✅

**Steps:**
1. Log out if logged in
2. Navigate to `http://localhost:3000/login`
3. Enter credentials:
   - Email: "test@example.com"
   - Password: "Test123!"
4. Click "Sign in"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/dashboard`
- ✅ User session active
- ✅ **No token in localStorage**
- ✅ **authToken cookie set by backend**

**Backend Logs (server.js):**
```
POST /api/auth/login 200
Set-Cookie: authToken=<jwt>; Path=/; HttpOnly; SameSite=Lax
```

---

### Test 3: Protected Route Access ✅

**Steps:**
1. While logged in, navigate to protected routes:
   - `/dashboard`
   - `/chat`
   - `/profile`
   - `/courses`

**Expected Results:**
- ✅ All routes accessible
- ✅ Cookie sent automatically with each request
- ✅ User data loads correctly

**Network Tab Verification:**
1. Open DevTools → Network
2. Navigate to `/dashboard`
3. Look at API requests
4. Check **Request Headers:**
   ```
   Cookie: authToken=<jwt-token>
   ```
5. Verify **no Authorization header** (we're using cookies now)

---

### Test 4: Authentication Persistence ✅

**Steps:**
1. Log in
2. Refresh the page (F5)
3. Close and reopen browser tab
4. Navigate directly to `http://localhost:3000/dashboard`

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ User remains logged in after tab close/reopen
- ✅ Session persists until cookie expires (7 days)

---

### Test 5: Logout ✅

**Steps:**
1. While logged in, click "Logout" button
2. Observe behavior

**Expected Results:**
- ✅ Logout API call succeeds
- ✅ Cookie cleared by backend
- ✅ Redirected to `/login`
- ✅ Cannot access protected routes
- ✅ Accessing `/dashboard` redirects to `/login`

**Backend Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Test 6: Middleware Route Protection ✅

**Steps:**
1. Log out completely
2. Try to access protected routes directly:
   - Type `http://localhost:3000/dashboard` in address bar

**Expected Results:**
- ✅ Redirected to `/login?redirect=/dashboard`
- ✅ After login, redirected back to `/dashboard`

---

### Test 7: Token Expiration Handling ✅

**Note:** This test requires simulating an expired token

**Steps:**
1. Log in successfully
2. Manually delete the cookie OR wait for expiration (7 days)
3. Try to access protected route or make API call

**Expected Results:**
- ✅ API returns 401 Unauthorized
- ✅ Frontend redirects to login
- ✅ User prompted to log in again

---

### Test 8: CORS and Credentials ✅

**Steps:**
1. Log in from `http://localhost:3000`
2. Open Network tab
3. Make any API request

**Expected Results:**
- ✅ Request includes `Cookie` header
- ✅ Response includes `Set-Cookie` header (on auth endpoints)
- ✅ CORS headers present:
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Credentials: true
   ```

---

## Browser DevTools Checks

### 1. Verify No localStorage Token

**DevTools → Application → Local Storage → http://localhost:3000**

Expected:
```
✅ NO "authToken" key
✅ Only other app data (if any)
```

### 2. Verify HTTP-only Cookie

**DevTools → Application → Cookies → http://localhost:5000**

Expected:
```
Name: authToken
Value: <jwt-token-hash>
Domain: localhost
Path: /
Expires: <7 days from now>
HttpOnly: ✅ (checkbox checked)
Secure: ❌ (in development)
SameSite: Lax
```

### 3. Verify Cookies Sent with Requests

**DevTools → Network → Select any API request → Headers**

Request Headers:
```
Cookie: authToken=eyJhbGc...
```

Response Headers (on auth endpoints):
```
Set-Cookie: authToken=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

---

## Security Verification

### XSS Protection Test

**Test:** Try to access token via JavaScript

```javascript
// Open browser console
localStorage.getItem('authToken')
// Expected: null ✅

document.cookie
// Expected: Does NOT show authToken value ✅
// (Cookie is HttpOnly, inaccessible to JavaScript)
```

**Result:** ✅ Token cannot be stolen via XSS

---

### CSRF Protection Test

**Verification:**
- ✅ Cookie has `SameSite: Lax` attribute
- ✅ Prevents cross-site request forgery
- ✅ Cookie only sent on same-site requests

---

## Common Issues & Troubleshooting

### Issue 1: "Cannot read property 'authToken' of undefined"

**Cause:** Backend not parsing cookies (cookie-parser not installed)

**Fix:**
```bash
cd backend
npm install cookie-parser
# Verify server.js imports cookieParser
# Verify app.use(cookieParser()) is called
```

---

### Issue 2: 401 Unauthorized on API Requests

**Cause:** Cookie not being sent with requests

**Fix:**
1. Verify `withCredentials: true` in frontend API client
2. Verify CORS `credentials: true` on backend
3. Verify cookie domain matches request domain

---

### Issue 3: Cookie Not Set After Login

**Cause:** CORS or cookie configuration issue

**Fix:**
1. Check backend CORS configuration:
   ```javascript
   credentials: true,
   origin: 'http://localhost:3000'
   ```
2. Check frontend URL matches CORS origin
3. Verify backend sets cookie with proper options:
   ```javascript
   res.cookie('authToken', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 7 * 24 * 60 * 60 * 1000
   });
   ```

---

### Issue 4: Infinite Redirect Loop

**Cause:** Middleware not recognizing authenticated user

**Fix:**
1. Verify backend middleware checks `req.cookies.authToken`
2. Verify frontend sends cookies with `withCredentials: true`
3. Check backend logs for authentication errors

---

### Issue 5: User Logged Out on Page Refresh

**Cause:** Cookie not persisting or being cleared

**Fix:**
1. Verify cookie `maxAge` is set correctly
2. Check cookie domain/path settings
3. Ensure cookie not being cleared by other code

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in backend
- [ ] Verify `JWT_SECRET` is strong (32+ characters)
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable `secure: true` for cookies in production:
  ```javascript
  secure: process.env.NODE_ENV === 'production'
  ```
- [ ] Verify HTTPS is enabled (required for secure cookies)
- [ ] Test authentication on production domain
- [ ] Verify cookies work across subdomains (if needed)
- [ ] Monitor authentication logs for errors
- [ ] Set up cookie domain for subdomains (if needed):
  ```javascript
  domain: '.yourdomain.com'
  ```

---

## Testing Checklist Summary

Use this checklist to verify all tests pass:

- [ ] ✅ Test 1: User Registration
- [ ] ✅ Test 2: User Login
- [ ] ✅ Test 3: Protected Route Access
- [ ] ✅ Test 4: Authentication Persistence
- [ ] ✅ Test 5: Logout
- [ ] ✅ Test 6: Middleware Route Protection
- [ ] ✅ Test 7: Token Expiration Handling
- [ ] ✅ Test 8: CORS and Credentials
- [ ] ✅ No authToken in localStorage
- [ ] ✅ authToken in HTTP-only cookie
- [ ] ✅ XSS Protection (token inaccessible to JS)
- [ ] ✅ CSRF Protection (SameSite: Lax)

---

## Expected Behavior Summary

### ✅ What Should Work

1. **Registration** → Cookie set → Redirect to dashboard
2. **Login** → Cookie set → Redirect to dashboard
3. **Protected routes** → Cookie sent automatically → Access granted
4. **Page refresh** → Cookie persists → User stays logged in
5. **Logout** → Cookie cleared → Redirect to login
6. **Unauthenticated access** → Redirect to login

### ❌ What Should NOT Work

1. ❌ Accessing token via `localStorage.getItem('authToken')` → Returns `null`
2. ❌ Accessing token via `document.cookie` → HttpOnly prevents access
3. ❌ Accessing protected routes without login → Redirects to login
4. ❌ Making API requests without cookie → Returns 401 Unauthorized

---

## Backend Logs to Monitor

**Successful Login:**
```
POST /api/auth/login 200 - 150ms
```

**Successful API Request with Cookie:**
```
GET /api/auth/me 200 - 50ms
```

**Failed Auth (No Cookie):**
```
GET /api/auth/me 401 - 10ms
Not authorized to access this route. Please login.
```

---

## Support

If tests fail:
1. Check this guide's "Common Issues" section
2. Review `AUTHENTICATION_SECURITY_AUDIT.md`
3. Review `SECURITY_IMPROVEMENTS.md`
4. Check backend logs for errors
5. Verify all prerequisites are met

---

**Last Updated:** 2025-12-01
**Status:** Ready for Testing 🚀
