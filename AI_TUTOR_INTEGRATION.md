# AI Tutor Integration Guide

## Overview

The AI Tutor system provides **Socratic teaching** using industry-level pedagogical techniques. Instead of giving direct answers, the AI guides students to discover concepts through questioning, scaffolding, and active learning.

**Key Features:**
- 🎯 Socratic method (guided discovery)
- 📚 Subject-specific teaching strategies
- 🎮 Adaptive difficulty (beginner → intermediate → advanced)
- 🏗️ Scaffolding technique (gradual complexity)
- ⚡ Active learning (student does 70% of the work)
- 🧠 Extended thinking display showing educational reasoning
- 🎭 Multi-phase teaching sessions
- 🌟 Gamification elements

---

## Architecture

### Backend Components

**1. `backend/ai/prompts/tutorPrompts.js`**
- Comprehensive teaching system prompts (300+ lines)
- Teaching principles (Socratic, scaffolding, active learning)
- 6 session phases (warmup → diagnostic → introduction → guided practice → independent practice → reflection)
- Subject-specific templates (programming, math, languages, sciences)
- Adaptive responses for different skill levels
- `generateTutorPrompt()` function composes contextual prompts

**2. `backend/services/aiOrchestrator.js`**
- `tutorChat()` method for teaching sessions
- Uses LangChain `SystemMessage` for tutor persona
- Integrates Groq LLM with teaching prompts
- Generates tutor-specific thinking steps
- Supports conversation history for context

**3. `backend/ai/thinking/thinkingGenerator.js`**
- `_generateTutorThinkingSteps()` method
- Tutor-specific phases:
  - **Understanding**: Analyzing student's question and learning objectives
  - **Assessment**: Determining knowledge level and misconceptions
  - **Planning**: Designing Socratic questions and scaffolded steps
  - **Formulation**: Crafting teaching response with questions/analogies

**4. `backend/controllers/aiController.js`**
- `tutorChat()` endpoint handler
- Validates input with `chatMessageSchema`
- Accepts: `message`, `subject`, `level`, `phase`, `conversationHistory`
- Returns: response, thinking steps, tutor metadata

**5. `backend/routes/aiRoutes.js`**
- Route: `POST /api/ai/tutor`
- Protected with authentication
- Rate limited (50 req/hour)

### Frontend Components

**`frontend/src/services/aiService.js`**
- `tutorChat(message, options)` method
- Options:
  - `subject`: 'general' | 'programming' | 'mathematics' | 'languages' | 'sciences'
  - `level`: 'beginner' | 'intermediate' | 'advanced'
  - `phase`: 'warmup' | 'diagnostic' | 'introduction' | 'guidedPractice' | 'independentPractice' | 'reflection'
  - `conversationHistory`: Array of previous exchanges

---

## API Reference

### POST /api/ai/tutor

**Endpoint**: `http://localhost:5000/api/ai/tutor`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "I want to learn about recursion in programming",
  "subject": "programming",
  "level": "beginner",
  "phase": "introduction",
  "conversationHistory": []
}
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| message | string | ✅ | - | Student's question or message |
| subject | string | ❌ | 'general' | Subject area |
| level | string | ❌ | 'intermediate' | Student's skill level |
| phase | string | ❌ | 'introduction' | Current teaching phase |
| conversationHistory | array | ❌ | [] | Previous conversation exchanges |

**Subject Options**:
- `general` - General topics
- `programming` - Code, algorithms, data structures
- `mathematics` - Math concepts, formulas, problem-solving
- `languages` - Foreign language learning
- `sciences` - Physics, chemistry, biology

**Level Options**:
- `beginner` - More analogies, smaller steps, frequent encouragement
- `intermediate` - Build on existing knowledge, proper terminology
- `advanced` - Deep theory, complex problems, optimizations

**Phase Options**:
- `warmup` - Friendly greeting, set learning objective
- `diagnostic` - Assess current understanding
- `introduction` - Introduce concept with analogy/story
- `guidedPractice` - Work through examples together
- `independentPractice` - Student solves with minimal help
- `reflection` - Summarize learning, preview next topic

