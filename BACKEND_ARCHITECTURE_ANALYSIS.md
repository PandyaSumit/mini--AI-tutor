# Backend Architecture Analysis: Mini AI Tutor Project

## Executive Summary

The Mini AI Tutor backend is a sophisticated, production-ready Node.js/Express application built with modern technologies. It implements a multi-layered architecture with advanced features including:
- **Microservices patterns** with specialized services for AI, voice, and education
- **Comprehensive database design** using MongoDB with Mongoose ODM
- **Advanced AI orchestration** using LangChain, LangGraph, and Groq
- **Semantic search** powered by ChromaDB vector database
- **Long-term memory system** with semantic consolidation
- **Real-time communication** via WebSockets (Socket.IO)
- **Enterprise-grade caching** with Redis circuit breaker
- **Multi-tier authentication and authorization**

**Total API Endpoints:** 121 routes  
**Database Collections:** 18 models  
**Services:** 10+ specialized services

---

## 1. Server Setup & Configuration

### 1.1 Main Server Entry Point
**File:** `/backend/server.js`

```javascript
Framework: Express.js 4.18.2
HTTP Server: Node.js http module (with Socket.IO support)
Type System: ES6 modules (import/export)
Port: 5000 (configurable via PORT env var)
```

**Key Features:**
- Async initialization with graceful shutdown handling
- Multi-phase startup (database → cache → AI pipeline → routes)
- Circuit breaker pattern for Redis connections
- Memory maintenance jobs for semantic consolidation
- Course sync service with ChromaDB
- Signal handling (SIGTERM, SIGINT) for clean shutdown

### 1.2 Middleware Stack

**Security & Headers:**
- `helmet()` - Security headers (HSTS, CSP, etc.)
- `cors()` - Cross-origin resource sharing

**Parsing:**
- `express.json()` - JSON body parser
- `express.urlencoded()` - URL-encoded parser

**Logging & Monitoring:**
- `morgan('dev')` - HTTP request logging

**Rate Limiting:**
- Applied globally to all routes
- Custom limiters for auth, chat endpoints
- Circuit breaker pattern for graceful degradation

**Content Moderation:**
- Applied to chat routes specifically
- Keyword and pattern-based violation detection

### 1.3 Core Dependencies

```json
{
  "express": "4.18.2",
  "mongoose": "8.0.3",
  "cors": "2.8.5",
  "helmet": "7.1.0",
  "morgan": "1.10.0",
  "socket.io": "4.7.2",
  "ioredis": "5.8.2",
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "2.4.3",
  
  "AI & LLM": {
    "@langchain/groq": "0.1.0",
    "@langchain/langgraph": "0.2.19",
    "@langchain/core": "0.3.0",
    "@langchain/community": "0.3.0",
    "groq-sdk": "0.3.2"
  },
  
  "Vector Store": {
    "chromadb": "1.9.0"
  },
  
  "Utilities": {
    "multer": "1.4.5-lts.1",
    "sanitize-html": "2.11.0",
    "uuid": "11.0.3",
    "winston": "3.11.0",
    "zod": "3.22.4"
  }
}
```

---

## 2. Database Schema & Models

### 2.1 Data Model Overview

**Total Models:** 18  
**ODM:** Mongoose 8.0.3  
**Database:** MongoDB

### 2.2 Core Entities

#### **User Model** (361 lines)
**Location:** `/backend/models/User.js`

```javascript
Fields:
├── Basic Info
│   ├── name (String, required, max 50)
│   ├── email (String, required, unique, validated)
│   ├── password (String, required, hashed with bcrypt)
│   ├── avatar (String, URL)
│   └── role (enum: 'user', 'admin')
│
├── Learning Stats
│   ├── totalConversations (Number)
│   ├── totalMessages (Number)
│   ├── totalTimeSpent (Number, in minutes)
│   ├── currentStreak (Number)
│   ├── lastActiveDate (Date)
│   └── topicProgress (Map<String, Number>)
│
├── Preferences
│   ├── theme (enum: 'light', 'dark', 'auto')
│   ├── language (String, default 'en')
│   └── notifications (Boolean)
│
├── Reputation System
│   ├── score (Number, min 0)
│   ├── coursesCreated (Number)
│   ├── coursesCoCreated (Number)
│   ├── improvementsImplemented (Number)
│   ├── totalStudents (Number)
│   ├── averageCourseRating (Number, 0-5)
│   └── badges (Array<enum>)
│       └── ['founder', 'co-creator', 'expert', 'prolific', 'quality', 'helpful']
│
├── Subscription
│   ├── tier (enum: 'free', 'pro', 'enterprise')
│   ├── status (enum: 'active', 'cancelled', 'expired')
│   ├── startDate (Date)
│   └── endDate (Date)
│
├── Contributor Activity
│   ├── errorReports (Number)
│   ├── suggestionsSubmitted (Number)
│   ├── suggestionsImplemented (Number)
│   ├── questionsAsked (Number)
│   ├── forumParticipation (Number)
│   ├── qualityScore (Number, 0-100)
│   ├── lastContributionDate (Date)
│   ├── invitedToContribute (Boolean)
│   └── invitedAt (Date)
│
└── Account Management
    ├── isVerified (Boolean)
    ├── resetPasswordToken (String)
    ├── resetPasswordExpire (Date)
    ├── createdAt (Date)
    └── updatedAt (Date)

Key Methods:
- comparePassword(password): async - Bcrypt comparison
- updateLearningStats(updates): Update user stats
- updateStreak(): Calculate streak based on activity
- canCreateSpecializedCourse(): Check subscription/reputation
- awardReputation(points, reason): Award points and badges
- shouldBeInvitedAsContributor(): Check if user qualifies
- updateContributorQuality(): Update quality score
- recordContribution(type): Record contribution activity

Indexes:
- { email: 1 } (unique)
- { 'reputation.score': -1 }
- { 'contributorActivity.invitedToContribute': 1 }
```

#### **Course Model** (450 lines)
**Location:** `/backend/models/Course.js`

```javascript
Fields:
├── Basic Info
│   ├── title (String, required, max 200)
│   ├── description (String, required, max 5000)
│   ├── thumbnail (String, URL)
│   ├── category (enum: 'programming', 'mathematics', 'science', 'language', 'business', 'design', 'other')
│   ├── level (enum: 'beginner', 'intermediate', 'advanced')
│   ├── tags (Array<String>)
│   └── isPublished (Boolean)
│
├── Creator & Contributors
│   ├── createdBy (ObjectId, ref User)
│   └── contributors (Array)
│       ├── user (ObjectId, ref User)
│       ├── contributionType (enum: 'founder', 'co-creator', 'content_improver', 'reviewer')
│       ├── contributionDate (Date)
│       ├── contributionScore (Number)
│       ├── revenueShare (Number, 0-100%)
│       ├── approvalStatus (enum: 'pending', 'approved', 'rejected')
│       ├── approvedBy (ObjectId, ref User)
│       └── approvedAt (Date)
│
├── Semantic Search
│   ├── embedding (Array<Number>) - 384-dim vector (BGE-small)
│   ├── specializationType (enum: 'general', 'niche', 'audience-specific', 'advanced')
│   ├── specializationJustification (String)
│   └── parentCourse (ObjectId, ref Course)
│
├── Quality & Publishing
│   ├── qualityScore (Number, 0-100)
│   ├── isDraft (Boolean)
│   ├── isPublished (Boolean)
│   ├── publishedAt (Date)
│   └── meetsQualityStandards(): Bool
│       └── Requires: ≥3 modules, ≥12 lessons, quality score ≥50
│
├── Statistics
│   ├── totalModules (Number)
│   ├── totalLessons (Number)
│   ├── totalDuration (Number, in minutes)
│   ├── enrollmentCount (Number)
│   └── completionCount (Number)
│
├── Metadata
│   ├── language (String)
│   ├── estimatedDuration (Number, in hours)
│   ├── prerequisites (Array<String>)
│   └── learningOutcomes (Array<String>)
│
└── Timestamps
    ├── createdAt (Date)
    └── updatedAt (Date)

Key Methods:
- publish(): Mark course as published
- updateStatistics(): Calculate module/lesson stats
- addContributor(userId, type, revenueShare): Add co-creator
- getFounder(): Get founder user
- canUserContribute(userId): Check permissions
- meetsQualityStandards(): Validate quality
- findPublished(filters): Static method for query
- calculateRevenueDistribution(totalRevenue): Distribution array
- calculateCoCreatorRevenue(userId): Calculate share for co-creator
- calculateContributorRevenue(implementationsCount): Calculate share for contributor
- normalizeRevenueShares(): Ensure total ≤ 100%
- getFounderRevenue(): Get founder's current share
- updateFounderRevenue(): Recalculate founder share based on co-creators

Indexes:
- { instructor: 1, isPublished: 1, createdAt: -1 }
- { category: 1, level: 1, isPublished: 1 }
- { tags: 1 }
- { 'statistics.enrollmentCount': -1 }

Hooks:
- post('save'): Sync to ChromaDB
- post('remove'): Remove from ChromaDB
- post('findOneAndUpdate'): Update ChromaDB
```

