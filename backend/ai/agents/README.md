# Multi-Agent System Documentation

## Overview

The Mini AI Tutor platform uses a **multi-agent orchestration system** where specialized agents handle different aspects of the platform. This ensures:

- **Cost efficiency**: Each agent optimizes for its specific domain
- **Scalability**: Agents can be scaled independently
- **Maintainability**: Clear separation of concerns
- **Reliability**: Failures are isolated to specific agents

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATOR                      │
│  • Routes tasks to appropriate agents                     │
│  • Aggregates metrics                                     │
│  • Manages agent lifecycle                                │
└────────────────┬─────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼─────┐  ┌────────▼────┐  ┌─────────▼──────┐
   │Tutoring  │  │Course Prep  │  │Cost Control    │
   │Agent     │  │Agent         │  │Agent           │
   └──────────┘  └─────────────┘  └────────────────┘
        │                 │                 │
   ┌────▼─────┐  ┌────────▼────┐  ┌─────────▼──────┐
   │Progress  │  │Admin        │  │Instructor Ver. │
   │Tracking  │  │Agent        │  │Agent           │
   └──────────┘  └─────────────┘  └────────────────┘
        │
   ┌────▼─────┐
   │Payment   │
   │Agent     │
   └──────────┘
```

---

## Agent Descriptions

### 1. Tutoring Agent
**Purpose**: Handle all AI tutoring interactions with students

**Responsibilities**:
- Answer student questions
- Multi-layer caching (in-memory → semantic → RAG)
- Quota enforcement
- Cost tracking per interaction
- Conversation management

**Key Features**:
- 60% cache hit rate target (reduces cost by 90%)
- Context-aware responses using course materials
- Automatic quota checking before answering
- Logs all interactions for analytics

**Cost**: $0.001-$0.05 per query (depends on cache hit)

---

### 2. Course Preparation Agent
**Purpose**: Process courses for AI teaching

**Responsibilities**:
- Create vector embeddings for course content
- Pre-generate common Q&As (20 per topic)
- Generate concept explanations
- Ingest content into ChromaDB
- Set up course for efficient AI tutoring

**Key Features**:
- One-time processing per course
- Async background processing (BullMQ)
- Generates cache that serves 60%+ of queries
- Cost amortized across all students

**Cost**: $5-20 per course (one-time)

---

### 3. Cost Control Agent
**Purpose**: Monitor and enforce AI cost budgets

**Responsibilities**:
- Track spending per user, course, feature
- Enforce tier limits (free/basic/pro)
- Alert when budgets are approaching
- Throttle system if costs spike
- Provide cost analytics

**Key Features**:
- Real-time budget tracking
- Automatic throttling at 95% of budget
- Detailed cost breakdowns
- Cache hit rate monitoring

**Cost**: $0 (monitoring only)

---

### 4. Progress Tracking Agent
**Purpose**: Track student learning progress and outcomes

**Responsibilities**:
- Update progress when topics/exercises completed
- Calculate completion percentage
- Track final project submissions
- Detect course completion
- Update course analytics

**Key Features**:
- Real-time progress updates
- Automatic completion detection
- Outcomes tracking (jobs, projects, certifications)

**Cost**: $0 (database operations only)

---

### 5. Admin Agent
**Purpose**: Handle administrative operations

**Responsibilities**:
- Approve/reject courses
- Suspend/ban users
- Adjust usage limits
- Platform statistics
- Content moderation

**Cost**: $0 (administrative operations)

---

### 6. Instructor Verification Agent
**Purpose**: Verify instructor applications

**Responsibilities**:
- Review applications (AI-powered scoring)
- Approve/reject instructors
- Calculate verification scores
- Track instructor quality

**Cost**: $0.001 per review

---

### 7. Payment Agent
**Purpose**: Handle payment operations

**Responsibilities**:
- Process subscriptions
- Process course purchases
- Calculate instructor payouts
- Revenue split calculations

**Cost**: $0 (Stripe handles processing)

---

## Complete User Flows

### Flow 1: Student Asks Question

```
1. Student types question in lesson

   POST /api/agents/tutor/ask
   {
     "course_id": "...",
     "topic_id": "...",
     "query": "What is a closure in JavaScript?",
     "conversation_id": "..."
   }

