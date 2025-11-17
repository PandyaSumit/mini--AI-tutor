import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import contributorInvitationService from '../services/contributorInvitationService.js';

const router = express.Router();

/**
 * @route   POST /api/invitations/check-and-invite
 * @desc    Check and invite eligible students (admin only or automated cron)
 * @access  Private (Admin)
 */
router.post('/check-and-invite', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can trigger this action'
      });
    }

    const result = await contributorInvitationService.checkAndInviteEligibleStudents();

    res.json(result);
  } catch (error) {
    console.error('Error checking and inviting students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/invitations/stats
 * @desc    Get invitation statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can view these statistics'
      });
    }

    const stats = await contributorInvitationService.getInvitationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting invitation stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/invitations/invite/:userId
 * @desc    Manually invite a specific user
 * @access  Private (Admin)
 */
router.post('/invite/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can manually invite users'
      });
    }

    const result = await contributorInvitationService.manuallyInviteUser(req.params.userId);

    res.json(result);
  } catch (error) {
    console.error('Error manually inviting user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/invitations/my-status
 * @desc    Check current user's contributor invitation status
 * @access  Private
 */
router.get('/my-status', protect, async (req, res) => {
  try {
    const user = req.user;

    const status = {
      invited: user.contributorActivity.invitedToContribute,
      invitedAt: user.contributorActivity.invitedAt,
      qualityScore: user.contributorActivity.qualityScore,
      eligible: user.shouldBeInvitedAsContributor(),
      activity: {
        errorReports: user.contributorActivity.errorReports,
        suggestionsSubmitted: user.contributorActivity.suggestionsSubmitted,
        suggestionsImplemented: user.contributorActivity.suggestionsImplemented,
        questionsAsked: user.contributorActivity.questionsAsked,
        forumParticipation: user.contributorActivity.forumParticipation
      },
      reputation: {
        score: user.reputation.score,
        canApplyAsCoCreator: user.reputation.score >= 50 || user.contributorActivity.invitedToContribute
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
