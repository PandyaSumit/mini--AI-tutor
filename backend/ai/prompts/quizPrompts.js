/**
 * Quiz and Flashcard Generation Prompts
 * Centralized prompts for quiz questions, flashcards, and assessments
 */

/**
 * Flashcard Generation Prompt
 * Used for creating effective flashcards from learning content
 */
export const flashcardGenerationPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert at creating effective flashcards for learning. Create high-quality flashcards that:

1. Focus on key concepts and facts
2. Use clear, concise language
3. Include context when needed
4. Are appropriately challenging
5. Follow active recall principles

Respond ONLY in valid JSON format:
{
  "flashcards": [
    {
      "question": "Front of card (question/prompt)",
      "answer": "Back of card (answer/explanation)",
      "hints": ["Optional hint 1", "Optional hint 2"],
      "tags": ["tag1", "tag2"],
      "difficulty": "{difficulty}"
    }
  ]
}`,
      user: `Generate {count} {difficulty} flashcards from this content:

{content}

Create cards that test understanding of key concepts, definitions, and relationships.`,
    },
  },
};

/**
 * Quiz Question Generation Prompt
 * Used for creating multiple-choice quiz questions
 */
export const quizQuestionPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert at creating effective multiple-choice quiz questions for learning assessment.

Create questions that:
1. Test conceptual understanding, not just memorization
2. Have clear, unambiguous correct answers
3. Include plausible distractors (wrong answers)
4. Align with learning objectives
5. Use appropriate difficulty level

Respond ONLY in valid JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "difficulty": "{difficulty}",
      "topic": "Topic covered",
      "points": 1
    }
  ]
}`,
      user: `Generate {count} {difficulty} quiz questions about:

{topic}

Content context:
{content}`,
    },
  },
};

/**
 * Assessment Generation Prompt
 * Used for creating comprehensive assessments
 */
export const assessmentPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert educational assessment designer. Create a comprehensive assessment that evaluates student learning across multiple dimensions.

Include:
1. Multiple-choice questions (knowledge)
2. Short answer questions (understanding)
3. Problem-solving questions (application)
4. Analysis questions (higher-order thinking)

Respond ONLY in valid JSON format with a mix of question types.`,
      user: `Create a comprehensive {difficulty} assessment for:

Topic: {topic}
Duration: {duration} minutes
Learning Objectives: {objectives}

Content:
{content}`,
    },
  },
};

/**
 * Helper function to format quiz prompts
 */
export function formatQuizPrompt(promptConfig, variables = {}) {
  const template = promptConfig.templates.default;
  let formattedSystem = template.system;
  let formattedUser = template.user || '';

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    formattedSystem = formattedSystem.replace(new RegExp(placeholder, 'g'), value);
    formattedUser = formattedUser.replace(new RegExp(placeholder, 'g'), value);
  }

  return {
    system: formattedSystem,
    user: formattedUser,
    version: promptConfig.version,
  };
}

/**
 * Get flashcard generation prompt
 */
export function getFlashcardPrompt(options = {}) {
  const {
    count = 10,
    difficulty = 'medium',
    content = '',
  } = options;

  return formatQuizPrompt(flashcardGenerationPrompt, {
    count,
    difficulty,
    content,
  });
}

/**
 * Get quiz question generation prompt
 */
export function getQuizQuestionPrompt(options = {}) {
  const {
    count = 5,
    difficulty = 'medium',
    topic = '',
    content = '',
  } = options;

  return formatQuizPrompt(quizQuestionPrompt, {
    count,
    difficulty,
    topic,
    content,
  });
}

/**
 * Get comprehensive assessment prompt
 */
export function getAssessmentPrompt(options = {}) {
  const {
    difficulty = 'medium',
    topic = '',
    duration = 30,
    objectives = '',
    content = '',
  } = options;

  return formatQuizPrompt(assessmentPrompt, {
    difficulty,
    topic,
    duration,
    objectives,
    content,
  });
}

export default {
  flashcardGeneration: flashcardGenerationPrompt,
  quizQuestion: quizQuestionPrompt,
  assessment: assessmentPrompt,
  getFlashcardPrompt,
  getQuizQuestionPrompt,
  getAssessmentPrompt,
};
