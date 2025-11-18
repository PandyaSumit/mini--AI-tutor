# Backend Quick Reference Guide

## Essential Files & Locations

### Core Server
- **Entry Point:** `/backend/server.js` (269 lines)
- **Main Config:** `/backend/config/` (database, redis, cache, AI, JWT, socket, etc.)
- **Dependencies:** `/backend/package.json`

### Database & ORM
- **Connection:** `/backend/config/database.js` (MongoDB + Mongoose)
- **Models:** `/backend/models/` (18 collections)
  - Key: User.js (361 lines), Course.js (450 lines), MemoryEntry.js (338 lines)
  
### API Routes (121+ endpoints)
- **Auth:** `/backend/routes/authRoutes.js` (5 endpoints)
- **Chat:** `/backend/routes/chatRoutes.js` (2 endpoints)
- **Courses:** `/backend/routes/courses.js` (10 endpoints)
- **Voice:** `/backend/routes/voiceRoutes.js` (8 endpoints)
- **AI:** `/backend/routes/aiRoutes.js` + `/backend/routes/aiWorkflowRoutes.js`
- **Co-creator:** `/backend/routes/coCreatorRoutes.js`
- **Contributors:** `/backend/routes/contributorRoutes.js`

### Controllers (9 files)
- Handle request logic, separate from routes
- Located in `/backend/controllers/`

### Middleware
- **Auth:** `/backend/middleware/authMiddleware.js` (JWT, roles)
- **Course Auth:** `/backend/middleware/courseAuth.js` (Founder, co-creator, contributor)
- **Rate Limiting:** `/backend/middleware/rateLimiter.js` (Global, auth, chat)
- **Content Moderation:** `/backend/middleware/contentModeration.js` (8 violation types)
- **Error Handler:** `/backend/middleware/errorHandler.js`

### Services (10+ specialized services)
- **AI Orchestrator:** `/backend/services/aiOrchestrator.js` (Main AI coordinator)
- **Course Generator:** `/backend/services/courseGenerator.js` (AI course creation)
- **Voice Orchestrator:** `/backend/services/voiceOrchestrator.js` (Voice pipeline)
- **Other:** Quiz, Roadmap, STT, Course Recommendation, Audio Storage, Contributor Invitations

### Advanced AI (`/backend/ai/`)
- **Embeddings:** `embeddings/embeddingService.js` (BGE-small, 384-dim)
- **Vector Store:** `vectorstore/chromaService.js` (ChromaDB)
- **RAG Chains:** `chains/ragChain.js` + `chains/advancedRagChain.js`
- **LangGraph:** `graphs/adaptiveTutorGraph.js` (State machine tutoring)
- **Memory:** `memory/industryMemoryManager.js` (Semantic consolidation)
- **Classifiers:** `classifiers/queryClassifier.js` (Intent detection)
- **MCP:** `mcp/` (Model Context Protocol for tools)

---

## Database Schema Quick Summary

### User (8 main sections)
- Basic: name, email, password (bcrypt), avatar, role
- Learning Stats: conversations, messages, time, streak
- Reputation: score, badges (founder, expert, prolific, quality, helpful)
- Subscription: tier (free/pro/enterprise)
- Contributor Activity: tracking quality & invitations

### Course (7 main sections)
- Basic: title, description, category, level, tags
- Creator & Contributors: founder (60%), co-creator (10-20%), improver (2-5%)
- Semantic: 384-dim embeddings, specialization type
- Quality & Publishing: quality score, draft/published status
- Statistics: modules, lessons, enrollments, completions
- Revenue Sharing: dynamic allocation based on contributions

### Conversation
- user (indexed), title, topic, tags
- metadata: model, tokens, isVoiceSession, language
- Virtual: messages (auto-populated)

### MemoryEntry (Advanced)
- Content + type (fact/preference/experience/skill/goal)
- Temporal: created, updated, lastAccessed, expires (TTL)
- Importance: score (0-1) with decay factors
- Source: conversationId, extraction method, confidence
- Semantic: embedding ID (ChromaDB), keywords, related memories
- Versioning: current + history
- Privacy: level, consent, retention policy
- Audit: trail of all actions

### Module & Lesson
- Hierarchical: Course → Module → Lessons (ordered)
- Lesson: content, type (text/video/voice/quiz/interactive), duration
- AI Instructions: systemPrompt, teachingStyle, contextGuidelines

### Enrollment
- user + course (unique constraint)
- progress: completedLessons, currentLesson, completionPercentage
- Tracks: enrolledAt, completedAt, lastAccessedAt

---

## API Endpoint Categories