2. API → AgentOrchestrator → TutoringAgent

3. TutoringAgent:
   a. Check user quota (CostControlAgent)
      → If exceeded: Return upgrade message
      → If within limit: Continue

   b. Check in-memory cache
      → Cache hit? Return answer ($0.0001)
      → Cache miss? Continue

   c. Check semantic cache (database)
      → Similar question found? Return answer ($0.001)
      → No match? Continue

   d. Use RAG + LLM
      → Retrieve relevant course content
      → Build context with conversation history
      → Call LLM (Groq)
      → Cache response for future
      → Cost: $0.005-$0.05

4. Response:
   {
     "answer": "A closure is...",
     "sources": [...],
     "cached": false,
     "cost": 0.01
   }

5. Usage updated:
   - User.usage.ai_messages_today++
   - User.usage.estimated_cost_this_month += cost
   - AIUsageLog.create(...)
   - AIConversation.update(...)
```

**Optimization**: After 10 students ask the same question, it's cached. Next 990 students get instant answer for $0.001 instead of $0.01.

**Savings**: $9.99 × 990 = $9,890 saved!

---

### Flow 2: Instructor Creates Course

```
1. Instructor creates course structure (modules, topics, exercises)

   POST /api/courses
   {
     "title": "JavaScript Mastery",
     "modules": [...]
   }

2. Course saved with status: 'draft'

3. Instructor publishes course

   POST /api/courses/:id/publish

4. System queues course preparation

   POST /api/agents/course/prepare
   {
     "course_id": "...",
     "mode": "full"
   }

5. AgentOrchestrator → CoursePreparationAgent

6. CoursePreparationAgent (async):
   a. Create ChromaDB collection: "course_<id>"

   b. Ingest content:
      - Extract all topics, concepts, exercises
      - Generate embeddings
      - Store in vector database
      - Cost: ~$1

   c. Generate common Q&As:
      - For each topic, generate 20 Q&As using LLM
      - Create embeddings for each question
      - Store in Course.ai_preparation.common_questions
      - Cost: ~$0.02 × num_topics

   d. Generate concept explanations:
      - For each unique concept, generate explanation
      - Store in Course.ai_preparation.concept_explanations
      - Cost: ~$0.01 × num_concepts

7. Course status: 'ready'
   Total cost: $5-20 (one-time)

8. Course now ready for AI tutoring
   → All future student questions can hit cache
   → Average cost per student: $2-3 instead of $20-30
```

---

### Flow 3: Cost Monitoring

```
Every hour (cron job):

1. CostControlAgent.checkGlobalBudget()

2. Query AIUsageLog for today's spending:
   SELECT SUM(cost) FROM ai_usage_logs
   WHERE timestamp >= today

3. Compare against daily budget ($100)

4. If > 80%:
   → Log warning
   → Send alert to admin

5. If > 95%:
   → Enable throttling
   → Return upgrade messages to free users
   → Prioritize pro users

6. Generate analytics:
   - Cost by feature
   - Cost by course
   - Cache hit rate
   - Model usage breakdown

7. Store for admin dashboard
```

---

## API Endpoints

### Tutoring
```
POST /api/agents/tutor/ask
Body: { course_id, topic_id, query, conversation_id }
Auth: Required
Response: { answer, sources, cached, cost }
```

### Course Preparation
```
POST /api/agents/course/prepare
Body: { course_id, mode }
Auth: Required (Instructor/Admin only)
Response: { success, collection_id, cost }
```

### Cost Analytics
```
GET /api/agents/cost/analytics?period=today&group_by=feature
Auth: Required (Admin only)
Response: { analytics: [...], routing_stats: {...} }
```

### User Budget
```
GET /api/agents/cost/user/:user_id
Auth: Required (Self or Admin)
Response: { cost_limit, current_cost, percent_used, within_budget }
```

### Progress Tracking
```
POST /api/agents/progress/update
Body: { enrollment_id, module_id, topic_id }
Auth: Required
Response: { success }

