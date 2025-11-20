import { nanoid } from 'nanoid';
import aiService from '../config/aiService.js';
import { detectSkillLevel, combineSkillLevels, detectUserDomain } from './skillDetectionService.js';
import EnhancedRoadmap from '../models/EnhancedRoadmap.js';

/**
 * Enhanced Roadmap Generation Service
 * Generates deeply structured, industry-grade learning roadmaps
 */

/**
 * Generate a comprehensive, module-wise learning roadmap
 * @param {Object} params - Roadmap parameters
 * @param {String} params.userId - User ID
 * @param {String} params.goal - Learning goal
 * @param {String} params.userDeclaredLevel - User's self-assessed skill level
 * @param {Number} params.weeklyTimeCommitment - Hours per week
 * @param {Date} params.targetCompletionDate - Target completion date
 * @param {Array} params.preferences - Learning preferences
 * @param {Array} params.priorExperience - User's prior experience
 * @returns {Object} Generated roadmap
 */
export const generateEnhancedRoadmap = async (params) => {
  const {
    userId,
    goal,
    userDeclaredLevel,
    weeklyTimeCommitment,
    targetCompletionDate,
    preferences = {},
    priorExperience = []
  } = params;

  try {
    // Step 1: Detect user's actual skill level from chat history
    console.log('Detecting skill level from chat history...');
    const skillDetection = await detectSkillLevel(userId, goal);

    // Step 2: Combine detected and declared skill levels
    const finalSkillLevel = combineSkillLevels(
      skillDetection.detectedLevel,
      userDeclaredLevel,
      skillDetection.confidence
    );

    // Step 3: Detect user's domain/industry
    console.log('Detecting user domain...');
    const domainDetection = await detectUserDomain(userId);

    // Step 4: Determine learning path (fast-track vs detailed)
    const learningPath = EnhancedRoadmap.determineLearningPath(
      finalSkillLevel,
      priorExperience
    );

    // Step 5: Calculate roadmap duration
    const duration = calculateRoadmapDuration(
      finalSkillLevel,
      weeklyTimeCommitment,
      learningPath,
      targetCompletionDate
    );

    // Step 6: Generate the roadmap using AI
    console.log('Generating roadmap with AI...');
    const roadmapData = await generateRoadmapWithAI({
      goal,
      finalSkillLevel,
      userDeclaredLevel,
      skillDetection,
      weeklyTimeCommitment,
      learningPath,
      domain: domainDetection.domain,
      industries: domainDetection.industries,
      priorExperience,
      preferences,
      duration
    });

    // Step 7: Generate quizzes for each module
    console.log('Generating module quizzes...');
    const roadmapWithQuizzes = await generateModuleQuizzes(roadmapData, goal);

    // Step 8: Create the roadmap document
    const enhancedRoadmap = new EnhancedRoadmap({
      user: userId,
      title: roadmapData.title,
      description: roadmapData.description,
      goal: goal,

      personalization: {
        detectedSkillLevel: skillDetection.detectedLevel,
        userDeclaredLevel: userDeclaredLevel,
        finalSkillLevel: finalSkillLevel,
        learningPath: learningPath,
        domain: domainDetection.domain,
        priorExperience: [
          ...priorExperience,
          ...(skillDetection.priorExperience || [])
        ],
        learningGoals: roadmapData.learningGoals || [],
        preferences: {
          learningStyle: preferences.learningStyle || 'mixed',
          pacePreference: preferences.pacePreference || 'moderate',
          contentTypes: preferences.contentTypes || ['video', 'text', 'hands-on']
        },
        weeklyTimeCommitment: weeklyTimeCommitment,
        targetCompletionDate: targetCompletionDate
      },

      phases: roadmapWithQuizzes.phases,

      metadata: {
        totalPhases: roadmapWithQuizzes.phases.length,
        totalModules: roadmapWithQuizzes.phases.reduce((sum, p) => sum + p.modules.length, 0),
        totalSubModules: calculateTotalSubModules(roadmapWithQuizzes.phases),
        totalEstimatedHours: duration.totalHours,
        totalEstimatedWeeks: duration.totalWeeks,
        difficultyProgression: roadmapWithQuizzes.difficultyProgression || [],
        tags: extractTags(goal, roadmapData),
        category: roadmapData.category || 'Technology',
        industry: domainDetection.domain
      },

      globalMilestones: roadmapData.globalMilestones || [],

      status: 'active',

      generatedBy: {
        method: 'ai-full',
        aiModel: 'llama-3.3-70b-versatile',
        generatedAt: new Date(),
        tokensUsed: roadmapData.tokensUsed
      }
    });

    await enhancedRoadmap.save();

    // Initialize progress for all phases and modules
    for (const phase of enhancedRoadmap.phases) {
      phase.progress = phase.progress || 0;
      for (const module of phase.modules) {
        module.progress = module.progress || 0;
      }
    }

    // Calculate initial progress
    enhancedRoadmap.calculateOverallProgress();
    enhancedRoadmap.updateProgressMetrics();
    await enhancedRoadmap.save();

    return {
      success: true,
      roadmap: enhancedRoadmap.toObject(),
      insights: {
        skillDetection,
        domainDetection,
        learningPath,
        recommendation: skillDetection.recommendation
      }
    };
  } catch (error) {
    console.error('Enhanced roadmap generation error:', error);
    throw new Error('Failed to generate enhanced roadmap: ' + error.message);
  }
};

