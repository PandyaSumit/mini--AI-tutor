/**
 * Next.js Middleware
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/chat',
  '/conversations',
  '/profile',
  '/roadmaps',
  '/flashcards',
  '/courses',
  '/session',
  '/admin', // Admin panel - requires authentication + admin role
];

// Public routes (explicitly allowed without auth)
const publicRoutes = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/api', // API routes
];

// Auth-only routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from HTTP-only cookie
  const token = request.cookies.get('authToken')?.value;
  const hasValidToken = !!token && token.trim() !== '' && token !== 'undefined';

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  // Allow public routes for everyone
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without valid token
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes (login/register) with valid token
  if (isAuthRoute && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
