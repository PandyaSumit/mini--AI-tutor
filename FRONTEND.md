# Frontend Documentation

## Overview

The Mini AI Tutor frontend is built with React 18.2.0 using Vite 5.0 as the build tool and development server. The application provides an interactive learning platform with AI-powered tutoring, voice interactions, course management, and spaced repetition flashcard systems. The frontend communicates with the backend through RESTful APIs, Server-Sent Events for streaming responses, and WebSocket connections for real-time voice interactions.

## Project Structure

The frontend codebase is organized in the src directory with a clear separation of concerns. Components are split between reusable UI components in the components directory and page-level components in the pages directory. Services handle all API communication and are located in the services directory. State management is implemented using React Context API with providers in the context directory. The application uses React Router 6.21.1 for client-side routing and Tailwind CSS 3.4 for styling.

The main application structure consists of 52 files organized across components (30+ reusable components), pages (18 page components), services (12 API service modules), and context providers (3 global state managers). The build system uses Vite with hot module replacement for fast development iterations and optimized production builds.

## Core Components

The Navbar component serves as the primary navigation interface, displaying the application logo, navigation links, and user authentication status. When a user is logged in, it shows their profile information and provides access to the dashboard, courses, and chat interfaces. The component adapts based on authentication state and uses the AuthContext to determine what navigation options to display.

The Chat component implements the main AI tutoring interface with support for streaming responses using Server-Sent Events. It displays a conversation history with messages from both the user and AI tutor, handles input through a text area with auto-resize functionality, and shows loading states during AI processing. The component supports rich formatting of AI responses including code blocks, mathematics rendering, and markdown formatting. It also displays retrieved sources when the RAG system is used, showing relevant knowledge base articles that informed the AI's response.

The VoiceChat component provides real-time voice interaction capabilities using WebSocket connections through Socket.IO. Users can speak to the AI tutor and receive spoken responses, with visual feedback showing recording status, transcription results, and audio playback controls. The component manages the WebSocket connection lifecycle, handles audio streaming in chunks, and coordinates with the browser's speech synthesis API for text-to-speech playback. It includes error handling for microphone permissions, network failures, and audio processing issues.

The CourseCard component displays course information in a card format with thumbnail images, title, description, difficulty level, and enrollment statistics. It supports different display modes for browse, enrolled, and creator views. The component handles navigation to course detail pages and shows progress indicators for enrolled courses. It uses Tailwind CSS for responsive layouts that adapt from mobile to desktop screen sizes.

The FlashcardDeck component implements a spaced repetition learning system based on the SM-2 algorithm. It displays flashcards one at a time with flip animations to reveal answers, tracks user performance ratings from 1 to 5, and schedules review intervals based on learning progress. The component maintains state for current card index, card visibility, and user ratings. It integrates with the backend to persist learning progress and fetch cards due for review.

The LessonViewer component renders interactive lesson content with support for rich text, code examples, embedded videos, and practice exercises. It tracks user progress through lessons, marks completed sections, and provides navigation between lessons within a module. The component integrates with the AI tutor to allow students to ask questions about lesson content in context.

## Routing Architecture

The application uses React Router 6.21.1 with a centralized routing configuration in App.jsx. Routes are organized into public routes accessible to all users and protected routes that require authentication. The PrivateRoute component wraps protected routes and redirects unauthenticated users to the login page while preserving the intended destination for post-login redirect.

Public routes include the landing page at the root path, login page at /login, signup page at /signup, and a public course browser at /courses. These routes are accessible without authentication and provide entry points for new users to explore the platform and create accounts.

Protected routes require authentication and include the user dashboard at /dashboard, the AI chat interface at /chat, the voice chat interface at /voice-chat, course creation tools at /courses/create, individual course pages at /courses/:id, lesson viewers at /courses/:id/modules/:moduleId/lessons/:lessonId, flashcard decks at /flashcards/:deckId, learning roadmaps at /roadmaps, and user profile settings at /profile. The router automatically handles navigation state and provides loading indicators during page transitions.

The routing system preserves scroll position when navigating between pages and supports browser back/forward navigation with proper state management. Deep linking to specific lessons or flashcard decks works correctly with the nested route structure. Error boundaries catch routing errors and display user-friendly fallback UIs.

