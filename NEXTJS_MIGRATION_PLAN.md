# Next.js + TypeScript Migration Plan
## Mini AI Tutor - Complete Migration Guide

---

## 🎯 Migration Overview

This document outlines the complete migration strategy from **React SPA (Vite)** to **Next.js 14+ with TypeScript**.

### Goals
- ✅ Better SEO (SSR/SSG/ISR)
- ✅ Improved performance (code splitting, image optimization)
- ✅ Type safety with TypeScript
- ✅ Production-ready folder structure
- ✅ Maintainability and scalability

---

## 📁 New Next.js Project Structure

```
mini-ai-tutor-nextjs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              # Authenticated routes
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [conversationId]/
│   │   │   │       └── page.tsx
│   │   │   ├── roadmaps/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── flashcards/
│   │   │   │   ├── page.tsx
│   │   │   │   └── study/
│   │   │   │       └── [deckName]/
│   │   │   │           └── page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       └── page.tsx
│   │   │   ├── conversations/
│   │   │   │   └── page.tsx
│   │   │   ├── session/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes (if needed)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── not-found.tsx             # 404 page
│   │   └── error.tsx                 # Error boundary
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   ├── MobileSidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── chat/                     # Chat-related components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ThinkingProcess.tsx
│   │   │   ├── StreamingThinkingProcess.tsx
│   │   │   └── CourseRecommendationCard.tsx
│   │   ├── course/                   # Course-related components
│   │   │   └── ...
│   │   ├── icons/                    # Custom icons
│   │   │   └── index.tsx
│   │   ├── providers/                # Context providers
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   └── Providers.tsx         # Combined providers
│   │   └── shared/                   # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── lib/                          # Core utilities & configurations
│   │   ├── api/                      # API client setup
│   │   │   ├── client.ts            # Axios instance
│   │   │   └── endpoints.ts         # API endpoints
│   │   ├── auth/                    # Authentication utilities
│   │   │   ├── session.ts
│   │   │   └── middleware.ts
│   │   ├── utils/                   # Utility functions
│   │   │   ├── cn.ts                # classnames utility
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   └── constants.ts             # App constants
│   │
│   ├── services/                    # Business logic & API services
│   │   ├── ai/
│   │   │   ├── aiService.ts
│   │   │   ├── aiStreamingService.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── authService.ts
│   │   │   └── index.ts
│   │   ├── chat/
│   │   │   ├── chatService.ts
│   │   │   └── index.ts
│   │   ├── course/
│   │   │   └── index.ts
│   │   ├── roadmap/
│   │   │   ├── roadmapService.ts
│   │   │   └── index.ts
│   │   ├── voice/
│   │   │   ├── audioRecorder.ts
│   │   │   ├── browserSTT.ts
│   │   │   ├── ttsService.ts
│   │   │   ├── voiceWebSocket.ts
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   └── dashboardService.ts
│   │   ├── user/
│   │   │   └── userService.ts
│   │   └── studyMaterial/
│   │       └── studyMaterialService.ts
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAI.ts
│   │   ├── useTheme.ts
│   │   ├── useToast.ts
│   │   └── index.ts
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── api.ts                   # API response types
│   │   ├── auth.ts                  # Auth types
│   │   ├── chat.ts                  # Chat types
│   │   ├── course.ts                # Course types
│   │   ├── roadmap.ts               # Roadmap types
│   │   ├── user.ts                  # User types
│   │   └── index.ts                 # Export all types
│   │
│   ├── styles/                      # Global styles
│   │   └── globals.css              # Tailwind + custom CSS
│   │
│   └── middleware.ts                # Next.js middleware (auth, redirects)
│
├── public/                          # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── .env.local                       # Environment variables
├── .env.example                     # Example env file
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
└── README.md                        # Documentation

```

---

## 🔄 Migration Phases

