import express from 'express';
import {
  createRoadmap,
  getRoadmaps,
  getRoadmap,
  updateProgress,
  completeMilestone,
  adaptRoadmapController,
  deleteRoadmap
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.post('/generate', protect, createRoadmap);
router.get('/', protect, getRoadmaps);
router.get('/:id', protect, getRoadmap);
router.put('/:id/progress', protect, updateProgress);
router.put('/:id/milestones/:milestoneIndex/complete', protect, completeMilestone);
router.post('/:id/adapt', protect, adaptRoadmapController);
router.delete('/:id', protect, deleteRoadmap);

export default router;