**Response**:
```json
{
  "success": true,
  "response": "Let's explore recursion together! 🤔 Imagine you're looking at a set of Russian nesting dolls...",
  "model": "llama-3.3-70b-versatile",
  "tutorMode": true,
  "subject": "programming",
  "level": "beginner",
  "phase": "introduction",
  "thinking": {
    "steps": [
      {
        "phase": "understanding",
        "title": "Understanding the question",
        "content": "Analyzing student's query about recursion...",
        "timestamp": 1700000000000,
        "duration": 250
      },
      {
        "phase": "assessment",
        "title": "Assessing knowledge level",
        "content": "Determining student's current understanding...",
        "timestamp": 1700000250,
        "duration": 300
      },
      {
        "phase": "planning",
        "title": "Planning teaching approach",
        "content": "Designing Socratic questions to guide discovery...",
        "timestamp": 1700000550,
        "duration": 400
      },
      {
        "phase": "formulation",
        "title": "Crafting teaching response",
        "content": "Preparing questions, analogies, and examples...",
        "timestamp": 1700000950,
        "duration": 300
      }
    ],
    "summary": {
      "totalSteps": 4,
      "totalDuration": 1250,
      "phases": ["understanding", "assessment", "planning", "formulation"],
      "summary": "Completed 4 thinking steps across 4 phases in 1.25s"
    },
    "totalDuration": 1250
  }
}
```

---

## Frontend Integration

### Basic Usage

```javascript
import aiService from './services/aiService';

// Simple tutor chat
const response = await aiService.tutorChat(
  "How do loops work in JavaScript?",
  {
    subject: 'programming',
    level: 'beginner',
    phase: 'introduction'
  }
);

console.log(response.response); // AI's teaching response
console.log(response.thinking.steps); // Educational reasoning process
```

### Full Teaching Session

```javascript
import { useState } from 'react';
import aiService from './services/aiService';

function TutorSession() {
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('warmup');
  const [studentLevel, setStudentLevel] = useState('intermediate');

  const sendMessage = async (userMessage) => {
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'student', content: userMessage }]);

    // Call tutor API
    const response = await aiService.tutorChat(userMessage, {
      subject: 'programming',
      level: studentLevel,
      phase: currentPhase,
      conversationHistory: conversationHistory
    });

    // Add tutor response to chat
    setMessages(prev => [...prev, {
      role: 'tutor',
      content: response.response,
      thinking: response.thinking
    }]);

    // Update conversation history for context
    setConversationHistory(prev => [...prev, {
      question: userMessage,
      answer: response.response
    }]);
  };

  return (
    <div className="tutor-session">
      {/* Subject selector */}
      <select value={subject} onChange={e => setSubject(e.target.value)}>
        <option value="programming">Programming</option>
        <option value="mathematics">Mathematics</option>
        <option value="languages">Languages</option>
        <option value="sciences">Sciences</option>
      </select>

      {/* Level selector */}
      <select value={studentLevel} onChange={e => setStudentLevel(e.target.value)}>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      {/* Phase indicator */}
      <div className="phase-indicator">
        Current Phase: {currentPhase}
      </div>

      {/* Messages */}
      {messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.role}`}>
          {/* Show thinking process for tutor messages */}
          {msg.role === 'tutor' && msg.thinking && (
            <StreamingThinkingProcess
              phases={msg.thinking.steps}
              isStreaming={false}
            />
          )}
          <div className="content">{msg.content}</div>
        </div>
      ))}

      {/* Input */}
      <input
        onKeyPress={e => e.key === 'Enter' && sendMessage(e.target.value)}
        placeholder="Ask a question..."
      />
    </div>
  );
}
```

### Integration with Existing Chat.jsx

Add tutor mode toggle to the Chat component:

```javascript
// In Chat.jsx
const [aiMode, setAiMode] = useState('simple'); // Add 'tutor' option
const [tutorConfig, setTutorConfig] = useState({
  subject: 'general',
  level: 'intermediate',
  phase: 'introduction',
  conversationHistory: []
});

// Update send message handler
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!inputMessage.trim() || loading) return;

  const userMessageText = inputMessage.trim();
  setInputMessage('');
  setLoading(true);

  try {
    let result;

    if (aiMode === 'tutor') {
      // Use tutor mode
      result = await aiService.tutorChat(userMessageText, tutorConfig);

      // Update conversation history
      setTutorConfig(prev => ({
        ...prev,
        conversationHistory: [
          ...prev.conversationHistory,
          { question: userMessageText, answer: result.response }
        ]
      }));
    } else if (aiMode === 'rag') {
      result = await aiService.ragQuery(userMessageText);
    } else {
      result = await aiService.chat(userMessageText);
    }

    // Add messages to chat
    const aiMessage = {
      role: 'assistant',
      content: result.response || result.answer,
      thinking: result.thinking,
      tutorMode: result.tutorMode,
      subject: result.subject,
      sources: result.sources
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
  } catch (error) {
    console.error('Chat error:', error);
  } finally {
    setLoading(false);
  }
};