## State Management

State management in the application is handled through a combination of React Context API for global state and local component state for UI-specific concerns. Three primary context providers manage authentication, notifications, and course-specific permissions.

The AuthContext manages user authentication state including the current user object, authentication tokens, login status, and authentication methods. It provides login, logout, and signup functions to child components and persists authentication state to localStorage for session continuity across page refreshes. The context automatically refreshes expired tokens and handles logout on authentication failures. It exposes loading states during authentication operations and error states when authentication fails.

The ToastContext implements a global notification system for user feedback. It provides functions to show success messages, error alerts, and informational notifications with automatic dismissal after a configurable timeout. Toasts appear in a fixed position at the top-right of the screen and stack vertically when multiple notifications are active. The context manages the notification queue and handles dismissal through user action or timeout.

The CourseRoleContext manages course-specific permissions for collaborative course creation. It determines whether the current user is the course founder, a co-creator, or has no special permissions for a given course. This context is used to conditionally render editing interfaces, approval buttons, and contributor management tools. It caches permission lookups to avoid repeated API calls when navigating within a course.

Local component state is used for UI concerns like form inputs, modal visibility, loading states, and temporary data that doesn't need to be shared across components. The application follows React best practices by keeping state as local as possible and only elevating to context when true global access is needed.

## User Flows

The authentication flow begins when a new user visits the platform and navigates to the signup page. They enter their name, email, and password, which are validated on the client side before submission. Upon successful registration, the backend returns a JWT token that is stored in localStorage and the AuthContext. The user is automatically logged in and redirected to their dashboard. For returning users, the login flow is similar but uses existing credentials. Password validation includes minimum length requirements, and the system provides clear error messages for validation failures or server errors.

The AI chat interaction flow starts when a user navigates to the chat interface. They can type a question or request in the message input field and submit it. The frontend sends the message to the chat API endpoint and immediately displays it in the conversation history. The backend processes the query, determines if RAG retrieval is needed, and streams the response back using Server-Sent Events. The chat component progressively displays the streaming response word by word, creating a natural typing effect. If sources are retrieved from the knowledge base, they appear below the AI response with titles, snippets, and links to full articles. Users can click source links to view the complete document in a modal overlay.

The voice learning flow begins when a user clicks the voice chat button and grants microphone permissions. The browser requests microphone access, and once granted, a WebSocket connection is established with the backend. When the user clicks the record button, audio is captured in chunks and streamed to the server for transcription. The transcribed text appears in real-time as the user speaks. Once recording stops, the full transcript is sent to the AI for processing. The AI response is generated and sent back to the client, where the browser's speech synthesis API reads it aloud while simultaneously displaying the text. Users can interrupt playback, replay responses, or start new voice interactions at any time.

The course creation flow allows authenticated users to generate courses through natural language prompts. Users navigate to the course creation page and enter a description of what they want to teach, specify the difficulty level, and set the number of modules and lessons. The frontend validates the input and sends it to the course generation API. The backend uses the Groq LLM to generate a complete course structure including modules, lessons, learning objectives, and example content. The generated structure is displayed for review, and users can accept it to create the full course in the database. Once created, the course appears in the user's creator dashboard with draft status, and they can edit content, add multimedia, or publish it for enrollment.

The enrollment flow begins when a student browses the course catalog using either keyword search or semantic search powered by ChromaDB. They can filter courses by category, difficulty level, and rating. When they find a course of interest, clicking it opens the detailed course page showing the full description, module structure, instructor information, and enrollment statistics. Students can preview lesson titles and objectives before enrolling. Clicking the enroll button creates an enrollment record and adds the course to their dashboard. From there, they can access lessons, track progress, and interact with the AI tutor in the context of course content.

The flashcard learning flow implements spaced repetition for long-term retention. Users access their flashcard decks from the dashboard, and the system automatically determines which cards are due for review based on the SM-2 algorithm. Cards are presented one at a time with the question visible. Users click to reveal the answer and then rate their recall quality from 1 to 5. Based on this rating, the next review interval is calculated, with intervals increasing exponentially for well-remembered cards and resetting for forgotten ones. The system tracks statistics including total cards, cards mastered, cards in learning, and average retention rate.

