/**
 * Course Generation Prompts
 * Centralized prompts for course creation, modules, lessons, and previews
 *
 * Features:
 * - Versioned prompts for A/B testing
 * - Localization support
 * - Reusable templates with variable substitution
 */

/**
 * Course Structure Generation
 * Used for generating complete course structure from user prompt
 */
export const courseStructurePrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert course curriculum designer. Create a comprehensive course structure based on the user's request.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Course Title",
  "description": "Detailed course description (2-3 sentences)",
  "category": "one of: programming, mathematics, science, language, business, design, other",
  "level": "{level}",
  "tags": ["tag1", "tag2", "tag3"],
  "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "objectives": ["objective1", "objective2"],
      "lessons": [
        {
          "title": "Lesson 1 Title",
          "content": "Detailed lesson content (5-8 paragraphs explaining the topic thoroughly)",
          "duration": 15,
          "objectives": ["Learn X", "Understand Y"],
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "examples": [
            {
              "title": "Example Title",
              "code": "code example if applicable",
              "explanation": "What this example demonstrates"
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create exactly {numModules} modules
- Each module should have exactly {lessonsPerModule} lessons
- Lesson content must be comprehensive (minimum 300 words)
- Include practical examples
- Tailor difficulty to {level} level
- Make it engaging and educational`,
      user: `{userPrompt}`,
    },
  },
};

/**
 * Course Preview Generation
 * Used for quick course outline previews
 */
export const coursePreviewPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `Generate a brief course outline based on this request.

Return ONLY a valid JSON object:
{
  "title": "Course Title",
  "description": "Course description",
  "category": "category",
  "level": "{level}",
  "modulesTitles": ["Module 1", "Module 2", ...],
  "estimatedDuration": 120
}`,
      user: `{userPrompt}`,
    },
  },
};

/**
 * Lesson AI Instructions
 * System prompt for AI tutoring within lessons
 */
export const lessonTutorPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert tutor teaching "{lessonTitle}". Provide clear, detailed explanations and encourage questions. Tailor your responses to {level} level students.`,
      contextGuidelines: `Always refer back to the lesson content when answering questions. The key learning objectives are: {objectives}.`,
    },
  },
};

/**
 * Course Specialization Justification
 * Used for generating justifications for specialized course versions
 */
export const courseSpecializationPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are a course specialization advisor. Based on the parent course and the specialization request, provide a detailed justification for creating a specialized version.

Analyze:
1. Target audience differences
2. Unique value proposition
3. Content differentiation strategy
4. Market demand assessment

Return a concise 2-3 sentence justification explaining why this specialized course should exist alongside the parent course.`,
      user: `Parent Course: {parentTitle}\nSpecialization Request: {specializationRequest}`,
    },
  },
};

/**
 * Course Quality Assessment
 * Used for assessing course quality and providing improvement suggestions
 */
export const courseQualityPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are a course quality assessment expert. Analyze the provided course structure and provide a quality score (0-100) along with specific improvement suggestions.

Criteria:
- Content depth and accuracy
- Learning outcome clarity
- Structure and progression
- Practical examples quality
- Engagement elements

Return JSON:
{
  "qualityScore": 85,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "missingElements": ["element1", "element2"]
}`,
      user: `Course Data: {courseData}`,
    },
  },
};

/**
 * Helper function to format prompts with variable substitution
 */
