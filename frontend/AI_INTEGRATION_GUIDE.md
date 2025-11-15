# 🤖 Frontend AI Integration Guide

## Overview

The Mini AI Tutor frontend now includes comprehensive AI-powered features using **RAG** (Retrieval Augmented Generation) and **local embeddings**.

---

## ✅ What's Integrated

### 1. AI Service (`src/services/aiService.js`)
Complete API client for all AI endpoints:
- ✅ Simple chat with AI
- ✅ RAG-enhanced queries
- ✅ Semantic search
- ✅ Content ingestion
- ✅ Generate embeddings
- ✅ AI statistics and health monitoring

### 2. useAI Hook (`src/hooks/useAI.jsx`)
React hook for easy AI integration in components:
```jsx
import { useAI } from '../hooks/useAI';

const { chat, askQuestion, search, loading, error } = useAI();
```

### 3. AI Components

#### **AIChat** (`src/components/AIChat.jsx`)
- RAG-enabled chat interface
- Shows sources and confidence scores
- Toggle between simple chat and RAG mode
- Beautiful UI with source attribution

#### **SemanticSearch** (`src/components/SemanticSearch.jsx`)
- Search across all knowledge
- Filter by content type (roadmaps, flashcards, notes)
- Shows similarity scores
- Cached results indication

### 4. AI Pages

#### **AI Dashboard** (`src/pages/AIDashboard.jsx`)
- Centralized AI hub
- Tabs for Chat and Search
- Info cards showing features
- `/ai` route

#### **AI Settings** (`src/pages/AISettings.jsx`)
- Real-time AI statistics
- Health monitoring
- Cost tracking
- Performance metrics
- `/ai-settings` route

---

## 🚀 How to Use

### Basic Chat

```jsx
import { useAI } from '../hooks/useAI';

function MyComponent() {
  const { chat, loading } = useAI();

  const handleChat = async (message) => {
    const result = await chat(message);
    console.log(result.response);
  };

  return (
    <button onClick={() => handleChat("Explain React hooks")} disabled={loading}>
      Ask AI
    </button>
  );
}
```

### RAG Query (with Knowledge Base)

```jsx
import { useAI } from '../hooks/useAI';

function MyComponent() {
  const { askQuestion, loading } = useAI();

  const handleQuestion = async (question) => {
    const result = await askQuestion(question, {
      topK: 5,
      collectionKey: 'knowledge'
    });

    console.log('Answer:', result.answer);
    console.log('Sources:', result.sources);
    console.log('Confidence:', result.confidence);
  };

  return (
    <button onClick={() => handleQuestion("What is recursion?")} disabled={loading}>
      Ask with RAG
    </button>
  );
}
```

### Semantic Search

```jsx
import { useAI } from '../hooks/useAI';

function MyComponent() {
  const { search, searchRoadmaps, loading } = useAI();

  const handleSearch = async (query) => {
    // Search all content
    const allResults = await search(query);

    // Or search specific type
    const roadmaps = await searchRoadmaps(query);

    console.log(allResults.results);
  };

  return (
    <input
      type="text"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Ingest Content

```jsx
import { useAI } from '../hooks/useAI';

function MyComponent() {
  const { ingestContent } = useAI();

  const handleSaveRoadmap = async (roadmapData) => {
    // Save to MongoDB first
    const savedRoadmap = await saveToMongoDB(roadmapData);

    // Then ingest to AI knowledge base
    await ingestContent('roadmap', roadmapData.content, {
      title: roadmapData.title,
      difficulty: roadmapData.difficulty,
      tags: roadmapData.tags,
    });
  };

  return <button onClick={() => handleSaveRoadmap(data)}>Save</button>;
}
```

### Get AI Statistics

```jsx
import { useAI } from '../hooks/useAI';
import { useEffect, useState } from 'react';

function StatsDisplay() {
  const { getStats } = useAI();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getStats();
      setStats(data);
    };
    loadStats();
  }, []);

  return (
    <div>
      {stats && (
        <>
          <p>Embeddings Generated: {stats.embeddings?.generated}</p>
          <p>Cache Hit Ratio: {stats.embeddings?.cacheHitRatio}%</p>
          <p>Cost: ${stats.cost?.total}</p>
        </>
      )}
    </div>
  );
}
```

---

## 📍 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/ai` | AIDashboard | Main AI hub with chat and search |
| `/ai-settings` | AISettings | AI statistics and monitoring |
| `/chat` | Chat | Original chat (can be enhanced) |

---

## 🎨 UI Components

### AIChat Features
- ✅ Toggle RAG mode
- ✅ Show sources with similarity scores
- ✅ Confidence indicators
- ✅ Beautiful gradient UI
- ✅ Loading states
- ✅ Error handling

### SemanticSearch Features
- ✅ Filter by content type
- ✅ Show match percentages
- ✅ Metadata display (tags, difficulty)
- ✅ Cached results indication
- ✅ Empty states with tips

### AISettings Features
- ✅ Health status indicators
- ✅ Real-time statistics
- ✅ Cost tracking
- ✅ Collection sizes
- ✅ Performance metrics

---

## 🔧 Integration Examples

### Enhance Existing Chat Page

```jsx
// In pages/Chat.jsx
import { useAI } from '../hooks/useAI';

const Chat = () => {
  const { askQuestion, loading } = useAI();

  const handleSendMessage = async (message) => {
    // Use RAG instead of simple chat
    const result = await askQuestion(message);

    // Show result with sources
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: result.answer,
      sources: result.sources,
      confidence: result.confidence
    }]);
  };

  // ...rest of component
};
```