#### **Conversation Model** (107 lines)
**Location:** `/backend/models/Conversation.js`

```javascript
Fields:
├── Basic Info
│   ├── user (ObjectId, ref User, required, indexed)
│   ├── title (String, required, max 100)
│   ├── topic (enum: 'programming', 'mathematics', 'languages', 'science', 'history', 'general', 'other')
│   ├── tags (Array<String>)
│   ├── messageCount (Number)
│   ├── lastMessageAt (Date)
│   └── isActive (Boolean)
│
├── Metadata
│   ├── model (String, default 'groq-llama')
│   ├── totalTokens (Number)
│   ├── averageResponseTime (Number)
│   ├── isVoiceSession (Boolean)
│   ├── sessionId (ObjectId, ref VoiceSession)
│   └── language (String, default 'en-US')
│
└── Timestamps
    ├── createdAt (Date)
    └── updatedAt (Date)

Methods:
- incrementMessageCount(): Increment and update timestamp

Indexes:
- { user: 1, isActive: 1, lastMessageAt: -1 }
- { user: 1, createdAt: -1 }
- { 'metadata.sessionId': 1 }

Virtual:
- messages (ref: Message, localField: _id, foreignField: conversation)
```

#### **Memory Entry Model** (338 lines)
**Location:** `/backend/models/MemoryEntry.js`

Complex semantic memory system with decay:

```javascript
Fields:
├── User & Content
│   ├── userId (ObjectId, ref User, indexed)
│   ├── content (String, max 5000)
│   └── type (enum: 'fact', 'preference', 'experience', 'skill', 'goal', 'relationship', 'event')
│
├── Namespace (Hierarchical Organization)
│   ├── category (enum: 'personal', 'work', 'education', 'hobby', 'health', 'general')
│   ├── subcategory (String, max 50)
│   └── topic (String, max 100)
│
├── Entities (Extracted)
│   ├── type (String)
│   ├── value (String)
│   └── confidence (Number, 0-1)
│
├── Temporal Info
│   ├── createdAt (Date)
│   ├── updatedAt (Date)
│   ├── lastAccessedAt (Date)
│   ├── expiresAt (Date) - For TTL
│   └── timeContext (String)
│
├── Importance & Decay
│   ├── score (Number, 0-1)
│   ├── factors
│   │   ├── userMarked (Boolean)
│   │   ├── accessFrequency (Number)
│   │   ├── recency (Number) - Decay factor
│   │   ├── emotionalValence (Number)
│   │   └── contradictionCount (Number)
│   └── decayRate (Number) - % per day
│
├── Source (Provenance)
│   ├── conversationId (ObjectId, ref Conversation)
│   ├── messageIds (Array<ObjectId>)
│   ├── extractionMethod (enum: 'automatic', 'user_explicit', 'consolidated', 'inferred')
│   └── confidence (Number, 0-1)
│
├── Semantic Info
│   ├── embeddingId (String) - ChromaDB ID
│   ├── keywords (Array<String>)
│   ├── relatedMemoryIds (Array<ObjectId>)
│   └── similarityThreshold (Number)
│
├── Versioning
│   ├── current (Number)
│   └── history (Array)
│       ├── version (Number)
│       ├── content (String)
│       ├── updatedAt (Date)
│       └── reason (String)
│
├── Status & Privacy
│   ├── status (enum: 'active', 'archived', 'deprecated', 'contradicted', 'consolidated')
│   ├── level (enum: 'public', 'private', 'sensitive', 'confidential')
│   ├── canShare (Boolean)
│   ├── dataCategory (enum: 'general', 'personal', 'health', 'financial', 'biometric', 'special')
│   ├── retentionPolicy (enum: 'standard', 'extended', 'minimal', 'explicit_consent')
│   └── userConsent
│       ├── granted (Boolean)
│       └── grantedAt (Date)
│
├── Access Control
│   ├── readBy (Array<String>)
│   ├── modifyBy (Array<String>)
│   └── deleteBy (Array<String>)
│
└── Audit Trail
    └── Array of actions with timestamps

Methods:
- markAccessed(): Update access time
- calculateImportanceScore(): Composite importance calculation
- shouldForget(): Determine if memory should be forgotten
- findByNamespace(userId, category, subcategory, topic): Static query
- findRecent(userId, limit): Get recent memories

Indexes:
- { userId: 1, 'namespace.category': 1, 'temporal.createdAt': -1 }
- { userId: 1, type: 1, status: 1 }
- { userId: 1, 'importance.score': -1, 'temporal.lastAccessedAt': -1 }
- { userId: 1, 'source.conversationId': 1 }
- { 'temporal.expiresAt': 1 } (TTL)
- { 'semantic.embeddingId': 1 }
```

#### **Module & Lesson Models**

**Module** (117 lines) - Course structure:
```javascript
- course (ObjectId, ref Course, indexed)
- title (String, required)
- description (String, required)
- order (Number, required)
- isPublished (Boolean)
- objectives (Array<String>)
- statistics (totalLessons, totalDuration, completionCount)
- metadata (difficulty, estimatedTime)

Methods:
- updateStatistics()
- getNextLessonOrder()
- findByCourseWithLessons() (static)
```

**Lesson** (175 lines) - Learning units:
```javascript
- module (ObjectId, ref Module, indexed)
- title (String, required)
- content (String, required)
- order (Number)
- duration (Number, in minutes)
- objectives (Array<String>)
- lessonType (enum: 'video', 'text', 'interactive', 'voice', 'quiz', 'assignment')
- content_structure
│   ├── sections (Array)
│   ├── keyPoints (Array)
│   ├── examples (Array)
│   └── questions (Array)
- aiInstructions
│   ├── systemPrompt
│   ├── teachingStyle (enum: 'conversational', 'formal', 'socratic', 'practical')
│   └── contextGuidelines
- resources (Array)
- statistics (sessionCount, completionCount, averageCompletionTime)
- metadata (difficulty, tags, prerequisites)

Methods:
- getAIContext(): Return context for AI tutoring
- recordCompletion(time)
- incrementSessionCount()
- findByModule() (static)
```

#### **Enrollment Model** (134 lines)

```javascript
- user (ObjectId, ref User, indexed)
- course (ObjectId, ref Course, indexed)
- status (enum: 'active', 'completed', 'paused', 'dropped')
- progress
│   ├── completedLessons (Array with timestamps, timeSpent)
│   ├── currentLesson (ObjectId)
│   ├── completionPercentage (Number, 0-100)
│   └── totalTimeSpent (Number)
- enrolledAt (Date)
- completedAt (Date)
- lastAccessedAt (Date)

Methods:
- completeLesson(lessonId, timeSpent)
- updateCurrentLesson(lessonId)
- findByUser(userId, status) (static)
- isEnrolled(userId, courseId) (static, async)

Unique Index:
- { user: 1, course: 1 }
```

#### **Other Models**

- **Message** (81 lines) - Chat messages
- **VoiceSession** (184 lines) - Voice interaction sessions
- **Session** (160 lines) - Learning sessions
- **Quiz/QuizAttempt** - Assessment tracking
- **Flashcard** (149 lines) - Spaced repetition
- **LearningRoadmap** (185 lines) - Personalized learning paths
- **CourseImprovement** (125 lines) - Improvement suggestions
- **CoCreatorRequest** (98 lines) - Co-creator applications
- **ModerationLog** (124 lines) - Content moderation audit trail
- **UserProfile** (376 lines) - Extended user information
- **Conversation** - Chat conversations

