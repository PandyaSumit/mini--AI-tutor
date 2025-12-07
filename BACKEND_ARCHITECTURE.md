# Mini AI Tutor - Backend Architecture Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Database Models](#database-models)
- [API Routes](#api-routes)
- [Controllers](#controllers)
- [Middleware](#middleware)
- [AI System Architecture](#ai-system-architecture)
- [Memory System](#memory-system)
- [Vector Store & RAG](#vector-store--rag)
- [Real-time Communication](#real-time-communication)
- [Caching Strategy](#caching-strategy)
- [Queue System](#queue-system)
- [Authentication & Security](#authentication--security)
- [Environment Configuration](#environment-configuration)
- [Services](#services)
- [MCP (Model Context Protocol)](#mcp-model-context-protocol)
- [Monitoring & Logging](#monitoring--logging)
- [Deployment](#deployment)

---

## Overview

The Mini AI Tutor backend is a **comprehensive Node.js/Express API** powered by advanced AI capabilities using LangChain, LangGraph, and Groq. It provides a scalable, production-ready platform for AI-powered education with real-time voice sessions, intelligent memory management, and course collaboration features.

**Key Characteristics:**
- **Framework:** Express.js with ES Modules
- **AI Engine:** LangChain + LangGraph + Groq
- **Database:** MongoDB with Mongoose ODM
- **Caching:** Redis multi-database architecture
- **Real-time:** Socket.IO with Redis adapter
- **Queue System:** BullMQ for background jobs
- **Vector Store:** ChromaDB for embeddings
- **Authentication:** JWT with HTTP-only cookies

---

## Technology Stack

### Core Framework
- **Node.js** - JavaScript runtime
- **Express 4.18.2** - Web framework
- **ES Modules** - Modern JavaScript imports

### AI & Machine Learning
- **LangChain 0.3.0** - AI orchestration framework
- **@langchain/core 0.3.0** - Core LangChain utilities
- **@langchain/groq 0.1.0** - Groq LLM integration
- **@langchain/langgraph 0.2.19** - State graph workflows
- **@langchain/community 0.3.0** - Community integrations
- **Groq SDK 0.3.2** - Groq API client
- **@xenova/transformers 2.17.0** - Local embeddings
- **onnxruntime-node 1.14.0** - ONNX runtime

### Database & Storage
- **Mongoose 8.0.3** - MongoDB ODM
- **ChromaDB 1.9.0** - Vector database
- **MinIO 7.1.3** - Object storage (S3-compatible)

### Caching & Queue
- **Redis 4.7.0** - In-memory database
- **IORedis 5.8.2** - Redis client
- **BullMQ 4.15.0** - Queue system
- **LRU Cache 10.1.0** - In-memory LRU cache
- **@socket.io/redis-adapter 8.3.0** - Socket.IO Redis adapter

### Real-time Communication
- **Socket.IO 4.7.2** - WebSocket server

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT tokens
- **bcryptjs 2.4.3** - Password hashing
- **helmet 7.1.0** - Security headers
- **cors 2.8.5** - CORS middleware
- **express-rate-limit 7.1.5** - Rate limiting
- **rate-limit-redis 4.2.0** - Redis-based rate limiting
- **sanitize-html 2.11.0** - HTML sanitization
- **express-validator 7.0.1** - Input validation

### Utilities
- **axios 1.6.5** - HTTP client
- **dotenv 16.3.1** - Environment variables
- **winston 3.11.0** - Logging
- **morgan 1.10.0** - HTTP request logging
- **compression 1.7.4** - Response compression
- **cookie-parser 1.4.6** - Cookie parsing
- **multer 1.4.5-lts.1** - File uploads
- **cheerio 1.0.0-rc.12** - HTML parsing
- **uuid 11.0.3** - UUID generation
- **zod 3.22.4** - Schema validation
- **opossum 8.1.3** - Circuit breaker

### Model Context Protocol
- **@modelcontextprotocol/sdk 1.0.4** - MCP SDK

### Monitoring
- **@opentelemetry/api 1.9.0** - Telemetry API
- **@opentelemetry/sdk-node 0.54.0** - OpenTelemetry SDK
- **@opentelemetry/sdk-trace-node 1.28.0** - Tracing SDK

### Email
- **nodemailer 7.0.10** - Email sending

### Testing
- **Jest 29.7.0** - Testing framework
- **Supertest 6.3.3** - HTTP assertions

---

## Project Structure

```
backend/
├── server.js                    # Main server entry point
├── serverProd.js                # Production server configuration
│
├── config/                      # Configuration files
│   ├── database.js              # MongoDB connection
│   ├── aiService.js             # AI service configuration
│   ├── socket.js                # Socket.IO setup
│   └── initializeCache.js       # Redis cache initialization
│
├── models/                      # Mongoose models (20 models)
│   ├── User.js                  # User model
│   ├── UserProfile.js           # Extended user profile
│   ├── Course.js                # Course model
│   ├── Module.js                # Course module
│   ├── Lesson.js                # Course lesson
│   ├── Enrollment.js            # Course enrollment
│   ├── LearningRoadmap.js       # Basic roadmap
│   ├── EnhancedRoadmap.js       # Advanced roadmap
│   ├── Flashcard.js             # Flashcard model
│   ├── Conversation.js          # Chat conversation
│   ├── Message.js               # Chat message
│   ├── Session.js               # Learning session
│   ├── VoiceSession.js          # Voice session
│   ├── MemoryEntry.js           # AI memory
│   ├── AIUsageLog.js            # AI usage tracking
│   ├── CoCreatorRequest.js      # Co-creator requests
│   ├── CourseImprovement.js     # Course suggestions
│   ├── Quiz.js                  # Quiz model
│   ├── QuizAttempt.js           # Quiz attempts
│   ├── AdminActionLog.js        # Admin actions
│   ├── ModerationLog.js         # Content moderation
│   └── NewsletterSubscription.js # Newsletter
│
├── controllers/                 # Request handlers (10 controllers)
│   ├── authController.js        # Authentication
│   ├── userController.js        # User management
│   ├── chatController.js        # Chat functionality
│   ├── aiController.js          # AI interactions
│   ├── aiStreamController.js    # Streaming AI
│   ├── conversationController.js # Conversations
│   ├── dashboardController.js   # Dashboard data
│   ├── roadmapController.js     # Roadmaps
│   ├── studyMaterialController.js # Study materials
│   └── voiceSessionController.js # Voice sessions
│
├── routes/                      # API routes (21 route files)
│   ├── authRoutes.js            # Authentication routes
│   ├── userRoutes.js            # User routes
│   ├── chatRoutes.js            # Chat routes
│   ├── aiRoutes.js              # AI routes
│   ├── aiWorkflowRoutes.js      # AI workflow routes
│   ├── conversationRoutes.js    # Conversation routes
│   ├── dashboardRoutes.js       # Dashboard routes
│   ├── roadmapRoutes.js         # Roadmap routes
│   ├── enhancedRoadmapRoutes.js # Enhanced roadmap routes
│   ├── studyMaterialRoutes.js   # Study materials
│   ├── voiceRoutes.js           # Voice routes
│   ├── courses.js               # Course routes
│   ├── modules.js               # Module routes
│   ├── lessons.js               # Lesson routes
│   ├── enrollments.js           # Enrollment routes
│   ├── publicCourseRoutes.js    # Public course API
│   ├── coCreatorRoutes.js       # Co-creator routes
│   ├── contributorRoutes.js     # Contributor routes
│   ├── invitationRoutes.js      # Invitation routes
│   ├── newsletterRoutes.js      # Newsletter routes
│   ├── cacheAdminRoutes.js      # Cache management
│   └── admin.js                 # Admin routes
│
├── middleware/                  # Express middleware
│   ├── errorHandler.js          # Global error handler
│   ├── rateLimiter.js           # Rate limiting
│   ├── contentModeration.js     # Content moderation
│   └── [auth middleware in routes]
│
├── services/                    # Business logic services
│   └── [Service modules]
│
├── socketHandlers/              # Socket.IO event handlers
│   └── voiceHandlers.js         # Voice session handlers
│
├── ai/                          # AI System (Advanced)
│   ├── chains/                  # LangChain chains
│   │   ├── ragChain.js          # Basic RAG chain
│   │   └── advancedRagChain.js  # Advanced RAG chain
│   │
│   ├── graphs/                  # LangGraph state machines
│   │   └── adaptiveTutorGraph.js # Adaptive tutoring graph
│   │
│   ├── memory/                  # Memory management
│   │   ├── conversationManager.js # Conversation memory
│   │   ├── industryMemoryManager.js # Industry-grade memory
│   │   └── memoryJobs.js        # Memory maintenance jobs
│   │
│   ├── vectorstore/             # Vector database
│   │   └── [ChromaDB integration]
│   │
│   ├── embeddings/              # Embedding models
│   │   └── models/              # Embedding models
│   │
│   ├── prompts/                 # AI prompts
│   │   └── [Prompt templates]
│   │
│   ├── classifiers/             # Query classifiers
│   │   └── [Classification logic]
│   │
│   ├── handlers/                # AI request handlers
│   │   └── [Handler implementations]
│   │
│   ├── thinking/                # AI thinking process
│   │   └── [Thinking logic]
│   │
│   ├── state/                   # State management
│   │   └── [State handlers]
│   │
│   ├── security/                # AI security
│   │   └── [Security measures]
│   │
│   ├── config/                  # AI configuration
│   │   └── [Config files]
│   │
│   └── mcp/                     # Model Context Protocol
│       ├── core/                # MCP core
│       ├── schemas/             # MCP schemas
│       ├── servers/             # MCP servers
│       ├── tools/               # MCP tools
│       └── setupMCPTools.js     # MCP setup
│
├── queues/                      # BullMQ job queues
│   └── [Queue definitions]
│
├── workers/                     # Background workers
│   └── [Worker implementations]
│
├── utils/                       # Utility functions
│   └── [Helper functions]
│
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── manual/                  # Manual testing scripts
│
├── scripts/                     # Utility scripts
│   ├── create-admin.js          # Create admin user
│   ├── verify-admin-setup.js    # Verify admin
│   └── seedKnowledgeBase.js     # Seed knowledge base
│
├── docs/                        # Documentation
│   └── [API documentation]
│
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
├── jest.config.js               # Jest configuration
└── Dockerfile                   # Docker configuration
```

---

## Architecture Overview

### Request Flow

```
Client Request
    ↓
Express Server (server.js)
    ↓
Middleware Stack (auth, rate limiting, validation)
    ↓
Router (routes/*.js)
    ↓
Controller (controllers/*.js)
    ↓
Business Logic (services/)
    ↓
Database (MongoDB via Mongoose)
    ↓
Response
```

### AI Request Flow

```
Client AI Request
    ↓
AI Controller
    ↓
LangGraph State Machine
    ↓
Memory Manager (retrieve context)
    ↓
RAG Chain (vector search)
    ↓
LLM (Groq API)
    ↓
Thinking Process
    ↓
Response Generation
    ↓
Memory Storage (save context)
    ↓
Stream/Return Response
```

### Real-time Flow (Voice Sessions)

```
Client WebSocket Connection
    ↓
Socket.IO Server
    ↓
Voice Handler (socketHandlers/voiceHandlers.js)
    ↓
Voice Session Controller
    ↓
AI Processing (streaming)
    ↓
Response Streaming via WebSocket
    ↓
Client Receives Response
```

---

## Core Components

### 1. Server (server.js)

**Responsibilities:**
- Express app initialization
- MongoDB connection
- Socket.IO setup
- Redis cache initialization
- AI service initialization
- Memory maintenance jobs
- Middleware configuration
- Route mounting
- Error handling

**Key Features:**
```javascript
- Database connection with retry logic
- Multi-instance cache system (DB 0-5)
- WebSocket support for voice sessions
- Background job scheduling
- Graceful shutdown handling
```

### 2. Database Layer (Mongoose Models)

**20 MongoDB Models:**
1. **User** - User accounts
2. **UserProfile** - Extended profiles
3. **Course** - Course data
4. **Module** - Course modules
5. **Lesson** - Course lessons
6. **Enrollment** - Course enrollments
7. **LearningRoadmap** - Basic roadmaps
8. **EnhancedRoadmap** - Advanced roadmaps
9. **Flashcard** - Study flashcards
10. **Conversation** - Chat conversations
11. **Message** - Chat messages
12. **Session** - Learning sessions
13. **VoiceSession** - Voice interactions
14. **MemoryEntry** - AI memory storage
15. **AIUsageLog** - AI usage tracking
16. **CoCreatorRequest** - Co-creator applications
17. **CourseImprovement** - Course suggestions
18. **Quiz** - Quizzes
19. **QuizAttempt** - Quiz results
20. **AdminActionLog** - Admin audit trail
21. **ModerationLog** - Content moderation
22. **NewsletterSubscription** - Newsletter

---

## Database Models

### User Model (User.js)
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Enum ['student', 'instructor', 'admin'],
  avatar: String,
  bio: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Course Model (Course.js)
```javascript
{
  title: String,
  description: String,
  instructor: ObjectId → User,
  contributors: [{
    user: ObjectId → User,
    contributionType: Enum ['founder', 'co-creator', 'content_improver'],
    revenueShare: Number
  }],
  category: String,
  level: Enum ['beginner', 'intermediate', 'advanced'],
  thumbnail: String,
  modules: [ObjectId → Module],
  enrollmentCount: Number,
  rating: Number,
  isPublished: Boolean,
  createdAt: Date
}
```

### Conversation Model (Conversation.js)
```javascript
{
  user: ObjectId → User,
  title: String,
  messages: [ObjectId → Message],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### MemoryEntry Model (MemoryEntry.js)
```javascript
{
  userId: ObjectId → User,
  conversationId: ObjectId → Conversation,
  type: Enum ['fact', 'preference', 'context', 'skill'],
  content: String,
  importance: Number,
  accessCount: Number,
  lastAccessed: Date,
  decayFactor: Number,
  embedding: [Number], // Vector embedding
  metadata: Object,
  createdAt: Date
}
```

---

## API Routes

### Complete API Endpoints

#### Authentication Routes (`/api/auth`)
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
GET    /api/auth/me              - Get current user
PUT    /api/auth/update-password - Update password
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password
```

#### User Routes (`/api/users`)
```
GET    /api/users/profile        - Get user profile
PUT    /api/users/profile        - Update profile
POST   /api/users/avatar         - Upload avatar
GET    /api/users/stats          - Get user statistics
```

#### Chat Routes (`/api/chat`)
```
POST   /api/chat                 - Send chat message
GET    /api/chat/conversations   - Get all conversations
GET    /api/chat/:id             - Get conversation
DELETE /api/chat/:id             - Delete conversation
```

#### AI Routes (`/api/ai`)
```
POST   /api/ai/chat              - AI chat
POST   /api/ai/stream            - Streaming AI response
GET    /api/ai/suggestions       - Get AI suggestions
```

#### AI Workflow Routes (`/api/ai-workflow`)
```
POST   /api/ai-workflow/invoke   - Invoke AI workflow
POST   /api/ai-workflow/stream   - Stream AI workflow
GET    /api/ai-workflow/history  - Get workflow history
```

#### Course Routes (`/api/courses`)
```
GET    /api/courses              - List courses
POST   /api/courses              - Create course
GET    /api/courses/:id          - Get course
PUT    /api/courses/:id          - Update course
DELETE /api/courses/:id          - Delete course
GET    /api/courses/:id/modules  - Get course modules
POST   /api/courses/:id/enroll   - Enroll in course
```

#### Public Course Routes (`/api/public/courses`)
```
GET    /api/public/courses       - Browse courses (no auth)
GET    /api/public/courses/:id   - View course (no auth)
GET    /api/public/categories    - Course categories
POST   /api/public/search        - Search courses
```

#### Module Routes (`/api/modules`)
```
POST   /api/modules              - Create module
GET    /api/modules/:id          - Get module
PUT    /api/modules/:id          - Update module
DELETE /api/modules/:id          - Delete module
```

#### Lesson Routes (`/api/lessons`)
```
POST   /api/lessons              - Create lesson
GET    /api/lessons/:id          - Get lesson
PUT    /api/lessons/:id          - Update lesson
DELETE /api/lessons/:id          - Delete lesson
POST   /api/lessons/:id/complete - Mark complete
```

#### Enrollment Routes (`/api/enrollments`)
```
GET    /api/enrollments          - My enrollments
POST   /api/enrollments          - Enroll in course
GET    /api/enrollments/:id      - Get enrollment
DELETE /api/enrollments/:id      - Unenroll
```

#### Roadmap Routes (`/api/roadmaps`)
```
GET    /api/roadmaps             - List roadmaps
POST   /api/roadmaps             - Create roadmap
GET    /api/roadmaps/:id         - Get roadmap
PUT    /api/roadmaps/:id         - Update roadmap
DELETE /api/roadmaps/:id         - Delete roadmap
```

#### Enhanced Roadmap Routes (`/api/enhanced-roadmaps`)
```
GET    /api/enhanced-roadmaps    - List enhanced roadmaps
POST   /api/enhanced-roadmaps    - Create enhanced roadmap
GET    /api/enhanced-roadmaps/:id - Get enhanced roadmap
PUT    /api/enhanced-roadmaps/:id - Update enhanced roadmap
DELETE /api/enhanced-roadmaps/:id - Delete enhanced roadmap
```

#### Flashcard Routes (`/api/study-materials`)
```
GET    /api/study-materials/flashcards - Get flashcards
POST   /api/study-materials/flashcards - Create flashcard
PUT    /api/study-materials/flashcards/:id - Update flashcard
DELETE /api/study-materials/flashcards/:id - Delete flashcard
```

#### Dashboard Routes (`/api/dashboard`)
```
GET    /api/dashboard/stats      - Dashboard statistics
GET    /api/dashboard/activity   - Recent activity
GET    /api/dashboard/progress   - Learning progress
```

#### Voice Routes (`/api/voice`)
```
POST   /api/voice/session        - Start voice session
GET    /api/voice/session/:id    - Get session
POST   /api/voice/upload         - Upload audio
POST   /api/voice/transcribe     - Transcribe audio
```

#### Co-Creator Routes (`/api/co-creator`)
```
POST   /api/co-creator/apply     - Apply as co-creator
GET    /api/co-creator/requests  - Get requests
PUT    /api/co-creator/:id/approve - Approve request
PUT    /api/co-creator/:id/reject - Reject request
```

#### Contributor Routes (`/api/contributors`)
```
GET    /api/contributors/:courseId - Get contributors
POST   /api/contributors/suggest - Suggest improvement
GET    /api/contributors/suggestions - Get suggestions
PUT    /api/contributors/:id/approve - Approve suggestion
```

#### Invitation Routes (`/api/invitations`)
```
POST   /api/invitations          - Send invitation
GET    /api/invitations/received - Received invitations
POST   /api/invitations/:id/accept - Accept invitation
POST   /api/invitations/:id/reject - Reject invitation
```

#### Newsletter Routes (`/api/newsletter`)
```
POST   /api/newsletter/subscribe - Subscribe
POST   /api/newsletter/unsubscribe - Unsubscribe
```

#### Admin Routes (`/api/admin`)
```
GET    /api/admin/users          - Manage users
GET    /api/admin/courses        - Manage courses
GET    /api/admin/stats          - Platform stats
POST   /api/admin/moderate       - Moderate content
GET    /api/admin/logs           - Admin logs
```

#### Cache Admin Routes (`/api/cache-admin`)
```
GET    /api/cache-admin/stats    - Cache statistics
POST   /api/cache-admin/clear    - Clear cache
POST   /api/cache-admin/flush    - Flush cache DB
```

---

## Controllers

### Controller Architecture

Each controller handles business logic for specific features:

**authController.js** - Authentication
- User registration with password hashing
- Login with JWT token generation
- Logout with token invalidation
- Password reset functionality

**chatController.js** - Chat
- Create conversations
- Send messages
- Retrieve chat history
- Delete conversations

**aiController.js** - AI Interactions
- AI query processing
- Response generation
- Context management

**aiStreamController.js** - Streaming AI
- Server-sent events (SSE)
- Streaming AI responses
- Real-time thinking process

**conversationController.js** - Conversations
- Conversation CRUD
- Message management
- Search conversations

**dashboardController.js** - Dashboard
- User statistics
- Learning progress
- Recent activity

**roadmapController.js** - Roadmaps
- Roadmap CRUD
- Progress tracking

**studyMaterialController.js** - Study Materials
- Flashcard management
- Quiz management
- Study session tracking

**userController.js** - User Management
- Profile CRUD
- Avatar uploads
- User settings

**voiceSessionController.js** - Voice Sessions
- Voice session management
- Audio processing
- Transcription handling

---

## Middleware

### 1. Error Handler (errorHandler.js)
Global error handling:
```javascript
- Catches all errors
- Formats error responses
- Logs errors with Winston
- Development vs production error details
```

### 2. Rate Limiter (rateLimiter.js)
Redis-based rate limiting:
```javascript
- General API: 100 requests / 15 minutes
- Auth routes: 5 requests / 15 minutes
- AI routes: 20 requests / 15 minutes
- Per-user limits
```

### 3. Content Moderation (contentModeration.js)
Content filtering:
```javascript
- Profanity detection
- Spam prevention
- Malicious content blocking
- HTML sanitization
```

### 4. Authentication (protect middleware)
JWT authentication:
```javascript
- Verify JWT token
- Extract user from token
- Attach user to request
- Check user permissions
```

---

## AI System Architecture

### LangChain Integration

#### 1. RAG Chain (ai/chains/ragChain.js)
Basic Retrieval-Augmented Generation:
```javascript
- Query embedding
- Vector similarity search
- Context retrieval
- LLM response generation
```

#### 2. Advanced RAG Chain (ai/chains/advancedRagChain.js)
Enhanced RAG with multi-step reasoning:
```javascript
- Query classification
- Multi-source retrieval
- Context ranking
- Source attribution
- Response synthesis
```

### LangGraph State Machine

#### Adaptive Tutor Graph (ai/graphs/adaptiveTutorGraph.js)
State-based tutoring workflow:
```javascript
States:
1. Query Classification
2. Context Retrieval
3. Knowledge Check
4. Response Generation
5. Memory Update

Flow:
User Query → Classify → Retrieve Context → Check Knowledge
→ Generate Response → Update Memory → Return Response
```

### AI Components

**Embeddings (ai/embeddings/):**
- Local embedding models
- Xenova Transformers
- Fast embedding generation

**Prompts (ai/prompts/):**
- System prompts
- User prompts
- Few-shot examples
- Prompt templates

**Classifiers (ai/classifiers/):**
- Query type classification
- Intent detection
- Topic categorization

**Handlers (ai/handlers/):**
- Request processing
- Response formatting
- Error handling

**Thinking (ai/thinking/):**
- Chain-of-thought reasoning
- Step-by-step explanations
- Transparency in AI responses

**Security (ai/security/):**
- Prompt injection prevention
- Content filtering
- Rate limiting
- Token limits

---

## Memory System

### Conversation Memory (ai/memory/conversationManager.js)

**Features:**
- Short-term conversation context
- Message history management
- Context window optimization
- Automatic summarization

**Architecture:**
```javascript
{
  conversationId: String,
  messages: [Message],
  summary: String,
  lastUpdated: Date
}
```

### Industry Memory (ai/memory/industryMemoryManager.js)

**Advanced memory system with:**
- Long-term knowledge storage
- Importance scoring
- Memory decay
- Consolidation
- Retrieval optimization

**Memory Types:**
1. **Facts** - User-stated facts
2. **Preferences** - User preferences
3. **Context** - Situational context
4. **Skills** - User skill levels

**Memory Operations:**
```javascript
- store(memory) - Store new memory
- retrieve(query) - Retrieve relevant memories
- consolidate() - Merge similar memories
- decay() - Apply time-based decay
- cleanup() - Remove low-importance memories
```

### Memory Jobs (ai/memory/memoryJobs.js)

**Background maintenance:**
```javascript
- Consolidation Job (every 6 hours)
  → Merge similar memories
  → Update importance scores

- Decay Job (daily)
  → Apply time-based decay
  → Reduce importance of old memories

- Cleanup Job (weekly)
  → Remove low-importance memories
  → Archive old conversations
```

---

## Vector Store & RAG

### ChromaDB Integration

**Purpose:** Store and retrieve document embeddings

**Collections:**
```javascript
- course_knowledge - Course content
- user_notes - User-generated notes
- conversations - Chat history
- documents - Uploaded documents
```

**Operations:**
```javascript
- addDocuments(docs) - Add documents
- similaritySearch(query, k) - Find similar docs
- delete(ids) - Remove documents
```

**Embedding Model:**
- Xenova Transformers (local)
- ONNX Runtime (fast inference)
- 384-dimensional embeddings

---

## Real-time Communication

### Socket.IO Setup (config/socket.js)

**Features:**
- WebSocket server
- Redis adapter (horizontal scaling)
- Room-based communication
- Authentication

**Namespaces:**
```javascript
- /voice - Voice sessions
- /chat - Real-time chat
- /notifications - User notifications
```

### Voice Handlers (socketHandlers/voiceHandlers.js)

**Events:**
```javascript
- voice:start - Start voice session
- voice:audio - Send audio chunk
- voice:end - End session
- voice:transcription - Receive transcription
- voice:response - Receive AI response
```

**Flow:**
```
Client connects → Authenticate → Create session
→ Stream audio → Transcribe → AI processing
→ Stream response → End session
```

---

## Caching Strategy

### Redis Multi-Database Architecture

**DB 0: General Cache**
- API responses
- User sessions
- Socket.IO adapter

**DB 1: Socket.IO Messages**
- WebSocket message passing
- Room management

**DB 2: BullMQ Queues**
- Job queues
- Job results
- Worker state

**DB 5: Conversation Memory**
- Chat context cache
- Recent messages
- AI conversation state

**Caching Patterns:**
```javascript
- Cache-aside pattern
- Write-through cache
- TTL-based expiration
- LRU eviction
```

**Cache Keys:**
```javascript
- user:{userId} - User data
- course:{courseId} - Course data
- conversation:{convId} - Chat context
- memory:{userId} - User memories
```

---

## Queue System

### BullMQ Integration

**Queues:**
```javascript
- email-queue - Email sending
- embedding-queue - Document embedding
- memory-consolidation - Memory jobs
- ai-processing - Heavy AI tasks
```

**Workers:**
```javascript
- Email worker - Process emails
- Embedding worker - Generate embeddings
- Memory worker - Consolidate memories
```

**Job Options:**
```javascript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  },
  removeOnComplete: true
}
```

---

## Authentication & Security

### JWT Authentication

**Token Generation:**
```javascript
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);
```

**Token Storage:**
- HTTP-only cookie (secure)
- No localStorage (prevents XSS)

**Password Security:**
```javascript
- bcrypt hashing (10 rounds)
- Salt per password
- Never store plaintext
```

### Security Headers (Helmet)
```javascript
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
```

### CORS Configuration
```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
```

### Input Validation
```javascript
- express-validator for input validation
- Sanitize HTML inputs
- Validate email formats
- Check required fields
```

---

## Environment Configuration

### Environment Variables (.env.example)

```bash
# Server
NODE_ENV=production
PORT=5000
INSTANCE_ID=backend-1
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-tutor?replicaSet=rs0

# JWT
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRE=30d

# AI APIs
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
HUGGINGFACE_API_KEY=your_hf_api_key
OPENAI_API_KEY=your_openai_api_key

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Services

### Business Logic Services

Located in `services/` directory:

**Purpose:** Encapsulate business logic separate from controllers

**Examples:**
```javascript
- emailService.js - Email sending
- storageService.js - File storage
- analyticsService.js - Analytics tracking
- notificationService.js - Push notifications
```

---

## MCP (Model Context Protocol)

### MCP Architecture (ai/mcp/)

**Purpose:** Standardized protocol for AI model context

**Components:**

**Core (ai/mcp/core/):**
- MCP server implementation
- Protocol handlers
- Context management

**Schemas (ai/mcp/schemas/):**
- Request schemas
- Response schemas
- Validation rules

**Servers (ai/mcp/servers/):**
- MCP server instances
- Connection management

**Tools (ai/mcp/tools/):**
- MCP tools integration
- Tool registration

**Setup (setupMCPTools.js):**
```javascript
- Initialize MCP tools
- Register handlers
- Configure protocol
```

---

## Monitoring & Logging

### Winston Logging

**Log Levels:**
```javascript
- error - Error messages
- warn - Warning messages
- info - Informational messages
- debug - Debug messages
```

**Log Transports:**
```javascript
- Console (development)
- File (production)
  → error.log - Errors only
  → combined.log - All logs
```

**Log Format:**
```javascript
{
  timestamp: ISO8601,
  level: string,
  message: string,
  metadata: object
}
```

### Morgan HTTP Logging

**Request logging:**
```javascript
- HTTP method
- URL
- Status code
- Response time
- User agent
```

### OpenTelemetry (Optional)

**Tracing:**
- Distributed tracing
- Performance monitoring
- Error tracking

---

## Deployment

### Docker Support

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
```

### Production Checklist

✅ Set `NODE_ENV=production`
✅ Use strong `JWT_SECRET` (32+ characters)
✅ Configure MongoDB replica set
✅ Enable Redis persistence
✅ Set up SSL/TLS certificates
✅ Configure firewall rules
✅ Enable rate limiting
✅ Set up monitoring (Winston logs)
✅ Configure backup strategy
✅ Update MinIO credentials
✅ Enable CORS for production domain
✅ Set secure cookie options

---

## API Usage Examples

### Authentication
```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

### AI Chat
```bash
# Send AI message
POST /api/ai/chat
{
  "message": "Explain quantum computing",
  "conversationId": "conv_123"
}

# Stream AI response
POST /api/ai/stream
{
  "message": "Write a Python function",
  "stream": true
}
```

### Course Management
```bash
# Create course
POST /api/courses
{
  "title": "Introduction to Python",
  "description": "Learn Python basics",
  "category": "Programming",
  "level": "beginner"
}

# Enroll in course
POST /api/courses/:id/enroll
```

---

## Performance Metrics

### Expected Performance

**API Response Times:**
- Simple queries: < 100ms
- AI queries (non-streaming): 1-3s
- AI queries (streaming): 200-500ms first token
- Database queries: < 50ms (with cache)

**Scalability:**
- Horizontal scaling with Redis adapter
- Multi-instance support
- Load balancing ready

**Caching:**
- Cache hit ratio: > 80%
- Cache TTL: 5-60 minutes
- Memory usage: < 500MB per instance

---

## Conclusion

The Mini AI Tutor backend is a production-grade, AI-powered education platform with:
- **21 API route modules** covering all features
- **20+ database models** for comprehensive data management
- **Advanced AI system** with LangChain, LangGraph, and Groq
- **Industry-grade memory** with consolidation and decay
- **Real-time communication** via Socket.IO
- **Multi-database caching** with Redis
- **Background job processing** with BullMQ
- **Vector search** with ChromaDB
- **MCP integration** for standardized AI context
- **Comprehensive security** with JWT, rate limiting, and validation
- **Scalable architecture** supporting horizontal scaling

This documentation provides a complete reference for backend development and maintenance.

---

**Last Updated:** December 7, 2025
**Version:** 1.0.0
**Node.js Version:** 18+