POST /api/agents/progress/complete-topic
Body: { enrollment_id, topic_id }
Auth: Required
Response: { success }
```

### Agent Stats
```
GET /api/agents/stats
Auth: Required (Admin only)
Response: { global: {...}, agents: {...} }
```

---

## Cost Optimization Strategies

### 1. Cache Layering
```
Layer 1: In-memory (Map)      → 30% hit rate, $0.0001/query
Layer 2: Semantic DB cache    → 30% hit rate, $0.001/query
Layer 3: RAG + Small Model    → 30% traffic, $0.01/query
Layer 4: RAG + Large Model    → 10% traffic, $0.05/query

Average cost per query: $0.005
```

### 2. Pre-computation
- Generate common Q&As during course creation
- Amortize cost across all students
- One $10 course preparation → serves 1000+ students

### 3. Smart Routing
- Route simple queries to small models
- Reserve GPT-4 for complex reasoning
- Use pattern matching for code reviews

### 4. Usage Limits
- Free: 50 messages/month
- Basic: 500 messages/month
- Pro: 2000 messages/month
- Prevents runaway costs

---

## Testing the System

### Test 1: Ask a Question
```bash
curl -X POST http://localhost:5000/api/agents/tutor/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "COURSE_ID",
    "topic_id": "TOPIC_ID",
    "query": "Explain closures in JavaScript"
  }'
```

### Test 2: Check Budget
```bash
curl http://localhost:5000/api/agents/cost/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Get Agent Stats
```bash
curl http://localhost:5000/api/agents/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Cache Hit Rate**
   - Target: >60%
   - If <50%: Course preparation may need improvement

2. **Average Cost Per Query**
   - Target: <$0.01
   - If >$0.02: Too many cache misses

3. **Daily Budget Usage**
   - Target: <$100/day
   - Alert at 80%, throttle at 95%

4. **User Quota Compliance**
   - Track % of users hitting limits
   - Conversion rate to paid tiers

5. **Agent Success Rate**
   - Target: >95% success rate
   - Monitor failures by agent type

---

## Troubleshooting

### Issue: High AI Costs

**Diagnosis**:
1. Check cache hit rate: `GET /api/agents/cost/analytics`
2. If <50%, course preparation may be incomplete

**Solution**:
1. Reprocess courses: `POST /api/agents/course/prepare`
2. Increase common Q&A generation (20 → 50 per topic)
3. Review query patterns for new common questions

---

### Issue: Slow Response Times

**Diagnosis**:
1. Check agent stats: `GET /api/agents/stats`
2. Look at `averageResponseTime` for each agent

**Solution**:
- TutoringAgent slow? → Optimize cache lookups
- CoursePreparationAgent slow? → Reduce batch size
- Consider Redis for faster caching

---

### Issue: Quota Exceeded Errors

**Diagnosis**:
1. Check user usage: `GET /api/agents/cost/user/:id`
2. Verify tier limits are appropriate

**Solution**:
- Adjust limits in CostControlAgent
- Encourage upgrades with better messaging
- Implement rollover for unused quota

---

## Future Enhancements

1. **Agent Load Balancing**
   - Multiple instances of TutoringAgent
   - Distribute load across instances

2. **Predictive Caching**
   - ML model predicts questions students will ask
   - Pre-generate answers

3. **Dynamic Pricing**
   - Adjust tier limits based on actual costs
   - Optimize margins per user

4. **Advanced Analytics**
   - Cohort analysis
   - Predictive cost modeling
   - Anomaly detection

---

## Conclusion

The multi-agent system provides a **robust, scalable, cost-efficient** foundation for AI-powered teaching. By combining smart caching, usage limits, and specialized agents, the platform can serve thousands of students profitably while maintaining high-quality AI tutoring.

**Key Success Metrics**:
- ✅ 60%+ cache hit rate
- ✅ <$3 AI cost per student per month
- ✅ >95% agent uptime
- ✅ <2s average response time

Monitor these metrics daily and optimize continuously!