/**
 * Generate roadmap structure using AI
 */
async function generateRoadmapWithAI(params) {
  const {
    goal,
    finalSkillLevel,
    userDeclaredLevel,
    skillDetection,
    weeklyTimeCommitment,
    learningPath,
    domain,
    industries,
    priorExperience,
    preferences,
    duration
  } = params;

  const systemPrompt = `You are an elite curriculum designer and educational strategist with expertise in creating industry-grade, deeply structured learning roadmaps. Your roadmaps are comprehensive, actionable, and personalized.

# YOUR MISSION
Create a PREMIUM, DEEPLY STRUCTURED learning roadmap that feels like it was crafted by expert educators. This is not a simple list - it's a complete learning system.

# CRITICAL REQUIREMENTS

## 1. STRUCTURE DEPTH
- Organize into **PHASES** (major learning stages)
- Each phase contains multiple **MODULES** (major topics)
- Each module contains **SUB-MODULES** (detailed topic breakdowns)
- Each module has **CORE CONCEPTS** with **SUB-CONCEPTS**

## 2. REQUIRED COMPONENTS PER MODULE

### A. Topics Breakdown
- **Core Concepts**: Fundamental ideas (each with 2-4 sub-concepts)
- **Sub-Modules**: Detailed topic divisions with their own objectives

### B. Learning Elements
- **Learning Objectives**: What you'll learn (3-5 per module)
- **Learning Outcomes**: What you'll be able to do (3-5 per module)
- **Real-World Applications**: Where this is used in industry (2-4 examples)

### C. Practical Components
- **Practical Tasks**: 3-5 hands-on exercises per module
  - Types: exercise, mini-project, coding-challenge, case-study, hands-on-lab
  - Each with clear instructions and expected outputs
- **Real Project Examples**: 1-3 industry-relevant projects
  - Include industry context, technologies used, learning outcomes
  - Specify complexity level and estimated hours

### D. Guidance Elements
- **Best Practices**: 3-5 best practices with examples
- **Common Mistakes**: 3-5 mistakes to avoid with:
  - What the mistake is
  - Why it's problematic
  - How to avoid it
  - Correct approach

### E. Module-End Components
- **Module Summary**:
  - Key takeaways (4-6 points)
  - Skills acquired (3-5 skills)
  - Next steps
  - Reflection questions (2-3)
- **Quiz**: Will be auto-generated (you don't need to create questions)
- **Checkpoints**: 2-4 skill validation points per module

## 3. DIFFICULTY PROGRESSION
- Start accessible, build progressively
- Mark difficulty: beginner → intermediate → advanced
- Ensure prerequisites are clear
- ${learningPath === 'fast-track' ? 'FAST-TRACK: Accelerated pace, skip basics, focus on advanced topics' : 'DETAILED: Thorough explanations, extra practice, foundational focus'}

## 4. PERSONALIZATION
- **Skill Level**: ${finalSkillLevel} (detected: ${skillDetection.detectedLevel}, declared: ${userDeclaredLevel})
- **Domain**: ${domain}
- **Industries**: ${industries.join(', ') || 'general'}
- **Prior Experience**: ${priorExperience.join(', ') || 'none detected'}
- **Learning Path**: ${learningPath}

## 5. TIME MANAGEMENT
- **Weekly Commitment**: ${weeklyTimeCommitment} hours
- **Total Duration**: ${duration.totalWeeks} weeks (${duration.totalHours} hours)
- Distribute time realistically across phases and modules

## 6. REAL-WORLD RELEVANCE
- Use examples from ${domain} whenever possible
- Reference ${industries.join(', ') || 'real-world'} scenarios
- Include industry-standard tools and practices
- Mention actual companies/products where relevant (without endorsements)

## 7. METADATA REQUIREMENTS
- Every phase needs: phaseId, title, description, phaseType, order
- Every module needs: moduleId, title, description, order, difficulty, estimatedHours
- Every sub-module needs: subModuleId, title, description, order, difficulty
- Use consistent formatting and IDs

# RESPONSE FORMAT

Respond with valid JSON in this EXACT structure:

{
  "title": "Complete Roadmap Title",
  "description": "2-3 sentence overview",
  "category": "Technology|Business|Design|Data|etc",
  "learningGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "difficultyProgression": ["beginner", "intermediate", "advanced"],

  "phases": [
    {
      "title": "Phase Title",
      "description": "What this phase covers",
      "order": 1,
      "phaseType": "foundation|intermediate|advanced|specialization|mastery",
      "estimatedWeeks": 4,
      "estimatedHours": 40,

      "modules": [
        {
          "title": "Module Title",
          "description": "Module overview",
          "order": 1,
          "difficulty": "beginner|intermediate|advanced",
          "estimatedHours": 10,
          "learningObjectives": [
            "Understand X concept",
            "Implement Y technique"
          ],
          "learningOutcomes": [
            "Build a X system",
            "Optimize Y performance"
          ],
          "realWorldApplications": [
            "Used in Netflix for recommendation systems",
            "Powers real-time trading platforms"
          ],

          "topicsBreakdown": {
            "coreConcepts": [
              {
                "title": "Concept Name",
                "description": "What it is",
                "importance": "Why it matters",
                "prerequisites": ["Concept A", "Concept B"],
                "subConcepts": [
                  {
                    "title": "Sub-concept",
                    "description": "Detailed explanation",
                    "keyPoints": ["Point 1", "Point 2"],
                    "examples": ["Example 1", "Example 2"],
                    "resources": [
                      {
                        "title": "Resource name",
                        "url": "https://example.com",
                        "type": "video|article|text|interactive|documentation",
                        "estimatedMinutes": 30
                      }
                    ]
                  }
                ]
              }
            ],
            "subModules": [
              {
                "title": "Sub-module Title",
                "description": "What it covers",
                "order": 1,
                "estimatedHours": 3,
                "difficulty": "beginner|intermediate|advanced",
                "learningObjectives": ["Objective 1", "Objective 2"],
                "coreConcepts": [
                  {
                    "title": "Concept",
                    "description": "Description",
                    "importance": "Why important",
                    "prerequisites": [],
                    "subConcepts": [
                      {
                        "title": "Detail",
                        "description": "Explanation",
                        "keyPoints": ["Point"],
                        "examples": ["Example"],
                        "resources": []
                      }
                    ]
                  }
                ],
                "practicalTasks": [
                  {
                    "title": "Task name",
                    "description": "What to do",
                    "type": "exercise|mini-project|coding-challenge|case-study|hands-on-lab",
                    "difficulty": "easy|medium|hard",
                    "estimatedMinutes": 60,
                    "instructions": ["Step 1", "Step 2"],
                    "expectedOutput": "What you should create",
                    "resources": []
                  }
                ],
                "resources": []
              }
            ]
          },

          "practicalTasks": [
            {
              "title": "Build X",
              "description": "Create a working X",
              "type": "mini-project",
              "difficulty": "medium",
              "estimatedMinutes": 120,
              "instructions": [
                "Set up environment",
                "Implement feature A",
                "Test and debug"
              ],
              "expectedOutput": "Working X with Y functionality",
              "resources": [
                {
                  "title": "Starter template",
                  "url": "https://github.com/example",
                  "type": "interactive"
                }
              ]
            }
          ],

          "projectExamples": [
            {
              "title": "Real-World Project Name",
              "description": "What the project is",
              "industry": "fintech|healthcare|e-commerce|saas|etc",
              "realWorldApplication": "How it's used in industry",
              "technologiesUsed": ["Tech 1", "Tech 2"],
              "complexity": "beginner|intermediate|advanced",
              "estimatedHours": 20,
              "learningOutcomes": ["Outcome 1", "Outcome 2"]
            }
          ],

          "bestPractices": [
            {
              "title": "Practice Name",
              "description": "What to do",
              "example": "Code example or scenario"
            }
          ],

          "commonMistakes": [
            {
              "mistake": "What people do wrong",
              "why": "Why it's problematic",
              "howToAvoid": "Prevention strategy",
              "correctApproach": "The right way"
            }
          ],

          "moduleEndSummary": {
            "keyTakeaways": [
              "Takeaway 1",
              "Takeaway 2"
            ],
            "skillsAcquired": [
              "Skill 1",
              "Skill 2"
            ],
            "nextSteps": "What to do next",
            "reflectionQuestions": [
              "How would you apply X?",
              "What challenges did you face?"
            ]
          },

          "checkpoints": [
            {
              "title": "Checkpoint name",
              "description": "What to validate",
              "validationType": "quiz|project|peer-review|self-assessment"
            }
          ],

          "prerequisiteModules": []
        }
      ],

      "phaseMilestone": {
        "title": "Phase Completion",
        "description": "What you'll achieve",
        "completionCriteria": {
          "minimumModulesCompleted": 3,
          "minimumAverageScore": 70,
          "requiredProjects": 1
        }
      }
    }
  ],

  "globalMilestones": [
    {
      "title": "Milestone name",
      "description": "Achievement description",
      "targetDate": null,
      "phaseId": "phase-1"
    }
  ]
}

# QUALITY STANDARDS
- Be specific and actionable, not vague
- Include realistic time estimates
- Provide actual resource recommendations (legitimate URLs)
- Use industry-standard terminology
- Ensure logical progression and clear prerequisites
- Make it feel premium and professional

# SAFETY
- Only educational content
- No illegal, harmful, or inappropriate material
- Recommend licensed professionals for specialized advice
- Mark resources as "recommendations" not endorsements

Generate the roadmap now.`;

  const userPrompt = `Create a comprehensive learning roadmap for:

**GOAL**: ${goal}

**LEARNER PROFILE**:
- Final Skill Level: ${finalSkillLevel}
- User Declared: ${userDeclaredLevel}
- AI Detected: ${skillDetection.detectedLevel} (confidence: ${skillDetection.confidence})
- Domain: ${domain}
- Industries: ${industries.join(', ') || 'general'}
- Prior Experience: ${priorExperience.join(', ') || 'limited'}

**CONSTRAINTS**:
- Weekly Time: ${weeklyTimeCommitment} hours
- Total Duration: ${duration.totalWeeks} weeks (${duration.totalHours} hours)
- Learning Path: ${learningPath.toUpperCase()}
- Learning Style: ${preferences.learningStyle || 'mixed'}

**SKILL DETECTION INSIGHTS**:
${skillDetection.evidence ? 'Evidence: ' + skillDetection.evidence.map(e => e.observation).join('; ') : ''}
${skillDetection.strengths ? 'Strengths: ' + skillDetection.strengths.join(', ') : ''}
${skillDetection.weaknesses ? 'Weaknesses: ' + skillDetection.weaknesses.join(', ') : ''}

**REQUIREMENTS**:
1. Create ${duration.totalPhases} phases with ${learningPath === 'fast-track' ? 'accelerated' : 'comprehensive'} modules
2. Include deep topic breakdowns with core concepts and sub-concepts
3. Add practical tasks and real project examples from ${domain}
4. Include best practices and common mistakes
5. Add module-end summaries with reflection questions
6. Create checkpoints for skill validation
7. Make it actionable and industry-relevant

Generate a premium, deeply structured roadmap that feels like a professional course.`;

  try {
    const completion = await aiService.generateStructuredJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      max_tokens: 8000, // Large token limit for comprehensive roadmap
      temperature: 0.7
    });

    const roadmapData = JSON.parse(completion.choices[0].message.content);

    // Add generated IDs and clean data
    const cleanedData = addIdsAndClean(roadmapData);

    return {
      ...cleanedData,
      tokensUsed: completion.usage?.total_tokens
    };
  } catch (error) {
    console.error('AI roadmap generation error:', error);
    throw error;
  }
}

