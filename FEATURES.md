# Mini AI Tutor - Advanced Features Documentation

## 🎯 Overview

This document outlines the advanced features implemented in the Mini AI Tutor platform, including personalized learning roadmaps, smart flashcards, quiz generation, and comprehensive content moderation.

---

## 📚 Feature 1: Personalized Learning Roadmaps

### Core Capabilities

Generate AI-powered, goal-based study plans tailored to:
- User's learning goal
- Current skill level (novice, intermediate, advanced)
- Weekly time commitment
- Target completion date
- Preferred learning styles (video, text, hands-on, interactive)

### What's Included

**Weekly Modules:**
- Progressive curriculum with clear objectives
- Daily task breakdowns with time estimates
- Curated learning resources (videos, articles, exercises)
- Prerequisite tracking (modules unlock progressively)

**Milestones & Tracking:**
- Achievement markers at key learning points
- Automatic progress calculation
- Completion criteria (quizzes, projects, minimum scores)

**Adaptive Learning:**
- Monitors consecutive missed milestones
- Automatically enters "remediation mode" after 2 missed milestones
- Recalculates roadmap based on performance
- Adjusts pacing and difficulty

### API Endpoints

```
POST   /api/roadmaps/generate              - Generate new roadmap
GET    /api/roadmaps                        - Get all user roadmaps
GET    /api/roadmaps/:id                    - Get single roadmap
PUT    /api/roadmaps/:id/progress           - Update progress
PUT    /api/roadmaps/:id/milestones/:index/complete - Complete milestone
POST   /api/roadmaps/:id/adapt              - Adapt roadmap based on performance
DELETE /api/roadmaps/:id                    - Delete roadmap
```

### UI Features

**Premium Multi-Step Creation Form:**
- Step 1: Define learning goal
- Step 2: Set experience level and time commitment
- Step 3: Select learning preferences
- Beautiful progress indicator
- Minimalistic, trustworthy design

---

## 🎴 Feature 2: Smart Flashcard System

### Core Capabilities

**Auto-Generation:**
- Generate flashcards from:
  - Conversation history
  - Specific topics
  - Lesson content
- AI creates front/back pairs with tags

**Spaced Repetition (SM-2 Algorithm):**
- Scientifically-proven memorization technique
- Automatically schedules review dates
- Tracks retention rates
- Adjusts difficulty based on performance

### How Spaced Repetition Works

The system uses the SM-2 algorithm:
1. User reviews a flashcard
2. Rates difficulty (0-5 scale)
3. Algorithm calculates next review date
4. Cards you struggle with appear more frequently
5. Mastered cards appear less often

### Flashcard Features

- **Deck Organization:** Group cards by topic
- **Performance Analytics:** Track correct/incorrect rates
- **Response Time Tracking:** Monitor learning speed
- **Export to Anki:** Download as CSV for Anki app

### API Endpoints

```
POST   /api/study/flashcards/generate      - Generate flashcards
GET    /api/study/flashcards/due           - Get cards due for review
POST   /api/study/flashcards/:id/review    - Review a flashcard
GET    /api/study/flashcards/decks         - Get all decks with stats
GET    /api/study/flashcards/export        - Export to Anki CSV
```

---

## 📝 Feature 3: Smart Quiz Generator

### Supported Question Types

1. **Multiple Choice (MCQ)**
   - 4 options with 3 plausible distractors
   - Explanation for correct answer
   - Hints for each wrong answer

2. **True/False**
   - Statement validation
   - Explanation provided

3. **Fill-in-the-Blank**
   - Contextual completion questions
   - Accepts multiple correct answers

4. **Coding Challenges** (Planned)
   - Language-specific problems
   - Test cases (visible & hidden)
   - Time and memory limits
   - Automatic evaluation

### Quiz Features

**Generation:**
- From conversation history
- From specific topics
- Custom difficulty levels
- Mixed question types

**Assessment:**
- Auto-grading with immediate feedback
- Performance tracking by topic
- Weak area identification
- Personalized recommendations

**Attempts & Analytics:**
- Multiple attempt support
- Attempt history
- Score percentages
- Time tracking
- Export results as JSON

### API Endpoints

```
POST   /api/study/quizzes/generate         - Generate quiz
GET    /api/study/quizzes                   - Get all quizzes
GET    /api/study/quizzes/:id               - Get quiz details
POST   /api/study/quizzes/:id/submit        - Submit quiz attempt
GET    /api/study/quizzes/:id/export        - Export quiz as JSON
```

---

## 🛡️ Feature 4: Content Moderation & Safety

### Moderation Rules

The system automatically detects and handles:

**Critical Violations (Immediate Refusal):**
- Illegal activity instructions
- Harmful content / self-harm
- Copyright violations

**High-Priority Violations:**
- Medical diagnoses or prescriptions
- Legal advice
- Financial investment advice

**Medium-Priority Violations:**
- Impersonation requests
- Non-educational transactional requests

### Safety Response System

**Refusal Messages:**
- Friendly, clear explanations
- Educational alternatives offered
- Professional resource recommendations

