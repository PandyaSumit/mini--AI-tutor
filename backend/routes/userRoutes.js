import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  deleteUserAccount
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/stats', protect, getUserStats);
router.delete('/account', protect, deleteUserAccount);

export default router;