---

## 3. API Endpoints & Route Organization

### 3.1 Route Structure

**File Organization:**
```
/backend/routes/
├── authRoutes.js              - Authentication
├── userRoutes.js              - User profile
├── chatRoutes.js              - Chat interface
├── conversationRoutes.js       - Conversation management
├── voiceRoutes.js             - Voice sessions
├── courses.js                 - Course CRUD
├── modules.js                 - Module management
├── lessons.js                 - Lesson management
├── enrollments.js             - Enrollment tracking
├── roadmapRoutes.js           - Learning roadmaps
├── studyMaterialRoutes.js     - Study materials
├── aiRoutes.js                - AI operations
├── aiWorkflowRoutes.js        - Advanced RAG/LangGraph
├── coCreatorRoutes.js         - Co-creator management
├── contributorRoutes.js       - Contributor features
├── invitationRoutes.js        - Contributor invitations
├── cacheAdminRoutes.js        - Cache management (admin)
└── [lessonRoutes.js]          - Dynamic lesson routes
```

**Total API Endpoints:** 121+

### 3.2 Authentication Routes
**File:** `/backend/routes/authRoutes.js`

```javascript
POST   /api/auth/register          - Register new user
├─ Rate Limited: 5/15min
├─ Input: { name, email, password }
└─ Returns: { user, token }

POST   /api/auth/login             - Login user
├─ Rate Limited: 5/15min
├─ Input: { email, password }
├─ Updates: User streak
└─ Returns: { user, token }

GET    /api/auth/me                - Get current user (Protected)
├─ Requires: Bearer token
└─ Returns: Full user profile

PUT    /api/auth/update-password   - Update password (Protected)
├─ Input: { currentPassword, newPassword }
└─ Returns: { token }

POST   /api/auth/logout            - Logout (Protected)
└─ Returns: { message }
```

### 3.3 Chat & Conversation Routes

**Chat Routes:**
```javascript
POST   /api/chat/message           - Send message to AI
├─ Protected, Rate Limited (20/min)
├─ Content Moderated
├─ Input: { conversationId, message, topic }
└─ Returns: { response, conversationId, tokens }

GET    /api/chat/conversation/:id  - Get conversation messages
├─ Protected
└─ Returns: Array of messages
```

**Conversation Routes:**
```javascript
GET    /api/conversations          - List user's conversations (Protected)
├─ Returns: Array<Conversation>
└─ Sorted by lastMessageAt

POST   /api/conversations          - Create new conversation
├─ Input: { title, topic, tags }
└─ Returns: Conversation

GET    /api/conversations/search   - Search conversations (Protected)
├─ Query: { query, limit }
└─ Returns: Matching conversations

GET    /api/conversations/:conversationId/messages - Get messages
├─ Protected
└─ Returns: Array<Message>

GET    /api/conversations/:id      - Get single conversation
PUT    /api/conversations/:id      - Update conversation
DELETE /api/conversations/:id      - Delete conversation
```

### 3.4 User Routes

```javascript
GET    /api/user/profile           - Get user profile (Protected)
GET    /api/user/stats             - Get learning stats (Protected)
PUT    /api/user/preferences       - Update preferences (Protected)
GET    /api/user/reputation        - Get reputation info (Protected)
```

### 3.5 Course Management Routes

**File:** `/backend/routes/courses.js`

```javascript
GET    /api/courses                - List published courses (public) or user's courses
├─ Query: { category, level, search, myCreated }
└─ Returns: Array<Course>

GET    /api/courses/:id            - Get course with modules
└─ Returns: Course + modules + lessons

POST   /api/courses                - Create course (Protected)
├─ Input: { title, description, category, level, tags }
└─ Auto-adds creator as founder (60% revenue share)

POST   /api/courses/generate       - AI generate course (Protected)
├─ Input: { prompt, level, numModules, lessonsPerModule }
├─ Uses: AIOrchestrator
└─ Returns: Generated course structure

POST   /api/courses/generate/preview - Preview AI course
├─ Input: { prompt, level, numModules }
└─ Returns: Preview structure (not saved)

POST   /api/courses/check-similar  - Check for similar courses
├─ Input: { prompt, level }
└─ Uses: Semantic search
└─ Returns: { similarCourses, hasSimilarCourses, highSimilarity }

PUT    /api/courses/:id            - Update course (Protected, creator only)
DELETE /api/courses/:id            - Delete course (Protected, creator only)

POST   /api/courses/:id/publish    - Publish course (Protected, creator only)
├─ Validates: Meets quality standards
└─ Updates: isPublished, publishedAt

POST   /api/courses/:id/enroll     - Enroll in course (Protected)
├─ Creates: Enrollment record
├─ Updates: Course enrollment count
└─ Returns: Enrollment
```

**Module Routes:** `/api/courses/:courseId/modules`
```javascript
GET    /modules                    - Get course modules
POST   /modules                    - Create module
GET    /modules/:id                - Get module details
PUT    /modules/:id                - Update module
DELETE /modules/:id                - Delete module
```

**Lesson Routes:** `/api/courses/:courseId/modules/:moduleId/lessons`
```javascript
GET    /lessons                    - Get module lessons
POST   /lessons                    - Create lesson
GET    /lessons/:id                - Get lesson details
PUT    /lessons/:id                - Update lesson
DELETE /lessons/:id                - Delete lesson
```

### 3.6 Enrollment Routes

```javascript
GET    /api/enrollments            - Get user's enrollments (Protected)
POST   /api/enrollments            - Enroll in course
GET    /api/enrollments/:id        - Get enrollment details
PUT    /api/enrollments/:id        - Update progress
DELETE /api/enrollments/:id        - Unenroll from course
```

### 3.7 Voice Routes

**File:** `/backend/routes/voiceRoutes.js`

```javascript
POST   /api/voice/session/init     - Initialize voice session (Protected)
├─ Returns: VoiceSession + Conversation

GET    /api/voice/session/:sessionId - Get session details
PUT    /api/voice/session/:sessionId/settings - Update settings
POST   /api/voice/session/:sessionId/end - End session
PUT    /api/voice/session/:sessionId/context - Update context

POST   /api/voice/sessions         - Create new session (Protected)
├─ Optional: { lesson, enrollment, title }
└─ Creates: Session + Conversation + VoiceSession

GET    /api/voice/sessions/:sessionId - Get session details
GET    /api/voice/sessions         - Get session history

POST   /api/voice/upload-audio     - Upload audio file (Protected)
├─ Multipart: audio file (max 10MB)
├─ Input: { sessionId }
└─ Uses: VoiceOrchestrator for processing
```

### 3.8 Co-Creator Routes

**File:** `/backend/routes/coCreatorRoutes.js`

```javascript
POST   /api/courses/:courseId/co-creators/apply - Apply as co-creator
├─ Protected, requires reputation ≥ 50
├─ Input: { message, proposedContributions, requestedRevenueShare }
├─ Revenue share validated: 10-20%
└─ Creates: CoCreatorRequest

GET    /api/courses/:courseId/co-creators - List co-creator requests (Protected, founder only)

POST   /api/courses/:courseId/co-creators/:requestId/approve - Approve request
├─ Protected, founder only
├─ Updates: Revenue share calculations
└─ Adds contributor to course

POST   /api/courses/:courseId/co-creators/:requestId/reject - Reject request
├─ Protected, founder only
└─ Updates: CoCreatorRequest status
```

### 3.9 Contributor Routes

**File:** `/backend/routes/contributorRoutes.js`

```javascript
POST   /api/courses/:courseId/improvements - Suggest improvement
├─ Protected
├─ Input: { type, title, description, affectedComponent }
└─ Creates: CourseImprovement

GET    /api/courses/:courseId/improvements - List improvements
├─ Protected, founder only
└─ Returns: Array<CourseImprovement>

POST   /api/courses/:courseId/improvements/:id/approve - Approve suggestion
├─ Protected, founder only
├─ Updates: User reputation
└─ Records: Contribution

POST   /api/courses/:courseId/improvements/:id/reject - Reject suggestion
```