The semantic course search flow allows users to find courses using natural language queries rather than exact keyword matches. When a user types a search query, the frontend debounces the input and sends it to the course search API. The backend generates an embedding for the query using the BGE-small model and performs a vector similarity search in ChromaDB against all course embeddings. The top matching courses are returned with similarity scores, ranked by relevance to the query. This enables queries like "learn to build web apps" to match courses about React, JavaScript, and web development even if those exact terms weren't in the query.

## API Integration

API communication is centralized in service modules located in src/services/. Each service module handles a specific domain of the application and provides clean interfaces for components to interact with the backend. All services use Axios as the HTTP client with configured interceptors for authentication and error handling.

The authService handles user authentication including login, signup, logout, and token refresh operations. It automatically attaches JWT tokens to requests in the Authorization header and handles token expiration by refreshing tokens transparently. When a token refresh fails, it triggers a logout and redirects to the login page.

The chatService manages AI conversation interactions including sending messages, streaming responses via Server-Sent Events, and retrieving conversation history. It provides a sendMessage function that returns an EventSource for streaming responses, allowing the chat component to display progressive output. The service handles connection errors, timeout scenarios, and graceful degradation when streaming is unavailable.

The voiceService manages WebSocket connections for voice interactions. It provides functions to establish connections, send audio chunks, receive transcriptions, and handle voice session lifecycle. The service implements reconnection logic with exponential backoff when connections drop and manages session state to prevent duplicate connections.

The courseService handles all course-related operations including browsing courses, fetching course details, creating courses, enrolling in courses, and tracking progress. It supports both keyword and semantic search, with automatic fallback to keyword search when ChromaDB is unavailable. The service caches frequently accessed course data to reduce API calls.

The flashcardService manages flashcard decks, individual cards, and spaced repetition scheduling. It submits user ratings after each card review and fetches cards due for review based on calculated intervals. The service handles bulk operations for creating cards from content and supports deck export and import.

The roadmapService generates and manages personalized learning roadmaps. It sends user goals, time commitments, and skill levels to the backend, which uses AI to create week-by-week learning plans with resources, milestones, and progress tracking. The service polls for roadmap generation completion when processing long roadmaps.

Error handling across all services follows a consistent pattern. Network errors, timeout errors, and server errors are caught in interceptors and transformed into user-friendly error messages. Services throw errors with structured information that components can use to display appropriate UI feedback. The ToastContext is commonly used to show error notifications.

Request cancellation is implemented for search operations to prevent race conditions when users type quickly. Previous requests are canceled when new ones are initiated, ensuring only the most recent results are displayed. This is particularly important for autocomplete and semantic search features.

## Styling System

The application uses Tailwind CSS 3.4 for styling with a mobile-first responsive design approach. Custom utility classes extend Tailwind's defaults to provide application-specific colors, spacing, and animations. The design system emphasizes consistency while allowing flexibility for component-specific needs.

The color palette includes primary blues for branding and call-to-action elements, secondary grays for text and backgrounds, success greens for positive feedback, warning yellows for cautions, and error reds for validation failures and critical alerts. Dark mode support is planned but not yet implemented, with color variables ready for theme switching.

Typography uses system fonts with fallbacks to ensure fast loading and broad compatibility. Headings use larger sizes with bold weights, while body text uses standard weights for readability. Code blocks use monospace fonts with syntax highlighting for programming content. Math equations render with proper formatting using libraries integrated through Markdown processors.

Responsive breakpoints follow Tailwind's defaults with mobile (0-640px), tablet (641-768px), laptop (769-1024px), and desktop (1025px+) sizes. Components adapt layouts from single columns on mobile to multi-column grids on larger screens. Navigation collapses to a hamburger menu on mobile devices. Font sizes and spacing scale appropriately across breakpoints.

Custom animations enhance user experience without being distracting. Fade-in animations introduce new content smoothly, slide-in animations bring modals and side panels into view, pulse animations indicate loading states, and flip animations show flashcard reveals. All animations use CSS transitions and transforms for GPU acceleration and smooth performance.

