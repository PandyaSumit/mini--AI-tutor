/**
 * CostControlAgent - Monitors AI costs and enforces budgets
 * - Tracks spending per user, course, feature
 * - Alerts when budgets are exceeded
 * - Can automatically throttle expensive operations
 */

import BaseAgent from './BaseAgent.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import AIUsageLog from '../../models/AIUsageLog.js';

class CostControlAgent extends BaseAgent {
  constructor() {
    super('CostControlAgent', {
      dailyBudget: parseFloat(process.env.DAILY_AI_BUDGET) || 100, // $100/day default
      alertThreshold: 0.8, // Alert at 80% of budget
      criticalThreshold: 0.95 // Throttle at 95%
    });

    this.budgetStatus = {
      today: 0,
      thisHour: 0,
      isThrottled: false
    };
  }

  /**
   * Main execution: Check and enforce cost controls
   */
  async execute(task) {
    const { action, target, ...params } = task;

    switch (action) {
      case 'check_user_budget':
        return await this.checkUserBudget(target);

      case 'check_course_budget':
        return await this.checkCourseBudget(target);

      case 'check_global_budget':
        return await this.checkGlobalBudget();

      case 'get_cost_analytics':
        return await this.getCostAnalytics(params);

      case 'enforce_limits':
        return await this.enforceLimits(target);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Check if user is within budget
   */
  async checkUserBudget(user_id) {
    const user = await User.findById(user_id).select('tier usage');

    // Cost limits per tier (monthly)
    const costLimits = {
      free: 0.50, // $0.50/month
      basic: 3.00, // $3/month
      pro: 7.00 // $7/month
    };

    const userLimit = costLimits[user.tier] || costLimits.free;
    const currentCost = user.usage.estimated_cost_this_month;
    const percentUsed = (currentCost / userLimit) * 100;

    const withinBudget = currentCost < userLimit;
    const needsAlert = percentUsed > this.config.alertThreshold * 100;
    const needsThrottle = percentUsed > this.config.criticalThreshold * 100;

    return {
      user_id,
      tier: user.tier,
      cost_limit: userLimit,
      current_cost: currentCost,
      percent_used: percentUsed,
      within_budget: withinBudget,
      needs_alert: needsAlert,
      needs_throttle: needsThrottle,
      cost: 0
    };
  }

  /**
   * Check course AI cost efficiency
   */
  async checkCourseBudget(course_id) {
    const course = await Course.findById(course_id)
      .select('analytics.total_ai_cost analytics.total_enrollments analytics.average_ai_cost_per_student');

    if (!course) {
      throw new Error(`Course ${course_id} not found`);
    }

    const totalCost = course.analytics.total_ai_cost || 0;
    const enrollments = course.analytics.total_enrollments || 1;
    const avgCostPerStudent = totalCost / enrollments;

    // Target: < $5 per student
    const targetCostPerStudent = 5.0;
    const isEfficient = avgCostPerStudent < targetCostPerStudent;

    return {
      course_id,
      total_cost: totalCost,
      enrollments,
      avg_cost_per_student: avgCostPerStudent,
      target_cost_per_student: targetCostPerStudent,
      is_efficient: isEfficient,
      needs_optimization: !isEfficient,
      cost: 0
    };
  }

  /**
   * Check global platform budget
   */
  async checkGlobalBudget() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's total cost
    const todaysCost = await AIUsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total_cost: { $sum: '$cost' },
          total_requests: { $sum: 1 }
        }
      }
    ]);

    const currentCost = todaysCost[0]?.total_cost || 0;
    const requests = todaysCost[0]?.total_requests || 0;

    this.budgetStatus.today = currentCost;

    const percentUsed = (currentCost / this.config.dailyBudget) * 100;
    const withinBudget = currentCost < this.config.dailyBudget;

    // Check if we need to throttle
    if (percentUsed > this.config.criticalThreshold * 100) {
      this.budgetStatus.isThrottled = true;
      this.log('warn', 'Global budget critical - throttling enabled', {
        current: currentCost,
        budget: this.config.dailyBudget
      });
    }

    // Alert if approaching limit
    if (percentUsed > this.config.alertThreshold * 100 && !this.budgetStatus.isThrottled) {
      this.log('warn', 'Global budget alert', {
        current: currentCost,
        budget: this.config.dailyBudget,
        percent: percentUsed
      });
    }

    return {
      daily_budget: this.config.dailyBudget,
      current_cost: currentCost,
      percent_used: percentUsed,
      within_budget: withinBudget,
      is_throttled: this.budgetStatus.isThrottled,
      total_requests: requests,
      cost: 0
    };
  }

  /**
   * Get cost analytics breakdown
   */
  async getCostAnalytics(params) {
    const { period = 'today', group_by = 'feature' } = params;

    const startDate = this.getPeriodStart(period);

    // Aggregate costs by specified dimension
    const analytics = await AIUsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: `$${group_by}`,
          total_cost: { $sum: '$cost' },
          total_requests: { $sum: 1 },
          avg_cost: { $avg: '$cost' },
          routing_breakdown: {
            $push: '$routing_decision'
          }
        }
      },
      {
        $sort: { total_cost: -1 }
      }
    ]);

    // Calculate routing efficiency
    const routingStats = await this.getRoutingStats(startDate);

    return {
      period,
      group_by,
      analytics,
      routing_stats: routingStats,
      cost: 0
    };
  }

  /**
   * Get routing decision statistics (cache hit rate)
   */
  async getRoutingStats(startDate) {
    const stats = await AIUsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$routing_decision',
          count: { $sum: 1 },
          total_cost: { $sum: '$cost' },
          avg_cost: { $avg: '$cost' }
        }
      }
    ]);

    const totalRequests = stats.reduce((sum, s) => sum + s.count, 0);

    return stats.map(s => ({
      routing: s._id,
      count: s.count,
      percentage: (s.count / totalRequests) * 100,
      total_cost: s.total_cost,
      avg_cost: s.avg_cost
    }));
  }

  /**
   * Enforce cost limits (throttle if needed)
   */
  async enforceLimits(target) {
    const globalBudget = await this.checkGlobalBudget();

    if (globalBudget.is_throttled) {
      return {
        action: 'throttle',
        reason: 'Global budget exceeded',
        message: 'AI features are temporarily throttled due to budget limits',
        cost: 0
      };
    }

    if (target?.user_id) {
      const userBudget = await this.checkUserBudget(target.user_id);

      if (userBudget.needs_throttle) {
        return {
          action: 'throttle',
          reason: 'User budget exceeded',
          message: 'You have reached your usage limit. Please upgrade to continue.',
          upgrade_url: '/pricing',
          cost: 0
        };
      }
    }

    return {
      action: 'allow',
      message: 'Within budget limits',
      cost: 0
    };
  }

  /**
   * Get period start date
   */
  getPeriodStart(period) {
    const now = new Date();

    switch (period) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today;

      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;

      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;

      default:
        return new Date(now);
    }
  }

  /**
   * Reset daily budget tracking (called at midnight)
   */
  resetDailyBudget() {
    this.budgetStatus = {
      today: 0,
      thisHour: 0,
      isThrottled: false
    };

    this.log('info', 'Daily budget reset');
  }

  /**
   * Check if system should throttle requests
   */
  shouldThrottle() {
    return this.budgetStatus.isThrottled;
  }
}

export default CostControlAgent;
