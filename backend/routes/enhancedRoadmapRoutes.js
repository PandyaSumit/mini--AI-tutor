import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateEnhancedRoadmap } from '../services/enhancedRoadmapService.js';
import EnhancedRoadmap from '../models/EnhancedRoadmap.js';

const router = express.Router();

/**
 * @route   POST /api/enhanced-roadmaps/generate
 * @desc    Generate a new enhanced learning roadmap
 * @access  Private
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const {
      goal,
      userDeclaredLevel,
      weeklyTimeCommitment,
      targetCompletionDate,
      preferences,
      priorExperience
    } = req.body;

    // Validation
    if (!goal || !userDeclaredLevel || !weeklyTimeCommitment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: goal, userDeclaredLevel, weeklyTimeCommitment'
      });
    }

    const validSkillLevels = ['absolute_beginner', 'beginner', 'intermediate', 'advanced', 'expert'];
    if (!validSkillLevels.includes(userDeclaredLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid skill level. Must be one of: ${validSkillLevels.join(', ')}`
      });
    }

    if (weeklyTimeCommitment < 1 || weeklyTimeCommitment > 40) {
      return res.status(400).json({
        success: false,
        message: 'Weekly time commitment must be between 1 and 40 hours'
      });
    }

    // Generate roadmap
    const result = await generateEnhancedRoadmap({
      userId: req.user._id,
      goal,
      userDeclaredLevel,
      weeklyTimeCommitment,
      targetCompletionDate,
      preferences: preferences || {},
      priorExperience: priorExperience || []
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Enhanced roadmap generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/enhanced-roadmaps
 * @desc    Get all enhanced roadmaps for the user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    if (category) {
      query['metadata.category'] = category;
    }

    const roadmaps = await EnhancedRoadmap.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

    // Calculate progress for each roadmap
    const roadmapsWithProgress = await Promise.all(
      roadmaps.map(async (roadmap) => {
        roadmap.calculateOverallProgress();
        roadmap.updateProgressMetrics();
        await roadmap.save();

        const obj = roadmap.toObject();
        // Hide quiz answers
        if (obj.phases) {
          obj.phases.forEach(phase => {
            if (phase.modules) {
              phase.modules.forEach(module => {
                if (module.quiz && module.quiz.questions) {
                  delete module.quiz.questions;
                }
              });
            }
          });
        }
        return obj;
      })
    );

    res.json({
      success: true,
      count: roadmapsWithProgress.length,
      roadmaps: roadmapsWithProgress
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmaps',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/enhanced-roadmaps/:id
 * @desc    Get a specific enhanced roadmap
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Calculate progress before sending
    roadmap.calculateOverallProgress();
    roadmap.updateProgressMetrics();
    await roadmap.save();

    // Convert to plain object
    const roadmapObj = roadmap.toObject();

    // Hide quiz answers
    if (roadmapObj.phases) {
      roadmapObj.phases.forEach(phase => {
        if (phase.modules) {
          phase.modules.forEach(module => {
            if (module.quiz && module.quiz.questions) {
              module.quiz.questions.forEach(q => {
                if (!module.quiz.completed) {
                  delete q.correctAnswer;
                }
              });
            }
          });
        }
      });
    }

    res.json({
      success: true,
      roadmap: roadmapObj
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enhanced-roadmaps/:id/module/:moduleId/complete
 * @desc    Mark a module as completed
 * @access  Private
 */