### 3.10 Invitation Routes

**File:** `/backend/routes/invitationRoutes.js`

```javascript
POST   /api/invitations            - Create invitation (Protected, admin)
├─ Input: { userId, role, courseId }
└─ Creates: Invitation record

GET    /api/invitations            - Get user's invitations
POST   /api/invitations/:id/accept - Accept invitation
POST   /api/invitations/:id/reject - Reject invitation
```

### 3.11 AI Routes

**File:** `/backend/routes/aiRoutes.js`

```javascript
POST   /api/ai/generate/lesson     - Generate lesson content
├─ Input: { topic, level, format }
└─ Uses: AIOrchestrator

POST   /api/ai/generate/quiz       - Generate quiz
POST   /api/ai/generate/roadmap    - Generate learning roadmap
```

### 3.12 Advanced AI Workflow Routes

**File:** `/backend/routes/aiWorkflowRoutes.js`

```javascript
POST   /api/ai/workflows/rag/multi-query - Multi-query RAG
├─ Input: { query, collectionKey, topK, numQueries }
└─ Returns: Retrieved documents + metadata

POST   /api/ai/workflows/rag/conversational - Conversational RAG
├─ Input: { query, collectionKey, conversationHistory }
└─ Returns: Response with sources

POST   /api/ai/workflows/rag/hyde - Hypothetical Document Embeddings
├─ Input: { query, collectionKey }
└─ Returns: Enhanced retrieval results

POST   /api/ai/workflows/graph/adaptive-tutor - LangGraph workflow
├─ Input: { userId, lessonId, userQuery, history }
└─ Returns: Personalized tutoring response

POST   /api/ai/workflows/state/save - Save conversation state
POST   /api/ai/workflows/state/load - Load conversation state
```

### 3.13 Admin Routes

**Cache Admin Routes:** `/api/cache`
```javascript
GET    /api/cache/stats            - Cache statistics (admin)
POST   /api/cache/clear            - Clear cache (admin)
POST   /api/cache/warmup           - Pre-warm cache (admin)
```

---

## 4. Authentication & Authorization

### 4.1 JWT-Based Authentication

**File:** `/backend/config/jwt.js`

```javascript
Configuration:
├─ Algorithm: HS256 (HMAC SHA256)
├─ Secret: JWT_SECRET (env var)
├─ Expiry: JWT_EXPIRE or 30 days
└─ Payload: { id: userId }

Functions:
├─ generateToken(userId)
│  └─ Returns: Signed JWT token
└─ verifyToken(token)
   └─ Returns: Decoded payload or throws error
```

### 4.2 Middleware: Authentication & Authorization

**File:** `/backend/middleware/authMiddleware.js`

```javascript
protect (middleware):
├─ Extracts token from Authorization header (Bearer scheme)
├─ Verifies JWT signature
├─ Looks up user in database (excluding password)
├─ Sets req.user
├─ Returns 401 if missing/invalid
└─ Returns 500 on server error

authorize(...roles) (middleware factory):
├─ Checks req.user.role against allowed roles
├─ Returns 403 if not authorized
└─ Calls next() if authorized
```

### 4.3 Course-Level Authorization

**File:** `/backend/middleware/courseAuth.js`

```javascript
isFounder:
└─ Only course creator/founder can access

isFounderOrCoCreator:
└─ Founder or approved co-creator

canEditContent:
├─ Founder/co-creator: Direct edit
└─ Contributor: Only suggest edits

canApproveCoCreators:
└─ Only founder can approve requests

canApplyAsCoCreator:
└─ Requirements: reputation ≥ 50 OR invited
└─ Cannot already be contributor

getUserContributionLevel:
└─ Returns: { type, share, status }
```

### 4.4 Authentication Flow

```
User Registration:
1. POST /api/auth/register
2. Validate input (email format, password length)
3. Check for existing user
4. Hash password with bcrypt (10 rounds)
5. Create user document
6. Generate JWT token
7. Return: { user, token }

User Login:
1. POST /api/auth/login
2. Find user by email
3. Compare password with bcrypt
4. Update user streak
5. Generate JWT token
6. Return: { user, token, learningStats }

Protected Request:
1. Client sends: Authorization: Bearer <token>
2. protect middleware:
   - Extract token
   - Verify signature
   - Decode payload
   - Fetch user from DB
   - Set req.user
3. Route handler executes

Authorization Check:
1. Route has authorize('founder', 'admin')
2. Check req.user.role
3. Return 403 if not authorized
4. Execute handler if authorized
```

---

## 5. Middleware & Request Processing

### 5.1 Middleware Stack (Order Matters)

```
1. helmet()                    - Security headers
2. cors()                      - Cross-origin requests
3. express.json()              - Parse JSON body
4. express.urlencoded()        - Parse URL-encoded body
5. morgan('dev')               - Log HTTP requests
6. rateLimiter                 - Rate limiting (global)
7. moderateContent             - Content moderation (chat routes only)
8. protect (selective)         - JWT authentication
9. Custom auth middleware      - Course-level permissions
```

### 5.2 Rate Limiting

**File:** `/backend/middleware/rateLimiter.js`

```javascript
rateLimiter (Global):
├─ Window: 15 minutes
├─ Limit: 100 requests/window
└─ Applied to all routes

authLimiter (Auth Routes):
├─ Window: 15 minutes
├─ Limit: 5 requests/window
└─ Prevents brute force

chatLimiter (Chat Routes):
├─ Window: 1 minute
├─ Limit: 20 messages/window
└─ Prevents API abuse
```

**Implementation:** express-rate-limit with RateLimit headers

### 5.3 Content Moderation

**File:** `/backend/middleware/contentModeration.js`

Sophisticated content filtering system:

```javascript
Violation Categories:
├── illegal_activity (CRITICAL)
│   ├─ Keywords: 'hack into', 'steal', 'malware', 'ddos'
│   └─ Patterns: /how to (hack|crack|steal)/i
│
├── medical_diagnosis (HIGH)
│   ├─ Keywords: 'diagnose me', 'prescription'
│   └─ Pattern-based detection
│
├── legal_advice (HIGH)
│   ├─ Keywords: 'sue', 'lawsuit', 'contract review'
│   └─ Pattern matching
│
├── financial_advice (MEDIUM)
│   ├─ Keywords: 'invest', 'buy stocks'
│   └─ Not fully refused, redirected educationally
│
├── harmful_content (CRITICAL)
│   ├─ Keywords: 'suicide', 'hurt myself'
│   ├─ Crisis resources provided
│   └─ Escalated for human review
│
├── copyright_violation (HIGH)
│   ├─ Keywords: 'transcribe entire book'
│   └─ Educational alternative offered
│
├── impersonation (MEDIUM)
│   ├─ Keywords: 'pretend to be human'
│   └─ Educational redirect
│
└── non_educational (LOW)
    ├─ Keywords: 'book flight', 'order food'
    └─ Redirected to educational context

Confidence Scoring:
├─ Keyword + Pattern match: 0.9
├─ Keyword match only: 0.7
└─ Pattern match only: 0.6

Actions:
├─ CRITICAL: Refuse request + escalate
├─ HIGH: Refuse + educational alternative
├─ MEDIUM: Warning + educational redirect
└─ LOW: Allow with warning

Database Log:
- Original prompt
- Violation type & severity
- Confidence score
- Action taken
- Timestamp & IP address
- User ID
- Repeated violation tracking
```

**Educational Refusal Messages:** Customized per violation type with learning resources

### 5.4 Error Handler Middleware

**File:** `/backend/middleware/errorHandler.js`

```javascript
Error Handling:
├─ CastError (invalid ObjectId)
│  └─ 404: "Resource not found"
│
├─ Duplicate Key (MongoDB error code 11000)
│  └─ 400: "{Field} already exists"
│
├─ ValidationError (Mongoose schema validation)
│  └─ 400: Concatenated validation messages
│
├─ JsonWebTokenError
│  └─ 401: "Invalid token"
│
├─ TokenExpiredError
│  └─ 401: "Token expired"
│
└─ Generic errors
   └─ 500: "Server Error"

Environment-specific:
├─ Development: Include stack trace
└─ Production: Omit stack trace
```

