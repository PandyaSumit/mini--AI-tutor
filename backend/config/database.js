import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Increase buffer timeout
    mongoose.set('bufferTimeoutMS', 30000); // 30 seconds

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('💡 Make sure MongoDB is running:');
    console.error('   - Check if MongoDB service is started');
    console.error('   - Verify MONGODB_URI in .env file');
    console.error('   - Try: mongod --dbpath ./data/db');
    process.exit(1);
  }
};

export default connectDB;
