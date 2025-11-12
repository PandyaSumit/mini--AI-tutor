import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST (before any other imports that need them)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Now import other modules that depend on environment variables
import connectDB from './config/database.js';
import aiService from './config/aiService.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import studyMaterialRoutes from './routes/studyMaterialRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import moderateContent from './middleware/contentModeration.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Re-initialize AI Service now that dotenv has loaded
aiService.initialize();

// Verify AI Service is initialized
if (aiService.isReady()) {
    console.log('✅ AI Service is ready');
} else {
    console.warn('⚠️  AI Service initialization pending - will retry on first use');
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Apply rate limiting to all routes
app.use(rateLimiter);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Mini AI Tutor API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', moderateContent, chatRoutes); // Apply content moderation to chat
app.use('/api/user', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/study', studyMaterialRoutes);

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Mini AI Tutor API`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
