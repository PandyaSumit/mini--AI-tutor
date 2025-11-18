/**
 * Learning Roadmap Generation Prompts
 * Centralized prompts for creating personalized learning paths
 */

/**
 * Roadmap Generation Prompt
 * Used for creating comprehensive, time-aware learning roadmaps
 */
export const roadmapGenerationPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert curriculum designer and educational mentor. Create a comprehensive, time-aware learning roadmap.

STRICT REQUIREMENTS:
1. Be concise, clear, and actionable
2. Focus on practical skills and measurable outcomes
3. Provide realistic time estimates based on user's availability
4. Include prerequisite checking and progressive unlocking
5. Suggest high-quality, legitimate learning resources
6. Break down complex topics into digestible modules
7. Include practical projects and assessments

Respond ONLY in valid JSON format (no markdown, no code blocks):
{
  "title": "Roadmap Title",
  "goal": "{goal}",
  "totalWeeks": {totalWeeks},
  "weeklyHours": {weeklyTimeCommitment},
  "modules": [
    {
      "week": 1,
      "title": "Module Title",
      "description": "What you'll learn",
      "objectives": ["objective1", "objective2"],
      "estimatedHours": 5,
      "prerequisiteModules": [],
      "topics": ["topic1", "topic2"],
      "dailyTasks": [
        {
          "day": 1,
          "task": "Task description",
          "duration": 60,
          "type": "reading"
        }
      ],
      "resources": [
        {
          "title": "Resource title",
          "url": "https://...",
          "type": "article"
        }
      ],
      "project": {
        "title": "Project title",
        "description": "Build something",
        "estimatedHours": 3
      }
    }
  ],
  "milestones": [
    {
      "week": 4,
      "title": "Milestone title",
      "description": "What you'll achieve"
    }
  ]
}`,
      user: `Create a {totalWeeks}-week learning roadmap for:

**Goal:** {goal}
**Current Level:** {currentLevel}
**Weekly Time Commitment:** {weeklyTimeCommitment} hours
**Target Date:** {targetDate}
**Preferred Learning:** {preferredLearningModes}

Generate a structured, progressive learning plan with weekly modules, daily tasks, milestones, and resources.

REMEMBER:
- prerequisiteModules must be week NUMBERS like [1, 2], NOT strings or module names!
- Week 1 should have prerequisiteModules: []
- Later weeks should reference earlier week numbers, e.g., week 3 could have [1, 2]`,
    },
  },
};

/**
 * Roadmap Update Prompt
 * Used for adapting roadmaps based on progress
 */
export const roadmapUpdatePrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert learning advisor. Analyze the student's progress and adapt their learning roadmap accordingly.

Consider:
1. Completed vs. planned progress
2. Time spent vs. allocated time
3. Performance on assessments
4. Student feedback and struggles
5. Remaining time and goals

Provide recommendations for:
- Pace adjustments (speed up/slow down)
- Topic reinforcement
- Resource changes
- Goal modifications

Respond in JSON format with updated modules and recommendations.`,
      user: `Current roadmap:
{currentRoadmap}

Progress so far:
{progressData}

Student feedback:
{feedback}

Provide updated roadmap and recommendations.`,
    },
  },
};

/**
 * Resource Recommendation Prompt
 * Used for suggesting learning resources
 */
export const resourceRecommendationPrompt = {
  version: '1.0.0',
  templates: {
    default: {
      system: `You are an expert at curating high-quality learning resources. Recommend legitimate, free or affordable resources that match the learning style and topic.

Types of resources:
- Articles and tutorials
- Video courses
- Interactive platforms
- Books and documentation
- Practice platforms
- Community forums

Prioritize:
- Quality and accuracy
- Beginner-friendliness (if applicable)
- Free/affordable options
- Up-to-date content
- Hands-on practice opportunities

Respond in JSON format with curated resources.`,
      user: `Topic: {topic}
Level: {level}
Learning Style: {learningStyle}
Time Available: {timeAvailable} hours

Recommend 5-10 high-quality resources.`,
    },
  },
};

/**
 * Helper function to format roadmap prompts
 */
export function formatRoadmapPrompt(promptConfig, variables = {}) {
  const template = promptConfig.templates.default;
  let formattedSystem = template.system;
  let formattedUser = template.user || '';

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    formattedSystem = formattedSystem.replace(new RegExp(placeholder, 'g'), valueStr);
    formattedUser = formattedUser.replace(new RegExp(placeholder, 'g'), valueStr);
  }

  return {
    system: formattedSystem,
    user: formattedUser,
    version: promptConfig.version,
  };
}

/**
 * Get roadmap generation prompt
 */
export function getRoadmapGenerationPrompt(options = {}) {
  const {
    goal = '',
    currentLevel = 'beginner',
    weeklyTimeCommitment = 10,
    totalWeeks = 12,
    targetDate = 'Flexible',
    preferredLearningModes = 'reading, video, practice',
  } = options;

  return formatRoadmapPrompt(roadmapGenerationPrompt, {
    goal,
    currentLevel,
    weeklyTimeCommitment,
    totalWeeks,
    targetDate,
    preferredLearningModes: Array.isArray(preferredLearningModes)
      ? preferredLearningModes.join(', ')
      : preferredLearningModes,
  });
}

/**
 * Get roadmap update prompt
 */
export function getRoadmapUpdatePrompt(options = {}) {
  const {
    currentRoadmap = {},
    progressData = {},
    feedback = 'No feedback provided',
  } = options;

  return formatRoadmapPrompt(roadmapUpdatePrompt, {
    currentRoadmap: JSON.stringify(currentRoadmap, null, 2),
    progressData: JSON.stringify(progressData, null, 2),
    feedback,
  });
}

/**
 * Get resource recommendation prompt
 */
export function getResourceRecommendationPrompt(options = {}) {
  const {
    topic = '',
    level = 'beginner',
    learningStyle = 'mixed',
    timeAvailable = 5,
  } = options;

  return formatRoadmapPrompt(resourceRecommendationPrompt, {
    topic,
    level,
    learningStyle,
    timeAvailable,
  });
}

export default {
  roadmapGeneration: roadmapGenerationPrompt,
  roadmapUpdate: roadmapUpdatePrompt,
  resourceRecommendation: resourceRecommendationPrompt,
  getRoadmapGenerationPrompt,
  getRoadmapUpdatePrompt,
  getResourceRecommendationPrompt,
};