### 5.5 WebSocket (Socket.IO) Setup

**File:** `/backend/config/socket.js`

```javascript
Configuration:
├─ CORS: Dynamic origins (localhost, env FRONTEND_URL)
├─ Ping: 25s interval, 60s timeout
├─ Max buffer: 100 MB (for audio chunks)
└─ Authentication: JWT in handshake

Authentication Middleware:
├─ Extract token from: socket.handshake.auth.token or headers
├─ Verify JWT
├─ Set socket.userId and socket.userEmail
└─ Reject if invalid

Events:
├─ 'connection': Establish connection
├─ 'disconnect': Clean up resources
└─ Custom events: Audio chunks, status updates
```

---

## 6. Database Connections & Configuration

### 6.1 MongoDB Connection

**File:** `/backend/config/database.js`

```javascript
Connection:
├─ Driver: Mongoose 8.0.3 (ODM)
├─ URI: process.env.MONGODB_URI
├─ Auth: Embedded in URI
└─ No deprecated options (Mongoose 6+)

Connection Handlers:
├─ 'connect': Log success
├─ 'error': Log connection errors
├─ 'disconnected': Log disconnection
└─ SIGINT: Graceful close on shutdown

Graceful Shutdown:
└─ Close connection on SIGINT/SIGTERM
```

### 6.2 Redis Connection with Circuit Breaker

**File:** `/backend/config/redis.js`

```javascript
RedisClient Class:
├─ Singleton pattern
├─ Lazy initialization
└─ Circuit breaker pattern

Connection Settings:
├─ Host: REDIS_HOST (default: localhost)
├─ Port: REDIS_PORT (default: 6379)
├─ Password: REDIS_PASSWORD (optional)
├─ DB: REDIS_DB (default: 0)
├─ TLS: REDIS_TLS_ENABLED (optional)
├─ Max Retries: REDIS_MAX_RETRIES (default: 3)
├─ Connection Timeout: 5s
├─ Command Timeout: 3s
└─ Retry Delay: 100ms

Circuit Breaker States:
├─ CLOSED: Normal operation
├─ OPEN: Too many failures, reject requests
├─ HALF_OPEN: Testing if service recovered

State Transitions:
├─ CLOSED → OPEN: After 5 consecutive failures
├─ OPEN → HALF_OPEN: After timeout (60s)
└─ HALF_OPEN → CLOSED: First successful request

Methods:
├─ connect(): Establish connection
├─ getClient(): Get connection instance
├─ canExecute(): Check circuit state
├─ executeWithCircuitBreaker(fn, fallback): Wrapped execution
├─ disconnect(): Close connection
└─ healthCheck(): Ping Redis
```

### 6.3 Cache Configuration

**File:** `/backend/config/cache.js`

```javascript
TTL Values:
├─ Conversations: 1 hour
├─ User profile (public): 5 minutes
├─ User stats: 15 minutes
├─ Roadmaps: 24 hours
├─ Flashcards: 7 days
├─ Quizzes: 30 days
├─ Rate limit window: 15 minutes
├─ Token blacklist: 30 days
└─ Distributed locks: 10 seconds

Features:
├─ Stale-While-Revalidate (SWR) multiplier: 2x
├─ Cache versioning: v1
├─ Circuit breaker enabled
├─ Rate limiting enabled
└─ Metrics enabled

Key Namespaces (Prefixes):
├─ 'conv': Conversations
├─ 'msg': Messages
├─ 'user': User data
├─ 'roadmap': Learning roadmaps
├─ 'flashcard': Flashcards
├─ 'quiz': Quizzes
├─ 'tag': Tags
├─ 'lock': Distributed locks
├─ 'rate': Rate limiting
├─ 'metric': Metrics
└─ 'blacklist': Token blacklist
```

### 6.4 Vector Database (ChromaDB)

**File:** `/backend/config/ai.js` (vectorStore section)

```javascript
ChromaDB Connection:
├─ Host: CHROMA_HOST (localhost)
├─ Port: CHROMA_PORT (8000)
├─ Path: CHROMA_PATH (./data/chromadb)
└─ Type: HTTP/REST API

Collections:
├─ knowledge_base: General knowledge
├─ conversations: Chat history embeddings
├─ courses: Course semantic index
├─ roadmaps: Learning path embeddings
├─ flashcards: Card embeddings
└─ user_notes: User note embeddings

Search Settings:
├─ Top K: 5 (default, configurable)
├─ Similarity threshold: 0.5
└─ Index type: HNSW (Hierarchical Navigable Small World)

HNSW Parameters:
├─ M (connections per node): 16
├─ EF construct: 200
└─ EF search: 50

Embedding Model:
├─ Primary: Xenova/bge-small-en-v1.5
├─ Secondary: Xenova/gte-small
├─ Fallback: Xenova/all-MiniLM-L6-v2
└─ Dimensions: 384

Caching:
├─ Enabled by default
├─ TTL: 1 hour
└─ In-memory LRU: 1000 entries
```

---

## 7. AI & ML Architecture

### 7.1 AI Orchestrator Service

**File:** `/backend/services/aiOrchestrator.js`

Central service coordinating all AI operations:

```javascript
Responsibilities:
├─ LLM initialization (Groq)
├─ Embedding service management
├─ Vector database (ChromaDB) setup
├─ RAG chain coordination
├─ Memory system initialization
├─ MCP tool setup
└─ Model availability checking

LLM Configuration:
├─ Provider: Groq
├─ Model: llama-3.3-70b-versatile (default)
├─ Temperature: 0.7
├─ Max tokens: 2048
├─ Streaming: Enabled
└─ Timeout: 60s

Initialization Pipeline:
1. Validate environment variables
2. Initialize embeddings
3. Initialize ChromaDB
4. Initialize query classifier
5. Initialize memory managers
6. Load MCP tools
7. Start maintenance jobs

Health Checks:
├─ Environment validation
├─ Service status reporting
└─ Graceful fallbacks
```

### 7.2 Embeddings System

**File:** `/backend/ai/embeddings/embeddingService.js`

```javascript
Embedding Model: BGE-small-en-v1.5
├─ Dimensions: 384
├─ Type: Sentence transformers (local, free)
├─ Device: CPU (configurable)
├─ Batch size: 32
└─ Max wait time: 100ms

Caching Strategy:
├─ LRU cache (in-memory): 1000 entries
├─ Redis cache (optional): 24-hour TTL
├─ Hit rate tracking
└─ Fallback: Recompute on miss

Batch Processing:
├─ Accumulate requests
├─ Wait up to 100ms
├─ Process together for efficiency
└─ Reduce model initialization overhead

APIs:
├─ embed(text): Single embedding
├─ embedBatch(texts): Batch embeddings
├─ embedBatchWithContext(texts, context): Context-aware
├─ getStats(): Cache statistics
└─ clearCache(): Clear LRU cache
```

### 7.3 RAG (Retrieval Augmented Generation)

**File:** `/backend/ai/chains/ragChain.js`

```javascript
RAG Pipeline:
1. Query Processing
   ├─ Tokenization
   ├─ Normalization
   └─ Embedding

2. Retrieval
   ├─ Vector similarity search
   ├─ Top-K selection (default: 5)
   ├─ Similarity threshold filtering (0.5)
   └─ Metadata extraction

3. Context Building
   ├─ Concatenate retrieved docs
   ├─ Context window management (max 4000 chars)
   ├─ Optional compression
   └─ Preserve source information

4. Generation
   ├─ Create prompt with context
   ├─ Call LLM
   ├─ Stream response (optional)
   └─ Format output

5. Post-processing
   ├─ Source citation
   ├─ Cache response
   └─ Log analytics

Features:
├─ Multi-query retrieval (expand single query)
├─ Conversational context (leverage history)
├─ Reranking (optional)
├─ Response compression
├─ Chain-of-thought reasoning
└─ Citation tracking
```

### 7.4 LangGraph Workflow

**File:** `/backend/ai/graphs/adaptiveTutorGraph.js`

State machine for tutoring:

```javascript
States:
├─ INTAKE: Assess student knowledge
├─ PLAN: Plan learning path
├─ TEACH: Deliver content
├─ ASSESS: Evaluate understanding
├─ ADAPT: Adjust difficulty
└─ FEEDBACK: Provide feedback

Transitions:
├─ INTAKE → PLAN (after baseline assessment)
├─ PLAN → TEACH (with ordered modules)
├─ TEACH → ASSESS (periodic checkpoints)
├─ ASSESS → ADAPT (based on performance)
├─ ADAPT → TEACH (with adjusted content)
└─ ASSESS → FEEDBACK (end of session)

Node Actions:
├─ intake_node: Extract learning style, prior knowledge
├─ plan_node: Generate personalized path
├─ teach_node: Deliver lesson with examples
├─ assess_node: Evaluate with questions/tasks
├─ adapt_node: Adjust complexity/pacing
└─ feedback_node: Generate summary & suggestions

Memory Management:
├─ Conversation buffer: Last 10 messages
├─ Summary memory: Condensed history
├─ Vector memory: Semantic relevance
└─ Persistence: MongoDB + Redis
```

### 7.5 Query Classifier

Determines query intent to route appropriately:

```javascript
Classification:
├─ Knowledge search
├─ Tutoring request
├─ Assessment
├─ Social interaction
├─ Meta-question (about tutor)
├─ Clarification
├─ Off-topic
└─ Error

Pattern-based Classifier:
├─ Regex patterns for intent
├─ Keyword matching
├─ Confidence scoring
└─ Fallback to semantic

Semantic Classifier:
├─ Intent embeddings (async init)
├─ Similarity-based matching
├─ Higher confidence than patterns
└─ Learned from conversation history
```

### 7.6 AI Config

**File:** `/backend/config/ai.js` (comprehensive)

```javascript
Sections:
├─ LLM (Groq configuration)
├─ Embeddings (BGE-small, Xenova models)
├─ Vector Store (ChromaDB)
├─ RAG (Retrieval settings)
├─ LangGraph (Workflow execution)
├─ MCP (Model Context Protocol)
├─ Memory (Conversation & semantic)
├─ Security (Rate limiting, input validation)
├─ Optimization (Caching, compression)
├─ Monitoring (Metrics, analytics)
└─ Feature Flags (Enable/disable features)

Environment Variables:
├─ GROQ_API_KEY
├─ EMBEDDING_MODEL
├─ CHROMA_HOST/PORT
├─ LLM_TEMPERATURE
├─ RAG_TOP_K
├─ MEMORY_BUFFER_SIZE
├─ Security thresholds
└─ Feature flags
```

---

## 8. Specialized Services

### 8.1 Course Generator Service

**File:** `/backend/services/courseGenerator.js`

AI-powered course creation:

```javascript
Functions:
├─ generateCourse(prompt, userId, options)
│  ├─ Input: Learning topic, user ID, preferences
│  ├─ Generates: Course structure with modules/lessons
│  ├─ Saves to database
│  └─ Returns: Course document
│
├─ generatePreview(prompt, level, numModules)
│  ├─ Input: Topic, difficulty level, module count
│  ├─ Generates: Structure without saving
│  └─ Returns: Preview structure
│
└─ findSimilarCourses(prompt, level)
   ├─ Semantic search for existing courses
   ├─ Similarity scoring
   └─ Returns: Ranked similar courses

Generation Pipeline:
1. Parse input & validate
2. Generate course outline (title, description)
3. Generate modules (ordered, with objectives)
4. Generate lessons per module
5. Calculate embeddings
6. Check for duplicates
7. Save to database
8. Sync to ChromaDB
9. Return course reference
```

### 8.2 Course Recommendation Service

**File:** `/backend/services/courseRecommendationService.js`

Personalized recommendations:

```javascript
Factors:
├─ Learning history
├─ Current progress
├─ Skill gaps
├─ Learning style
├─ Time commitment
├─ Difficulty progression
└─ Relevance to goals

Algorithms:
├─ Content-based: Similar to completed courses
├─ Collaborative filtering: What similar users took
├─ Semantic similarity: Vector search
└─ Trending: Popular in category

Recommendation Types:
├─ "Continue Learning": Next logical course
├─ "Recommended For You": Personalized
├─ "Trending Now": Popular courses
├─ "Skill Building": Target skill development
└─ "Explore": Breadth expansion
```

### 8.3 Voice Orchestrator

**File:** `/backend/services/voiceOrchestrator.js`

Voice interaction pipeline:

```javascript
Processing Steps:
1. Audio Reception
   ├─ WebSocket or file upload
   ├─ Format: WAV, MP3, etc.
   └─ Max size: 10 MB

2. Speech-to-Text (STT)
   ├─ Service: OpenAI Whisper or similar
   ├─ Language detection
   └─ Confidence scoring

3. Text Processing
   ├─ Normalization
   ├─ Intent extraction
   └─ Entity recognition

4. AI Response Generation
   ├─ Use RAG + LLM
   ├─ Context from lesson
   └─ Adaptive difficulty

5. Text-to-Speech (TTS)
   ├─ Service: Google Cloud TTS or similar
   ├─ Natural voice selection
   └─ Streaming delivery

6. Audio Response
   ├─ Stream back to client
   ├─ Synchronization
   └─ Storage (optional)

Real-time Features:
├─ Streaming audio input
├─ Progressive response
├─ Interruption handling
└─ Session context preservation
```

### 8.4 STT Service

**File:** `/backend/services/sttService.js`

Speech-to-text conversion:

```javascript
Supported Providers:
├─ OpenAI Whisper
├─ Google Cloud Speech-to-Text
└─ Azure Speech Services

Features:
├─ Multi-language support
├─ Confidence scoring
├─ Profanity filtering
├─ Punctuation restoration
└─ Caching
```

### 8.5 Quiz Service

**File:** `/backend/services/quizService.js`

Quiz generation and evaluation:

```javascript
Functions:
├─ generateQuiz(lessonId, numQuestions)
│  ├─ Generate MCQ, true/false, short answer
│  └─ Return quiz with answer key
│
├─ evaluateAnswer(questionId, answer)
│  ├─ Check correctness
│  ├─ Provide feedback
│  └─ Update scores
│
└─ generateAdaptiveQuiz(userId, difficulty)
   ├─ Adjust based on performance
   └─ Dynamic difficulty progression

Question Types:
├─ Multiple choice
├─ True/false
├─ Short answer (with keyword matching)
├─ Matching
└─ Fill-in-the-blank
```

### 8.6 Roadmap Service

**File:** `/backend/services/roadmapService.js`

Learning roadmap generation:

```javascript
Inputs:
├─ User skill level
├─ Learning goal
├─ Time availability
├─ Preferred learning style
└─ Prior knowledge

Generates:
├─ Ordered learning path
├─ Milestone checkpoints
├─ Estimated duration
├─ Resource recommendations
└─ Progress tracking milestones

Adaptation:
├─ Adjust based on progress
├─ Skip completed sections
├─ Accelerate high performers
└─ Slow down as needed
```

### 8.7 Memory Management System

**File:** `/backend/ai/memory/industryMemoryManager.js`

Advanced semantic memory:

```javascript
Features:
├─ Automatic memory extraction
├─ Semantic consolidation
├─ Memory decay over time
├─ Importance weighting
├─ Related memory linking
└─ Contradiction detection

Memory Types:
├─ Facts: Factual information
├─ Preferences: User preferences
├─ Experience: Past interactions
├─ Skills: Learned abilities
├─ Goals: User objectives
├─ Relationships: Entity relationships
└─ Events: Important events

Maintenance Jobs:
├─ Consolidation: Merge related memories
├─ Decay: Reduce importance over time
├─ Cleanup: Archive old, low-value memories
├─ Verification: Check for contradictions
└─ Linking: Find related memories
```

---

## 9. API Design Patterns & Conventions

### 9.1 RESTful API Structure