### **Phase 1: Project Setup** ✅
1. Initialize Next.js with TypeScript
2. Set up Tailwind CSS
3. Configure ESLint & Prettier
4. Set up environment variables
5. Configure path aliases

### **Phase 2: Type Definitions** 🎯
1. Create all TypeScript interfaces
2. Define API response types
3. Create utility types
4. Set up type exports

### **Phase 3: Core Services** 🔧
1. Migrate API client (axios)
2. Migrate authentication service
3. Migrate AI services
4. Migrate chat service
5. Migrate course/roadmap services
6. Migrate voice/TTS services

### **Phase 4: Context & Providers** 🎭
1. Migrate AuthContext → AuthProvider
2. Migrate ThemeProvider
3. Migrate ToastContext → ToastProvider
4. Migrate CourseRoleContext
5. Create combined Providers component

### **Phase 5: Components** 🧩
1. Migrate layout components (Sidebar, Headers)
2. Migrate shared UI components
3. Migrate chat components
4. Migrate course components
5. Add 'use client' directives where needed

### **Phase 6: Pages & Routing** 📄
1. Set up app router structure
2. Migrate public pages (Landing, Login, Register)
3. Migrate dashboard layout
4. Migrate authenticated pages
5. Set up dynamic routes
6. Implement middleware for auth

### **Phase 7: Hooks** 🪝
1. Migrate useAuth hook
2. Migrate useAI hook
3. Migrate useTheme hook
4. Create new Next.js-specific hooks

### **Phase 8: Testing & Optimization** 🚀
1. Test all routes
2. Test authentication flow
3. Optimize images with next/image
4. Implement proper loading states
5. Add error boundaries
6. SEO optimization (metadata)

---

## 🔑 Key Migration Decisions

### **Server vs Client Components**

#### Server Components (Default)
- Layout wrappers
- Static content pages
- Data fetching pages
- SEO-critical pages

#### Client Components ('use client')
- Interactive UI components (Sidebar, Modals)
- Components using hooks (useState, useEffect)
- Event handlers
- Browser APIs (WebSocket, audio)
- Context providers

### **Data Fetching Strategy**

1. **Server Components**: Use native fetch with cache
2. **Client Components**: Use SWR or React Query
3. **Real-time**: Keep Socket.io for WebSocket

### **Authentication Approach**

- Use Next.js middleware for route protection
- HTTP-only cookies for tokens
- Server-side session validation
- Client-side auth context for UI state

---

## 📦 Dependencies Mapping

### Keep (Compatible)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.5",
  "react-markdown": "^9.0.1",
  "react-syntax-highlighter": "^15.5.0",
  "lucide-react": "^0.303.0",
  "socket.io-client": "^4.7.2",
  "zustand": "^4.4.7"
}
```

### Replace
```json
{
  "react-router-dom": "Remove - use Next.js router",
  "vite": "Remove - use Next.js",
  "@vitejs/plugin-react": "Remove"
}
```

### Add
```json
{
  "next": "^14.0.0",
  "typescript": "^5.3.0",
  "@types/node": "^20.10.0",
  "@types/react": "^18.2.45",
  "@types/react-dom": "^18.2.18",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.1.0"
}
```

---

## 🛠️ Configuration Files

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🎨 Styling Strategy

- Keep Tailwind CSS (already configured)
- Use `cn()` utility for conditional classes
- Maintain existing color scheme
- Keep dark mode support

---

## 🔐 Authentication Flow

1. **Login**: POST to `/api/auth/login` → Set HTTP-only cookie
2. **Middleware**: Check auth on protected routes
3. **AuthProvider**: Client-side auth state
4. **Logout**: Clear cookie + redirect

---

## 📝 Next Steps

1. Review this plan
2. Create new Next.js project
3. Start Phase 1: Project Setup
4. Proceed with systematic migration

---

**Estimated Timeline**: 3-5 days for complete migration
**Risk Level**: Low (systematic approach)
**Rollback Plan**: Keep original React app until Next.js is fully tested

