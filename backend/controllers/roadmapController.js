import LearningRoadmap from '../models/LearningRoadmap.js';
import { generateRoadmap, adaptRoadmap } from '../services/roadmapService.js';
import User from '../models/User.js';

// @desc    Generate new learning roadmap
// @route   POST /api/roadmaps/generate
// @access  Private
export const createRoadmap = async (req, res) => {
  try {
    const { goal, currentLevel, weeklyTimeCommitment, targetDate, preferredLearningModes } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!goal || !currentLevel || !weeklyTimeCommitment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide goal, current level, and weekly time commitment'
      });
    }

    // Generate roadmap using AI
    const roadmapData = await generateRoadmap({
      goal,
      currentLevel,
      weeklyTimeCommitment,
      targetDate,
      preferredLearningModes: preferredLearningModes || ['text', 'hands-on']
    });

    // Create roadmap in database
    const roadmap = await LearningRoadmap.create({
      user: userId,
      title: `${goal} - Learning Roadmap`,
      goal,
      currentLevel,
      weeklyTimeCommitment,
      targetDate,
      preferredLearningModes: preferredLearningModes || ['text', 'hands-on'],
      totalWeeks: roadmapData.totalWeeks,
      overview: roadmapData.overview,
      milestones: roadmapData.milestones,
      weeklyModules: roadmapData.weeklyModules
    });

    res.status(201).json({
      success: true,
      message: 'Learning roadmap generated successfully',
      data: { roadmap }
    });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap',
      error: error.message
    });
  }
};

// @desc    Get all user roadmaps
// @route   GET /api/roadmaps
// @access  Private
export const getRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const roadmaps = await LearningRoadmap.find(query)
      .sort({ createdAt: -1 })
      .select('title goal status totalWeeks createdAt updatedAt');

    res.status(200).json({
      success: true,
      data: { roadmaps }
    });
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmaps',
      error: error.message
    });
  }
};

// @desc    Get single roadmap with details
// @route   GET /api/roadmaps/:id
// @access  Private
export const getRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await LearningRoadmap.findOne({
      _id: id,
      user: userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Calculate progress
    const progress = roadmap.calculateProgress();

    res.status(200).json({
      success: true,
      data: {
        roadmap,
        progress
      }
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap',
      error: error.message
    });
  }
};

// @desc    Update roadmap progress
// @route   PUT /api/roadmaps/:id/progress
// @access  Private
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { weekNumber, taskIndex, completed } = req.body;
    const userId = req.user.id;

    const roadmap = await LearningRoadmap.findOne({
      _id: id,
      user: userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Find the module
    const module = roadmap.weeklyModules.find(m => m.weekNumber === weekNumber);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Update task completion
    if (taskIndex !== undefined && module.dailyTasks[taskIndex]) {
      module.dailyTasks[taskIndex].completed = completed;
      module.dailyTasks[taskIndex].completedAt = completed ? new Date() : null;

      // Calculate module progress
      const completedTasks = module.dailyTasks.filter(t => t.completed).length;
      module.progress = Math.round((completedTasks / module.dailyTasks.length) * 100);

      // Update module status
      if (module.progress === 100) {
        module.status = 'completed';
      } else if (module.progress > 0) {
        module.status = 'in_progress';
      }
    }

    roadmap.adaptiveData.lastProgressUpdate = new Date();
    await roadmap.save();

    // Update user stats
    const user = await User.findById(userId);
    user.updateStreak();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { roadmap }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

// @desc    Complete milestone
// @route   PUT /api/roadmaps/:id/milestones/:milestoneIndex/complete
// @access  Private
export const completeMilestone = async (req, res) => {
  try {
    const { id, milestoneIndex } = req.params;
    const userId = req.user.id;

    const roadmap = await LearningRoadmap.findOne({
      _id: id,
      user: userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    roadmap.completeMilestone(parseInt(milestoneIndex));
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Milestone completed!',
      data: { roadmap }
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete milestone',
      error: error.message
    });
  }
};

// @desc    Adapt roadmap based on performance
// @route   POST /api/roadmaps/:id/adapt
// @access  Private
export const adaptRoadmapController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await LearningRoadmap.findOne({
      _id: id,
      user: userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Get performance data
    const progressData = {
      averageQuizScore: roadmap.adaptiveData.performanceMetrics.averageQuizScore || 0,
      completionRate: roadmap.adaptiveData.performanceMetrics.completionRate || 0
    };

    // Get AI adaptation suggestions
    const adaptations = await adaptRoadmap(roadmap, progressData);

    // Apply adjustments if needed
    if (adaptations.remediationNeeded) {
      roadmap.adaptiveData.remediationMode = true;
    }

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Roadmap adapted successfully',
      data: {
        adaptations,
        roadmap
      }
    });
  } catch (error) {
    console.error('Adapt roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adapt roadmap',
      error: error.message
    });
  }
};

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private
export const deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await LearningRoadmap.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap',
      error: error.message
    });
  }
};