/**
 * Add unique IDs to all components and clean data
 */
function addIdsAndClean(roadmapData) {
  // Add IDs to phases
  if (roadmapData.phases) {
    roadmapData.phases = roadmapData.phases.map((phase, phaseIndex) => {
      phase.phaseId = phase.phaseId || nanoid(10);
      phase.order = phaseIndex + 1;

      // Add IDs to modules
      if (phase.modules) {
        phase.modules = phase.modules.map((module, moduleIndex) => {
          module.moduleId = module.moduleId || nanoid(10);
          module.order = moduleIndex + 1;

          // Add IDs to sub-modules
          if (module.topicsBreakdown?.subModules) {
            module.topicsBreakdown.subModules = module.topicsBreakdown.subModules.map((subModule, smIndex) => {
              subModule.subModuleId = subModule.subModuleId || nanoid(10);
              subModule.order = smIndex + 1;

              // Add IDs to sub-module concepts
              if (subModule.coreConcepts) {
                subModule.coreConcepts = subModule.coreConcepts.map(concept => {
                  concept.conceptId = concept.conceptId || nanoid(10);
                  if (concept.subConcepts) {
                    concept.subConcepts = concept.subConcepts.map(subConcept => ({
                      subConceptId: nanoid(10),
                      ...subConcept
                    }));
                  }
                  return concept;
                });
              }

              // Add IDs to sub-module tasks
              if (subModule.practicalTasks) {
                subModule.practicalTasks = subModule.practicalTasks.map(task => ({
                  taskId: nanoid(10),
                  ...task
                }));
              }

              return subModule;
            });
          }

          // Add IDs to module core concepts
          if (module.topicsBreakdown?.coreConcepts) {
            module.topicsBreakdown.coreConcepts = module.topicsBreakdown.coreConcepts.map(concept => {
              concept.conceptId = concept.conceptId || nanoid(10);
              if (concept.subConcepts) {
                concept.subConcepts = concept.subConcepts.map(subConcept => ({
                  subConceptId: nanoid(10),
                  ...subConcept
                }));
              }
              return concept;
            });
          }

          // Add IDs to practical tasks
          if (module.practicalTasks) {
            module.practicalTasks = module.practicalTasks.map(task => ({
              taskId: nanoid(10),
              ...task
            }));
          }

          // Add IDs to project examples
          if (module.projectExamples) {
            module.projectExamples = module.projectExamples.map(project => ({
              exampleId: nanoid(10),
              ...project
            }));
          }

          // Add IDs to checkpoints
          if (module.checkpoints) {
            module.checkpoints = module.checkpoints.map(checkpoint => ({
              checkpointId: nanoid(10),
              ...checkpoint
            }));
          }

          return module;
        });
      }

      return phase;
    });
  }

  // Add IDs to global milestones
  if (roadmapData.globalMilestones) {
    roadmapData.globalMilestones = roadmapData.globalMilestones.map(milestone => ({
      milestoneId: nanoid(10),
      ...milestone
    }));
  }

  return roadmapData;
}

