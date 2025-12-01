/**
 * Create Admin User Script
 * Creates an admin user for platform management
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../models/User.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log('🔐 Admin User Creation Script\n');

    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check for existing admins
    const existingAdmins = await User.find({ role: 'admin' }).select('name email');
    if (existingAdmins.length > 0) {
      console.log('⚠️  Existing admin users:');
      existingAdmins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
      console.log('');

      const proceed = await question('Do you want to create another admin? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('❌ Admin creation cancelled');
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }
      console.log('');
    }

    // Get admin details
    const name = await question('Enter admin name: ');
    if (!name.trim()) {
      throw new Error('Name is required');
    }

    const email = await question('Enter admin email: ');
    if (!email.trim() || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`\n⚠️  User with email ${email} is already an admin`);
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      } else {
        const upgrade = await question(`\n⚠️  User with email ${email} exists with role "${existingUser.role}". Upgrade to admin? (yes/no): `);
        if (upgrade.toLowerCase() === 'yes' || upgrade.toLowerCase() === 'y') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log(`\n✅ User ${existingUser.name} upgraded to admin!`);
          console.log(`   Email: ${existingUser.email}`);
          console.log(`   Role: admin`);
          rl.close();
          await mongoose.connection.close();
          process.exit(0);
        } else {
          console.log('❌ Admin creation cancelled');
          rl.close();
          await mongoose.connection.close();
          process.exit(0);
        }
      }
    }

    const password = await question('Enter admin password (min 6 characters): ');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    console.log('\n📝 Creating admin user...');

    // Create admin user
    const admin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      aiUsage: {
        quotas: {
          chatMessages: {
            limit: -1, // Unlimited for admin
            used: 0
          },
          voiceMinutes: {
            limit: -1,
            used: 0
          },
          courseGenerations: {
            limit: -1,
            used: 0
          }
        }
      }
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);
    console.log('═══════════════════════════════════════');
    console.log('\n🔐 Admin user can now access:');
    console.log('   - Admin Panel: /admin/dashboard');
    console.log('   - Instructor Verification: /admin/instructors');
    console.log('   - Course Quality Review: /admin/courses');
    console.log('   - User Management: /admin/users');
    console.log('   - Admin API: /api/admin/*');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run script
createAdminUser();
