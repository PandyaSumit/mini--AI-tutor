# Semantic Query Classification System

## Overview

The semantic query classification system uses **embeddings and similarity scores** instead of keyword-based patterns to intelligently route user queries. This provides more accurate, context-aware routing with automatic fallback mechanisms.

## Key Principles

### 1. **No Hardcoded Keywords**
- ❌ Old: Pattern matching like `/^(what|how|explain)/i`
- ✅ New: Semantic similarity to intent examples using embeddings

### 2. **Automatic Knowledge Base Checking**
- Before routing to RAG, checks if relevant documents exist
- Automatically falls back to simple chat if KB is empty or irrelevant
- No error messages shown to users - seamless experience

### 3. **Context-Aware Routing**
- Uses conversation history for better classification
- Detects references to previous messages
- Adapts based on similarity confidence scores

### 4. **Graceful Degradation**
- Multiple fallback layers
- Never shows "collection empty" errors
- Always provides helpful responses

## Routing Modes

### 1. **RAG Mode** (Retrieval-Augmented Generation)
**When:** Educational/factual queries requiring knowledge retrieval

**Process:**
1. Query semantically matches RAG intent examples
2. System checks knowledge base for relevant documents
3. If relevant docs found (score > threshold) → Use RAG
4. If KB empty or low relevance → **Automatic fallback to simple chat**

**Examples:**
- "Explain how async/await works in JavaScript"
- "What are the principles of object-oriented programming"
- "Teach me about React hooks with examples"

### 2. **Simple Chat Mode**
**When:** Conversational, opinion-based, or general dialogue

**Process:**
- Query semantically matches conversational intent
- Directly uses LLM without knowledge retrieval

**Examples:**
- "Hello, how are you?"
- "That was helpful, thanks!"
- "What do you think about AI?"

### 3. **Session Memory Mode**
**When:** Query references previous conversation

**Process:**
- Detects contextual reference words in context
- Short query + conversation history + reference indicators
- Uses simple chat with conversation context

**Examples:**
- "What did you just tell me?"
- "Continue from where you left off"
- "Tell me more about that"
- "Expand on your previous answer"

### 4. **Platform Action Mode** (Future)
**When:** Request for platform features/tools

**Process:**
- Detects action intent semantically
- Currently falls back to simple chat
- Future: Integration with MCP tools

**Examples:**
- "Enroll me in the Python course"
- "Show my progress"
- "Generate flashcards from this conversation"
- "Create a learning roadmap"

## How It Works

### Intent Detection Pipeline

```
User Query
    ↓
[1. Security Check]
    ↓
[2. Embed Query] → Generate 384-dim vector
    ↓
[3. Calculate Similarity] → Compare with intent examples
    ↓
[4. Determine Primary Intent] → Highest similarity score
    ↓
[5. Route Based on Intent]
    ↓
┌─────────────────────────────────────────┐
│  RAG Intent?                            │
│  → Check KB relevance                   │
│  → If available: Use RAG                │
│  → If unavailable: Fallback to simple   │
└─────────────────────────────────────────┘
    ↓
[6. Generate Response]
    ↓
[7. Return with Mode Detection Metadata]
```

### Intent Similarity Calculation

The system uses **pre-computed embeddings** of intent examples:

```javascript
intentExamples = {
  rag: [
    "Explain the concept thoroughly with details",
    "What is the definition and meaning",
    "Teach me about this topic step by step",
    // ... more examples
  ],
  conversational: [
    "Hello, how are you doing today",
    "I appreciate your help, thank you",
    // ... more examples
  ],
  // ... other intents
}
```

For each query:
1. Compute query embedding
2. Calculate cosine similarity with all intent examples
3. Take **max similarity** for each intent category
4. Select intent with highest score

### Knowledge Base Check

Before routing to RAG:

```javascript
1. Check if ChromaDB is initialized
2. Perform semantic search with topK=3
3. Evaluate:
   - Collection empty? → Fallback
   - Best score < threshold? → Fallback
   - Relevant docs found? → Proceed with RAG
```

### Fallback Logic

Multiple layers of fallback:

```
Primary Intent Detection
    ↓
Intent = RAG?
    ↓ YES
ChromaDB Available?
    ↓ NO → Fallback (reason: ChromaDB unavailable)
    ↓ YES
Knowledge Collection Empty?
    ↓ YES → Fallback (reason: Collection empty)
    ↓ NO
Similarity Score > Threshold?
    ↓ NO → Fallback (reason: Low relevance)
    ↓ YES
Use RAG Mode ✓
```

All fallbacks are **transparent** - user gets proper LLM response, not errors.

## Configuration

### Enable Semantic Classification (Default)

```javascript
// Frontend (aiService.js)
const response = await aiService.chat(message, {
  conversationHistory: history,
  useSemanticClassifier: true, // Default: true
});
```

### Use Pattern-Based Classifier (Legacy)

```javascript
const response = await aiService.chat(message, {
  conversationHistory: history,
  useSemanticClassifier: false, // Use old regex patterns
});
```