/**
 * Generate quizzes for each module
 */
async function generateModuleQuizzes(roadmapData, goal) {
  // Import quiz service
  const { generateQuiz } = await import('./quizService.js');

  for (const phase of roadmapData.phases) {
    for (const module of phase.modules) {
      try {
        // Generate quiz content summary
        const quizContent = `
Module: ${module.title}
Description: ${module.description}
Objectives: ${module.learningObjectives?.join(', ')}
Core Concepts: ${module.topicsBreakdown?.coreConcepts?.map(c => c.title).join(', ') || ''}
        `.trim();

        // Generate quiz
        const questionCount = module.difficulty === 'advanced' ? 12 : module.difficulty === 'intermediate' ? 10 : 8;
        const quizData = await generateQuiz(quizContent, {
          questionCount: questionCount,
          difficulty: module.difficulty === 'advanced' ? 'hard' : module.difficulty === 'intermediate' ? 'medium' : 'easy',
          types: ['mcq', 'true_false', 'fill_blank'],
          topic: module.title
        });

        // Add quiz to module
        module.quiz = {
          title: `${module.title} - Assessment`,
          description: `Test your understanding of ${module.title}`,
          questions: quizData.questions,
          passingScore: 70,
          timeLimit: quizData.questions.length * 2 // 2 minutes per question
        };

      } catch (error) {
        console.error(`Failed to generate quiz for module ${module.title}:`, error);
        // Continue without quiz for this module
      }
    }
  }

  return roadmapData;
}

