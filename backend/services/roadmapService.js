import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Generate personalized learning roadmap using AI
export const generateRoadmap = async (params) => {
  const { goal, currentLevel, weeklyTimeCommitment, targetDate, preferredLearningModes } = params;

  if (!groq) {
    throw new Error('AI service not configured');
  }

  // Calculate total weeks available
  const totalWeeks = targetDate
    ? Math.ceil((new Date(targetDate) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : calculateOptimalWeeks(currentLevel, weeklyTimeCommitment);

  const systemPrompt = `You are an expert curriculum designer and educational mentor. Create a comprehensive, time-aware learning roadmap.

STRICT REQUIREMENTS:
1. Be concise, clear, and actionable
2. Focus on practical skills and measurable outcomes
3. Provide realistic time estimates based on user's availability
4. Include prerequisite checking and progressive unlocking
5. Suggest high-quality, legitimate learning resources
6. Break down complex topics into digestible modules
7. Include practical projects and assessments

SAFETY RULES:
- Only educational content
- No illegal, harmful, or inappropriate suggestions
- Refer to licensed professionals for medical/legal/financial advice
- Mark all external resources as "recommendations" not endorsements

Respond ONLY in valid JSON format with this exact structure:
{
  "overview": "Brief 2-3 sentence summary of the learning path",
  "milestones": [
    {
      "title": "Milestone name",
      "description": "What learner will achieve",
      "weekNumber": 4
    }
  ],
  "weeklyModules": [
    {
      "weekNumber": 1,
      "title": "Week title",
      "description": "What this week covers",
      "objectives": ["Objective 1", "Objective 2"],
      "estimatedHours": 10,
      "dailyTasks": [
        {
          "title": "Task name",
          "description": "What to do",
          "estimatedMinutes": 60,
          "resources": [
            {
              "title": "Resource name",
              "url": "https://example.com",
              "type": "video"
            }
          ]
        }
      ],
      "prerequisiteModules": [],
      "completionCriteria": {
        "quizzesRequired": 1,
        "projectsRequired": 0,
        "minimumScore": 70
      }
    }
  ]
}`;

  const userPrompt = `Create a ${totalWeeks}-week learning roadmap for:

**Goal:** ${goal}
**Current Level:** ${currentLevel}
**Weekly Time Commitment:** ${weeklyTimeCommitment} hours
**Target Date:** ${targetDate ? new Date(targetDate).toLocaleDateString() : 'Flexible'}
**Preferred Learning:** ${preferredLearningModes.join(', ')}

Generate a structured, progressive learning plan with weekly modules, daily tasks, milestones, and resources.`;

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

    const roadmapData = JSON.parse(completion.choices[0].message.content);

    return {
      ...roadmapData,
      totalWeeks,
      generationMetadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens
      }
    };
  } catch (error) {
    console.error('Roadmap generation error:', error);
    throw new Error('Failed to generate roadmap: ' + error.message);
  }
};

// Calculate optimal weeks based on level and time
function calculateOptimalWeeks(level, weeklyHours) {
  const baseWeeks = {
    novice: 16,
    intermediate: 12,
    advanced: 8
  };

  const weeks = baseWeeks[level] || 12;

  // Adjust based on time commitment
  if (weeklyHours < 5) {
    return Math.ceil(weeks * 1.5);
  } else if (weeklyHours > 15) {
    return Math.ceil(weeks * 0.75);
  }

  return weeks;
}

// Adapt roadmap based on progress
export const adaptRoadmap = async (roadmap, progressData) => {
  if (!groq) {
    throw new Error('AI service not configured');
  }

  const systemPrompt = `You are an adaptive learning coach. Analyze user progress and adjust the learning roadmap accordingly.

RULES:
1. If user is behind, suggest remediation strategies
2. If user is ahead, offer advanced challenges
3. Identify weak areas and reinforce them
4. Maintain realistic expectations
5. Stay encouraging and supportive

Respond in JSON with:
{
  "adjustments": [
    {
      "weekNumber": 3,
      "reason": "User struggling with X",
      "changes": ["Add extra practice", "Simplify concepts"],
      "newEstimatedHours": 12
    }
  ],
  "recommendation": "Brief recommendation",
  "remediationNeeded": true/false
}`;

  const userPrompt = `Current roadmap progress:
- Total modules: ${roadmap.weeklyModules.length}
- Completed: ${roadmap.weeklyModules.filter(m => m.status === 'completed').length}
- Average quiz score: ${progressData.averageQuizScore}%
- Completion rate: ${progressData.completionRate}%
- Consecutive missed milestones: ${roadmap.adaptiveData.consecutiveMissedMilestones}

Analyze and suggest adjustments.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Roadmap adaptation error:', error);
    throw new Error('Failed to adapt roadmap');
  }
};