```javascript
Standard Patterns:
├─ GET /resource              - List all
├─ GET /resource/:id          - Get single
├─ POST /resource             - Create new
├─ PUT /resource/:id          - Update
├─ DELETE /resource/:id       - Delete

Nested Resources:
├─ GET /courses/:courseId/modules
├─ POST /courses/:courseId/modules/:moduleId/lessons
└─ PUT /courses/:courseId/modules/:id

Actions (Non-standard):
├─ POST /courses/:id/publish  - State change
├─ POST /courses/:id/enroll   - Action
└─ POST /ai/generate/lesson   - Operation
```

### 9.2 Response Format

All responses follow consistent structure:

```javascript
Success Response (2xx):
{
  "success": true,
  "data": { /* resource(s) */ },
  "message": "Optional message",
  "pagination": {               // If applicable
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}

Error Response (4xx/5xx):
{
  "success": false,
  "message": "Error description",
  "error": "Error message",
  "code": "ERROR_CODE",       // Optional
  "details": { /* additional */ },
  "stack": "..." // Dev only
}

Pagination:
GET /api/courses?page=1&limit=20
├─ Default limit: 20
├─ Max limit: 100
└─ Returned in response metadata
```

### 9.3 Authentication Headers

```javascript
Authorization: Bearer <token>

Token Format:
├─ Type: JWT (JSON Web Token)
├─ Algorithm: HS256
├─ Payload: { id: userId }
└─ Expiry: 30 days (configurable)

Error Responses:
├─ 401: Missing/invalid token
├─ 403: Token valid but insufficient permissions
└─ 500: Server error during auth
```

### 9.4 Query Parameters

Supported across multiple endpoints:

```javascript
Pagination:
├─ page=N (default: 1)
├─ limit=N (default: 20, max: 100)
└─ sort=field,-field (ascending/descending)

Filtering:
├─ category=value
├─ level=value
├─ status=value
└─ Custom per endpoint

Search:
├─ search=query
├─ q=query
└─ Semantic search with embeddings
```

### 9.5 Status Codes

```javascript
Success:
├─ 200: OK (GET, PUT)
├─ 201: Created (POST)
└─ 204: No Content (DELETE)

Client Errors:
├─ 400: Bad Request (invalid input)
├─ 401: Unauthorized (missing/invalid auth)
├─ 403: Forbidden (insufficient permissions)
├─ 404: Not Found
├─ 409: Conflict (duplicate, constraint violation)
└─ 429: Too Many Requests (rate limited)

Server Errors:
├─ 500: Internal Server Error
├─ 503: Service Unavailable
└─ 504: Gateway Timeout
```

### 9.6 Error Handling Strategy

```javascript
Validation Errors:
├─ 400: Bad Request
├─ Messages: Detailed validation error per field
└─ Example: "Invalid email format"

Database Errors:
├─ Duplicate key → 400: "{Field} already exists"
├─ Validation failure → 400: Validation messages
└─ Cast error → 404: "Resource not found"

Auth Errors:
├─ 401: Unauthorized (missing token)
├─ 401: Invalid/expired token
└─ 403: Forbidden (role/permission issue)

Rate Limit Errors:
├─ 429: Too many requests
├─ Include: Retry-After header
└─ Message: Time to retry
```

### 9.7 Naming Conventions

```javascript
Routes:
├─ Lowercase with hyphens: /api/voice-sessions
├─ Noun-based: /courses, /enrollments (not /getCourses)
└─ Hierarchy: /courses/:courseId/modules/:moduleId/lessons

Query Parameters:
├─ Lowercase camelCase: ?sortBy=createdAt
├─ Boolean flags: ?isPublished=true
└─ Semantic: ?search=term

Response Fields:
├─ camelCase: firstName, createdAt, isPublished
├─ Consistent: Always _id (MongoDB), never id
└─ Nested: { user: { name, email } }

Database Fields:
├─ camelCase in schema: firstName, createdAt
├─ Index on: Frequently queried fields
└─ Timestamps: createdAt, updatedAt (automatic)
```

---

## 10. Advanced Features

### 10.1 Multi-Tier Revenue Sharing

**In Course Model:**

```javascript
Contributor Types:
├─ Founder: 50-60% (base)
├─ Co-creator: 10-20% (contribution-based)
├─ Content Improver: 2-5% (implementations)
└─ Reviewer: 1-3% (reviews)

Revenue Calculation:
1. Base founder revenue: 60%
2. For each co-creator added: -2% founder
3. Co-creator share: Based on content contribution
4. Min founder: 50%

Distribution:
├─ Input: Total revenue
├─ Calculate: Per-user allocation
├─ Normalize: Ensure total ≤ 100%
└─ Return: Array of { userId, amount, share }

Approval Workflow:
├─ Request pending (await founder review)
├─ Approved (added as contributor, revenue share active)
└─ Rejected (invitation declined)
```

### 10.2 Reputation & Badges System

**In User Model:**

```javascript
Reputation Score:
├─ Base: 0
├─ +5: Error report
├─ +10: Suggestion submitted
├─ +50: Suggestion implemented
├─ +2: Forum participation
└─ Max tracked per activity

Badges (Automatic):
├─ Founder: Created 1+ course
├─ Co-creator: Co-created 3+ courses
├─ Prolific: Created/co-created 10+ total
├─ Helpful: 10+ implementations
├─ Quality: 4.5+ avg course rating
└─ Expert: 500+ reputation score

Display:
├─ User profile: Show badges
├─ Course card: Show creator badges
├─ Rankings: Filter by badge type
└─ Trust indicator: Higher reputation = more visible
```

### 10.3 Semantic Search Integration

Uses ChromaDB for intelligent course discovery:

```javascript
Indexing:
├─ Course title + description → Embedding
├─ Stored in ChromaDB 'courses' collection
├─ Updated on publish/update via mongoose hooks
└─ 384-dimensional vectors (BGE-small)

Searching:
1. User enters: "Python for beginners"
2. Embed query
3. ChromaDB similarity search
4. Get top 5 similar courses
5. Rank by enrollment, rating
6. Return enriched results

Similarity Matching:
├─ Exact keyword match: Boost relevance
├─ Semantic meaning: Catch intent
├─ Related topics: Broaden results
└─ Prevent duplicates: Flag very similar courses

Duplicate Detection:
├─ Similarity threshold: 85%
├─ Check on course generation
├─ Warn user of existing courses
└─ Suggest enhancement instead
```

### 10.4 Content Moderation System

Educational-focused, not censorious:

```javascript
Violation Types:
├─ Illegal activity: Refuse + educational redirect
├─ Medical advice: Refuse + learn alternatives
├─ Legal advice: Refuse + educational path
├─ Financial advice: Redirect + learn alternatives
├─ Harmful content: Crisis resources + escalate
├─ Copyright: Refuse + suggest alternatives
├─ Impersonation: Refuse + explain AI nature
└─ Non-educational: Redirect to learning context

Logging:
├─ Store all violations
├─ Track per-user patterns
├─ Flag repeated offenders
├─ Escalate critical cases for human review
└─ Analytics on violation types

Educational Framing:
├─ "I can't help with that, BUT I can teach you..."
├─ Examples: Cybersecurity basics, legal fundamentals
├─ Links to legitimate resources
└─ Encourages learning, not punishment
```

---

## 11. File Organization & Project Structure