export function formatCoursePrompt(promptConfig, variables = {}) {
  const template = promptConfig.templates.default;
  let formattedSystem = template.system;
  let formattedUser = template.user || '';

  // Replace all variables in both system and user prompts
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
 * Get course structure generation prompt
 */
export function getCourseStructurePrompt(options = {}) {
  const {
    level = 'beginner',
    numModules = 5,
    lessonsPerModule = 4,
    userPrompt = '',
  } = options;

  return formatCoursePrompt(courseStructurePrompt, {
    level,
    numModules,
    lessonsPerModule,
    userPrompt,
  });
}

/**
 * Get course preview prompt
 */
export function getCoursePreviewPrompt(options = {}) {
  const { level = 'beginner', userPrompt = '' } = options;

  return formatCoursePrompt(coursePreviewPrompt, {
    level,
    userPrompt,
  });
}

/**
 * Get lesson tutor prompt
 */
export function getLessonTutorPrompt(options = {}) {
  const {
    lessonTitle = 'this topic',
    level = 'beginner',
    objectives = 'understanding the fundamentals',
  } = options;

  // Format objectives if it's an array
  const objectivesStr = Array.isArray(objectives) ? objectives.join(', ') : objectives;

  return formatCoursePrompt(lessonTutorPrompt, {
    lessonTitle,
    level,
    objectives: objectivesStr,
  });
}

/**
 * Get course specialization prompt
 */
export function getCourseSpecializationPrompt(options = {}) {
  const {
    parentTitle = '',
    specializationRequest = '',
  } = options;

  return formatCoursePrompt(courseSpecializationPrompt, {
    parentTitle,
    specializationRequest,
  });
}

/**
 * Get course quality assessment prompt
 */
export function getCourseQualityPrompt(courseData = {}) {
  return formatCoursePrompt(courseQualityPrompt, {
    courseData: JSON.stringify(courseData, null, 2),
  });
}

/**
 * Generate Common Questions for Topic
 * Used by CoursePreparationAgent
 */
export const commonQuestionsPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert educator preparing teaching materials.

Generate 20 common questions that students typically ask about this topic, with clear, concise answers.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "questions": [
    {
      "question": "What is X?",
      "answer": "X is... (2-3 sentences)"
    }
  ]
}

Guidelines:
- Questions should cover basics, common misconceptions, and practical applications
- Answers should be clear, accurate, and beginner-friendly
- Include "why" and "how" questions, not just "what"
- Cover edge cases and gotchas`,
      user: `Topic: {topicTitle}

Learning Objectives:
{learningObjectives}

Key Concepts:
{keyConcepts}

Generate 20 common questions and answers:`,
    },
  },
};

/**
 * Explain Concept
 * Used by CoursePreparationAgent for generating concept explanations
 */
export const explainConceptPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert educator. Explain the following concept clearly and concisely.

Guidelines:
- Start with a simple definition
- Provide a real-world analogy
- Give a practical example
- Keep it to 2-3 paragraphs
- Use beginner-friendly language`,
      user: `Course: {courseTitle}
Course Context: {courseDescription}

Concept to explain: {concept}

Provide a clear explanation:`,
    },
  },
};

/**
 * Helper function to generate common questions prompt
 */
export function generateCommonQuestions(options = {}) {
  const {
    topicTitle = '',
    learningObjectives = [],
    keyConcepts = []
  } = options;

  const objectivesStr = Array.isArray(learningObjectives)
    ? learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')
    : learningObjectives;

  const conceptsStr = Array.isArray(keyConcepts)
    ? keyConcepts.join(', ')
    : keyConcepts;

  return formatCoursePrompt(commonQuestionsPrompt, {
    topicTitle,
    learningObjectives: objectivesStr,
    keyConcepts: conceptsStr
  });
}

/**
 * Helper function to explain concept
 */
export function explainConcept(options = {}) {
  const {
    concept = '',
    courseTitle = '',
    courseDescription = ''
  } = options;

  return formatCoursePrompt(explainConceptPrompt, {
    concept,
    courseTitle,
    courseDescription
  });
}

export default {
  courseStructure: courseStructurePrompt,
  coursePreview: coursePreviewPrompt,
  lessonTutor: lessonTutorPrompt,
  courseSpecialization: courseSpecializationPrompt,
  courseQuality: courseQualityPrompt,
  commonQuestions: commonQuestionsPrompt,
  explainConcept: explainConceptPrompt,
  getCourseStructurePrompt,
  getCoursePreviewPrompt,
  getLessonTutorPrompt,
  getCourseSpecializationPrompt,
  getCourseQualityPrompt,
  generateCommonQuestions,
  explainConcept,
};