/**
 * Calculate roadmap duration
 */
function calculateRoadmapDuration(skillLevel, weeklyHours, learningPath, targetDate) {
  // Base hours by skill level and path
  const baseHours = {
    'fast-track': {
      'absolute_beginner': 120,
      'beginner': 100,
      'intermediate': 80,
      'advanced': 60,
      'expert': 40
    },
    'detailed': {
      'absolute_beginner': 200,
      'beginner': 160,
      'intermediate': 120,
      'advanced': 80,
      'expert': 60
    }
  };

  const totalHours = baseHours[learningPath][skillLevel] || 120;

  let totalWeeks;

  if (targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    totalWeeks = Math.ceil((target - now) / (7 * 24 * 60 * 60 * 1000));
  } else {
    totalWeeks = Math.ceil(totalHours / weeklyHours);
  }

  // Ensure reasonable duration
  totalWeeks = Math.max(4, Math.min(52, totalWeeks)); // Between 4-52 weeks

  // Calculate phases based on duration
  let totalPhases;
  if (totalWeeks <= 8) {
    totalPhases = 2;
  } else if (totalWeeks <= 16) {
    totalPhases = 3;
  } else if (totalWeeks <= 26) {
    totalPhases = 4;
  } else {
    totalPhases = 5;
  }

  return {
    totalHours,
    totalWeeks,
    totalPhases,
    weeksPerPhase: Math.ceil(totalWeeks / totalPhases)
  };
}

/**
 * Calculate total sub-modules across all phases
 */
function calculateTotalSubModules(phases) {
  let total = 0;
  for (const phase of phases) {
    for (const module of phase.modules) {
      if (module.topicsBreakdown?.subModules) {
        total += module.topicsBreakdown.subModules.length;
      }
    }
  }
  return total;
}

/**
 * Extract tags from goal and roadmap data
 */
function extractTags(goal, roadmapData) {
  const tags = new Set();

  // Extract from goal
  const goalWords = goal.toLowerCase().split(/\s+/);
  goalWords.forEach(word => {
    if (word.length > 3) tags.add(word);
  });

  // Extract from category
  if (roadmapData.category) {
    tags.add(roadmapData.category.toLowerCase());
  }

  // Extract from phase/module titles
  if (roadmapData.phases) {
    roadmapData.phases.forEach(phase => {
      const phaseWords = phase.title.toLowerCase().split(/\s+/);
      phaseWords.forEach(word => {
        if (word.length > 3) tags.add(word);
      });
    });
  }

  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}