### Authentication (5)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/update-password
POST   /api/auth/logout
```

### Courses (10+)
```
GET    /api/courses                          - List with filters
POST   /api/courses                          - Create
GET    /api/courses/:id                      - Get with modules
PUT    /api/courses/:id                      - Update
DELETE /api/courses/:id                      - Delete
POST   /api/courses/generate                 - AI generate
POST   /api/courses/generate/preview         - Preview
POST   /api/courses/check-similar            - Find duplicates
POST   /api/courses/:id/publish              - Publish
POST   /api/courses/:id/enroll               - Enroll
```

### Chat (2)
```
POST   /api/chat/message                     - Send message to AI
GET    /api/chat/conversation/:id            - Get messages
```

### Conversations (7)
```
GET    /api/conversations                    - List
POST   /api/conversations                    - Create
GET    /api/conversations/:id                - Get
PUT    /api/conversations/:id                - Update
DELETE /api/conversations/:id                - Delete
GET    /api/conversations/:id/messages       - Get messages
GET    /api/conversations/search             - Search
```

### Voice (8)
```
POST   /api/voice/session/init               - Initialize
GET    /api/voice/session/:id                - Get details
PUT    /api/voice/session/:id/settings       - Update settings
POST   /api/voice/session/:id/end            - End session
POST   /api/voice/sessions                   - Create
GET    /api/voice/sessions/:id               - Get session
GET    /api/voice/sessions                   - History
POST   /api/voice/upload-audio               - Upload audio
```

### AI (Advanced)
```
POST   /api/ai/generate/lesson               - Generate content
POST   /api/ai/generate/quiz                 - Generate quiz
POST   /api/ai/workflows/rag/multi-query     - Multi-query RAG
POST   /api/ai/workflows/rag/conversational  - Conversational RAG
POST   /api/ai/workflows/graph/adaptive-tutor - LangGraph workflow
```

### Co-Creators
```
POST   /api/courses/:courseId/co-creators/apply           - Apply
GET    /api/courses/:courseId/co-creators                 - List requests
POST   /api/courses/:courseId/co-creators/:id/approve     - Approve
POST   /api/courses/:courseId/co-creators/:id/reject      - Reject
```

### Contributors
```
POST   /api/courses/:courseId/improvements                - Suggest
GET    /api/courses/:courseId/improvements                - List
POST   /api/courses/:courseId/improvements/:id/approve    - Approve
POST   /api/courses/:courseId/improvements/:id/reject     - Reject
```

---

## Authentication & Authorization

### JWT Token
- **Algorithm:** HS256
- **Secret:** JWT_SECRET (env var)
- **Expiry:** 30 days (configurable)
- **Payload:** { id: userId }

### Role-Based Access
- **Global Roles:** user, admin
- **Course Roles:** founder, co-creator, contributor, student

### Middleware
```javascript
// Protected route
router.get('/me', protect, handler)

// Role-based authorization
router.post('/admin', protect, authorize('admin'), handler)

// Course-level
router.put('/:courseId/modules', protect, isFounderOrCoCreator, handler)
```

---

## Rate Limiting

```
Global:     100 requests / 15 minutes
Auth:       5 attempts / 15 minutes (register, login)
Chat:       20 messages / 1 minute
```

---

## Content Moderation Rules

8 violation categories with severity levels:

| Category | Severity | Action |
|----------|----------|--------|
| illegal_activity | CRITICAL | Refuse + escalate |
| harmful_content | CRITICAL | Refuse + crisis resources |
| medical_diagnosis | HIGH | Refuse + educational redirect |
| legal_advice | HIGH | Refuse + educational redirect |
| copyright_violation | HIGH | Refuse + alternatives |
| financial_advice | MEDIUM | Warning + redirect |
| impersonation | MEDIUM | Warning + redirect |
| non_educational | LOW | Allow with redirect |

**All violations are logged** for analytics and user pattern tracking.

---

## Cache Configuration

```javascript
TTL Values:
- Conversations: 1 hour
- User profile: 5 minutes
- User stats: 15 minutes
- Roadmaps: 24 hours
- Flashcards: 7 days
- Quizzes: 30 days

