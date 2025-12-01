import express from 'express';
import { createServer } from 'http';
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
import dashboardRoutes from './routes/dashboardRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import studyMaterialRoutes from './routes/studyMaterialRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import courseRoutes from './routes/courses.js';
import moduleRoutes from './routes/modules.js';
import lessonRoutes from './routes/lessons.js';
import enrollmentRoutes from './routes/enrollments.js';
import adminRoutes from './routes/admin.js';
import publicCourseRoutes from './routes/publicCourseRoutes.js';
import { errorHandler} from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import moderateContent from './middleware/contentModeration.js';
import { initializeSocketIO } from './config/socket.js';
import registerVoiceHandlers from './socketHandlers/voiceHandlers.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);
registerVoiceHandlers(io);
console.log('✅ WebSocket (Socket.IO) initialized for voice sessions');

// Initialize Cache System
let cacheInitialized = false;
(async () => {
    try {
        const { initializeCache, shutdownCache } = await import('./config/initializeCache.js');
        const result = await initializeCache();
        cacheInitialized = result.success;

        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n🛑 Received shutdown signal...');
            await shutdownCache();
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('❌ Cache initialization error:', error.message);
        console.log('⚠️  Continuing without cache...');
    }
})();

// Re-initialize AI Service now that dotenv has loaded
aiService.initialize();

// Verify AI Service is initialized
if (aiService.isReady()) {
    console.log('✅ AI Service is ready');
} else {
    console.warn('⚠️  AI Service initialization pending - will retry on first use');
}

// Initialize Memory Maintenance Jobs
(async () => {
    try {
        const { default: memoryJobs } = await import('./ai/memory/memoryJobs.js');

        // Start background jobs for memory consolidation, decay, and cleanup
        memoryJobs.startAll();
        console.log('✅ Memory maintenance jobs initialized');

        // Graceful shutdown for memory jobs
        const originalShutdown = process.listeners('SIGTERM')[0];
        process.removeListener('SIGTERM', originalShutdown);

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Stopping memory jobs...');
            memoryJobs.stopAll();
            if (originalShutdown) await originalShutdown();
        });

        process.on('SIGINT', async () => {
            console.log('\n🛑 Stopping memory jobs...');
            memoryJobs.stopAll();
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Memory jobs initialization error:', error.message);
        console.log('⚠️  Continuing without memory maintenance jobs...');
    }
})();

// Initialize Course Sync Service
(async () => {
    try {
        const { default: chromaService } = await import('./ai/vectorstore/chromaService.js');
        const { default: courseSyncService } = await import('./ai/vectorstore/courseSyncService.js');

        // Initialize ChromaDB first
        const chromaResult = await chromaService.initialize();

        if (chromaResult.success) {
            // Initialize course sync service
            await courseSyncService.initialize();
            console.log('✅ Course Sync Service initialized');

            // Perform initial sync if needed (optional - can be triggered manually)
            // Uncomment the following line to auto-sync on startup:
            // await courseSyncService.syncAllCourses({ batchSize: 50 });
        } else {
            console.log('⚠️  ChromaDB not available - course semantic search disabled');
        }
    } catch (error) {
        console.error('❌ Course Sync Service initialization error:', error.message);
        console.log('⚠️  Continuing without course semantic search...');
    }
})();

// Middleware
app.use(helmet()); // Security headers

// Configure CORS to allow the frontend origin and credentials (cookies)
const allowedFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., server-to-server, mobile tools)
        if (!origin) return callback(null, true);
        const allowed = [allowedFrontend, 'http://localhost:5173', 'http://localhost:5174'];
        if (allowed.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions)); // Enable CORS with options
app.options('*', cors(corsOptions)); // Preflight support
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
app.use('/api/public', publicCourseRoutes); // PUBLIC - No auth required for course discovery
app.use('/api/admin', adminRoutes); // ADMIN ONLY - Protected by admin middleware
app.use('/api/chat', moderateContent, chatRoutes); // Apply content moderation to chat
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes); // Optimized dashboard endpoint
app.use('/api/conversations', conversationRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/study', studyMaterialRoutes);
app.use('/api/voice', voiceRoutes); // Voice session routes

// Course system routes
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:courseId/modules', moduleRoutes);
app.use('/api/courses/:courseId/modules/:moduleId/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Co-creator management routes
const coCreatorRoutes = (await import('./routes/coCreatorRoutes.js')).default;
app.use('/api/courses', coCreatorRoutes);
app.use('/api/co-creators', coCreatorRoutes);

// Contributor improvement suggestions routes
const contributorRoutes = (await import('./routes/contributorRoutes.js')).default;
app.use('/api/courses', contributorRoutes);
app.use('/api/contributors', contributorRoutes);

// Contributor invitation routes
const invitationRoutes = (await import('./routes/invitationRoutes.js')).default;
app.use('/api/invitations', invitationRoutes);

// Initialize async routes
(async () => {
    try {
        // Cache Admin Routes
        try {
            const cacheAdminRoutes = await import('./routes/cacheAdminRoutes.js');
            app.use('/api/cache', cacheAdminRoutes.default);
            console.log('✅ Cache admin routes mounted at /api/cache');
        } catch (error) {
            console.warn('⚠️  Cache admin routes not available:', error.message);
        }

        // Initialize AI Pipeline
        try {
            const aiOrchestrator = await import('./services/aiOrchestrator.js');
            const result = await aiOrchestrator.default.initialize();

            if (result.success) {
                // Mount AI routes
                const aiRoutes = await import('./routes/aiRoutes.js');
                app.use('/api/ai', aiRoutes.default);
                console.log('✅ AI routes mounted at /api/ai');

                // Initialize MCP tools for platform actions
                try {
                    const setupMCPTools = await import('./ai/mcp/setupMCPTools.js');
                    const mcpResult = setupMCPTools.default();

                    if (mcpResult.success) {
                        console.log(`✅ MCP tools initialized (${mcpResult.toolsRegistered} tools registered)`);
                    } else {
                        console.warn('⚠️  MCP tools initialization failed:', mcpResult.error);
                    }
                } catch (mcpError) {
                    console.warn('⚠️  MCP tools not available:', mcpError.message);
                }

                // Mount AI Workflow routes (Advanced RAG, LangGraph, MCP)
                try {
                    const aiWorkflowRoutes = await import('./routes/aiWorkflowRoutes.js');
                    app.use('/api/ai/workflows', aiWorkflowRoutes.default);
                    console.log('✅ AI Workflow routes mounted at /api/ai/workflows');
                } catch (error) {
                    console.warn('⚠️  AI Workflow routes not available:', error.message);
                }

                // Add cleanup on shutdown
                const aiShutdown = async () => {
                    console.log('\n🛑 Shutting down AI pipeline...');
                    await aiOrchestrator.default.cleanup();
                };

                process.on('SIGTERM', aiShutdown);
                process.on('SIGINT', aiShutdown);
            }
        } catch (error) {
            console.error('❌ AI Pipeline initialization error:', error.message);
            console.log('⚠️  Continuing without AI pipeline...');
        }

        // Register 404 handler AFTER all routes are mounted
        app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });

        // Error handling middleware (must be last)
        app.use(errorHandler);
    } catch (error) {
        console.error('❌ Route initialization error:', error);
    }
})();

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Mini AI Tutor API`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 WebSocket server ready for voice sessions`);
});

export default app;