// Add mode selector UI
<div className="mode-selector">
  <button
    onClick={() => setAiMode('simple')}
    className={aiMode === 'simple' ? 'active' : ''}
  >
    💬 Simple Chat
  </button>
  <button
    onClick={() => setAiMode('rag')}
    className={aiMode === 'rag' ? 'active' : ''}
  >
    📚 RAG Mode
  </button>
  <button
    onClick={() => setAiMode('tutor')}
    className={aiMode === 'tutor' ? 'active' : ''}
  >
    🎓 Tutor Mode
  </button>
</div>

{/* Tutor config panel (when tutor mode active) */}
{aiMode === 'tutor' && (
  <div className="tutor-config">
    <select
      value={tutorConfig.subject}
      onChange={e => setTutorConfig(prev => ({ ...prev, subject: e.target.value }))}
    >
      <option value="general">General</option>
      <option value="programming">Programming</option>
      <option value="mathematics">Mathematics</option>
      <option value="languages">Languages</option>
      <option value="sciences">Sciences</option>
    </select>

    <select
      value={tutorConfig.level}
      onChange={e => setTutorConfig(prev => ({ ...prev, level: e.target.value }))}
    >
      <option value="beginner">Beginner</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
    </select>
  </div>
)}
```

---

## Teaching Principles

### 1. Socratic Method

**Never give direct answers immediately. Guide through questioning.**

❌ **Bad Response**:
```
"Recursion is when a function calls itself."
```

✅ **Good Response**:
```
"What do you think happens if a function could call itself? Let's explore together...

Imagine you're standing between two mirrors. What do you see?

Try to think about what would happen if a function did the same thing - if it could 'look at itself' by calling itself. What would need to happen for it to eventually stop?"
```

### 2. Scaffolding Technique

**Start with what the student knows, build complexity gradually.**

Example progression:
1. "You know how to use loops, right?"
2. "What if we could break a big problem into smaller identical problems?"
3. "Recursion does exactly that - let's see how..."
4. "Now let's add a base case to stop the recursion..."
5. "Finally, let's optimize it with memoization..."

### 3. Active Learning

**Student does 70% of the work, tutor guides 30%.**

Example:
```
Tutor: "Let's calculate factorial(5) together. What's the first step?"
Student: "Multiply 5 by 4?"
Tutor: "Good start! But in recursion, we break it down. What's factorial(5) in terms of factorial(4)?"
Student: "5 * factorial(4)?"
Tutor: "Exactly! 🎉 Now YOU calculate factorial(4) the same way..."
```

---

## Teaching Phases

### Phase 1: Warmup
**Goal**: Set the stage, create engagement

```
"Hey! 👋 Great to see you! Today we'll explore recursion in programming. By the end, you'll be able to write recursive functions and understand when to use them. Sound good?"
```

### Phase 2: Diagnostic
**Goal**: Assess current knowledge

```
"Before we dive in, let me ask:
1. What do you already know about functions in programming?
2. Have you heard of the term 'recursion' before?
3. Can you think of any real-world examples of things that repeat or refer to themselves?"
```

### Phase 3: Introduction
**Goal**: Introduce concept with hooks

```
"Imagine you're organizing files in folders, and each folder can contain more folders. To count all files, you'd need to:
1. Count files in current folder
2. For each subfolder, repeat the same process

That's recursion! A problem that contains smaller versions of itself. 🤯"
```

### Phase 4: Guided Practice
**Goal**: Work through examples together

```
"Let's write our first recursive function TOGETHER:

function countdown(n) {
  // What should we do when n reaches 0? (This is the base case)
  // What should we do for other numbers?
}

Think about it, then tell me what you'd put in each part!"
```

### Phase 5: Independent Practice
**Goal**: Student solves with minimal help

```
"Now it's your turn! 💪

Write a recursive function to calculate the sum of numbers from 1 to n.

Hints:
- What's the base case? (When should it stop?)
- What's the recursive case? (How does sum(n) relate to sum(n-1)?)

Give it a try, and I'll help if you get stuck!"
```

### Phase 6: Reflection
**Goal**: Consolidate learning, preview next

```
"Awesome work! 🎉 Let's recap what you learned:
- Recursion is when a function calls itself
- Every recursive function needs a base case
- It breaks problems into smaller identical problems

Stretch challenge: How would you prevent stack overflow in deep recursion?

