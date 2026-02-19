/**
 * Audit Log Model
 *
 * Stores audit trail of sensitive actions for compliance and security
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User details (denormalized for historical accuracy)
    userEmail: {
      type: String,
      required: true,
    },

    userRole: {
      type: String,
      required: true,
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
      //           'ROLE_CHANGE', 'PERMISSION_CHANGE', 'BAN', 'UNBAN'
    },

    // What resource was affected
    resource: {
      type: {
        type: String,
        required: true,
        // Examples: 'User', 'Course', 'Enrollment', 'Settings'
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        // ID of the affected resource
      },
      name: {
        type: String,
        // Human-readable name of the resource
      },
    },

    // Details of the change
    changes: {
      // What was changed
      before: {
        type: mongoose.Schema.Types.Mixed,
        // State before the change
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
        // State after the change
      },
    },

    // Request context
    context: {
      ip: {
        type: String,
        required: true,
      },
      userAgent: {
        type: String,
      },
      method: {
        type: String,
        // HTTP method: GET, POST, PUT, DELETE
      },
      path: {
        type: String,
        // Request path
      },
      statusCode: {
        type: Number,
        // HTTP status code
      },
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      // Any additional context-specific data
    },

    // Severity level
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    // Success or failure
    status: {
      type: String,
      enum: ['success', 'failure', 'partial'],
      default: 'success',
      index: true,
    },

    // Error details (if action failed)
    error: {
      message: String,
      code: String,
      stack: String,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'auditlogs',
  }
);

// ===================================================
// INDEXES
// ===================================================

// Compound indexes for common queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional, configure as needed)
// Uncomment to auto-delete logs older than 90 days
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ===================================================
// STATIC METHODS
// ===================================================

/**
 * Log an action
 * @param {Object} logData - Log data
 * @returns {Promise<Object>} Created audit log
 */
auditLogSchema.statics.logAction = async function (logData) {
  try {
    const log = await this.create(logData);
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - logging failure shouldn't break the application
    return null;
  }
};

/**
 * Get logs for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
auditLogSchema.statics.getUserLogs = async function (
  userId,
  { limit = 50, skip = 0, action = null } = {}
) {
  const query = { user: userId };
  if (action) {
    query.action = action;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get logs for a specific resource
 * @param {string} resourceType - Resource type (e.g., 'Course')
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
auditLogSchema.statics.getResourceLogs = async function (
  resourceType,
  resourceId,
  { limit = 50, skip = 0 } = {}
) {
  return this.find({
    'resource.type': resourceType,
    'resource.id': resourceId,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email')
    .lean();
};

/**
 * Get high-severity logs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Critical/high severity logs
 */
auditLogSchema.statics.getHighSeverityLogs = async function ({
  limit = 100,
  skip = 0,
  since = null,
} = {}) {
  const query = {
    severity: { $in: ['high', 'critical'] },
  };

  if (since) {
    query.timestamp = { $gte: since };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email role')
    .lean();
};

/**
 * Get failed actions
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Failed actions
 */
auditLogSchema.statics.getFailedActions = async function ({
  limit = 100,
  skip = 0,
  since = null,
} = {}) {
  const query = {
    status: 'failure',
  };

  if (since) {
    query.timestamp = { $gte: since };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email role')
    .lean();
};

/**
 * Get audit statistics
 * @param {Date} since - Start date
 * @returns {Promise<Object>} Audit statistics
 */
auditLogSchema.statics.getStatistics = async function (since = null) {
  const matchStage = since ? { timestamp: { $gte: since } } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        byAction: [
          {
            $group: {
              _id: '$action',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ],
        bySeverity: [
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        byResource: [
          {
            $group: {
              _id: '$resource.type',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ],
        total: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  return {
    total: stats[0].total[0]?.count || 0,
    byAction: stats[0].byAction,
    bySeverity: stats[0].bySeverity,
    byStatus: stats[0].byStatus,
    byResource: stats[0].byResource,
  };
};

// ===================================================
// INSTANCE METHODS
// ===================================================

/**
 * Get human-readable description of the log entry
 * @returns {string} Description
 */
auditLogSchema.methods.getDescription = function () {
  const { user, action, resource } = this;
  const userName = user?.name || this.userEmail;
  const resourceName = resource.name || resource.id;

  return `${userName} performed ${action} on ${resource.type} "${resourceName}"`;
};

// ===================================================
// VIRTUAL PROPERTIES
// ===================================================

// Virtual to check if log is recent (within last 24 hours)
auditLogSchema.virtual('isRecent').get(function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.timestamp >= oneDayAgo;
});

// ===================================================
// MODEL EXPORT
// ===================================================

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
