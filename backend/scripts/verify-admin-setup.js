/**
 * Admin Setup Verification Script
 * Verifies that all admin functionality is properly configured
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
import User from '../models/User.js';
import Course from '../models/Course.js';
import AIUsageLog from '../models/AIUsageLog.js';
import AdminActionLog from '../models/AdminActionLog.js';

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function logSuccess(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function logError(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

async function verifyAdminSetup() {
  try {
    console.log('🔍 Starting Admin Setup Verification...\n');

    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logSuccess('Connected to MongoDB');
    console.log('');

    // 1. Verify User Model
    console.log('👤 Verifying User Model...');

    // Check role enum
    const userRoleEnum = User.schema.path('role').enumValues;
    const expectedRoles = ['learner', 'verified_instructor', 'platform_author', 'admin'];
    if (JSON.stringify(userRoleEnum.sort()) === JSON.stringify(expectedRoles.sort())) {
      logSuccess('User role enum includes all required roles');
    } else {
      logError(`User role enum mismatch. Expected: ${expectedRoles.join(', ')}. Got: ${userRoleEnum.join(', ')}`);
    }

    // Check default role
    const defaultRole = User.schema.path('role').defaultValue;
    if (defaultRole === 'learner') {
      logSuccess('User default role is "learner"');
    } else {
      logError(`User default role should be "learner", got "${defaultRole}"`);
    }

    // Check for instructor verification methods
    const userMethods = Object.keys(User.schema.methods);
    if (userMethods.includes('approveAsInstructor')) {
      logSuccess('User model has approveAsInstructor method');
    } else {
      logError('User model missing approveAsInstructor method');
    }

    if (userMethods.includes('rejectInstructorApplication')) {
      logSuccess('User model has rejectInstructorApplication method');
    } else {
      logError('User model missing rejectInstructorApplication method');
    }

    console.log('');

    // 2. Verify Course Model
    console.log('📚 Verifying Course Model...');

    // Check courseType enum
    const courseTypeEnum = Course.schema.path('courseType').enumValues;
    const expectedTypes = ['personal', 'marketplace', 'flagship'];
    if (JSON.stringify(courseTypeEnum.sort()) === JSON.stringify(expectedTypes.sort())) {
      logSuccess('Course courseType enum includes all required types');
    } else {
      logError(`Course courseType enum mismatch. Expected: ${expectedTypes.join(', ')}. Got: ${courseTypeEnum.join(', ')}`);
    }

    // Check default courseType
    const defaultCourseType = Course.schema.path('courseType').defaultValue;
    if (defaultCourseType === 'personal') {
      logSuccess('Course default courseType is "personal"');
    } else {
      logError(`Course default courseType should be "personal", got "${defaultCourseType}"`);
    }

    // Check visibility enum
    const visibilityEnum = Course.schema.path('visibility').enumValues;
    const expectedVisibility = ['private', 'unlisted', 'public'];
    if (JSON.stringify(visibilityEnum.sort()) === JSON.stringify(expectedVisibility.sort())) {
      logSuccess('Course visibility enum includes all required values');
    } else {
      logError(`Course visibility enum mismatch. Expected: ${expectedVisibility.join(', ')}. Got: ${visibilityEnum.join(', ')}`);
    }

    // Check for quality review methods
    const courseMethods = Object.keys(Course.schema.methods);
    if (courseMethods.includes('approveQuality')) {
      logSuccess('Course model has approveQuality method');
    } else {
      logError('Course model missing approveQuality method');
    }

    if (courseMethods.includes('rejectQuality')) {
      logSuccess('Course model has rejectQuality method');
    } else {
      logError('Course model missing rejectQuality method');
    }

    console.log('');

    // 3. Verify AIUsageLog Model
    console.log('🤖 Verifying AIUsageLog Model...');

    try {
      await AIUsageLog.schema;
      logSuccess('AIUsageLog model exists');

      // Check static methods
      if (typeof AIUsageLog.getPlatformUsage === 'function') {
        logSuccess('AIUsageLog has getPlatformUsage method');
      } else {
        logError('AIUsageLog missing getPlatformUsage static method');
      }

      if (typeof AIUsageLog.getUserUsageSummary === 'function') {
        logSuccess('AIUsageLog has getUserUsageSummary method');
      } else {
        logError('AIUsageLog missing getUserUsageSummary static method');
      }
    } catch (error) {
      logError(`AIUsageLog model error: ${error.message}`);
    }

    console.log('');

    // 4. Verify AdminActionLog Model
    console.log('📝 Verifying AdminActionLog Model...');

    try {
      await AdminActionLog.schema;
      logSuccess('AdminActionLog model exists');

      // Check static methods
      if (typeof AdminActionLog.getRecentActions === 'function') {
        logSuccess('AdminActionLog has getRecentActions method');
      } else {
        logError('AdminActionLog missing getRecentActions static method');
      }

      if (typeof AdminActionLog.getActionsByType === 'function') {
        logSuccess('AdminActionLog has getActionsByType method');
      } else {
        logError('AdminActionLog missing getActionsByType static method');
      }
    } catch (error) {
      logError(`AdminActionLog model error: ${error.message}`);
    }

    console.log('');

    // 5. Check for existing admins
    console.log('👑 Checking Admin Users...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      logSuccess(`Found ${adminCount} admin user(s)`);
    } else {
      logWarning('No admin users found. You need to create at least one admin user.');
      console.log('   Run: npm run create-admin');
    }

    console.log('');

    // 6. Database Statistics
    console.log('📊 Database Statistics...');
    const stats = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ 'instructorVerification.status': 'pending' }),
      Course.countDocuments({ courseType: 'marketplace', 'marketplace.hasPassedQualityReview': false })
    ]);

    console.log(`   Total Users: ${stats[0]}`);
    console.log(`   Total Courses: ${stats[1]}`);
    console.log(`   Pending Instructor Applications: ${stats[2]}`);
    console.log(`   Pending Course Reviews: ${stats[3]}`);

    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📋 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Passed: ${checks.passed}`);
    console.log(`❌ Failed: ${checks.failed}`);
    console.log(`⚠️  Warnings: ${checks.warnings}`);
    console.log('═══════════════════════════════════════');

    if (checks.failed === 0) {
      console.log('\n🎉 All checks passed! Admin system is properly configured.');
    } else {
      console.log(`\n⚠️  ${checks.failed} check(s) failed. Please review and fix the issues above.`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(checks.failed > 0 ? 1 : 0);
  }
}

// Run verification
verifyAdminSetup();