router.put('/:id/module/:moduleId/complete', protect, async (req, res) => {
  try {
    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const completed = await roadmap.completeModule(req.params.moduleId);

    if (!completed) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.json({
      success: true,
      message: 'Module completed successfully',
      roadmap
    });
  } catch (error) {
    console.error('Error completing module:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete module',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enhanced-roadmaps/:id/concept/:conceptId/complete
 * @desc    Mark a concept as completed
 * @access  Private
 */
router.put('/:id/concept/:conceptId/complete', protect, async (req, res) => {
  try {
    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    let found = false;

    // Find and mark concept as completed
    for (const phase of roadmap.phases) {
      for (const module of phase.modules) {
        if (module.topicsBreakdown?.coreConcepts) {
          const concept = module.topicsBreakdown.coreConcepts.find(c => c.conceptId === req.params.conceptId);
          if (concept) {
            concept.completed = true;
            found = true;

            // Recalculate module progress
            roadmap.calculateModuleProgress(module.moduleId);
            break;
          }
        }

        if (module.topicsBreakdown?.subModules) {
          for (const subModule of module.topicsBreakdown.subModules) {
            if (subModule.coreConcepts) {
              const concept = subModule.coreConcepts.find(c => c.conceptId === req.params.conceptId);
              if (concept) {
                concept.completed = true;
                found = true;

                // Recalculate module progress
                roadmap.calculateModuleProgress(module.moduleId);
                break;
              }
            }
          }
        }

        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Concept not found'
      });
    }

    // Recalculate overall progress
    roadmap.calculateOverallProgress();
    roadmap.updateProgressMetrics();
    await roadmap.save();

    // Return updated roadmap
    const roadmapObj = roadmap.toObject();

    res.json({
      success: true,
      message: 'Concept marked as completed',
      roadmap: roadmapObj
    });
  } catch (error) {
    console.error('Error completing concept:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete concept',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enhanced-roadmaps/:id/task/:taskId/complete
 * @desc    Mark a practical task as completed
 * @access  Private
 */
router.put('/:id/task/:taskId/complete', protect, async (req, res) => {
  try {
    const { submissionUrl, feedback } = req.body;

    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    let found = false;

    // Find and mark task as completed
    for (const phase of roadmap.phases) {
      for (const module of phase.modules) {
        // Check module tasks
        if (module.practicalTasks) {
          const task = module.practicalTasks.find(t => t.taskId === req.params.taskId);
          if (task) {
            task.completed = true;
            task.completedAt = new Date();
            if (submissionUrl) task.submissionUrl = submissionUrl;
            if (feedback) task.feedback = feedback;
            found = true;

            // Recalculate module progress
            roadmap.calculateModuleProgress(module.moduleId);
            break;
          }
        }

        // Check sub-module tasks
        if (module.topicsBreakdown?.subModules) {
          for (const subModule of module.topicsBreakdown.subModules) {
            if (subModule.practicalTasks) {
              const task = subModule.practicalTasks.find(t => t.taskId === req.params.taskId);
              if (task) {
                task.completed = true;
                task.completedAt = new Date();
                if (submissionUrl) task.submissionUrl = submissionUrl;
                if (feedback) task.feedback = feedback;
                found = true;

                // Recalculate module progress
                roadmap.calculateModuleProgress(module.moduleId);
                break;
              }
            }
          }
        }

        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update progress metrics
    roadmap.progressMetrics.projectsCompleted += 1;
    roadmap.progressMetrics.lastActivityDate = new Date();

    // Recalculate overall progress
    roadmap.calculateOverallProgress();
    roadmap.updateProgressMetrics();
    await roadmap.save();

    // Return updated roadmap
    const roadmapObj = roadmap.toObject();

    res.json({
      success: true,
      message: 'Task marked as completed',
      roadmap: roadmapObj
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/enhanced-roadmaps/:id/quiz/:quizId/submit
 * @desc    Submit quiz attempt
 * @access  Private
 */
router.post('/:id/quiz/:quizId/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required'
      });
    }

    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    let quiz = null;
    let module = null;

    // Find the quiz
    for (const phase of roadmap.phases) {
      for (const mod of phase.modules) {
        if (mod.quiz && mod.quiz.quizId === req.params.quizId) {
          quiz = mod.quiz;
          module = mod;
          break;
        }
      }
      if (quiz) break;
    }

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Grade the quiz
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach(question => {
      const userAnswer = answers[question.questionId];
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (quiz.passingScore || 70);

    // Record attempt
    if (!quiz.attempts) {
      quiz.attempts = [];
    }

    quiz.attempts.push({
      attemptDate: new Date(),
      score: score,
      answers: answers,
      timeTaken: timeTaken,
      passed: passed
    });

    // Update best score
    if (!quiz.bestScore || score > quiz.bestScore) {
      quiz.bestScore = score;
    }

    // Mark as completed if passed
    if (passed) {
      quiz.completed = true;

      // Recalculate module progress
      roadmap.calculateModuleProgress(module.moduleId);

      // Update progress metrics
      roadmap.progressMetrics.quizzesCompleted += 1;
    }

    roadmap.progressMetrics.lastActivityDate = new Date();
    await roadmap.save();

    // Recalculate average quiz score
    roadmap.updateProgressMetrics();
    await roadmap.save();

    res.json({
      success: true,
      result: {
        score,
        passed,
        correctCount,
        totalQuestions,
        bestScore: quiz.bestScore,
        attempts: quiz.attempts.length
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/enhanced-roadmaps/:id/progress
 * @desc    Get detailed progress for a roadmap
 * @access  Private
 */
router.get('/:id/progress', protect, async (req, res) => {
  try {
    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean();

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Calculate detailed progress
    const progressData = {
      overall: roadmap.overallProgress,
      metrics: roadmap.progressMetrics,
      phases: roadmap.phases.map(phase => ({
        phaseId: phase.phaseId,
        title: phase.title,
        progress: phase.progress,
        status: phase.status,
        modules: phase.modules.map(module => ({
          moduleId: module.moduleId,
          title: module.title,
          progress: module.progress,
          status: module.status,
          quizCompleted: module.quiz?.completed || false,
          quizScore: module.quiz?.bestScore,
          tasksCompleted: module.practicalTasks?.filter(t => t.completed).length || 0,
          totalTasks: module.practicalTasks?.length || 0
        }))
      })),
      currentModule: roadmap.getCurrentModule ? roadmap.getCurrentModule() : null,
      nextModule: roadmap.getNextModule ? roadmap.getNextModule() : null
    };

    res.json({
      success: true,
      progress: progressData
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/enhanced-roadmaps/:id/status
 * @desc    Update roadmap status
 * @access  Private
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'paused', 'completed', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const roadmap = await EnhancedRoadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    roadmap.status = status;
    await roadmap.save();

    res.json({
      success: true,
      message: `Roadmap status updated to ${status}`,
      roadmap
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/enhanced-roadmaps/:id
 * @desc    Delete a roadmap
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const roadmap = await EnhancedRoadmap.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap',
      error: error.message
    });
  }
});

export default router;
