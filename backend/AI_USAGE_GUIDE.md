# AI Pipeline Usage Guide

Complete guide for using the AI-powered features in Mini AI Tutor platform.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install all AI dependencies:
- `@langchain/groq` - Groq LLM integration
- `@langchain/community` - LangChain community tools
- `@xenova/transformers` - FREE local embeddings
- `chromadb` - Vector database
- `zod` - Input validation
- `isomorphic-dompurify` - Sanitization

### 2. Configure Environment

Add to your `.env`:

```env
# LLM (Groq) - Already configured
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Local Embeddings (FREE)
EMBEDDING_MODEL=Xenova/bge-small-en-v1.5
EMBEDDING_CACHE_ENABLED=true

# Vector Database
CHROMA_PATH=./data/chromadb

# AI Features
FEATURE_RAG=true
FEATURE_VECTOR_SEARCH=true
```

### 3. Start Server

```bash
npm run dev
```

**Expected output:**
```
🚀 Initializing AI Pipeline...
📦 Loading BGE-small embedding model...
✅ BGE-small model loaded successfully
✅ Embedding Service initialized
✅ ChromaDB connected successfully
✅ AI Pipeline initialized successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AI Pipeline Ready:
   ✓ Local embeddings (BGE-small, FREE)
   ✓ Vector store (ChromaDB)
   ✓ RAG pipeline
   ✓ LLM (Groq)
   ✓ Security layer
   Cost: $0 embeddings + Groq LLM only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ AI routes mounted at /api/ai
```

---

## 📚 API Endpoints

### 1. Simple Chat

**Endpoint:** `POST /api/ai/chat`

**Description:** Simple LLM completion without context.

**Request:**
```json
{
  "message": "Explain recursion in simple terms",
  "context": {
    "skill_level": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Recursion is when a function calls itself...",
  "model": "llama-3.3-70b-versatile",
  "sanitized": false
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Explain recursion in simple terms"
  }'
```

---

### 2. RAG Query (Context-Aware)

**Endpoint:** `POST /api/ai/rag/query`

**Description:** Query with RAG - searches knowledge base and generates contextual answer.

**Request:**
```json
{
  "query": "How do I implement a binary search tree?",
  "topK": 5,
  "collectionKey": "knowledge"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the learning materials, here's how to implement a BST...",
  "sources": [
    {
      "content": "A binary search tree is a data structure...",
      "score": 0.92,
      "metadata": { "type": "roadmap", "topic": "data-structures" }
    }
  ],
  "confidence": 0.92,
  "cached": false,
  "question": "How do I implement a binary search tree?",
  "model": "llama-3.3-70b-versatile"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/ai/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "How do I implement a binary search tree?",
    "topK": 5
  }'
```

---

### 3. Generate Embeddings

**Endpoint:** `POST /api/ai/embeddings`

**Description:** Generate vector embeddings for texts (FREE, local).

**Request:**
```json
{
  "texts": [
    "Python is a high-level programming language",
    "JavaScript is used for web development"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "embeddings": [
    [0.123, -0.456, 0.789, ...],  // 384 dimensions
    [0.234, -0.567, 0.891, ...]
  ],
  "count": 2,
  "dimensions": 384,
  "cached": 0,
  "generated": 2,
  "embedTime": 156,
  "avgTime": 78,
  "cost": 0,
  "cacheHitRatio": 0
}
```

**Key Benefits:**
- ✅ **100% FREE** - No API costs
- ✅ **Fast** - ~100ms per text (cached: 2ms)
- ✅ **Cached** - Automatic caching in Redis + LRU

---

### 4. Semantic Search

**Endpoint:** `POST /api/ai/search`

**Description:** Search for similar content using vector similarity.

**Request:**
```json
{
  "query": "How to optimize React performance",
  "topK": 5,
  "collectionKey": "roadmaps"
}
```

**Response:**
```json
{
  "success": true,
  "query": "How to optimize React performance",
  "results": [
    {
      "id": "roadmap_123",
      "content": "React Performance Optimization Guide...",
      "score": 0.89,
      "metadata": {
        "type": "roadmap",
        "difficulty": "intermediate",
        "userId": "user_456"
      }
    }
  ],
  "count": 5,
  "cached": false
}
```

