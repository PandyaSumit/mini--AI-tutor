# Mini AI Tutor - Next.js Frontend Architecture Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Patterns](#architecture-patterns)
- [App Router Structure](#app-router-structure)
- [Route Groups & Layouts](#route-groups--layouts)
- [Complete Route Map](#complete-route-map)
- [Middleware & Authentication](#middleware--authentication)
- [Components Architecture](#components-architecture)
- [Services Layer](#services-layer)
- [State Management](#state-management)
- [Type System](#type-system)
- [Styling System](#styling-system)
- [API Integration](#api-integration)
- [Environment Configuration](#environment-configuration)
- [Features & Functionality](#features--functionality)
- [SEO & Metadata](#seo--metadata)
- [Performance Optimization](#performance-optimization)

---

## Overview

The Mini AI Tutor Next.js frontend is a **modern, type-safe, server-rendered application** built with Next.js 14 App Router. It provides an enhanced learning platform with AI-powered tutoring, course management, learning roadmaps, and interactive study tools.

**Key Characteristics:**
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript for type safety
- **Rendering:** Server-side rendering (SSR) + Client components
- **Styling:** TailwindCSS with custom design system
- **State Management:** React Context + Zustand
- **Authentication:** Cookie-based with HTTP-only tokens

---

## Technology Stack

### Core Framework
- **Next.js 14.2.0** - React framework with App Router
- **React 18.3.0** - UI library
- **TypeScript 5.3.3** - Type-safe JavaScript

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **@tailwindcss/typography 0.5.10** - Typography plugin
- **Lucide React 0.303.0** - Icon library
- **class-variance-authority 0.7.0** - Type-safe component variants
- **clsx 2.1.0** - Conditional class names
- **tailwind-merge 2.2.0** - Merge Tailwind classes

### State & Data
- **Zustand 4.4.7** - Lightweight state management
- **Axios 1.6.5** - HTTP client
- **Socket.IO Client 4.7.2** - WebSocket communication

### Content Rendering
- **React Markdown 9.0.1** - Markdown rendering
- **React Syntax Highlighter 16.1.0** - Code highlighting
- **PrismJS 1.29.0** - Syntax highlighting themes

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Project Structure

```
nextjs-app/
├── src/
│   ├── app/                      # App Router pages & layouts
│   │   ├── (public)/            # Public routes (landing, browse, etc.)
│   │   ├── (auth)/              # Authentication routes (login, register)
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── (admin)/             # Admin panel routes
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Root page (redirects)
│   │   ├── error.tsx            # Error boundary
│   │   ├── not-found.tsx        # 404 page
│   │   ├── robots.ts            # Robots.txt generator
│   │   └── sitemap.ts           # Sitemap generator
│   │
│   ├── components/              # Reusable components
│   │   ├── layout/              # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileSidebar.tsx
│   │   │   └── MobileHeader.tsx
│   │   ├── providers/           # Context providers
│   │   │   ├── Providers.tsx    # Combined providers
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ToastProvider.tsx
│   │   ├── icons/               # Icon components
│   │   ├── SEO.tsx              # SEO component
│   │   ├── Breadcrumbs.tsx      # Breadcrumb navigation
│   │   ├── CourseCard.tsx       # Course display card
│   │   ├── FAQ.tsx              # FAQ component
│   │   ├── Testimonials.tsx     # Testimonials section
│   │   ├── NewsletterSignup.tsx # Newsletter subscription
│   │   └── LoadingSkeletons.tsx # Loading states
│   │
│   ├── services/                # API service layer
│   │   ├── auth/                # Authentication services
│   │   ├── user/                # User management
│   │   ├── course/              # Course operations
│   │   ├── chat/                # Chat functionality
│   │   ├── ai/                  # AI services
│   │   ├── roadmap/             # Roadmap services
│   │   ├── flashcard/           # Flashcard services
│   │   ├── studyMaterial/       # Study materials
│   │   ├── dashboard/           # Dashboard data
│   │   ├── enrollment/          # Course enrollment
│   │   ├── admin/               # Admin operations
│   │   ├── public/              # Public API services
│   │   ├── voice/               # Voice services
│   │   └── index.ts             # Service exports
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useTheme.ts          # Theme management
│   │   ├── useToast.ts          # Toast notifications
│   │   └── index.ts             # Hook exports
│   │
│   ├── lib/                     # Library utilities
│   │   ├── api/                 # API client configuration
│   │   │   ├── client.ts        # Axios instance
│   │   │   └── endpoints.ts     # API endpoints
│   │   ├── utils/               # Utility functions
│   │   │   ├── cn.ts            # Class name utility
│   │   │   ├── format.ts        # Formatting utilities
│   │   │   ├── validation.ts    # Validation helpers
│   │   │   └── index.ts         # Utility exports
│   │   └── constants.ts         # App constants
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts              # Authentication types
│   │   ├── user.ts              # User types
│   │   ├── course.ts            # Course types
│   │   ├── chat.ts              # Chat types
│   │   ├── roadmap.ts           # Roadmap types
│   │   ├── flashcard.ts         # Flashcard types
│   │   ├── api.ts               # API response types
│   │   ├── common.ts            # Common types
│   │   └── index.ts             # Type exports
│   │
│   ├── styles/                  # Global styles
│   │   └── globals.css          # Global CSS with Tailwind
│   │
│   └── middleware.ts            # Next.js middleware (auth)
│
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── postcss.config.js            # PostCSS configuration
├── package.json                 # Dependencies
└── README.md                    # Project documentation
```

---

## Architecture Patterns

### 1. **App Router Architecture**
Next.js 14 uses the App Router pattern with file-based routing:
- **Server Components** by default (faster, smaller bundle)
- **Client Components** when needed ('use client' directive)
- **Streaming SSR** for faster page loads
- **Automatic code splitting** per route

### 2. **Route Groups**
Using parentheses `()` for logical grouping without affecting URL:
- `(public)` - Public pages
- `(auth)` - Authentication pages
- `(dashboard)` - Protected user pages
- `(admin)` - Admin panel

### 3. **Layout Nesting**
Each route group has its own layout:
```tsx
app/
├── layout.tsx           → Root layout (all pages)
├── (public)/
│   └── layout.tsx       → Public layout
├── (dashboard)/
│   └── layout.tsx       → Dashboard layout (sidebar, etc.)
└── (admin)/
    └── layout.tsx       → Admin layout
```

### 4. **Service Layer Pattern**
All API calls abstracted into service modules:
```tsx
Component → Hook → Service → API Client → Backend
```

### 5. **Provider Pattern**
Context providers wrap the app:
```tsx
<ThemeProvider>
  <AuthProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## App Router Structure

### Root Level Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers, fonts, metadata |
| `app/page.tsx` | Root page (redirects based on auth status) |
| `app/middleware.ts` | Route protection & authentication |
| `app/error.tsx` | Global error boundary |
| `app/not-found.tsx` | 404 page |
| `app/robots.ts` | SEO - Robots.txt generation |
| `app/sitemap.ts` | SEO - Sitemap generation |

---

## Route Groups & Layouts

### 1. **(public) - Public Routes**
**Layout:** `app/(public)/layout.tsx`
**Features:** Public header, footer, marketing content

**Routes:**
- `/` - Landing page
- `/browse` - Browse courses catalog
- `/categories` - Course categories
- `/course/[id]` - Public course details
- `/teach` - Become an instructor

### 2. **(auth) - Authentication Routes**
**Layout:** None (standalone pages)
**Features:** Clean auth forms, no navigation

**Routes:**
- `/login` - User login
- `/register` - User registration

### 3. **(dashboard) - Protected User Routes**
**Layout:** `app/(dashboard)/layout.tsx`
**Features:** Sidebar navigation, user header, protected access

**Routes:**
- `/dashboard` - User dashboard
- `/chat` - New AI chat session
- `/chat/[conversationId]` - Existing conversation
- `/conversations` - Conversation history
- `/session/[sessionId]` - Session details
- `/courses` - My courses
- `/courses/create` - Create new course
- `/courses/[courseId]` - Course details & management
- `/roadmaps` - My learning roadmaps
- `/roadmaps/create` - Create roadmap
- `/roadmaps/[id]` - Roadmap details
- `/flashcards` - Flashcard decks
- `/flashcards/study/[deckName]` - Study flashcards
- `/profile` - User profile settings

### 4. **(admin) - Admin Routes**
**Layout:** `app/(admin)/layout.tsx`
**Features:** Admin sidebar, admin header, role-based access

**Routes:**
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/courses` - Course management
- `/admin/instructors` - Instructor management

---

## Complete Route Map

### Public Routes (Unauthenticated Access)

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/` | `(public)/page.tsx` | Landing page | PublicLayout |
| `/browse` | `(public)/browse/page.tsx` | Browse all courses | PublicLayout |
| `/categories` | `(public)/categories/page.tsx` | Course categories | PublicLayout |
| `/course/[id]` | `(public)/course/[id]/page.tsx` | Public course preview | PublicLayout |
| `/teach` | `(public)/teach/page.tsx` | Become instructor page | PublicLayout |

### Authentication Routes

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/login` | `(auth)/login/page.tsx` | Login form | None |
| `/register` | `(auth)/register/page.tsx` | Registration form | None |

### Protected Routes (Require Authentication)

#### Dashboard Routes

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | User dashboard | DashboardLayout |
| `/profile` | `(dashboard)/profile/page.tsx` | User profile & settings | DashboardLayout |

#### Chat & AI Routes

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/chat` | `(dashboard)/chat/page.tsx` | New AI chat session | DashboardLayout |
| `/chat/[conversationId]` | `(dashboard)/chat/[conversationId]/page.tsx` | Continue conversation | DashboardLayout |
| `/conversations` | `(dashboard)/conversations/page.tsx` | Conversation history | DashboardLayout |
| `/session/[sessionId]` | `(dashboard)/session/[sessionId]/page.tsx` | Session details | DashboardLayout |

#### Course Routes

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/courses` | `(dashboard)/courses/page.tsx` | My enrolled courses | DashboardLayout |
| `/courses/create` | `(dashboard)/courses/create/page.tsx` | Create new course | DashboardLayout |
| `/courses/[courseId]` | `(dashboard)/courses/[courseId]/page.tsx` | Course management | DashboardLayout |

#### Learning Routes

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/roadmaps` | `(dashboard)/roadmaps/page.tsx` | My roadmaps | DashboardLayout |
| `/roadmaps/create` | `(dashboard)/roadmaps/create/page.tsx` | Create roadmap | DashboardLayout |
| `/roadmaps/[id]` | `(dashboard)/roadmaps/[id]/page.tsx` | Roadmap details | DashboardLayout |
| `/flashcards` | `(dashboard)/flashcards/page.tsx` | Flashcard decks | DashboardLayout |
| `/flashcards/study/[deckName]` | `(dashboard)/flashcards/study/[deckName]/page.tsx` | Study mode | DashboardLayout |

### Admin Routes (Require Admin Role)

| Route | Component | Description | Layout |
|-------|-----------|-------------|--------|
| `/admin/dashboard` | `(admin)/admin/dashboard/page.tsx` | Admin overview | AdminLayout |
| `/admin/users` | `(admin)/admin/users/page.tsx` | User management | AdminLayout |
| `/admin/courses` | `(admin)/admin/courses/page.tsx` | Course moderation | AdminLayout |
| `/admin/instructors` | `(admin)/admin/instructors/page.tsx` | Instructor management | AdminLayout |

---

## Middleware & Authentication

### Next.js Middleware
**File:** `src/middleware.ts`

**Purpose:** Server-side route protection and authentication

**Flow:**
```typescript
1. Extract authToken from HTTP-only cookie
2. Check if route is protected, public, or auth-only
3. Redirect logic:
   - Protected route + no token → Redirect to /login
   - Auth route + valid token → Redirect to /dashboard
   - Public route → Allow access
```

**Protected Routes:**
```typescript
const protectedRoutes = [
  '/dashboard',
  '/chat',
  '/conversations',
  '/profile',
  '/roadmaps',
  '/flashcards',
  '/courses',
  '/session',
  '/admin', // Requires auth + admin role
];
```

**Auth Routes (redirect if logged in):**
```typescript
const authRoutes = ['/login', '/register'];
```

**Cookie-based Authentication:**
- Token stored in HTTP-only cookie (secure, prevents XSS)
- No localStorage/sessionStorage (more secure)
- Automatic token inclusion in requests

---

## Components Architecture

### Layout Components
**Location:** `src/components/layout/`

#### DashboardLayout
- Sidebar navigation
- Mobile responsive
- User menu
- Breadcrumbs

#### Sidebar
- Desktop navigation menu
- Active route highlighting
- Quick actions
- User profile link

#### MobileSidebar
- Drawer-style sidebar
- Touch-optimized
- Gesture controls

#### MobileHeader
- Mobile navigation header
- Menu toggle
- User avatar

### Provider Components
**Location:** `src/components/providers/`

#### Providers (Combined)
Wraps all context providers:
```tsx
<ThemeProvider>
  <AuthProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </AuthProvider>
</ThemeProvider>
```

#### AuthProvider
- Manages authentication state
- User session persistence
- Login/logout handlers
- Token refresh logic

#### ThemeProvider
- Dark/light mode toggle
- System preference detection
- Theme persistence

#### ToastProvider
- Global notification system
- Success/error/info/warning toasts
- Auto-dismiss functionality

### UI Components

| Component | Purpose |
|-----------|---------|
| **SEO** | Meta tags, Open Graph, Twitter cards |
| **Breadcrumbs** | Navigation breadcrumb trail |
| **CourseCard** | Course display card with image, title, stats |
| **FAQ** | Accordion-style FAQ section |
| **Testimonials** | User testimonials carousel |
| **NewsletterSignup** | Email subscription form |
| **LoadingSkeletons** | Loading state placeholders |

---

## Services Layer

All API interactions abstracted into service modules.

### Service Structure
```typescript
// Service pattern
export const serviceName = {
  async operation(params) {
    const response = await apiClient.method(endpoint, data);
    return response.data;
  }
};
```

### Available Services

#### Auth Service (`services/auth/`)
```typescript
- login(credentials)
- register(userData)
- logout()
- refreshToken()
- getCurrentUser()
- updatePassword(data)
```

#### User Service (`services/user/`)
```typescript
- getProfile()
- updateProfile(data)
- uploadAvatar(file)
- getUserStats()
```

#### Course Service (`services/course/`)
```typescript
- getCourses()
- getCourse(id)
- createCourse(data)
- updateCourse(id, data)
- deleteCourse(id)
- enrollInCourse(id)
```

#### Chat Service (`services/chat/`)
```typescript
- getConversations()
- getConversation(id)
- sendMessage(data)
- deleteConversation(id)
- searchConversations(query)
```

#### AI Service (`services/ai/`)
```typescript
- sendMessage(message)
- streamResponse(message)
- getAISuggestions()
```

#### Roadmap Service (`services/roadmap/`)
```typescript
- getRoadmaps()
- createRoadmap(data)
- updateRoadmap(id, data)
- deleteRoadmap(id)
```

#### Flashcard Service (`services/flashcard/`)
```typescript
- getDecks()
- createDeck(data)
- getCards(deckId)
- createCard(data)
- updateCard(id, data)
- deleteCard(id)
```

#### Dashboard Service (`services/dashboard/`)
```typescript
- getStats()
- getRecentActivity()
- getProgress()
```

#### Admin Service (`services/admin/`)
```typescript
- getUsers()
- updateUser(id, data)
- deleteUser(id)
- getCourses()
- moderateCourse(id, action)
```

#### Public Service (`services/public/`)
```typescript
- getPublicCourses()
- getPublicCourse(id)
- getCourseCategories()
- searchCourses(query)
```

---

## State Management

### 1. React Context API
Used for global app state:

**AuthContext:**
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  loading: boolean,
  login: (credentials) => Promise<void>,
  logout: () => Promise<void>,
  updateUser: (data) => Promise<void>
}
```

**ThemeContext:**
```typescript
{
  theme: 'light' | 'dark',
  setTheme: (theme) => void,
  toggleTheme: () => void
}
```

**ToastContext:**
```typescript
{
  success: (message) => void,
  error: (message) => void,
  info: (message) => void,
  warning: (message) => void
}
```

### 2. Zustand Stores
Lightweight state management for complex features:
- AI chat state
- Course builder state
- Flashcard study state

### 3. URL State
- Route parameters (dynamic routes)
- Search parameters (filters, pagination)
- Next.js automatic state sync

### 4. Server State
- Server components fetch data directly
- No client-side state needed
- Automatic caching by Next.js

---

## Type System

### TypeScript Types
**Location:** `src/types/`

#### Core Types

**auth.ts:**
```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  createdAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}
```

**course.ts:**
```typescript
interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: User;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  contributors: Contributor[];
  enrollmentCount: number;
  rating: number;
}

interface Contributor {
  user: User;
  contributionType: 'founder' | 'co-creator' | 'content_improver';
  revenueShare: number;
}
```

**chat.ts:**
```typescript
interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

**api.ts:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
```

---

## Styling System

### TailwindCSS Configuration
**File:** `tailwind.config.ts`

**Custom Theme:**
```typescript
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
      accent: {...}
    },
    fontFamily: {
      sans: ['var(--font-manrope)', 'sans-serif']
    }
  }
}
```

### Design Tokens
- **Spacing:** Tailwind scale (0.25rem increments)
- **Colors:** Custom palette with semantic naming
- **Typography:** Manrope font family
- **Breakpoints:** sm, md, lg, xl, 2xl

### Component Styling Patterns

**1. Utility Classes:**
```tsx
<div className="flex items-center gap-4 px-6 py-4 bg-white rounded-lg shadow-md">
```

**2. Class Variance Authority (CVA):**
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-200 text-gray-800"
    },
    size: {
      sm: "px-3 py-1 text-sm",
      lg: "px-6 py-3 text-lg"
    }
  }
});
```

**3. Tailwind Merge:**
```typescript
import { cn } from '@/lib/utils/cn';

<div className={cn("default-classes", className)} />
```

---

## API Integration

### API Client
**File:** `src/lib/api/client.ts`

**Axios Instance:**
```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Request Interceptor:**
```typescript
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor:**
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints
**File:** `src/lib/api/endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: (id) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id) => `/courses/${id}`,
    DELETE: (id) => `/courses/${id}`
  },
  // ... more endpoints
};
```

---

## Environment Configuration

### Environment Variables
**File:** `.env.example`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=http://localhost:5000/api

# WebSocket URL
NEXT_PUBLIC_WS_URL=http://localhost:5000

# App Configuration
NEXT_PUBLIC_APP_NAME=Mini AI Tutor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Next.js Configuration
**File:** `next.config.js`

**API Proxy (avoid CORS):**
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.BACKEND_API_URL}/:path*`
    }
  ];
}
```

---

## Features & Functionality

### 1. AI-Powered Chat
- Real-time AI tutoring
- Streaming responses
- Conversation history
- Context-aware responses

### 2. Course Management
- Browse course catalog
- Create & edit courses
- Multi-role collaboration
- Revenue sharing system

### 3. Learning Roadmaps
- Personalized learning paths
- Progress tracking
- Milestone achievements

### 4. Flashcards
- Create custom decks
- Study mode with spaced repetition
- Progress analytics

### 5. Admin Panel
- User management
- Course moderation
- Instructor approvals
- Analytics dashboard

### 6. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop experience
- Touch gestures

### 7. Dark Mode
- System preference detection
- Manual toggle
- Persistent selection

### 8. SEO Optimization
- Meta tags
- Open Graph
- Twitter cards
- Dynamic sitemap
- Robots.txt

---

## SEO & Metadata

### Static Metadata
**File:** `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: 'Mini AI Tutor - Learn Smarter, Not Harder',
  description: 'AI-powered education platform...',
  keywords: ['AI tutor', 'learning platform', ...],
  openGraph: {...},
  twitter: {...}
};
```

### Dynamic Metadata
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const course = await getCourse(params.id);
  return {
    title: course.title,
    description: course.description
  };
}
```

### Sitemap Generation
**File:** `app/sitemap.ts`

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://example.com', lastModified: new Date() },
    // Dynamic routes...
  ];
}
```

---

## Performance Optimization

### 1. Server Components
- Default to server components
- Smaller client bundle
- Faster page loads

### 2. Code Splitting
- Automatic per-route splitting
- Dynamic imports for large components

### 3. Image Optimization
- Next.js Image component
- Automatic WebP conversion
- Lazy loading

### 4. Caching
- Next.js automatic caching
- SWR for client-side caching

### 5. Streaming
- Streaming SSR
- Progressive page rendering

---

## Development Guidelines

### Running the App
```bash
# Development
npm run dev          # http://localhost:3000

# Build
npm run build        # Production build
npm run start        # Start production server

# Type checking
npm run type-check   # TypeScript validation
```

### Code Quality
```bash
npm run lint         # ESLint
npm run fix:caniuse  # Fix browserslist
```

### Best Practices
1. Use TypeScript for all new code
2. Server components by default
3. Client components only when needed
4. Extract business logic to services
5. Use custom hooks for reusable logic
6. Keep components small and focused
7. Leverage Next.js features (Image, Link, etc.)

---

## Conclusion

The Mini AI Tutor Next.js frontend is a modern, type-safe, server-rendered application with:
- **30+ routes** organized with App Router
- **Route-based layouts** for different sections
- **Server-side authentication** with middleware
- **Type-safe API layer** with TypeScript
- **Component-based architecture** for reusability
- **SEO optimization** with metadata & sitemaps
- **Performance optimization** with SSR & code splitting

This documentation provides a complete reference for developers working on the Next.js frontend.

---

**Last Updated:** December 7, 2025
**Version:** 2.0.0
**Next.js Version:** 14.2.0
