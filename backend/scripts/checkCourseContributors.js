import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

dotenv.config();

async function checkCourseContributors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-ai-tutor');
    console.log('✅ Connected to MongoDB\n');

    // Get all courses
    const courses = await Course.find({})
      .populate('createdBy', 'name email')
      .populate('contributors.user', 'name email')
      .limit(10);

    console.log(`📊 Found ${courses.length} courses:\n`);

    for (const course of courses) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📚 Course: ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Created By: ${course.createdBy?.name || 'Unknown'} (${course.createdBy?._id})`);
      console.log(`   Contributors: ${course.contributors?.length || 0}`);

      if (course.contributors && course.contributors.length > 0) {
        course.contributors.forEach((contributor, idx) => {
          console.log(`   ${idx + 1}. ${contributor.user?.name || 'Unknown'}`);
          console.log(`      Role: ${contributor.contributionType}`);
          console.log(`      Revenue: ${contributor.revenueShare}%`);
          console.log(`      Status: ${contributor.approvalStatus || 'N/A'}`);
        });
      } else {
        console.log(`   ⚠️  NO CONTRIBUTORS FOUND - needs migration!`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCourseContributors();
