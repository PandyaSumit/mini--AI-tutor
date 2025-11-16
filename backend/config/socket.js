import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

// Initialize Socket.IO server
export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8 // 100 MB for audio chunks
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;

      console.log(`✅ User ${decoded.email} authenticated via WebSocket`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userEmail})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO server initialized');
  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
};

// Emit to specific user
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to specific session
export const emitToSession = (sessionId, event, data) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  io.to(`session:${sessionId}`).emit(event, data);
};

// Broadcast to all connected clients
export const broadcast = (event, data) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  io.emit(event, data);
};

export default { initializeSocketIO, getIO, emitToUser, emitToSession, broadcast };