---

### 5. Ingest Content

**Endpoint:** `POST /api/ai/ingest`

**Description:** Add content to vector database for semantic search.

**Request:**
```json
{
  "type": "roadmap",
  "content": "Complete guide to learning Python...",
  "metadata": {
    "userId": "user_123",
    "courseId": "python-basics",
    "difficulty": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "ids": ["uuid-here"],
  "embedTime": 145,
  "cached": 0
}
```

**Supported Types:**
- `roadmap` - Learning roadmaps
- `flashcard` - Flashcard decks
- `note` - User notes
- `knowledge` - General knowledge base

---

### 6. Get Statistics

**Endpoint:** `GET /api/ai/stats`

**Description:** Get AI pipeline performance statistics.

**Response:**
```json
{
  "success": true,
  "initialized": true,
  "embeddings": {
    "service": {
      "totalEmbeddings": 1543,
      "cacheHits": 1234,
      "cacheMisses": 309,
      "cacheHitRatio": 79.9,
      "avgEmbedTime": 98,
      "batchProcessed": 45,
      "totalCost": 0
    },
    "cache": {
      "enabled": true,
      "hits": { "lru": 543, "redis": 691, "total": 1234 },
      "misses": 309,
      "hitRatio": 79.9,
      "lruSize": 234,
      "lruMax": 1000
    },
    "model": {
      "name": "Xenova/bge-small-en-v1.5",
      "dimensions": 384,
      "loaded": true
    }
  },
  "vectorStore": {
    "initialized": true,
    "collections": {
      "knowledge": 456,
      "conversations": 123,
      "roadmaps": 89,
      "flashcards": 234,
      "notes": 67
    },
    "totalDocuments": 969
  },
  "model": "llama-3.3-70b-versatile",
  "cost": {
    "embeddings": 0,
    "total": 0
  }
}
```

---

### 7. Health Check

**Endpoint:** `GET /api/ai/health`

**Description:** Check AI pipeline health status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "embeddings": {
    "status": "healthy",
    "model": "Xenova/bge-small-en-v1.5",
    "dimensions": 384,
    "cacheEnabled": true,
    "testEmbedTime": 87
  },
  "vectorStore": {
    "status": "healthy",
    "collections": 5,
    "path": "./data/chromadb"
  },
  "model": "llama-3.3-70b-versatile"
}
```

---

## 💡 Use Cases

### Use Case 1: Student Asks Question

**Scenario:** Student asks a question while studying.

```javascript
// Frontend code
const askQuestion = async (question) => {
  const response = await fetch('/api/ai/rag/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: question,
      topK: 5,
      collectionKey: 'knowledge'
    })
  });

  const data = await response.json();

  return {
    answer: data.answer,
    sources: data.sources,
    confidence: data.confidence
  };
};

