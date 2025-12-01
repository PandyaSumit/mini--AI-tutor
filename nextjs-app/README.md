# Mini AI Tutor - Next.js + TypeScript

> AI-powered learning platform built with Next.js 14+, TypeScript, and Tailwind CSS

## 🚀 Features

- **AI-Powered Chat** - Interactive AI tutor with context-aware responses
- **Learning Roadmaps** - Personalized learning paths with milestones
- **Flashcards** - AI-generated flashcards for better retention
- **Courses** - Structured learning with lessons and quizzes
- **Progress Tracking** - Monitor your learning journey
- **Dark Mode** - Theme support
- **Responsive Design** - Mobile-first approach

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Real-time**: Socket.io
- **Icons**: Lucide React
- **Markdown**: React Markdown

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── chat/             # Chat-specific components
│   ├── providers/        # Context providers
│   └── shared/           # Shared components
├── lib/                  # Core utilities
│   ├── api/             # API client & endpoints
│   ├── auth/            # Auth utilities
│   └── utils/           # Helper functions
├── services/            # Business logic & API services
│   ├── auth/           # Authentication service
│   ├── ai/             # AI service
│   ├── chat/           # Chat service
│   └── ...
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## 🔧 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## 🌐 Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# WebSocket URL
NEXT_PUBLIC_WS_URL=http://localhost:5000

# App Configuration
NEXT_PUBLIC_APP_NAME=Mini AI Tutor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📜 Available Scripts

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)

# Production
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking

# Troubleshooting
npm run fix:caniuse   # Fix caniuse-lite module issues
```

## 🔧 Troubleshooting

Having issues? Check out [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common problems, including:
- Module not found errors (caniuse-lite, etc.)
- Port conflicts
- Build errors
- TypeScript errors

## 🏗️ Architecture

### Server vs Client Components

**Server Components** (default):
- Layout wrappers
- Static content
- Data fetching pages
- SEO-critical pages

**Client Components** ('use client'):
- Interactive UI (forms, modals)
- State management (useState, useEffect)
- Event handlers
- Browser APIs (WebSocket, audio)
- Context providers

### Data Fetching

- **Server Components**: Native `fetch` with cache
- **Client Components**: Services with Axios
- **Real-time**: Socket.io for WebSocket

### Authentication

- HTTP-only cookies for tokens
- Next.js middleware for route protection
- Server-side session validation
- Client-side AuthProvider for UI state

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom theme** in `tailwind.config.ts`
- **Dark mode** support with class strategy
- **Typography plugin** for markdown content

## 🔐 Authentication Flow

1. User logs in → Server sets HTTP-only cookie
2. Middleware checks auth on protected routes
3. AuthProvider manages client-side state
4. Logout clears cookie + redirects

## 📱 Responsive Design

- **Mobile**: Bottom navigation bar
- **Tablet/Desktop**: Sidebar navigation
- **Breakpoints**: Following Tailwind defaults

## 🧩 Key Components

### Layout Components
- `Sidebar` - Desktop navigation
- `MobileHeader` - Mobile top bar
- `MobileSidebar` - Mobile navigation drawer
- `DashboardLayout` - Authenticated pages wrapper

### Providers
- `AuthProvider` - Authentication state
- `ThemeProvider` - Dark/light theme
- `ToastProvider` - Notifications
- `Providers` - Combined provider wrapper

## 📊 State Management

- **Global State**: Zustand stores
- **Server State**: React Query (future)
- **UI State**: React Context
- **Form State**: React Hook Form (future)

## 🧪 Testing

```bash
# Unit tests (to be added)
npm run test

# E2E tests (to be added)
npm run test:e2e
```

## 📈 Performance Optimization

- ✅ Automatic code splitting
- ✅ Image optimization with `next/image`
- ✅ Font optimization
- ✅ Route prefetching
- ✅ API response caching
- ✅ Lazy loading components

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t mini-ai-tutor .

# Run container
docker run -p 3000:3000 mini-ai-tutor
```

## 📝 Migration from React SPA

This project was migrated from a React + Vite SPA to Next.js + TypeScript.

See `MIGRATION_STATUS.md` for detailed migration progress and `NEXTJS_MIGRATION_PLAN.md` for the complete migration strategy.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting
- Tailwind CSS for the utility-first approach
- All contributors and users

---

**Built with ❤️ using Next.js + TypeScript**
