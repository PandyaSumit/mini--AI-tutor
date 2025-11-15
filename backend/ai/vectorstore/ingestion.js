/**
 * Document Ingestion Service
 * Handles ingestion of documents into vector store
 */

import chromaService from './chromaService.js';

class IngestionService {
  /**
   * Ingest learning content (roadmaps, flashcards, notes)
   */
  async ingestContent(type, content, metadata = {}) {
    const collectionMap = {
      roadmap: 'roadmaps',
      flashcard: 'flashcards',
      note: 'notes',
      knowledge: 'knowledge',
    };

    const collectionKey = collectionMap[type] || 'knowledge';

    const documents = Array.isArray(content) ? content : [content];
    const docs = documents.map((doc) => ({
      id: doc.id || crypto.randomUUID(),
      text: typeof doc === 'string' ? doc : doc.text,
      metadata: { type, ...metadata, ...(doc.metadata || {}) },
    }));

    return await chromaService.addDocuments(collectionKey, docs);
  }

  /**
   * Ingest conversation for semantic search
   */
  async ingestConversation(conversationId, messages, userId) {
    const docs = messages.map((msg, idx) => ({
      id: `${conversationId}:${idx}`,
      text: msg.content,
      metadata: {
        conversationId,
        userId,
        role: msg.role,
        timestamp: msg.timestamp,
      },
    }));

    return await chromaService.addDocuments('conversations', docs);
  }
}

export default new IngestionService();