// Usage
const result = await askQuestion("What is polymorphism in OOP?");
console.log(result.answer);
console.log("Confidence:", result.confidence);
console.log("Sources:", result.sources.length);
```

---

### Use Case 2: Ingest Roadmap Content

**Scenario:** Admin creates a new learning roadmap.

```javascript
// When roadmap is created/updated
const ingestRoadmap = async (roadmap) => {
  await fetch('/api/ai/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'roadmap',
      content: roadmap.content,
      metadata: {
        userId: roadmap.userId,
        title: roadmap.title,
        difficulty: roadmap.difficulty,
        tags: roadmap.tags
      }
    })
  });
};
```

---

### Use Case 3: Semantic Search for Similar Roadmaps

**Scenario:** Recommend similar learning paths.

```javascript
const findSimilarRoadmaps = async (currentRoadmap) => {
  const response = await fetch('/api/ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: currentRoadmap.title + ' ' + currentRoadmap.description,
      topK: 3,
      collectionKey: 'roadmaps'
    })
  });

  const data = await response.json();
  return data.results;
};
```

---

## 🎯 Best Practices

### 1. Use RAG for Knowledge-Based Questions

**Good:**
```javascript
// Use RAG when you need context from learning materials
POST /api/ai/rag/query
{
  "query": "How do I use React hooks?",
  "collectionKey": "knowledge"
}
```

**Bad:**
```javascript
// Don't use simple chat for knowledge questions
POST /api/ai/chat
{
  "message": "How do I use React hooks?"
}
```

**Why:** RAG provides accurate, grounded answers from your actual learning content.

---

### 2. Ingest Content Immediately

**Good:**
```javascript
// Ingest as soon as content is created
router.post('/roadmaps', async (req, res) => {
  const roadmap = await Roadmap.create(req.body);

  // Immediately ingest for semantic search
  await fetch('/api/ai/ingest', {
    method: 'POST',
    body: JSON.stringify({
      type: 'roadmap',
      content: roadmap.content,
      metadata: { ... }
    })
  });

  res.json(roadmap);
});
```

**Why:** Makes content immediately searchable and available for RAG.

---

### 3. Use Batch Embeddings

**Good:**
```javascript
// Batch multiple texts together
POST /api/ai/embeddings
{
  "texts": [
    "Text 1",
    "Text 2",
    "Text 3"
  ]
}
```

**Bad:**
```javascript
// Don't call embedding API for each text
for (const text of texts) {
  await fetch('/api/ai/embeddings', {
    body: JSON.stringify({ texts: [text] })
  });
}
```

**Why:** Batching is 10x faster and more efficient.

---

### 4. Handle Errors Gracefully

```javascript
try {
  const result = await fetch('/api/ai/rag/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  });

  const data = await result.json();

  if (!result.ok) {
    // Handle error
    showError(data.error);
    return;
  }

  displayAnswer(data.answer);
} catch (error) {
  console.error('AI request failed:', error);
  showError('AI service temporarily unavailable');
}
```

---

## 📊 Performance

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Embedding (cached) | 2-5ms | 95% of requests |
| Embedding (new) | 80-150ms | First time only |
| Vector search | 20-50ms | HNSW index |
| RAG query (total) | 300-500ms | Search + LLM |
| Simple chat | 1-3s | LLM response time |

### Optimization Tips

1. **Pre-warm cache** - Embed common content on startup
2. **Batch operations** - Process multiple items together
3. **Use filters** - Narrow vector search with metadata filters
4. **Monitor stats** - Check `/api/ai/stats` regularly
5. **Adjust topK** - Lower for faster searches (3-5 is good)

---

## 💰 Cost Analysis

### Actual Costs

**Embeddings:**
- OpenAI ada-002: $0.0001 per 1K tokens
- **Local BGE-small: $0** ✅

**At 10,000 embeddings/day:**
- OpenAI: ~$30/month
- **Local: $0/month** ✅
- **Savings: 100%**

**LLM Calls:**
- Groq Llama 3.3: ~$0.05 per 1K tokens
- Already integrated in your platform

**Total AI Pipeline Cost:**
- Embeddings: **$0**
- Vector DB: **$0** (local ChromaDB)
- LLM: Groq costs only (already budgeted)

---

## 🔒 Security

### Built-in Protections

1. **Input Validation** - Zod schemas validate all inputs
2. **Sanitization** - DOMPurify removes malicious content
3. **Injection Detection** - Blocks prompt injection attempts
4. **Rate Limiting** - 50 AI calls per hour (configurable)
5. **Authentication** - JWT required for all endpoints
6. **Length Limits** - Max 10,000 chars per input

### Security Best Practices

```javascript
// All requests are automatically:
// 1. Validated (Zod schemas)
// 2. Sanitized (DOMPurify)
// 3. Checked for injection (pattern matching)
// 4. Rate limited (Redis)
// 5. Authenticated (JWT)

// You don't need to do anything - it's automatic!
```

---

## 🚀 Next Steps

1. **Test the API** - Use the cURL examples above
2. **Ingest your content** - Add roadmaps, flashcards, notes
3. **Monitor performance** - Check `/api/ai/stats` regularly
4. **Optimize caching** - Adjust TTLs based on hit ratios
5. **Scale up** - Works with thousands of users out of the box

---

## 📞 Support

For issues or questions:
1. Check `/api/ai/health` for system status
2. Check `/api/ai/stats` for performance metrics
3. Review server logs for detailed error messages
4. See `AI_PIPELINE_ARCHITECTURE.md` for architecture details

Happy building! 🎉
