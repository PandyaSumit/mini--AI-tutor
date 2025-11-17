# AI Orchestration Implementation Guide

## Quick Start

This guide will help you get started with the new AI orchestration features including advanced RAG chains, LangGraph workflows, and MCP tool servers.

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [API Reference](#api-reference)
5. [Testing](#testing)
6. [Migration Guide](#migration-guide)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

**New dependencies added:**
- `@langchain/langgraph` - LangGraph for stateful workflows
- `@modelcontextprotocol/sdk` - MCP for standardized tools
- `@opentelemetry/api` - Observability and telemetry
- `uuid` - Session ID generation

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# State Persistence
STATE_TTL_SECONDS=604800  # 7 days

# Feature Flags (optional)
FEATURE_ADVANCED_RAG=true
FEATURE_ADAPTIVE_TUTOR=true
FEATURE_MCP_TOOLS=true
```

### 3. Start Required Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individually:
docker-compose up -d redis mongodb chromadb
```

### 4. Seed Knowledge Base (Optional)

```bash
npm run seed:knowledge
```

---

## Configuration

### Feature Flags

Control which features are enabled via environment variables:

```javascript
// backend/config/ai.js
features: {
  enableAdvancedRAG: process.env.FEATURE_ADVANCED_RAG !== 'false',
  enableAdaptiveTutor: process.env.FEATURE_ADAPTIVE_TUTOR !== 'false',
  enableMCPTools: process.env.FEATURE_MCP_TOOLS !== 'false',
}
```

### Rate Limiting

Adjust rate limits for MCP tools:

```javascript
// When registering a tool
server.registerTool({
  name: 'get_user_profile',
  rateLimit: 100, // calls per minute
  // ...
});
```

### State Persistence TTL

```bash
# Default: 7 days
STATE_TTL_SECONDS=604800

# For development (1 hour):
STATE_TTL_SECONDS=3600
```

---

## Usage Examples

### 1. Advanced RAG - Multi-Query Retrieval

**Endpoint:** `POST /api/ai/workflows/rag/multi-query`

**Description:** Generates multiple query variations for better retrieval recall.

**Example:**

```bash
curl -X POST http://localhost:5000/api/ai/workflows/rag/multi-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "how to learn python programming",
    "collectionKey": "knowledge",
    "topK": 5,
    "numQueries": 3
  }'
```

**Response:**

```json
{
  "success": true,
  "answer": "To learn Python programming...",
  "sources": [
    {
      "content": "Python is a high-level programming language...",
      "score": 0.89,
      "metadata": { "title": "Introduction to Python", "difficulty": "beginner" }
    }
  ],
  "confidence": 0.89,
  "queries": [
    "how to learn python programming",
    "what are the best ways to start learning Python",
    "python programming for beginners guide"
  ],
  "strategy": "multi-query",
  "resultsBeforeDedup": 15,
  "resultsAfterDedup": 12
}
```

### 2. Conversational RAG

**Endpoint:** `POST /api/ai/workflows/rag/conversational`

**Description:** Context-aware RAG that maintains conversation history.

**Example:**

```bash
curl -X POST http://localhost:5000/api/ai/workflows/rag/conversational \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "what about data types?",
    "conversationHistory": [
      { "role": "user", "content": "explain python variables" },
      { "role": "assistant", "content": "Variables in Python..." }
    ],
    "collectionKey": "knowledge"
  }'
```

**Response:**

```json
{
  "success": true,
  "answer": "Building on variables, Python has several data types...",
  "sources": [...],
  "confidence": 0.87,
  "contextualizedQuestion": "What are the data types available in Python?",
  "strategy": "conversational"
}
```

### 3. Adaptive Tutor Workflow

**Endpoint:** `POST /api/ai/workflows/tutor/start`

**Description:** Start an adaptive, stateful tutoring session with Socratic method.

**Example:**

```bash
# Start session
curl -X POST http://localhost:5000/api/ai/workflows/tutor/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topic": "Python Basics",
    "level": "beginner"
  }'
```

**Response:**

```json
{
  "success": true,
  "sessionId": "tutor:user-123:1234567890",
  "state": {
    "sessionId": "tutor:user-123:1234567890",
    "topic": "Python Basics",
    "studentLevel": "beginner",
    "currentPhase": "learning",
    "questionsAsked": 0,
    "correctAnswers": 0
  },
  "message": "Welcome! Let's start learning Python Basics. I'll assess your current knowledge level."
}
```

**Continue Interaction:**

```bash
curl -X POST http://localhost:5000/api/ai/workflows/tutor/interact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionId": "tutor:user-123:1234567890",
    "message": "I think variables are used to store data"
  }'
```

**Response:**

```json
{
  "success": true,
  "sessionId": "tutor:user-123:1234567890",
  "message": "Excellent! You're absolutely right. Can you explain what happens when we assign a value to a variable in Python?",
  "nextAction": "question",
  "mastery": 0,
  "state": {...}
}
```

**Get Session State:**

```bash
curl http://localhost:5000/api/ai/workflows/tutor/session/tutor:user-123:1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**End Session:**

```bash
curl -X POST http://localhost:5000/api/ai/workflows/tutor/end \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionId": "tutor:user-123:1234567890"
  }'
```

### 4. MCP Tool Execution

**Endpoint:** `POST /api/ai/workflows/mcp/execute`

**Description:** Execute standardized platform tools.

**List Available Tools:**

```bash
curl http://localhost:5000/api/ai/workflows/mcp/tools \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Execute Tool:**

```bash
curl -X POST http://localhost:5000/api/ai/workflows/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tool": "get_user_profile",
    "input": {
      "userId": "USER_ID_HERE"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "tool": "get_user_profile",
  "result": {
    "success": true,
    "data": {
      "profile": {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "learningGoals": ["Learn Python", "Master ML"]
      },
      "statistics": {
        "enrollments": 5,
        "completedCourses": 2,
        "studyStreak": 7,
        "totalStudyTime": 3600
      }
    }
  },
  "latency": 45,
  "server": "platform"
}
```

**Available MCP Tools:**

1. `get_user_profile` - Retrieve user profile and stats
2. `update_user_profile` - Update user information
3. `get_course` - Get course details
4. `list_courses` - Browse courses with filters
5. `enroll_in_course` - Enroll in a course
6. `update_course_progress` - Update learning progress
7. `get_learning_analytics` - Retrieve analytics
8. `get_course_analytics` - Course-level analytics (creators only)

---

## API Reference

### Advanced RAG Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/workflows/rag/multi-query` | POST | Multi-query retrieval |
| `/api/ai/workflows/rag/conversational` | POST | Context-aware RAG |
| `/api/ai/workflows/rag/self-query` | POST | Metadata-filtered search |
| `/api/ai/workflows/rag/hybrid` | POST | Semantic + keyword search |

### Adaptive Tutor Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/workflows/tutor/start` | POST | Start tutoring session |
| `/api/ai/workflows/tutor/interact` | POST | Continue session |
| `/api/ai/workflows/tutor/session/:id` | GET | Get session state |
| `/api/ai/workflows/tutor/end` | POST | End session |
| `/api/ai/workflows/tutor/sessions` | GET | List user sessions |

### MCP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/workflows/mcp/tools` | GET | List available tools |
| `/api/ai/workflows/mcp/execute` | POST | Execute tool |
| `/api/ai/workflows/mcp/stats` | GET | Server statistics |
| `/api/ai/workflows/mcp/health` | GET | Health check |

### State Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/workflows/state/stats` | GET | State persistence stats |

---

## Testing

### Run All Tests

```bash
# Run all tests with coverage
npm test

# Run only unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

### Manual Testing

#### 1. Test Advanced RAG

```bash
# Multi-query RAG
curl -X POST http://localhost:5000/api/ai/workflows/rag/multi-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "machine learning basics", "numQueries": 3}'
```

#### 2. Test Adaptive Tutor

```bash
# Start session
SESSION_ID=$(curl -X POST http://localhost:5000/api/ai/workflows/tutor/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"topic": "Calculus", "level": "beginner"}' | jq -r '.sessionId')

# Interact
curl -X POST http://localhost:5000/api/ai/workflows/tutor/interact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"What is a derivative?\"}"
```

#### 3. Test MCP Tools

```bash
# Get user profile
curl -X POST http://localhost:5000/api/ai/workflows/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tool": "get_user_profile", "input": {"userId": "YOUR_USER_ID"}}'
```

---

## Migration Guide

### From Existing RAG to Advanced RAG

**Before:**

```javascript
// Old basic RAG
const result = await ragChain.query(question, { collectionKey: 'knowledge' });
```

**After:**

```javascript
// New multi-query RAG (better recall)
const result = await advancedRagChain.multiQueryRetrieval(question, {
  collectionKey: 'knowledge',
  numQueries: 3
});

// Or conversational RAG (context-aware)
const result = await advancedRagChain.conversationalRAG(question, {
  conversationHistory: previousMessages
});
```

**Migration Checklist:**

- [ ] Update API endpoint from `/api/ai/rag/query` to `/api/ai/workflows/rag/multi-query`
- [ ] Add conversation history parameter if using conversational RAG
- [ ] Update response parsing to handle new `queries` and `strategy` fields
- [ ] Test with existing queries to verify improved results

### Integrating Adaptive Tutor into Existing Chat

**Steps:**

1. **Replace Simple Chat with Stateful Tutor:**

```javascript
// Before: Simple chat
await aiOrchestrator.chat(message);

// After: Adaptive tutor
const session = await adaptiveTutorGraph.start(userId, topic, level);
const response = await adaptiveTutorGraph.interact(session.sessionId, message);
```

2. **Add Session Management:**

```javascript
// Store session ID in user state/localStorage
localStorage.setItem('tutorSessionId', session.sessionId);

// Resume session on page reload
const sessionId = localStorage.getItem('tutorSessionId');
if (sessionId) {
  const state = await adaptiveTutorGraph.getSession(sessionId);
  // Continue from checkpoint
}
```

3. **Handle Session Lifecycle:**

```javascript
// End session when user finishes
await adaptiveTutorGraph.endSession(sessionId);
localStorage.removeItem('tutorSessionId');
```

### Using MCP Tools in AI Agents

**Example: Course Recommendation Agent**

```javascript
import platformServer from './ai/mcp/servers/platformServer.js';

async function recommendCourses(userId) {
  // Get user profile
  const profileResult = await platformServer.execute(
    'get_user_profile',
    { userId },
    { user: { id: userId } }
  );

  const learningGoals = profileResult.result.data.profile.learningGoals;

  // Get learning analytics
  const analyticsResult = await platformServer.execute(
    'get_learning_analytics',
    { userId, timeRange: 'month' },
    { user: { id: userId } }
  );

  const completedTopics = analyticsResult.result.data.summary.topicsMastered;

  // Search for relevant courses
  const coursesResult = await platformServer.execute(
    'list_courses',
    {
      filters: { topic: learningGoals[0] },
      limit: 5
    },
    { user: { id: userId } }
  );

  return coursesResult.result.data.courses;
}
```

---

## Troubleshooting

### Issue: "ChromaDB not initialized"

**Cause:** ChromaDB server is not running.

**Solution:**

```bash
# Start ChromaDB
docker-compose up -d chromadb

# Or manually:
pip install chromadb
chroma run --path ./data/chromadb
```

### Issue: "Session not found or expired"

**Cause:** Tutor session expired (default TTL: 7 days).

**Solution:**

```bash
# Extend session TTL in .env
STATE_TTL_SECONDS=1209600  # 14 days

# Or extend programmatically:
await statePersistence.extendTTL(sessionId, 3600); // +1 hour
```

### Issue: "Rate limit exceeded"

**Cause:** Too many tool calls in one minute.

**Solution:**

```bash
# Increase rate limit for specific tool
server.registerTool({
  name: 'get_user_profile',
  rateLimit: 200, // Increase from 100
  // ...
});
```

### Issue: "Validation error"

**Cause:** Invalid input to MCP tool.

**Solution:**

Check the tool's input schema:

```bash
# Get tool definition
curl http://localhost:5000/api/ai/workflows/mcp/tools \
  -H "Authorization: Bearer $TOKEN" | jq '.tools[] | select(.name == "your_tool_name")'
```

Ensure your input matches the schema exactly.

### Issue: "No sources returned" from Advanced RAG

**Cause:** Knowledge base is empty or minimum score threshold too high.

**Solution:**

```bash
# 1. Seed knowledge base
npm run seed:knowledge

# 2. Lower minimum score threshold in config/ai.js
rag: {
  minScore: 0.3, // Default: 0.5
}

# 3. Use multi-query for better recall
POST /api/ai/workflows/rag/multi-query
```

---

## Performance Optimization

### 1. Caching

All advanced RAG queries are cached automatically. To monitor cache performance:

```bash
curl http://localhost:5000/api/cache/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Batch Requests

For multiple tool executions, batch them:

```javascript
const results = await Promise.all([
  platformServer.execute('get_user_profile', { userId }),
  platformServer.execute('get_learning_analytics', { userId }),
  platformServer.execute('list_courses', { limit: 10 })
]);
```

### 3. State Cleanup

Archive old sessions to MongoDB:

```javascript
// Automatically archive sessions older than 30 days
import statePersistence from './ai/state/statePersistence.js';
import WorkflowArchive from './models/WorkflowArchive.js';

await statePersistence.archiveCheckpoint(sessionId, WorkflowArchive);
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await adaptiveTutorGraph.interact(sessionId, message);
  // Handle success
} catch (error) {
  if (error.message.includes('Session not found')) {
    // Restart session
    const newSession = await adaptiveTutorGraph.start(userId, topic);
  } else {
    // Log error and show user-friendly message
    logger.error('Tutor interaction error:', error);
    showError('Something went wrong. Please try again.');
  }
}
```

### 2. Session Management

- Save session IDs persistently (localStorage, database)
- Set up session expiration warnings
- Implement auto-save for long sessions
- Provide resume functionality

### 3. MCP Tool Security

- Always validate user authorization before tool execution
- Sanitize input to prevent injection attacks
- Log all tool executions for audit trail
- Implement rate limiting per user, not just per IP

### 4. Monitoring

Track key metrics:

```javascript
// Custom metrics
logger.info('Advanced RAG query', {
  strategy: 'multi-query',
  queries: result.queries.length,
  sources: result.sources.length,
  confidence: result.confidence,
  latency: Date.now() - startTime
});
```

---

## Next Steps

1. **Explore Advanced Features:**
   - Implement course generation workflow with LangGraph
   - Add multi-agent content review
   - Create learning path optimizer

2. **Integrate with Frontend:**
   - Add UI components for adaptive tutor
   - Create analytics dashboard using MCP tools
   - Implement session resume functionality

3. **Extend MCP Tools:**
   - Add notification tools
   - Create content moderation tools
   - Implement external integrations (calendar, email)

4. **Optimize Performance:**
   - Implement embedding model fine-tuning
   - Add re-ranking for better precision
   - Set up comprehensive monitoring

---

## Support & Resources

- **Architecture Document:** `AI_ORCHESTRATION_ARCHITECTURE.md`
- **Knowledge Search Fix:** `KNOWLEDGE_SEARCH_FIX.md`
- **API Docs:** See inline comments in route files
- **GitHub Issues:** [Report issues](https://github.com/PandyaSumit/mini--AI-tutor/issues)

---

**Version:** 1.0.0
**Last Updated:** 2025-01-17
**Status:** Production Ready
