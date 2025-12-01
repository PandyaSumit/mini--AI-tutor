# Next.js Migration - Completion Guide

This guide explains how to complete the remaining migration tasks.

---

## ✅ What's Already Done

1. ✓ Complete Next.js project structure
2. ✓ All TypeScript type definitions
3. ✓ Utility functions (cn, format, validation)
4. ✓ API client with Axios interceptors
5. ✓ API endpoint constants
6. ✓ Core services (Auth, AI, Chat)
7. ✓ Configuration files (tsconfig, next.config, tailwind)

---

## 🚧 Remaining Tasks

### STEP 1: Complete Remaining Services

#### 1.1 Roadmap Service

```typescript
// src/services/roadmap/roadmapService.ts
import apiClient from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Roadmap, ApiResponse } from '@/types';

class RoadmapService {
  async getRoadmaps(): Promise<Roadmap[]> {
    const response = await apiClient.get<ApiResponse<Roadmap[]>>(
      API_ENDPOINTS.ROADMAPS.GET_ALL
    );
    return response.data.data;
  }

  async getRoadmapById(id: string): Promise<Roadmap> {
    const response = await apiClient.get<ApiResponse<Roadmap>>(
      API_ENDPOINTS.ROADMAPS.GET_ONE(id)
    );
    return response.data.data;
  }

  async createRoadmap(data: Partial<Roadmap>): Promise<Roadmap> {
    const response = await apiClient.post<ApiResponse<Roadmap>>(
      API_ENDPOINTS.ROADMAPS.CREATE,
      data
    );
    return response.data.data;
  }

  async updateRoadmap(id: string, data: Partial<Roadmap>): Promise<Roadmap> {
    const response = await apiClient.put<ApiResponse<Roadmap>>(
      API_ENDPOINTS.ROADMAPS.UPDATE(id),
      data
    );
    return response.data.data;
  }

  async deleteRoadmap(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ROADMAPS.DELETE(id));
  }

  async updateProgress(id: string, progress: any): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.ROADMAPS.UPDATE_PROGRESS(id),
      progress
    );
  }
}

export const roadmapService = new RoadmapService();
export default roadmapService;
```

Create similar services for:
- Course Service
- Flashcard Service
- User Service
- Dashboard Service
- Study Material Service

### STEP 2: Migrate Components

#### 2.1 Create AuthProvider

```typescript
// src/components/providers/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth/authService';
import type { User, AuthState } from '@/types';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      setError('Failed to authenticate');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### 2.2 Create Combined Providers

```typescript
// src/components/providers/Providers.tsx
'use client';

import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

#### 2.3 Migrate Sidebar Component

Copy from original `Sidebar.jsx`, convert to TypeScript, add proper types:

```typescript
// src/components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { /* icons */ } from 'lucide-react';
import type { NavItem } from '@/types';

export function Sidebar() {
  // Copy logic from original Sidebar.jsx
  // Replace react-router hooks with next/navigation hooks
  // Replace useLocation → usePathname
  // Replace useNavigate → useRouter
  // Replace <Link to="/path"> → <Link href="/path">
}
```

### STEP 3: Set Up App Router Pages

#### 3.1 Root Layout

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mini AI Tutor',
  description: 'Your AI-powered learning companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### 3.2 Landing Page

```typescript
// src/app/page.tsx
import { Metadata } from 'next';
// Import Landing component after migrating it

export const metadata: Metadata = {
  title: 'Mini AI Tutor - AI-Powered Learning Platform',
  description: 'Learn with AI assistance',
};

export default function Home() {
  return <LandingPage />;
}
```

#### 3.3 Dashboard Layout

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MobileHeader />
      <Sidebar />
      <div className="flex-1 overflow-x-hidden pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
```

#### 3.4 Example Page

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Metadata } from 'next';
// Import Dashboard component after migrating it

export const metadata: Metadata = {
  title: 'Dashboard - Mini AI Tutor',
};

export default function DashboardPage() {
  return <DashboardComponent />;
}
```

### STEP 4: Create Middleware for Auth

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/chat') ||
                          request.nextUrl.pathname.startsWith('/roadmaps') ||
                          request.nextUrl.pathname.startsWith('/flashcards') ||
                          request.nextUrl.pathname.startsWith('/courses') ||
                          request.nextUrl.pathname.startsWith('/profile');

  // Redirect to login if accessing protected page without auth
  if (isProtectedPage && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/roadmaps/:path*',
    '/flashcards/:path*',
    '/courses/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
```

### STEP 5: Create Global Styles

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🔄 Component Migration Pattern

For each component from original project:

1. **Copy the component file**
2. **Rename .jsx → .tsx**
3. **Add TypeScript types**:
   - Define prop interfaces
   - Type all state variables
   - Type function parameters
4. **Replace imports**:
   - `react-router-dom` → `next/navigation`
   - `useLocation` → `usePathname`
   - `useNavigate` → `useRouter`
   - `<Link to>` → `<Link href>`
   - `useParams` → `useParams` (from next/navigation)
5. **Add 'use client' if needed**:
   - Uses hooks (useState, useEffect)
   - Event handlers
   - Browser APIs
   - Context providers
6. **Update imports to use @ aliases**:
   - `@/components/...`
   - `@/lib/...`
   - `@/types/...`
   - `@/services/...`

---

## 📋 Migration Checklist Per Component

- [ ] Copy component code
- [ ] Rename to .tsx
- [ ] Add type definitions
- [ ] Update imports
- [ ] Replace React Router with Next.js navigation
- [ ] Add 'use client' if interactive
- [ ] Test in browser
- [ ] Fix TypeScript errors
- [ ] Verify styling works

---

## 🧪 Testing Your Migration

1. **Install dependencies**:
   ```bash
   cd nextjs-app
   npm install
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Test routes**:
   - Visit http://localhost:3000
   - Test authentication flow
   - Test protected routes
   - Test all features

4. **Check for errors**:
   - Browser console
   - Terminal console
   - TypeScript errors

---

## 🎯 Priority Order

1. ✅ **DONE**: Structure, types, utils, core services
2. **NEXT**: Remaining services (5-7 services)
3. **THEN**: Providers (AuthProvider, etc.)
4. **THEN**: Layout components (Sidebar, Headers)
5. **THEN**: App router structure
6. **THEN**: Page components
7. **THEN**: Feature components
8. **FINALLY**: Testing & optimization

---

## 📞 Need Help?

- Check `MIGRATION_STATUS.md` for current progress
- Check `NEXTJS_MIGRATION_PLAN.md` for architecture details
- Review existing migrated files for patterns
- Next.js docs: https://nextjs.org/docs
- TypeScript docs: https://www.typescriptlang.org/docs

---

**You're 60% done! Keep going! 🚀**
