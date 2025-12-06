# Mini AI Tutor - Frontend Architecture Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Routing System](#routing-system)
- [Authentication & Authorization](#authentication--authorization)
- [Role-Based Access Control](#role-based-access-control)
- [State Management](#state-management)
- [Context Providers](#context-providers)
- [Services Layer](#services-layer)
- [Components](#components)
- [Styling](#styling)
- [Environment Configuration](#environment-configuration)
- [Key Features](#key-features)

---

## Overview

The Mini AI Tutor frontend is a **React-based single-page application (SPA)** built with **Vite** as the build tool. It provides an interactive learning platform with AI-powered tutoring, course management, roadmap creation, flashcards, and real-time chat capabilities.

**Note:** Despite the reference to "Next.js" in the task description, this project is built with **React + Vite**, not Next.js.

---

## Technology Stack

### Core Technologies
- **React 18.2.0** - UI library
- **Vite 5.0.11** - Build tool and dev server
- **React Router DOM 6.21.1** - Client-side routing

### State Management
- **Zustand 4.4.7** - Lightweight state management
- **React Context API** - Global state management for auth, theme, and toast notifications

### HTTP & Real-time Communication
- **Axios 1.6.5** - HTTP client
- **Socket.IO Client 4.7.2** - WebSocket for real-time features

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.303.0** - Icon library
- **@tailwindcss/typography 0.5.10** - Typography plugin

### Content Rendering
- **React Markdown 9.0.1** - Markdown rendering
- **React Syntax Highlighter 15.5.0** - Code syntax highlighting
- **PrismJS 1.29.0** - Syntax highlighting theme

---

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── chat/          # Chat-specific components
│   │   ├── course/        # Course-specific components
│   │   └── icons/         # Custom icon components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page-level components (routes)
│   ├── services/          # API service layer
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── index.html             # HTML entry point
```

### Detailed Folder Breakdown

#### `/src/components/` - Reusable Components
- **Layout Components:**
  - `Layout.jsx` - Main layout wrapper with sidebar
  - `Sidebar.jsx` - Desktop sidebar navigation
  - `MobileSidebar.jsx` - Mobile sidebar navigation
  - `MobileHeader.jsx` - Mobile header component

- **Chat Components:**
  - `AIChat.jsx` - AI chat interface
  - `ChatPanel.jsx` - Chat panel component
  - `FloatingChatButton.jsx` - Floating chat trigger button
  - `VoiceChat.jsx` - Voice chat functionality
  - `chat/CourseRecommendationCard.jsx` - Course recommendation in chat

- **Course Components:**
  - `course/CoCreatorApplication.jsx` - Apply to become co-creator
  - `course/CoCreatorRequests.jsx` - Manage co-creator requests
  - `course/ContributorStatus.jsx` - Display contributor status
  - `course/CourseImprovements.jsx` - Course improvement suggestions
  - `course/CourseRoleNav.jsx` - Role-based navigation for courses
  - `course/RevenueDistribution.jsx` - Revenue sharing display
  - `course/RoleBadge.jsx` - Display user role badge
  - `course/RoleDebug.jsx` - Debug role information

- **Feature Components:**
  - `PrivateRoute.jsx` - Protected route wrapper
  - `Whiteboard.jsx` - Interactive whiteboard
  - `ThinkingProcess.jsx` - Display AI thinking process
  - `StreamingThinkingProcess.jsx` - Streaming AI thinking
  - `LessonProgress.jsx` - Track lesson progress
  - `LessonLayout.jsx` - Lesson page layout
  - `SemanticSearch.jsx` - Semantic search functionality
  - `ContextualHint.jsx` - Context-aware hints
  - `LearningPathGuide.jsx` - Learning path guidance
  - `QuickActionsPanel.jsx` - Quick action shortcuts
  - `WelcomeTour.jsx` - Onboarding tour

#### `/src/pages/` - Page Components
- **Authentication:**
  - `Landing.jsx` - Landing page
  - `Login.jsx` - Login page
  - `Register.jsx` - Registration page

- **Main Pages:**
  - `Dashboard.jsx` - User dashboard
  - `Profile.jsx` - User profile page
  - `NotFound.jsx` - 404 page

- **Chat & Conversations:**
  - `Chat.jsx` - Chat interface
  - `Conversations.jsx` - Conversation history
  - `SessionDetails.jsx` - Individual session details
  - `AIDashboard.jsx` - AI dashboard
  - `AISettings.jsx` - AI settings

- **Courses:**
  - `CourseCatalog.jsx` - Browse courses
  - `CourseDetails.jsx` - View course details
  - `CreateCourse.jsx` - Create new course

- **Roadmaps:**
  - `MyRoadmaps.jsx` - User's roadmaps
  - `CreateRoadmap.jsx` - Create basic roadmap
  - `RoadmapDetail.jsx` - Basic roadmap details
  - `CreateEnhancedRoadmap.jsx` - Create enhanced roadmap
  - `EnhancedRoadmapDetail.jsx` - Enhanced roadmap details
  - `EnhancedRoadmapsList.jsx` - List enhanced roadmaps

- **Study Materials:**
  - `Flashcards.jsx` - Flashcard management
  - `StudyFlashcards.jsx` - Study flashcards interface

#### `/src/context/` - Context Providers
- `AuthContext.jsx` - Authentication state
- `CourseRoleContext.jsx` - Course role management
- `ThemeProvider.jsx` - Theme management
- `ToastContext.jsx` - Toast notifications

#### `/src/services/` - API Services
- `api.js` - Axios instance with interceptors
- `authService.js` - Authentication API calls
- `userService.js` - User management
- `chatService.js` - Chat functionality
- `dashboardService.js` - Dashboard data
- `roadmapService.js` - Roadmap operations
- `studyMaterialService.js` - Study materials
- `aiService.js` - AI API calls
- `aiStreamingService.js` - Streaming AI responses
- `ttsService.js` - Text-to-speech
- `browserSTT.js` - Speech-to-text
- `audioRecorder.js` - Audio recording
- `voiceWebSocket.js` - Voice WebSocket connection

#### `/src/hooks/` - Custom Hooks
- `useAI.jsx` - AI functionality hook
- `useTheme.js` - Theme management hook

#### `/src/utils/` - Utility Functions
- `CommandParser.js` - Parse commands
- `WhiteboardAnimator.js` - Whiteboard animations
- `whiteboardUtils.js` - Whiteboard utilities

---

## Architecture

### Application Flow

```
main.jsx (Entry Point)
    ↓
Context Providers (AuthProvider → ToastProvider → ThemeProvider)
    ↓
App.jsx (Router & Route Configuration)
    ↓
Layout Components (Sidebar, Header)
    ↓
Page Components
    ↓
Feature Components & Services
```

### Provider Hierarchy
```jsx
<AuthProvider>
  <ToastProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ToastProvider>
</AuthProvider>
```

### Request Flow
1. **User Action** → Component
2. **Component** → Service Layer
3. **Service Layer** → API (with auth token via interceptor)
4. **API Response** → Service Layer
5. **Service Layer** → Component (updates state)
6. **Component** → Re-renders UI

---

## Routing System

The application uses **React Router v6** with programmatic routing and protected routes.

### Route Structure

```jsx
<Router>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Protected Routes */}
    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
    <Route path="/chat" element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />
    <Route path="/chat/:conversationId" element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />

    {/* ... more routes */}
  </Routes>
</Router>
```

### Complete Route Map

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | `Landing` | Public | Landing page (redirects to `/dashboard` if authenticated) |
| `/login` | `Login` | Public | Login page |
| `/register` | `Register` | Public | Registration page |
| `/dashboard` | `Dashboard` | Protected | User dashboard |
| `/chat` | `Chat` | Protected | New chat session |
| `/chat/:conversationId` | `Chat` | Protected | Existing conversation |
| `/conversations` | `Conversations` | Protected | Conversation history |
| `/session/:sessionId` | `SessionDetails` | Protected | Session details |
| `/courses` | `CourseCatalog` | Protected | Browse courses |
| `/courses/create` | `CreateCourse` | Protected | Create new course |
| `/courses/:courseId` | `CourseDetails` | Protected | View course details |
| `/profile` | `Profile` | Protected | User profile |
| `/roadmaps` | `MyRoadmaps` | Protected | User's roadmaps |
| `/roadmaps/create` | `CreateRoadmap` | Protected | Create roadmap |
| `/roadmaps/:id` | `RoadmapDetail` | Protected | Roadmap details |
| `/flashcards` | `Flashcards` | Protected | Flashcard management |
| `/flashcards/study/:deckName` | `StudyFlashcards` | Protected | Study flashcards |
| `*` | `NotFound` | Public | 404 page |

### Route Protection

Protected routes use the `PrivateRoute` component:

```jsx
// src/components/PrivateRoute.jsx
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};
```

---

## Authentication & Authorization

### Authentication Flow

#### 1. **Registration**
```javascript
register(userData) → POST /api/auth/register
  ↓
Store token, user, userId in localStorage
  ↓
Update AuthContext state
  ↓
Redirect to /dashboard
```

#### 2. **Login**
```javascript
login(credentials) → POST /api/auth/login
  ↓
Store token, user, userId in localStorage
  ↓
Update AuthContext state
  ↓
Redirect to /dashboard
```

#### 3. **Logout**
```javascript
logout() → POST /api/auth/logout
  ↓
Clear localStorage (token, user, userId)
  ↓
Clear AuthContext state
  ↓
Redirect to /login
```

### Token Management

**Axios Request Interceptor** automatically adds auth token to all requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Axios Response Interceptor** handles token expiration:

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Auth Context API

```javascript
// Available via useAuth() hook
{
  user,              // Current user object
  token,             // JWT token
  loading,           // Auth loading state
  register,          // Register function
  login,             // Login function
  logout,            // Logout function
  updateUser,        // Update user function
  isAuthenticated    // Boolean flag
}
```

---

## Role-Based Access Control

The application implements a sophisticated **course-level role-based access control** system.

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Founder** | Course creator | Full control, approve co-creators, manage revenue |
| **Co-Creator** | Approved collaborator | Edit course content, suggest improvements |
| **Content Improver** | Contributor | Suggest improvements (requires approval) |
| **Student** | Default role | View and enroll in courses |

### CourseRoleContext

The `CourseRoleContext` provides role information for a specific course:

```javascript
// Usage
const {
  userRole,           // 'founder' | 'co-creator' | 'content_improver' | 'student'
  revenueShare,       // User's revenue share percentage
  loading,            // Role loading state
  error,              // Error message if any
  contributorStatus,  // Contributor application status
  refreshRole,        // Refresh role function

  // Convenience flags
  isFounder,          // Boolean
  isCoCreator,        // Boolean
  isContributor,      // Boolean
  isStudent,          // Boolean

  // Permission checks
  canEdit,            // Can edit course (founder or co-creator)
  canApprove,         // Can approve requests (founder only)
  canSuggest,         // Can suggest improvements (any authenticated user)
  canApplyAsCoCreator // Can apply to be co-creator
} = useCourseRole();
```

### Role Detection Algorithm

```javascript
// 1. Fetch course data
const courseRes = await api.get(`/courses/${courseId}`);

// 2. Get current user ID
const userId = localStorage.getItem('userId');

// 3. Find user in course contributors
const contributor = course.contributors?.find(
  c => c.user._id === userId || c.user === userId
);

// 4. Determine role
if (contributor) {
  setUserRole(contributor.contributionType);
  setRevenueShare(contributor.revenueShare);
} else {
  setUserRole('student');
  setRevenueShare(0);
}
```

### Custom Permission Hooks

```javascript
// Check if user can edit
const { canEdit, loading } = useCanEdit();

// Check if user can approve
const { canApprove, loading } = useCanApprove();

// Get revenue share info
const { revenueShare, userRole, loading } = useRevenueShare();

// Get contributor status
const { contributorStatus, loading } = useContributorStatus();
```

### Usage in Components

```jsx
import { CourseRoleProvider, useCourseRole } from '../context/CourseRoleContext';

// Wrap course page with provider
<CourseRoleProvider courseId={courseId}>
  <CourseContent />
</CourseRoleProvider>

// Inside component
const CourseContent = () => {
  const { canEdit, isFounder } = useCourseRole();

  return (
    <>
      {canEdit && <EditButton />}
      {isFounder && <ApproveRequestsButton />}
    </>
  );
};
```

---

## State Management

The application uses a **hybrid approach** to state management:

### 1. React Context API
- **AuthContext** - Global authentication state
- **CourseRoleContext** - Course-specific role state
- **ThemeProvider** - Theme state (light/dark mode)
- **ToastContext** - Toast notification state

### 2. Zustand (mentioned in dependencies)
- Used for AI-related state management
- Lightweight alternative to Redux

### 3. Component State (useState)
- Local component state for UI interactions
- Form inputs
- Modal visibility
- Loading states

### 4. URL State (React Router)
- Route parameters (e.g., `courseId`, `conversationId`)
- Query parameters for filters and search

---

## Context Providers

### AuthContext
**Location:** `src/context/AuthContext.jsx`

**Purpose:** Manage global authentication state

**State:**
```javascript
{
  user: null | UserObject,
  token: null | string,
  loading: boolean
}
```

**Methods:**
- `register(userData)` - Register new user
- `login(credentials)` - Login user
- `logout()` - Logout user
- `updateUser(userData)` - Update user info

### CourseRoleContext
**Location:** `src/context/CourseRoleContext.jsx`

**Purpose:** Manage course-specific role and permissions

**State:**
```javascript
{
  userRole: 'founder' | 'co-creator' | 'content_improver' | 'student',
  revenueShare: number,
  loading: boolean,
  error: string | null,
  contributorStatus: object | null
}
```

**Methods:**
- `refreshRole()` - Refresh role from server

### ThemeProvider
**Location:** `src/context/ThemeProvider.jsx`

**Purpose:** Manage light/dark theme

**Powered by:** `useTheme` hook

### ToastContext
**Location:** `src/context/ToastContext.jsx`

**Purpose:** Global toast notification system

**Methods:**
- `success(message, duration)` - Success toast
- `error(message, duration)` - Error toast
- `info(message, duration)` - Info toast
- `warning(message, duration)` - Warning toast

**Usage:**
```javascript
const { success, error } = useToast();

// Show success toast
success('Course created successfully!');

// Show error toast
error('Failed to save changes');
```

---

## Services Layer

All API interactions are abstracted into service modules for clean separation of concerns.

### Core API Service
**File:** `src/services/api.js`

- Axios instance with base URL configuration
- Request interceptor (adds auth token)
- Response interceptor (handles 401 errors)

### Service Modules

#### authService.js
```javascript
- register(userData)
- login(credentials)
- logout()
- getCurrentUser()
- updatePassword(passwords)
- isAuthenticated()
- getStoredUser()
```

#### userService.js
```javascript
- getUserProfile()
- updateUserProfile(data)
```

#### chatService.js
```javascript
- getConversations()
- getConversation(id)
- sendMessage(data)
- deleteConversation(id)
```

#### roadmapService.js
```javascript
- getRoadmaps()
- createRoadmap(data)
- updateRoadmap(id, data)
- deleteRoadmap(id)
```

#### studyMaterialService.js
```javascript
- getFlashcards()
- createFlashcard(data)
- updateFlashcard(id, data)
- deleteFlashcard(id)
```

#### dashboardService.js
```javascript
- getDashboardStats()
- getRecentActivity()
```

#### aiService.js
```javascript
- sendAIMessage(message)
- getAIResponse(query)
- streamAIResponse(query)
```

#### aiStreamingService.js
- Handles streaming AI responses using Server-Sent Events (SSE)

#### ttsService.js
- Text-to-speech functionality
- Audio playback controls

#### browserSTT.js
- Speech-to-text using browser APIs

#### audioRecorder.js
- Audio recording functionality

#### voiceWebSocket.js
- WebSocket connection for voice sessions
- Real-time voice communication

---

## Components

### Component Categories

#### 1. Layout Components
- **Layout** - Main app layout with sidebar
- **Sidebar** - Desktop navigation
- **MobileSidebar** - Mobile navigation
- **MobileHeader** - Mobile header

#### 2. Route Protection
- **PrivateRoute** - HOC for protected routes

#### 3. Chat Components
- **AIChat** - Main chat interface
- **ChatPanel** - Chat sidebar panel
- **FloatingChatButton** - Floating chat trigger
- **VoiceChat** - Voice chat functionality

#### 4. Course Components
All located in `src/components/course/`:
- Role-based navigation
- Co-creator applications
- Revenue distribution
- Course improvements
- Contributor status

#### 5. Learning Components
- **Whiteboard** - Interactive whiteboard
- **LessonProgress** - Progress tracker
- **LearningPathGuide** - Learning guidance
- **ThinkingProcess** - Display AI reasoning
- **StreamingThinkingProcess** - Streaming AI thoughts

#### 6. UI Components
- **SemanticSearch** - Semantic search
- **ContextualHint** - Context hints
- **QuickActionsPanel** - Quick actions
- **WelcomeTour** - Onboarding tour

### Component Design Patterns

#### Container/Presentational Pattern
Some components follow the container/presentational pattern:
- **Container:** Handles logic and state
- **Presentational:** Pure UI rendering

#### Compound Components
Some features use compound component patterns:
- CourseRole components work together
- Chat components are composable

---

## Styling

### TailwindCSS
The application uses **TailwindCSS** for styling with a utility-first approach.

**Configuration:** `tailwind.config.js`

### Custom Theme
The theme includes:
- Custom color palette (primary, secondary, accent)
- Typography scale
- Spacing system
- Breakpoints for responsive design

### Dark Mode Support
Theme toggle via `ThemeProvider` context

### CSS Files
- **index.css** - Global styles, Tailwind directives
- **Whiteboard.css** - Whiteboard-specific styles

### Design System
- Consistent spacing using Tailwind scale
- Reusable utility classes
- Component-level customization with Tailwind

---

## Environment Configuration

### Environment Variables
**File:** `.env.example`

```bash
# API URL (Backend)
VITE_API_URL=http://localhost:5000/api

# WebSocket URL (for Voice Sessions)
VITE_WS_URL=http://localhost:5000
```

### Development
```bash
npm run dev
```
Runs on: `http://localhost:5173` (default Vite port)

### Production Build
```bash
npm run build
npm run preview
```

### Environment-Specific URLs
- **Development:** `http://localhost:5000/api`
- **Production:** Set via `VITE_API_URL` environment variable

---

## Key Features

### 1. AI-Powered Chat
- Real-time AI tutoring
- Streaming responses
- Conversation history
- Voice chat support

### 2. Course Management
- Browse course catalog
- Create courses
- Multi-role collaboration
- Revenue sharing system

### 3. Learning Roadmaps
- Create learning paths
- Track progress
- Enhanced roadmaps
- Step-by-step guidance

### 4. Flashcards
- Create flashcard decks
- Study mode
- Spaced repetition

### 5. Interactive Whiteboard
- Visual explanations
- Animation support
- Drawing tools

### 6. Voice Features
- Voice chat
- Text-to-speech
- Speech-to-text
- Real-time voice sessions

### 7. Semantic Search
- Intelligent content search
- Context-aware results

### 8. Multi-Theme Support
- Light/dark mode
- Persistent theme selection

### 9. Toast Notifications
- Success, error, warning, info toasts
- Auto-dismiss
- Manual dismiss

### 10. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop experience

---

## Development Guidelines

### Code Organization
1. Keep components small and focused
2. Extract business logic to services
3. Use custom hooks for reusable logic
4. Keep context providers lightweight

### Naming Conventions
- **Components:** PascalCase (e.g., `UserProfile.jsx`)
- **Services:** camelCase (e.g., `authService.js`)
- **Hooks:** usePrefixed (e.g., `useAuth.js`)
- **Utils:** camelCase (e.g., `formatDate.js`)

### File Structure
- One component per file
- Co-locate related files (e.g., `Whiteboard.jsx` + `Whiteboard.css`)
- Group by feature in subdirectories

### Best Practices
1. Use TypeScript for type safety (planned)
2. Write meaningful commit messages
3. Keep dependencies up to date
4. Use ESLint for code quality
5. Test critical user flows

---

## API Integration

### Base URL
All API calls go through the centralized `api.js` service:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Request Format
```javascript
// GET request
const response = await api.get('/courses');

// POST request
const response = await api.post('/courses', courseData);

// PUT request
const response = await api.put(`/courses/${id}`, updates);

// DELETE request
const response = await api.delete(`/courses/${id}`);
```

### Response Format
Expected response structure:
```javascript
{
  success: boolean,
  data: any,
  message?: string,
  error?: string
}
```

---

## Future Enhancements

### Planned Features
- TypeScript migration
- Progressive Web App (PWA) support
- Offline mode
- Advanced analytics dashboard
- Multi-language support (i18n)
- Enhanced accessibility (a11y)
- Unit and integration tests
- Component library documentation (Storybook)

### Performance Optimizations
- Code splitting
- Lazy loading routes
- Image optimization
- Bundle size reduction
- Caching strategies

---

## Troubleshooting

### Common Issues

#### 1. **401 Unauthorized Errors**
- **Cause:** Expired or invalid token
- **Solution:** Logout and login again

#### 2. **CORS Errors**
- **Cause:** Backend CORS not configured
- **Solution:** Ensure backend allows frontend origin

#### 3. **WebSocket Connection Failed**
- **Cause:** Incorrect `VITE_WS_URL`
- **Solution:** Verify WebSocket URL in `.env`

#### 4. **Role Not Detected**
- **Cause:** userId not stored in localStorage
- **Solution:** Re-login to refresh userId

---

## Conclusion

The Mini AI Tutor frontend is a modern, well-structured React application with:
- Clear separation of concerns
- Role-based access control
- Real-time capabilities
- AI-powered features
- Responsive design
- Scalable architecture

This documentation should serve as a comprehensive guide for developers working on the frontend codebase.

---

**Last Updated:** December 6, 2025
**Version:** 1.0.0