Component styling follows a utility-first approach with classes composed directly in JSX. Common patterns are extracted to reusable component variants rather than custom CSS classes. This approach reduces CSS bundle size and improves development velocity. Conditional classes are managed with the classnames library for clean, readable code.

Forms include consistent styling for inputs, labels, validation messages, and submit buttons. Input fields have focus states with border highlights, error states with red borders and error messages, and disabled states with reduced opacity. Form layouts adapt to screen size with full-width inputs on mobile and inline layouts on desktop.

Accessibility is considered in styling decisions with sufficient color contrast ratios, focus indicators for keyboard navigation, and semantic HTML elements. Interactive elements have hover states and active states to provide feedback. Text remains readable at different zoom levels, and layouts don't break when text size increases.

## Performance Optimizations

The application implements several performance optimizations to ensure fast loading and smooth interactions. Code splitting is configured through Vite to create separate bundles for routes, reducing initial bundle size. Lazy loading with React.lazy and Suspense defers loading of route components until needed, decreasing time to interactive on the initial page load.

Image optimization includes lazy loading for images below the fold using the loading="lazy" attribute, responsive images with srcset for different screen sizes, and WebP format with fallbacks for modern browsers. Course thumbnails and user avatars are sized appropriately and cached by the browser.

API response caching reduces redundant network requests for frequently accessed data. Course lists, user profiles, and flashcard decks are cached with appropriate expiration times. The cache is invalidated when data changes through user actions, ensuring users see up-to-date information. Service Workers could be added for offline caching in future iterations.

React rendering is optimized through proper use of key props in lists, memo for expensive components, useMemo for expensive calculations, and useCallback for stable function references. Components avoid unnecessary re-renders by keeping state local and using context selectively.

Debouncing is applied to search inputs to limit API calls while typing. A 300ms delay waits for the user to pause typing before sending the search query, reducing backend load and improving perceived performance. Autocomplete suggestions use similar debouncing patterns.

Bundle size is monitored through Vite's build analysis. Dependencies are reviewed regularly to avoid including large libraries unnecessarily. Tree shaking removes unused code from production builds, and minification reduces file sizes. Gzip compression is enabled on the server to further reduce transfer sizes.

## Development Workflow

The development environment uses Vite's dev server with hot module replacement for instant feedback during development. Changes to components, styles, or services reload immediately without full page refreshes, preserving application state. The development server runs on port 5173 by default and proxies API requests to the backend running on port 5000.

Environment variables are managed through .env files with different configurations for development, staging, and production. The VITE_API_URL variable configures the backend endpoint, allowing developers to point to local backends or remote staging servers. Sensitive credentials are never committed to version control.

Code organization follows conventions with components in PascalCase filenames, utilities in camelCase, and constants in UPPER_SNAKE_CASE. Imports are organized with external dependencies first, then internal imports, and finally styles. Consistent formatting is enforced through Prettier configuration.

Component development follows a pattern of creating the component file, defining prop types or TypeScript interfaces, implementing the component logic, adding styles, and writing tests. Reusable components are built with flexibility in mind, accepting props for customization rather than hardcoding values.

Browser DevTools are used extensively for debugging, with React DevTools for component inspection, Network tab for API monitoring, and Console for logging. Source maps are generated in development builds for accurate debugging of transpiled code.

The build process for production involves running vite build, which creates an optimized bundle in the dist directory. The build includes minification, tree shaking, and asset optimization. The resulting files are static and can be served from any web server or CDN. The build is typically deployed to hosting platforms like Vercel, Netlify, or traditional web servers.

## Future Enhancements

Planned frontend improvements include implementing dark mode with theme persistence, adding progressive web app capabilities for offline usage, expanding accessibility features to meet WCAG 2.1 AA standards, implementing end-to-end tests with Playwright or Cypress, adding real-time collaboration for course editing, and creating a mobile app using React Native with shared business logic.

Additional UX improvements include adding keyboard shortcuts for power users, implementing undo/redo functionality for course editing, adding drag-and-drop for content organization, improving loading states with skeleton screens, and adding optimistic UI updates for better perceived performance.

Internationalization support would enable the platform to serve global audiences with translations for UI text, locale-specific formatting for dates and numbers, and right-to-left layout support for languages like Arabic. The i18next library would provide translation management and runtime language switching.