### Add Search to Roadmaps Page

```jsx
// In pages/MyRoadmaps.jsx
import { useAI } from '../hooks/useAI';

const MyRoadmaps = () => {
  const { searchRoadmaps } = useAI();

  const handleSearch = async (query) => {
    const results = await searchRoadmaps(query, 10);
    setSearchResults(results.results);
  };

  return (
    <div>
      <input
        type="search"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search roadmaps..."
      />
      {/* Display results */}
    </div>
  );
};
```

### Auto-ingest Content

```jsx
// In pages/CreateRoadmap.jsx
import { useAI } from '../hooks/useAI';

const CreateRoadmap = () => {
  const { ingestContent } = useAI();

  const handleSubmit = async (formData) => {
    // Save to database
    const roadmap = await api.post('/roadmaps', formData);

    // Automatically add to AI knowledge base
    await ingestContent('roadmap', formData.content, {
      title: formData.title,
      difficulty: formData.difficulty,
      tags: formData.tags
    });

    // Success message
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

---

## 🎯 Best Practices

### 1. Always Use RAG for Knowledge Questions
```jsx
// ❌ Don't use simple chat for factual questions
const result = await chat("What is Python?");

// ✅ Use RAG to get accurate, sourced answers
const result = await askQuestion("What is Python?");
```

### 2. Show Sources to Users
```jsx
{message.sources && message.sources.length > 0 && (
  <div className="sources">
    <h4>Sources:</h4>
    {message.sources.map((source, idx) => (
      <div key={idx}>
        <p>{source.content}</p>
        <span>{(source.score * 100).toFixed(0)}% match</span>
      </div>
    ))}
  </div>
)}
```

### 3. Handle Loading States
```jsx
const { loading, error } = useAI();

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
```

### 4. Ingest Content Automatically
```jsx
// Whenever user creates content, add to knowledge base
const handleCreateFlashcard = async (data) => {
  await api.post('/flashcards', data);
  await ingestContent('flashcard', data.content, data.metadata);
};
```

### 5. Use Semantic Search for Discovery
```jsx
// Instead of exact text match
const results = await search("machine learning concepts");
// Returns semantically similar content even without exact words
```

---

## 💡 Tips & Tricks

### 1. Filter Searches by Type
```jsx
// Search only in roadmaps
const roadmaps = await search(query, { collectionKey: 'roadmaps' });

// Search only in flashcards
const flashcards = await search(query, { collectionKey: 'flashcards' });
```

### 2. Adjust Result Count
```jsx
// Get more results
const results = await search(query, { topK: 20 });

// Get fewer, more relevant results
const results = await search(query, { topK: 3 });
```

### 3. Check AI Health
```jsx
useEffect(() => {
  const checkHealth = async () => {
    const health = await aiService.healthCheck();
    if (health.status !== 'healthy') {
      // Show warning to user
    }
  };
  checkHealth();
}, []);
```

### 4. Monitor Performance
```jsx
const stats = await getStats();
console.log('Cache hit ratio:', stats.embeddings.cacheHitRatio);
console.log('Avg response time:', stats.embeddings.avgTime);
```

---

## 🔌 API Reference

See `src/services/aiService.js` for complete API documentation.

### Core Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `chat(message, context)` | message, context | `{response, model}` | Simple AI chat |
| `ragQuery(query, options)` | query, {topK, collectionKey} | `{answer, sources, confidence}` | RAG query |
| `semanticSearch(query, options)` | query, {topK, collectionKey} | `{results, cached}` | Semantic search |
| `ingestContent(type, content, metadata)` | type, content, metadata | `{success, count, ids}` | Add to knowledge base |
| `generateEmbeddings(texts)` | texts[] | `{embeddings, cost}` | Generate embeddings |
| `getStats()` | - | stats object | Get AI statistics |
| `healthCheck()` | - | health object | Check AI health |

---

## 🎨 Styling

All components use Tailwind CSS and match the existing design system:
- Blue/Purple gradients for AI features
- Consistent spacing and shadows
- Responsive design
- Dark mode ready (if needed)

---

## 📱 Mobile Support

All AI components are fully responsive:
- Mobile-optimized layouts
- Touch-friendly buttons
- Responsive grids
- Proper viewport handling

---

## 🐛 Troubleshooting

### AI responses are slow
- Check if backend is running
- Monitor AI stats for cache hit ratio
- Ensure embeddings are cached

### Search returns no results
- Verify content has been ingested
- Check collection key is correct
- Try broader search terms

### Chat doesn't show sources
- Make sure you're using `askQuestion()` not `chat()`
- Check RAG mode is enabled in AIChat component
- Verify backend has content in vector database

---

## 🚀 Next Steps

1. **Enhance existing pages** with AI features
2. **Auto-ingest** all user-created content
3. **Add search** to all list pages
4. **Show AI suggestions** throughout the app
5. **Personalize** learning paths with AI

---

## 📚 Related Documentation

- Backend AI API: `backend/AI_USAGE_GUIDE.md`
- Architecture: `backend/AI_PIPELINE_ARCHITECTURE.md`
- Verification: `backend/AI_VERIFICATION_REPORT.md`

---

**The AI features are now fully integrated and ready to use!** 🎉
