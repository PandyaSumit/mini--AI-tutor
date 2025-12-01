import mongoose from 'mongoose';

/**
 * Admin Action Log Model
 * Tracks all administrative actions for security audit trail
 *
 * SECURITY CRITICAL: This provides accountability and forensics
 * for all admin operations on the platform.
 */

const adminActionLogSchema = new mongoose.Schema({
  // Admin who performed the action
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  adminEmail: {
    type: String,
    required: true,
    index: true
  },

  // Type of action performed
  actionType: {
    type: String,
    required: true,
    enum: [
      // User management
      'approve_instructor',
      'reject_instructor',
      'ban_user',
      'unban_user',
      'delete_user',
      'change_user_role',
      'reset_user_password',

      // Course management
      'approve_course',
      'reject_course',
      'delete_course',
      'feature_course',
      'unfeature_course',

      // Financial
      'approve_payout',
      'reject_payout',
      'adjust_earnings',

      // System
      'update_settings',
      'view_analytics',
      'export_data',
      'other'
    ],
    index: true
  },

  // Resource that was acted upon
  targetResource: {
    type: String, // ID of user, course, etc.
    default: null,
    index: true
  },

  // Request details
  requestMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: true
  },

  requestPath: {
    type: String,
    required: true
  },

  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  requestQuery: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Security context
  ipAddress: {
    type: String,
    index: true
  },

  userAgent: {
    type: String
  },

  // Result
  success: {
    type: Boolean,
    required: true,
    index: true
  },

  errorMessage: {
    type: String,
    default: null
  },

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },

  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
adminActionLogSchema.index({ adminUser: 1, timestamp: -1 });
adminActionLogSchema.index({ actionType: 1, timestamp: -1 });
adminActionLogSchema.index({ success: 1, timestamp: -1 });

// Static method: Get recent admin actions
adminActionLogSchema.statics.getRecentActions = function(limit = 50) {
  return this.find()
    .populate('adminUser', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method: Get actions by admin
adminActionLogSchema.statics.getActionsByAdmin = function(adminId, limit = 100) {
  return this.find({ adminUser: adminId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method: Get failed actions (security monitoring)
adminActionLogSchema.statics.getFailedActions = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.find({
    success: false,
    timestamp: { $gte: since }
  })
    .populate('adminUser', 'name email')
    .sort({ timestamp: -1 });
};

// Static method: Get actions by type
adminActionLogSchema.statics.getActionsByType = function(actionType, limit = 100) {
  return this.find({ actionType })
    .populate('adminUser', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method: Get actions for specific resource
adminActionLogSchema.statics.getActionsForResource = function(resourceId) {
  return this.find({ targetResource: resourceId })
    .populate('adminUser', 'name email')
    .sort({ timestamp: -1 });
};

// Static method: Get analytics summary
adminActionLogSchema.statics.getAnalyticsSummary = async function(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const summary = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        },
        uniqueAdmins: { $addToSet: '$adminUser' }
      }
    },
    {
      $project: {
        _id: 0,
        actionType: '$_id',
        count: 1,
        successCount: 1,
        failureCount: 1,
        uniqueAdmins: { $size: '$uniqueAdmins' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return summary;
};

// Static method: Detect suspicious activity
adminActionLogSchema.statics.detectSuspiciousActivity = async function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Find patterns that might indicate compromise
  const alerts = [];

  // 1. High number of failed actions from same admin
  const failedActions = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: oneHourAgo },
        success: false
      }
    },
    {
      $group: {
        _id: '$adminUser',
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gte: 5 } // 5+ failures in 1 hour
      }
    }
  ]);

  if (failedActions.length > 0) {
    alerts.push({
      type: 'high_failure_rate',
      severity: 'medium',
      admins: failedActions.map(a => a._id),
      message: 'Admin(s) with unusually high failure rate detected'
    });
  }

  // 2. Multiple admin logins from different IPs
  const multipleIPs = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: oneHourAgo }
      }
    },
    {
      $group: {
        _id: '$adminUser',
        ips: { $addToSet: '$ipAddress' }
      }
    },
    {
      $match: {
        $expr: { $gte: [{ $size: '$ips' }, 3] } // 3+ different IPs
      }
    }
  ]);

  if (multipleIPs.length > 0) {
    alerts.push({
      type: 'multiple_ips',
      severity: 'high',
      admins: multipleIPs.map(a => a._id),
      message: 'Admin(s) accessing from multiple IP addresses'
    });
  }

  return alerts;
};

// Auto-delete very old logs (older than 2 years) to save space
adminActionLogSchema.statics.cleanupOldLogs = async function() {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  console.log(`🧹 Cleaned up ${result.deletedCount} old admin action logs`);
  return result;
};

export default mongoose.model('AdminActionLog', adminActionLogSchema);
