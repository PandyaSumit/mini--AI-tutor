import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

// Load environment variables
dotenv.config();

/**
 * Migration script to add founders to existing courses
 * Run this once to update all existing courses to have proper founder entries
 */
async function addFoundersToExistingCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-ai-tutor');
    console.log('✅ Connected to MongoDB');

    // Find all courses that don't have contributors or have empty contributors array
    const coursesWithoutFounders = await Course.find({
      $or: [
        { contributors: { $exists: false } },
        { contributors: { $size: 0 } },
        { contributors: { $not: { $elemMatch: { contributionType: 'founder' } } } }
      ]
    });

    console.log(`\n📊 Found ${coursesWithoutFounders.length} courses without founders\n`);

    let updated = 0;
    let skipped = 0;

    for (const course of coursesWithoutFounders) {
      if (!course.createdBy) {
        console.log(`⚠️  Skipping course ${course._id} - no createdBy field`);
        skipped++;
        continue;
      }

      // Add the founder entry
      course.contributors = course.contributors || [];
      course.contributors.push({
        user: course.createdBy,
        contributionType: 'founder',
        contributionDate: course.createdAt || new Date(),
        contributionScore: 100,
        revenueShare: 60,
        approvalStatus: 'approved'
      });

      await course.save();
      console.log(`✅ Added founder to course: ${course.title} (${course._id})`);
      updated++;
    }

    console.log(`\n📈 Migration complete!`);
    console.log(`   Updated: ${updated} courses`);
    console.log(`   Skipped: ${skipped} courses`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addFoundersToExistingCourses();
