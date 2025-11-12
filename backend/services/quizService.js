import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Generate flashcards from content
export const generateFlashcards = async (content, options = {}) => {
  if (!groq) {
    throw new Error('AI service not configured');
  }

  const { count = 10, difficulty = 'medium', deck = 'General' } = options;

  const systemPrompt = `You are an expert at creating effective flashcards for learning. Create high-quality flashcards that:

1. Focus on key concepts and facts
2. Use clear, concise language
3. Include context when needed
4. Are appropriately challenging
5. Follow active recall principles

Respond ONLY in valid JSON format:
{
  "flashcards": [
    {
      "front": "Question or prompt",
      "back": "Answer with explanation",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  const userPrompt = `Generate ${count} ${difficulty} flashcards from this content:

${content}

Create cards that test understanding of key concepts, definitions, and relationships.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.flashcards || [];
  } catch (error) {
    console.error('Flashcard generation error:', error);
    throw new Error('Failed to generate flashcards');
  }
};

// Generate quiz from content
export const generateQuiz = async (content, options = {}) => {
  if (!groq) {
    throw new Error('AI service not configured');
  }

  const {
    questionCount = 5,
    difficulty = 'medium',
    types = ['mcq', 'true_false'],
    topic = 'General'
  } = options;

  const systemPrompt = `You are an expert assessment creator. Generate high-quality quiz questions that:

1. Test understanding, not memorization
2. Include 3 plausible distractors for MCQs
3. Provide clear explanations for correct answers
4. Give helpful hints for wrong answers
5. Are pedagogically sound

Question types: ${types.join(', ')}

Respond ONLY in valid JSON format:
{
  "title": "Quiz title",
  "description": "Brief description",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct (2-3 sentences)",
      "wrongAnswerHints": [
        {
          "forAnswer": "Option B",
          "hint": "Why this is wrong"
        }
      ],
      "difficulty": "easy|medium|hard",
      "points": 1,
      "tags": ["topic1", "concept2"]
    },
    {
      "type": "true_false",
      "question": "Statement is correct",
      "correctAnswer": "true",
      "explanation": "Explanation",
      "difficulty": "easy",
      "points": 1,
      "tags": ["topic1"]
    },
    {
      "type": "fill_blank",
      "question": "The _____ is responsible for _____",
      "correctAnswer": "correct term",
      "explanation": "Explanation",
      "difficulty": "medium",
      "points": 1,
      "tags": ["topic1"]
    }
  ]
}`;

  const userPrompt = `Generate a ${questionCount}-question ${difficulty} quiz on: ${topic}

Content to base questions on:
${content}

Question types to include: ${types.join(', ')}

Create diverse, challenging questions that assess true understanding.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw new Error('Failed to generate quiz');
  }
};

// Generate coding challenge
export const generateCodingChallenge = async (topic, difficulty = 'medium', language = 'javascript') => {
  if (!groq) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an expert coding challenge creator. Generate practical coding problems that:

1. Test real-world programming skills
2. Include clear problem statements
3. Provide starter code
4. Include comprehensive test cases
5. Have educational value

Respond ONLY in valid JSON format:
{
  "question": "Problem description",
  "codingChallenge": {
    "language": "${language}",
    "starterCode": "function solve() {\\n  // Your code here\\n}",
    "testCases": [
      {
        "input": "input data",
        "expectedOutput": "expected output",
        "isHidden": false
      }
    ],
    "timeLimit": 5,
    "memoryLimit": 128
  },
  "explanation": "Solution approach",
  "difficulty": "${difficulty}",
  "tags": ["arrays", "algorithms"]
}`;

  const userPrompt = `Create a ${difficulty} coding challenge about: ${topic}
Language: ${language}

Include:
- Clear problem statement
- Starter code
- At least 3 test cases (2 visible, 1 hidden)
- Solution hints`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Coding challenge generation error:', error);
    throw new Error('Failed to generate coding challenge');
  }
};

// Generate quiz from conversation history
export const generateQuizFromConversation = async (messages, options = {}) => {
  const conversationContent = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n\n');

  return await generateQuiz(conversationContent, options);
};

// Export flashcards to Anki CSV format
export const exportToAnkiCSV = (flashcards) => {
  // Anki CSV format: front, back, tags
  const header = 'Front,Back,Tags\n';
  const rows = flashcards.map(card => {
    const front = `"${card.front.replace(/"/g, '""')}"`;
    const back = `"${card.back.replace(/"/g, '""')}"`;
    const tags = `"${(card.tags || []).join(' ')}"`;
    return `${front},${back},${tags}`;
  }).join('\n');

  return header + rows;
};

// Export quiz to JSON
export const exportQuizToJSON = (quiz, attempts = []) => {
  return JSON.stringify({
    quiz: {
      title: quiz.title,
      description: quiz.description,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions.map(q => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tags: q.tags
      }))
    },
    attempts: attempts.map(a => ({
      attemptNumber: a.attemptNumber,
      score: a.score,
      timeCompleted: a.timeCompleted,
      weakTopics: a.weakTopics
    })),
    exportedAt: new Date().toISOString()
  }, null, 2);
};