Next time, we'll explore tail recursion optimization!"
```

---

## Adaptive Teaching

### Beginner Level
- More analogies and visual representations
- Smaller, simpler steps
- Frequent encouragement
- Avoid jargon
- More guided practice

### Intermediate Level
- Build on existing knowledge
- Introduce proper terminology
- More independent practice
- Edge cases and variations
- Connect concepts together

### Advanced Level
- Dive deeper into theory
- Complex challenges
- Discuss optimizations
- Explore alternatives
- Encourage creative solutions

---

## Subject-Specific Approaches

### Programming
1. Start with pseudocode
2. Show real code
3. Code together
4. Let student code
5. Debug errors together
6. Optimize/improve

### Mathematics
1. Real-world scenario
2. Visual representation
3. Pattern discovery
4. Formalize the pattern
5. Practice variations
6. Challenge problems

### Languages
1. Immersion (use target language when possible)
2. Context-based scenarios
3. Pronunciation guides
4. Cultural connections
5. Conversational practice

### Sciences
1. Inquiry-based questions
2. Experiments/thought experiments
3. Predictions → test → explain
4. Observable phenomena
5. Address misconceptions

---

## Example Teaching Session

### Student: "I want to learn about binary search"

**Phase: Warmup**
```
Tutor: "Hey! 👋 Excited to explore binary search with you! By the end of this session, you'll understand how binary search works and when to use it. Ready to dive in?"
```

**Phase: Diagnostic**
```
Tutor: "Quick questions to understand where you're at:
1. Have you worked with arrays before?
2. Do you know what sorting means?
3. How would you find a name in a phone book? 📖"
```

**Phase: Introduction**
```
Tutor: "Perfect! So you mentioned using a phone book. You wouldn't start at 'A' and go through every single name to find 'Smith,' right?

What would you actually do? Think about it... 🤔"
```

**Student: "I'd open it somewhere in the middle?"**

```
Tutor: "Exactly! 🎉 And then what?

Let's say you open to 'M' but you're looking for 'Smith.' What now?"
```

**Student: "Go to the right half?"**

```
Tutor: "YES! That's binary search! You just:
1. Check the middle
2. Eliminate half of the remaining options
3. Repeat

That's WAY faster than checking every single entry. In fact, if a phone book has 1 million names, binary search finds any name in about 20 steps! 🚀

Now, what do you think the array needs to be for this to work?"
```

**Phase: Guided Practice**
```
Tutor: "Let's code it together:

function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  // What condition should we use in the while loop?
  // Think about when we should stop searching...
}

What would you put for the while condition?"
```

---

## Best Practices

### DO ✅
- Ask questions to guide discovery
- Check understanding frequently
- Use analogies and real-world examples
- Celebrate effort and progress
- Keep responses concise (3-5 sentences before asking a question)
- Adapt difficulty based on student responses
- Use emojis sparingly for warmth
- Always end with a question or practice opportunity

### DON'T ❌
- Give direct answers immediately
- Use excessive jargon with beginners
- Move forward without checking understanding
- Lecture for too long without interaction
- Assume prior knowledge
- Dismiss mistakes (they're learning opportunities!)
- Skip the "why" to focus only on "what"

---

## Testing

### Manual Testing (with curl)

```bash
# Test tutor endpoint
curl -X POST http://localhost:5000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "I want to learn about recursion",
    "subject": "programming",
    "level": "beginner",
    "phase": "introduction"
  }'
```

### Frontend Testing

```javascript
// Test in browser console
const response = await fetch('http://localhost:5000/api/ai/tutor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    message: "Explain variables to me",
    subject: "programming",
    level: "beginner",
    phase: "introduction"
  })
});

const data = await response.json();
console.log(data);
```

---

## Next Steps

### Immediate
1. ✅ Backend integration complete
2. ✅ Frontend service method added
3. 🔲 Add tutor mode toggle in Chat UI
4. 🔲 Test with real teaching sessions
5. 🔲 Add phase progression logic

### Future Enhancements
- Streaming support (SSE) for tutor responses
- Student progress tracking
- Learning path recommendations
- Achievement system
- Spaced repetition for concept review
- Multi-turn session management
- Voice-to-voice tutor mode
- Interactive code execution sandbox

---

## Troubleshooting

### Issue: Tutor gives direct answers
**Solution**: Ensure the phase is set correctly. The system prompt emphasizes Socratic method, but initial phases (warmup, diagnostic) may be more direct.

### Issue: Thinking steps not showing
**Solution**: Check that frontend is displaying `thinking.steps` from the response. Use `StreamingThinkingProcess` or `ThinkingProcess` component.

### Issue: Responses too generic
**Solution**: Provide more context in `conversationHistory`. The more conversation history, the more personalized the teaching.

### Issue: Wrong difficulty level
**Solution**: Adjust the `level` parameter or let the system auto-adjust based on student responses (future feature).

---

## Support

For issues or questions:
1. Check this documentation
2. Review `tutorPrompts.js` for prompt details
3. Test with different subjects/levels/phases
4. Check console for errors

---

**Version**: 1.0.0
**Status**: ✅ Ready for Integration
**Created**: November 15, 2025
**Endpoint**: `POST /api/ai/tutor`
