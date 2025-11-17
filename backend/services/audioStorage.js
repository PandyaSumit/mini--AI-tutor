/**
 * MinIO Audio Storage Service
 * Handles audio chunk storage and retrieval for voice sessions
 * CRITICAL: Never store audio in server memory - stream directly to MinIO
 */

import * as Minio from 'minio';
import { Readable } from 'stream';
import logger from '../config/logger.js';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT) || 9000;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const BUCKET_NAME = 'voice-audio';

/**
 * Audio Storage Service using MinIO S3-compatible storage
 */
class AudioStorageService {
  constructor() {
    this.client = null;
    this.bucketName = BUCKET_NAME;
  }

  /**
   * Initialize MinIO client
   */
  async initialize() {
    try {
      this.client = new Minio.Client({
        endPoint: MINIO_ENDPOINT,
        port: MINIO_PORT,
        useSSL: MINIO_USE_SSL,
        accessKey: MINIO_ACCESS_KEY,
        secretKey: MINIO_SECRET_KEY
      });

      // Check if bucket exists, create if not
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        logger.info('MinIO bucket created', { bucket: this.bucketName });

        // Set download policy
        const policy = {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`]
          }]
        };
        await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }

      logger.info('MinIO audio storage initialized', {
        endpoint: MINIO_ENDPOINT,
        port: MINIO_PORT,
        bucket: this.bucketName
      });
    } catch (error) {
      logger.error('Failed to initialize MinIO', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Store audio chunk to MinIO
   * @param {string} sessionId - Voice session ID
   * @param {Buffer} audioChunk - Audio data as Buffer
   * @param {number} chunkIndex - Chunk sequence number
   * @returns {Promise<string>} - Object key in MinIO
   */
  async storeAudioChunk(sessionId, audioChunk, chunkIndex) {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const timestamp = Date.now();
    const objectKey = `sessions/${sessionId}/chunk_${String(chunkIndex).padStart(5, '0')}_${timestamp}.webm`;

    try {
      // Convert Buffer to stream
      const stream = Readable.from(audioChunk);

      // Upload to MinIO
      await this.client.putObject(
        this.bucketName,
        objectKey,
        stream,
        audioChunk.length,
        {
          'Content-Type': 'audio/webm',
          'X-Session-Id': sessionId,
          'X-Chunk-Index': chunkIndex.toString(),
          'X-Timestamp': timestamp.toString()
        }
      );

      logger.debug('Audio chunk stored', {
        sessionId,
        chunkIndex,
        objectKey,
        size: audioChunk.length
      });

      return objectKey;
    } catch (error) {
      logger.error('Failed to store audio chunk', {
        sessionId,
        chunkIndex,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get all audio chunks for a session
   * @param {string} sessionId - Voice session ID
   * @returns {Promise<Array>} - List of objects with key, size, lastModified
   */
  async getSessionAudio(sessionId) {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const prefix = `sessions/${sessionId}/`;
    const objects = [];

    try {
      const stream = this.client.listObjectsV2(this.bucketName, prefix, true);

      for await (const obj of stream) {
        objects.push({
          key: obj.name,
          size: obj.size,
          lastModified: obj.lastModified
        });
      }

      // Sort by chunk index (extracted from filename)
      objects.sort((a, b) => {
        const indexA = parseInt(a.key.match(/chunk_(\d+)_/)[1]);
        const indexB = parseInt(b.key.match(/chunk_(\d+)_/)[1]);
        return indexA - indexB;
      });

      logger.debug('Retrieved session audio list', {
        sessionId,
        chunkCount: objects.length
      });

      return objects;
    } catch (error) {
      logger.error('Failed to get session audio', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Download and merge all audio chunks for a session
   * @param {string} sessionId - Voice session ID
   * @returns {Promise<Buffer>} - Complete merged audio as Buffer
   */
  async downloadAndMergeAudio(sessionId) {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    try {
      // Get list of all chunks
      const chunks = await this.getSessionAudio(sessionId);

      if (chunks.length === 0) {
        logger.warn('No audio chunks found for session', { sessionId });
        return Buffer.alloc(0);
      }

      logger.info('Downloading and merging audio chunks', {
        sessionId,
        chunkCount: chunks.length
      });

      // Download and concatenate all chunks
      const buffers = [];
      let totalSize = 0;

      for (const chunk of chunks) {
        const stream = await this.client.getObject(this.bucketName, chunk.key);
        const chunkBuffers = [];

        for await (const data of stream) {
          chunkBuffers.push(data);
        }

        const buffer = Buffer.concat(chunkBuffers);
        buffers.push(buffer);
        totalSize += buffer.length;

        logger.debug('Downloaded audio chunk', {
          sessionId,
          key: chunk.key,
          size: buffer.length
        });
      }

      // Merge all buffers
      const mergedAudio = Buffer.concat(buffers, totalSize);

      logger.info('Audio chunks merged successfully', {
        sessionId,
        chunkCount: chunks.length,
        totalSize
      });

      return mergedAudio;
    } catch (error) {
      logger.error('Failed to download and merge audio', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Cleanup audio chunks for a session
   * @param {string} sessionId - Voice session ID
   * @returns {Promise<number>} - Number of chunks deleted
   */
  async cleanupSessionAudio(sessionId) {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    try {
      const chunks = await this.getSessionAudio(sessionId);

      if (chunks.length === 0) {
        return 0;
      }

      // Delete all chunks
      const objectsList = chunks.map(chunk => chunk.key);
      await this.client.removeObjects(this.bucketName, objectsList);

      logger.info('Audio chunks cleaned up', {
        sessionId,
        deletedCount: chunks.length
      });

      return chunks.length;
    } catch (error) {
      logger.error('Failed to cleanup audio chunks', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for temporary download access
   * @param {string} objectKey - Object key in MinIO
   * @param {number} expirySeconds - URL expiry time in seconds (default 3600)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(objectKey, expirySeconds = 3600) {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    try {
      const url = await this.client.presignedGetObject(
        this.bucketName,
        objectKey,
        expirySeconds
      );

      logger.debug('Generated presigned URL', {
        objectKey,
        expirySeconds
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', {
        objectKey,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Health check for MinIO connection
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.bucketExists(this.bucketName);
      return true;
    } catch (error) {
      logger.error('MinIO health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} - Storage stats
   */
  async getStats() {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    try {
      let totalObjects = 0;
      let totalSize = 0;

      const stream = this.client.listObjectsV2(this.bucketName, '', true);

      for await (const obj of stream) {
        totalObjects++;
        totalSize += obj.size;
      }

      return {
        totalObjects,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      logger.error('Failed to get storage stats', {
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const audioStorage = new AudioStorageService();

export default audioStorage;