Strategy:
- Circuit breaker enabled (5 failures → OPEN state)
- Stale-while-revalidate: 2x TTL
- Key prefixes: conv, user, roadmap, flashcard, quiz, etc.
- Metrics: Hit rate, misses, size
```

---

## AI & ML Stack

### LLM
- **Provider:** Groq (free tier)
- **Model:** llama-3.3-70b-versatile
- **Temperature:** 0.7
- **Max tokens:** 2048
- **Streaming:** Enabled
- **Timeout:** 60s

### Embeddings
- **Model:** Xenova/bge-small-en-v1.5
- **Dimensions:** 384
- **Type:** Local, free (no API calls)
- **Batch size:** 32
- **Cache:** LRU (1000) + Redis (24hr)

### Vector Database
- **System:** ChromaDB
- **Index:** HNSW
- **Collections:** knowledge, conversations, courses, roadmaps, flashcards, notes
- **Search:** Top-K (5), threshold (0.5)

### RAG Pipeline
1. Query embedding
2. Vector similarity search
3. Context building (max 4000 chars)
4. LLM generation with context
5. Response with citations

### LangGraph Workflows
- **Adaptive Tutor:** INTAKE → PLAN → TEACH → ASSESS → ADAPT → FEEDBACK

---

## Memory System (Advanced)

**Semantic Memory with Decay:**
- Automatic extraction from conversations
- Importance scoring (0-1)
- Decay over time (~10% per day)
- Categories: personal, work, education, hobby, health
- Types: fact, preference, experience, skill, goal, relationship, event
- Privacy levels: public, private, sensitive, confidential
- Audit trail for all operations
- Consolidation jobs: daily background maintenance

---

## Revenue Sharing Model

| Role | Base | Max | Calculation |
|------|------|-----|-------------|
| Founder | 60% | 50-60% | Reduced by 2% per co-creator |
| Co-creator | 10-20% | 20% | Based on content contribution |
| Content Improver | 2-5% | 5% | Per implemented suggestion |
| Reviewer | 1-3% | 3% | Per review contribution |

**Total:** Always normalized to ≤ 100%

---

## Key Dependencies

```json
{
  "express": "4.18.2",
  "mongoose": "8.0.3",
  "socket.io": "4.7.2",
  "ioredis": "5.8.2",
  
  "AI": {
    "@langchain/groq": "0.1.0",
    "@langchain/langgraph": "0.2.19",
    "chromadb": "1.9.0"
  },
  
  "Security": {
    "bcryptjs": "2.4.3",
    "jsonwebtoken": "9.0.2",
    "helmet": "7.1.0",
    "express-rate-limit": "7.1.5"
  },
  
  "Utilities": {
    "multer": "1.4.5-lts.1",
    "zod": "3.22.4",
    "winston": "3.11.0"
  }
}
```

---

## Environment Variables

**Critical:**
```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Optional:**
```
CHROMA_HOST=localhost
CHROMA_PORT=8000
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

---

## Running the Server

```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production
npm start

# Run tests
npm test
npm run test:integration

# Linting
npm run lint
npm run lint:fix

# Docker
npm run docker:build
npm run docker:up
npm run docker:logs
```

---

## Common Patterns

### Protected Route
```javascript
router.get('/me', protect, controller)
// Requires: Authorization: Bearer <token>
```

### Course Access Control
```javascript
router.put('/:courseId', protect, isFounderOrCoCreator, controller)
// User must be founder or approved co-creator
```

### Content Moderation
```javascript
router.post('/message', protect, chatLimiter, moderateContent, controller)
// Checks for violations before processing
```

### Error Handling
```javascript
try {
  // operation
} catch (error) {
  return res.status(400).json({
    success: false,
    message: error.message,
    code: 'ERROR_CODE'
  })
}
// All errors caught by errorHandler middleware
```

---

## Useful Queries & Operations

### Find user courses (created)
```javascript
Course.find({ createdBy: userId, isPublished: true })
```

### Get user enrollments
```javascript
Enrollment.findByUser(userId, 'active')
```

### Search semantically
```javascript
chromaService.search('python for beginners', { topK: 5 })
```

### Get user memory
```javascript
MemoryEntry.findByNamespace(userId, 'education')
```

### Check reputation
```javascript
user.reputation.score >= 50 ? "Can create course" : "Need more reputation"
```

---

## File Size Summary

| Component | Files | Total Lines |
|-----------|-------|-------------|
| Models | 18 | ~3,500 |
| Routes | 17 | ~1,500 |
| Middleware | 8 | ~800 |
| Services | 10+ | ~2,500 |
| Controllers | 9 | ~1,200 |
| Config | 10+ | ~1,000 |
| AI System | 15+ | ~3,000 |
| **Total** | **80+** | **~13,500** |

---

## Performance Tips

1. **Embeddings Cache:** Hits reduce latency by 100x
2. **Circuit Breaker:** Prevents cascading failures
3. **Database Indexes:** Speed up queries on frequently accessed fields
4. **Rate Limiting:** Prevents abuse and cost overruns
5. **Batch Processing:** Combine operations when possible
6. **Lazy Loading:** Load AI models only when needed

---

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Password hashing: bcrypt (10 rounds)
- [ ] CORS configured for specific origins
- [ ] Rate limiting enabled
- [ ] Content moderation active
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose stack traces in production
- [ ] HTTPS/TLS in production
- [ ] Database credentials in environment variables
- [ ] Audit logging for sensitive operations

---

## Troubleshooting

**Redis not connecting?**
- Check REDIS_HOST and REDIS_PORT
- Circuit breaker will gracefully degrade
- Verify Redis is running: `redis-cli ping`

**AI service not responding?**
- Verify GROQ_API_KEY is set
- Check network connectivity
- Review token usage in Groq dashboard

**ChromaDB not available?**
- Semantic search will be skipped
- Course indexing won't happen
- Other features continue normally

**Rate limit errors?**
- Adjust limits in `/backend/middleware/rateLimiter.js`
- Use different endpoints for different rate tiers
- Implement pagination for list endpoints

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** Production-Ready
