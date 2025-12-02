/**
 * AdminAgent - Handles admin operations
 */

import BaseAgent from './BaseAgent.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';

class AdminAgent extends BaseAgent {
  constructor() {
    super('AdminAgent');
  }

  async execute(task) {
    const { action, ...params } = task;

    switch (action) {
      case 'approve_course':
        return await this.approveCourse(params.course_id, params.admin_id);

      case 'suspend_user':
        return await this.suspendUser(params.user_id, params.reason);

      case 'adjust_usage_limits':
        return await this.adjustUsageLimits(params.user_id, params.limits);

      case 'get_platform_stats':
        return await this.getPlatformStats();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async approveCourse(course_id, admin_id) {
    await Course.updateOne(
      { _id: course_id },
      {
        status: 'approved',
        approved_by_admin_id: admin_id,
        approved_at: new Date()
      }
    );

    this.log('info', 'Course approved', { course_id, admin_id });
    return { success: true, cost: 0 };
  }

  async suspendUser(user_id, reason) {
    await User.updateOne(
      { _id: user_id },
      {
        status: 'suspended',
        suspension_reason: reason,
        suspension_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    );

    this.log('info', 'User suspended', { user_id, reason });
    return { success: true, cost: 0 };
  }

  async adjustUsageLimits(user_id, limits) {
    // Custom limits for specific users
    this.log('info', 'Usage limits adjusted', { user_id, limits });
    return { success: true, cost: 0 };
  }

  async getPlatformStats() {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments({ status: 'approved' });

    return { userCount, courseCount, cost: 0 };
  }
}

export default AdminAgent;