**Example Refusals:**

1. **Illegal Activity:**
   ```
   "I can't help with that request. However, I can teach cybersecurity
   fundamentals, ethical hacking principles, or information security
   best practices if you're interested in these topics for educational
   or career purposes."
   ```

2. **Medical Advice:**
   ```
   "I can't provide medical diagnoses or treatment advice. For health
   concerns, please consult a licensed healthcare professional.

   I can teach you about: Human anatomy, physiology, health sciences,
   or medical career paths if that interests you."
   ```

3. **Self-Harm Content:**
   ```
   "I'm concerned about what you've shared. Please reach out for help:

   🆘 Crisis Resources:
   - National Suicide Prevention Lifeline: 988 or 1-800-273-8255
   - Crisis Text Line: Text HOME to 741741
   - International: findahelpline.com

   You don't have to face this alone. Professional support is available 24/7."
   ```

### Moderation Logging

Every violation is logged with:
- Timestamp
- User ID
- Original prompt
- Violation type
- Severity level
- Action taken
- Suggested alternatives

**Repeated Violation Detection:**
- Tracks violations over 7-day periods
- Flags users with 3+ high/critical violations
- Requires human review for flagged accounts

### API Protection

Content moderation is applied automatically to:
- `/api/chat` - All chat messages
- Any user-generated content endpoints

---

## 🎨 UI/UX Design Philosophy

### Minimalist & Premium

**Color Scheme:**
- Primary: Blue gradient (#0ea5e9)
- Accents: Purple, green, orange
- Neutral: Grayscale palette
- Clean white backgrounds

**Typography:**
- Clear, readable fonts
- Generous spacing
- Visual hierarchy

**Components:**
- Rounded corners
- Soft shadows
- Smooth transitions
- Hover effects

**Trust Signals:**
- Clear progress indicators
- Success confirmations
- Helpful error messages
- Professional polish

### Responsive Design

All features work seamlessly on:
- Desktop (1920x1080+)
- Laptop (1366x768+)
- Tablet (768x1024+)
- Mobile (375x667+)

---

## 🔧 Technical Stack

### Backend
- **Models:** Mongoose schemas with validation
- **Services:** AI integration with Groq API
- **Middleware:** Content moderation, rate limiting
- **Controllers:** RESTful API logic
- **Security:** Helmet, CORS, JWT

### Frontend
- **React:** Component-based UI
- **Vite:** Fast build system
- **Tailwind CSS:** Utility-first styling
- **React Router:** Client-side routing
- **Axios:** API communication

### AI Integration
- **Groq API:** LLM-3.1 70B model
- **JSON Mode:** Structured responses
- **Temperature:** 0.6-0.7 for creativity
- **Max Tokens:** 2000-4000 depending on task

---

## 📊 Performance Metrics

### Spaced Repetition Effectiveness
- Retention rates tracked per card
- Review intervals dynamically adjusted
- Performance trends visualized

### Quiz Analytics
- Success rate by topic
- Average completion time
- Weak area identification
- Progress over time

### Roadmap Completion
- Module completion percentage
- Time on task vs estimated
- Milestone achievement rate
- Adaptive pacing effectiveness

---

## 🚀 Getting Started

### 1. Generate a Learning Roadmap

```
1. Go to "Create Roadmap" in navigation
2. Enter your learning goal (e.g., "Become a React developer")
3. Select your current level
4. Set weekly time commitment
5. Choose learning preferences
6. Click "Generate Roadmap"
7. AI creates personalized plan in ~10 seconds
```

### 2. Generate Flashcards

```
1. Have a conversation with AI tutor about a topic
2. Click "Generate Flashcards" button
3. Select number of cards (5-20)
4. Choose difficulty level
5. Review cards using spaced repetition
```

### 3. Take a Quiz

```
1. Generate quiz from conversation or topic
2. Select question count and types
3. Complete the quiz
4. Get instant feedback
5. Review weak areas
6. Retake if needed
```

---

## 🔐 Security & Privacy

### Data Protection
- All user data encrypted
- JWT token-based authentication
- Passwords hashed with bcrypt
- No PII exposed in logs

### Content Safety
- Automatic content screening
- Violation logging
- Human review for critical cases
- Clear refusal policies

### API Security
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation

---

## 📈 Future Enhancements

### Phase 2 (Planned)
- Live coding sandboxes
- Video lesson integration
- Peer learning communities
- Certificate generation
- Mobile app (React Native)

### Phase 3 (Roadmap)
- Voice-based learning
- AR/VR experiences
- Multi-language support
- Enterprise features
- Integration with LMS platforms

---

## 🤝 Contributing

To add new features:
1. Follow existing code patterns
2. Add comprehensive error handling
3. Include content moderation where needed
4. Write clear API documentation
5. Design with UI/UX best practices
6. Test thoroughly before committing

---

## 📞 Support

For questions or issues:
- GitHub Issues: [Report a bug]
- Documentation: See README.md
- API Docs: See inline comments

---

**Built with ❤️ for learners everywhere**
