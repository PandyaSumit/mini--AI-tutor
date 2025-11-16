/**
 * Production Socket.IO Setup with Redis Adapter
 * Enables horizontal scaling across multiple backend instances
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { createSocketIOClients, ConnectionTracker } from './redisCluster.js';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let io = null;
let connectionTracker = null;

/**
 * Setup Socket.IO server with Redis adapter for clustering
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} - Socket.IO server instance
 */
export function setupSocketIO(httpServer) {
  // Create pub/sub Redis clients for Socket.IO adapter
  const { pubClient, subClient } = createSocketIOClients();

  // Create Socket.IO server
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB for audio chunks
    allowEIO3: true
  });

  // Attach Redis adapter for multi-instance support
  io.adapter(createAdapter(pubClient, subClient));

  logger.info('Socket.IO server created with Redis adapter', {
    frontend: FRONTEND_URL,
    transports: ['websocket', 'polling']
  });

  // Initialize connection tracker
  connectionTracker = new ConnectionTracker(pubClient);

  // JWT Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.logAuthFailure('No token provided', socket.handshake.address);
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded || !decoded.userId) {
        logger.logAuthFailure('Invalid token', socket.handshake.address);
        return next(new Error('Invalid authentication token'));
      }

      // Store userId in socket
      socket.userId = decoded.userId;

      logger.debug('Socket authenticated', {
        socketId: socket.id,
        userId: decoded.userId
      });

      next();
    } catch (error) {
      logger.logAuthFailure(error.message, socket.handshake.address);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Track connection
    await connectionTracker.addConnection(userId, socket.id);

    // Join user room (for cross-instance messaging)
    socket.join(`user:${userId}`);

    logger.logConnection(userId, socket.id);

    // Connection stats
    const totalConnections = await connectionTracker.getTotalConnections();
    logger.info('Active connections', { total: totalConnections });

    // Disconnection handler
    socket.on('disconnect', async (reason) => {
      await connectionTracker.removeConnection(userId, socket.id);

      logger.logDisconnection(userId, socket.id);

      logger.debug('Disconnect reason', {
        socketId: socket.id,
        userId,
        reason
      });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId,
        error: error.message,
        stack: error.stack
      });
    });
  });

  // Socket.IO adapter events
  io.of('/').adapter.on('create-room', (room) => {
    logger.debug('Room created', { room });
  });

  io.of('/').adapter.on('delete-room', (room) => {
    logger.debug('Room deleted', { room });
  });

  io.of('/').adapter.on('join-room', (room, socketId) => {
    logger.debug('Socket joined room', { room, socketId });
  });

  io.of('/').adapter.on('leave-room', (room, socketId) => {
    logger.debug('Socket left room', { room, socketId });
  });

  return io;
}

/**
 * Get Socket.IO server instance
 * @returns {Server} - Socket.IO server instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call setupSocketIO first.');
  }
  return io;
}

/**
 * Emit event to specific user across all instances
 * Uses Redis pub/sub to route to correct instance
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToUser(userId, event, data) {
  if (!io) {
    logger.warn('Cannot emit to user, Socket.IO not initialized', {
      userId,
      event
    });
    return;
  }

  io.to(`user:${userId}`).emit(event, data);

  logger.debug('Event emitted to user', {
    userId,
    event,
    dataKeys: Object.keys(data)
  });
}

/**
 * Emit event to specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToRoom(room, event, data) {
  if (!io) {
    logger.warn('Cannot emit to room, Socket.IO not initialized', {
      room,
      event
    });
    return;
  }

  io.to(room).emit(event, data);

  logger.debug('Event emitted to room', {
    room,
    event
  });
}

/**
 * Get connection statistics
 * @returns {Promise<Object>} - Connection stats
 */
export async function getConnectionStats() {
  if (!connectionTracker) {
    return { total: 0 };
  }

  const total = await connectionTracker.getTotalConnections();

  return {
    total,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if user is connected
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function isUserConnected(userId) {
  if (!connectionTracker) {
    return false;
  }

  return await connectionTracker.isUserConnected(userId);
}

/**
 * Get user's active sockets
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of socket IDs
 */
export async function getUserSockets(userId) {
  if (!connectionTracker) {
    return [];
  }

  return await connectionTracker.getUserConnections(userId);
}

/**
 * Broadcast to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function broadcast(event, data) {
  if (!io) {
    logger.warn('Cannot broadcast, Socket.IO not initialized', {
      event
    });
    return;
  }

  io.emit(event, data);

  logger.info('Event broadcasted', {
    event,
    dataKeys: Object.keys(data)
  });
}

/**
 * Close Socket.IO server gracefully
 */
export async function closeSocketIO() {
  if (io) {
    logger.info('Closing Socket.IO server gracefully');

    return new Promise((resolve) => {
      io.close(() => {
        logger.info('Socket.IO server closed');
        io = null;
        resolve();
      });
    });
  }
}

export default {
  setupSocketIO,
  getIO,
  emitToUser,
  emitToRoom,
  getConnectionStats,
  isUserConnected,
  getUserSockets,
  broadcast,
  closeSocketIO
};
