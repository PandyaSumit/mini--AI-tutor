/**
 * Dashboard Routes
 * Optimized unified endpoints for dashboard data
 */

import express from 'express';
import {
  getDashboardSummary,
  getDashboardStats
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
// Main dashboard endpoint - aggregates all dashboard data
router.get('/summary', protect, getDashboardSummary);

// Lightweight stats endpoint - just counters
router.get('/stats', protect, getDashboardStats);

export default router;