### Force Specific Mode (Testing/Override)

```javascript
const response = await aiService.chat(message, {
  conversationHistory: history,
  forceMode: 'rag', // or 'simple'
});
```

## API Response Structure

### Response with Mode Detection Metadata

```json
{
  "success": true,
  "response": "Async/await is a syntactic feature...",
  "model": "llama-3.3-70b-versatile",
  "modeDetection": {
    "mode": "simple",
    "confidence": 0.82,
    "method": "semantic",
    "classifier": "semantic",
    "reasoning": "RAG intended but falling back: Knowledge collection empty",
    "selectedMode": "rag",
    "actualMode": "simple",
    "fallback": true,
    "reason": "Knowledge collection empty",
    "knowledgeCheck": {
      "available": false,
      "reason": "Knowledge base empty"
    }
  }
}
```

### Key Fields

- **mode**: Final routing decision (`rag`, `simple`, `sessionMemory`, `platformAction`)
- **confidence**: Similarity score (0-1)
- **classifier**: `semantic` or `pattern`
- **reasoning**: Human-readable explanation
- **selectedMode**: Initial intent detection
- **actualMode**: Final mode after fallbacks
- **fallback**: Whether fallback occurred
- **reason**: Why fallback happened (if applicable)

## Statistics & Monitoring

### Get Classifier Stats

```javascript
GET /api/ai/classifier/stats?useSemanticClassifier=true
```

**Response:**
```json
{
  "success": true,
  "totalClassifications": 156,
  "modeBreakdown": {
    "rag": 42,
    "simple": 98,
    "sessionMemory": 12,
    "platformAction": 4
  },
  "modePercentages": {
    "rag": "26.9",
    "simple": "62.8",
    "sessionMemory": "7.7",
    "platformAction": "2.6"
  },
  "fallbacks": 18,
  "fallbackRate": "11.5",
  "averageConfidence": 0.736,
  "knowledgeBaseChecks": 42,
  "classifierType": "semantic"
}
```

## Benefits Over Pattern-Based

| Feature | Pattern-Based | Semantic |
|---------|--------------|----------|
| **Accuracy** | Depends on keyword coverage | High - understands meaning |
| **Maintenance** | Update regex patterns regularly | Self-adapting via embeddings |
| **Flexibility** | Rigid keyword matching | Flexible semantic similarity |
| **Context Awareness** | Limited | Strong - uses conversation history |
| **Fallback** | Manual checks | Automatic KB relevance check |
| **Error Handling** | Shows "collection empty" | Graceful fallback |
| **Ambiguity** | Hard to handle | Confidence scores guide decisions |
| **New Patterns** | Must add keywords | Learns from intent examples |

## Example Scenarios

### Scenario 1: Educational Query with Empty KB

**User:** "Explain how async/await works in JavaScript"

**Process:**
1. Semantic similarity → RAG intent (confidence: 0.85)
2. Check knowledge base → Empty
3. **Automatic fallback** to simple chat
4. LLM provides educational explanation

**Response:** Full async/await explanation from LLM
**Metadata:** `fallback: true, reason: "Knowledge collection empty"`

### Scenario 2: Conversational Follow-up

**User:** "Tell me more about that"

**Context:** Previous message about Python

**Process:**
1. Short query detected
2. Has conversation history
3. Reference word "that" detected
4. Session memory intent (confidence: 0.85)
5. Use simple chat with context

**Response:** Expansion on previous Python topic
**Metadata:** `mode: "sessionMemory"`

### Scenario 3: Ambiguous Query

**User:** "Help me understand"

**Process:**
1. Semantic similarity calculated
2. Multiple intents close (RAG: 0.62, conversational: 0.58)
3. Confidence delta < 0.15 → Ambiguous
4. Default to simple chat with clarification

**Response:** "I'd be happy to help! What would you like to understand?"
**Metadata:** `ambiguous: true, confidence: 0.4`

## Migration from Pattern-Based

The system supports both classifiers:

- **Default:** Semantic classifier (`useSemanticClassifier: true`)
- **Legacy:** Pattern-based available for compatibility
- **Gradual migration:** Both can coexist
- **Testing:** Force mode for testing specific scenarios

## Future Enhancements

1. **LLM-Enhanced Classification**
   - Use small LLM for complex ambiguous cases
   - Combine embeddings + reasoning

2. **Platform Action Integration**
   - Connect to MCP tools
   - Execute platform operations directly

3. **Adaptive Learning**
   - Track classification accuracy
   - Adjust thresholds dynamically

4. **Multi-Intent Detection**
   - Handle queries with multiple intents
   - Parallel processing where appropriate

5. **Personalized Classification**
   - Learn user patterns over time
   - Adapt to individual communication styles

## Conclusion

The semantic query classification system provides **intelligent, automatic routing** with no user intervention required. It understands intent through semantic similarity, proactively checks knowledge base relevance, and gracefully falls back when needed - all while being completely transparent to the user.

**Key Takeaway:** Users never need to think about modes - the system intelligently adapts to provide the best response every time.