```
/backend
├── server.js                          # Entry point
├── package.json                       # Dependencies
│
├── /config                            # Configuration
│   ├── database.js                   # MongoDB setup
│   ├── redis.js                      # Redis with circuit breaker
│   ├── cache.js                      # Cache TTL & prefixes
│   ├── jwt.js                        # Token generation/verification
│   ├── socket.js                     # Socket.IO setup
│   ├── ai.js                         # Comprehensive AI config
│   ├── aiService.js                  # Groq client management
│   ├── logger.js                     # Winston logging
│   ├── envValidator.js               # Environment validation
│   ├── initializeCache.js            # Cache initialization
│   └── socketIOProd.js               # Production Socket.IO
│
├── /models                            # Database schemas (18 models)
│   ├── User.js                       # User with reputation
│   ├── Course.js                     # Course with contributors
│   ├── Module.js                     # Course modules
│   ├── Lesson.js                     # Lesson content
│   ├── Enrollment.js                 # Course enrollment
│   ├── Conversation.js               # Chat conversations
│   ├── Message.js                    # Chat messages
│   ├── MemoryEntry.js                # Semantic memory
│   ├── VoiceSession.js               # Voice interactions
│   ├── Session.js                    # Learning sessions
│   ├── Quiz.js                       # Quiz definitions
│   ├── QuizAttempt.js                # Quiz responses
│   ├── Flashcard.js                  # Flashcard decks
│   ├── LearningRoadmap.js            # Learning paths
│   ├── CourseImprovement.js          # Improvement suggestions
│   ├── CoCreatorRequest.js           # Co-creator applications
│   ├── ModerationLog.js              # Content moderation audit
│   └── UserProfile.js                # Extended user profile
│
├── /routes                            # API route handlers (17 files)
│   ├── authRoutes.js                 # /api/auth
│   ├── userRoutes.js                 # /api/user
│   ├── chatRoutes.js                 # /api/chat
│   ├── conversationRoutes.js         # /api/conversations
│   ├── courses.js                    # /api/courses
│   ├── modules.js                    # /api/modules
│   ├── lessons.js                    # /api/lessons
│   ├── enrollments.js                # /api/enrollments
│   ├── voiceRoutes.js                # /api/voice
│   ├── roadmapRoutes.js              # /api/roadmaps
│   ├── studyMaterialRoutes.js        # /api/study
│   ├── aiRoutes.js                   # /api/ai
│   ├── aiWorkflowRoutes.js           # /api/ai/workflows
│   ├── coCreatorRoutes.js            # /api/co-creators
│   ├── contributorRoutes.js          # /api/contributors
│   ├── invitationRoutes.js           # /api/invitations
│   └── cacheAdminRoutes.js           # /api/cache
│
├── /controllers                       # Request handlers (9 files)
│   ├── authController.js
│   ├── userController.js
│   ├── chatController.js
│   ├── conversationController.js
│   ├── voiceSessionController.js
│   ├── roadmapController.js
│   ├── studyMaterialController.js
│   ├── aiController.js
│   └── aiStreamController.js
│
├── /middleware                        # Express middleware
│   ├── authMiddleware.js             # JWT auth & authorization
│   ├── courseAuth.js                 # Course-level permissions
│   ├── errorHandler.js               # Error handling
│   ├── rateLimiter.js                # Rate limiting
│   ├── contentModeration.js          # Content filtering
│   ├── cacheMiddleware.js            # Cache management
│   ├── cacheRateLimiter.js          # Cache-based rate limiting
│   └── securityProd.js               # Production security
│
├── /services                          # Business logic (10+ services)
│   ├── aiOrchestrator.js             # AI pipeline coordinator
│   ├── courseGenerator.js            # AI course generation
│   ├── courseRecommendationService.js # Personalized recommendations
│   ├── voiceOrchestrator.js          # Voice interaction pipeline
│   ├── voiceOrchestratorProd.js      # Production voice setup
│   ├── sttService.js                 # Speech-to-text
│   ├── quizService.js                # Quiz logic
│   ├── roadmapService.js             # Learning roadmaps
│   ├── audioStorage.js               # Audio file management
│   └── contributorInvitationService.js # Invitation system
│
├── /ai                                # Advanced AI (sophisticated architecture)
│   ├── /prompts                      # Prompt templates
│   │   └── tutorPrompts.js
│   ├── /chains                       # LangChain chains
│   │   ├── ragChain.js               # RAG implementation
│   │   └── advancedRagChain.js       # Multi-query, conversational
│   ├── /graphs                       # LangGraph workflows
│   │   └── adaptiveTutorGraph.js     # State machine for tutoring
│   ├── /memory                       # Memory management
│   │   ├── industryMemoryManager.js  # Long-term semantic memory
│   │   ├── conversationManager.js    # Session memory
│   │   └── memoryJobs.js             # Background jobs
│   ├── /embeddings                   # Embedding models
│   │   ├── embeddingService.js       # BGE-small model wrapper
│   │   └── /models                   # Model configs
│   ├── /vectorstore                  # Vector database
│   │   ├── chromaService.js          # ChromaDB client
│   │   ├── courseSyncService.js      # Course indexing
│   │   └── ingestion.js              # Data loading
│   ├── /classifiers                  # Intent/query classification
│   │   ├── queryClassifier.js        # Pattern-based
│   │   └── semanticQueryClassifier.js # Embedding-based
│   ├── /security                     # Security measures
│   │   └── sanitizer.js              # Input/output sanitization
│   ├── /thinking                     # Reasoning generation
│   │   └── thinkingGenerator.js      # Chain-of-thought
│   ├── /handlers                     # AI request handlers
│   │   └── mcpHandler.js             # MCP tool handling
│   ├── /mcp                          # Model Context Protocol
│   │   ├── setupMCPTools.js          # Tool registration
│   │   ├── /servers                  # MCP servers
│   │   ├── /tools                    # Tool implementations
│   │   ├── /core                     # Core MCP logic
│   │   └── /schemas                  # Tool schemas
│   ├── /agents                       # Agentic workflows
│   ├── /config                       # AI-specific config
│   └── /state                        # State management
│
├── /utils                             # Utilities
│   ├── logger.js
│   ├── errorHandler.js
│   └── validators.js
│
├── /queues                            # Job queues
│   └── index.js                       # BullMQ setup
│
├── /socketHandlers                    # WebSocket handlers
│   └── voiceHandlers.js               # Voice event handling
│
└── /docs                              # Documentation
```

---

## 12. Summary of Key Architectural Decisions

| Aspect | Technology | Rationale |
|--------|-----------|-----------|
| **Framework** | Express.js | Lightweight, widely used, excellent middleware |
| **Database** | MongoDB + Mongoose | Flexible schema, semantic memory storage |
| **ORM/ODM** | Mongoose 8.0 | Automatic timestamps, validation, hooks |
| **Caching** | Redis with circuit breaker | High performance, graceful degradation |
| **Real-time** | Socket.IO | WebSocket fallbacks, easy event handling |
| **Auth** | JWT + bcrypt | Stateless, secure, scalable |
| **LLM** | Groq API (free) | Fast inference, good models, free tier |
| **Embeddings** | BGE-small (local) | Free, 384-dim, high quality, no API calls |
| **Vector DB** | ChromaDB | Local/cloud option, easy to use, semantic search |
| **AI Chains** | LangChain | Standardized patterns, LCEL, ecosystem |
| **Workflows** | LangGraph | State machines, complex reasoning |
| **MCP** | Model Context Protocol | Tool-use standardization, extensibility |
| **Validation** | Zod (schemas) | Runtime validation, TypeScript-like DX |
| **Rate Limiting** | express-rate-limit | Simple, distributed support |
| **Security Headers** | Helmet.js | Best practices for HTTP headers |
| **Logging** | Winston | Structured logging, multiple transports |
| **Job Queues** | BullMQ | Background processing, Redis-backed |

---

## 13. Performance Considerations

- **Circuit breaker pattern** prevents cascading Redis failures
- **LRU embedding cache** reduces model inference
- **Stale-while-revalidate** for eventual consistency
- **Batch embedding processing** for efficiency
- **ChromaDB HNSW index** for fast semantic search
- **Database indexes** on frequently queried fields
- **Connection pooling** via Mongoose/ioredis
- **Rate limiting** prevents API abuse and cost overruns
- **Streaming responses** for large content
- **Compression** for API responses (via middleware)

---

## 14. Security Measures

- **Bcrypt password hashing** with 10 rounds
- **JWT token expiration** (30 days)
- **CORS** with configurable origins
- **Rate limiting** tiered by endpoint
- **Content moderation** with keyword/pattern detection
- **Input sanitization** for HTML content
- **HTTPS/TLS** support in production
- **CircuitBreaker** for resilience
- **Access control** at route and resource level
- **Audit trails** for sensitive operations (moderation, contributions)

---

## Conclusion

The Mini AI Tutor backend demonstrates professional-grade architecture with:
- Clear separation of concerns
- Scalable service-oriented design
- Comprehensive error handling
- Advanced AI capabilities
- Enterprise caching strategies
- User-centric education design
- Flexible revenue-sharing system
- Long-term semantic memory
- Real-time capabilities

Total scope: ~3500+ lines of model code, 121+ endpoints, 10+ specialized services, sophisticated AI pipeline.
