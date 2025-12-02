/**
 * CoursePreparationAgent - Prepares courses for AI teaching
 * - Generates embeddings for all course content
 * - Pre-generates common Q&As
 * - Creates concept explanations and examples
 * Uses existing vector store infrastructure
 */

import BaseAgent from './BaseAgent.js';
import Course from '../../models/Course.js';
import { coursePrompts } from '../prompts/coursePrompts.js';
import { Queue } from 'bullmq';

class CoursePreparationAgent extends BaseAgent {
  constructor() {
    super('CoursePreparationAgent', {
      batchSize: 10,
      maxConcurrent: 3
    });

    // Job queue for async processing
    this.queue = null;
  }

  async initialize(dependencies) {
    await super.initialize(dependencies);

    // Initialize BullMQ queue
    this.queue = new Queue('course-preparation', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    this.log('info', 'Course preparation queue initialized');
  }

  /**
   * Main execution: Prepare course for AI teaching
   */
  async execute(task) {
    const { course_id, mode = 'full' } = task;

    this.log('info', 'Starting course preparation', { course_id, mode });

    const course = await Course.findById(course_id);
    if (!course) {
      throw new Error(`Course ${course_id} not found`);
    }

    // Update status
    await Course.updateOne(
      { _id: course_id },
      { 'ai_preparation.status': 'processing' }
    );

    let totalCost = 0;

    try {
      // Step 1: Create vector store collection for course
      const collectionId = await this.createVectorCollection(course);
      totalCost += 0.5; // Estimated embedding cost

      // Step 2: Ingest all course content into vector store
      const ingestionCost = await this.ingestCourseContent(course);
      totalCost += ingestionCost;

      // Step 3: Generate common Q&As for each topic
      const qaGenerationCost = await this.generateCommonQAs(course);
      totalCost += qaGenerationCost;

      // Step 4: Generate concept explanations (optional, for advanced mode)
      if (mode === 'full') {
        const explanationCost = await this.generateConceptExplanations(course);
        totalCost += explanationCost;
      }

      // Step 5: Update course status
      await Course.updateOne(
        { _id: course_id },
        {
          'ai_preparation.status': 'ready',
          'ai_preparation.embeddings_collection_id': collectionId,
          'ai_preparation.preparation_cost': totalCost,
          'ai_preparation.last_updated': new Date()
        }
      );

      this.log('info', 'Course preparation completed', {
        course_id,
        totalCost
      });

      return {
        success: true,
        course_id,
        collection_id: collectionId,
        cost: totalCost,
        status: 'ready'
      };

    } catch (error) {
      // Mark as failed
      await Course.updateOne(
        { _id: course_id },
        { 'ai_preparation.status': 'failed' }
      );

      throw error;
    }
  }

  /**
   * Create vector store collection for course
   */
  async createVectorCollection(course) {
    const collectionName = `course_${course._id}`;

    this.log('info', 'Creating vector collection', { collectionName });

    // Use existing chromaService
    const collection = await this.dependencies.chromaService.getOrCreateCollection(
      collectionName
    );

    return collectionName;
  }

  /**
   * Ingest all course content into vector store
   */
  async ingestCourseContent(course) {
    const collectionName = `course_${course._id}`;
    let cost = 0;

    this.log('info', 'Ingesting course content', { collectionName });

    // Prepare documents for ingestion
    const documents = [];

    // Process each module and topic
    for (const module of course.modules) {
      for (const topic of module.topics) {
        // Topic overview
        documents.push({
          id: `topic_${topic._id}`,
          text: `${topic.title}\n\n${topic.description}\n\nLearning Objectives:\n${topic.learning_objectives.join('\n')}`,
          metadata: {
            type: 'topic_overview',
            course_id: course._id.toString(),
            module_id: module._id.toString(),
            topic_id: topic._id.toString(),
            title: topic.title
          }
        });

        // Key concepts
        for (const concept of topic.key_concepts) {
          documents.push({
            id: `concept_${topic._id}_${concept}`,
            text: `Concept: ${concept}\nFrom topic: ${topic.title}`,
            metadata: {
              type: 'concept',
              course_id: course._id.toString(),
              topic_id: topic._id.toString(),
              concept
            }
          });
        }

        // Exercises
        for (const exercise of topic.exercises || []) {
          documents.push({
            id: `exercise_${exercise._id}`,
            text: `Exercise: ${exercise.title}\n\n${exercise.description}\n\nHints:\n${exercise.hints.join('\n')}`,
            metadata: {
              type: 'exercise',
              course_id: course._id.toString(),
              topic_id: topic._id.toString(),
              exercise_id: exercise._id.toString()
            }
          });
        }
      }
    }

    this.log('info', 'Prepared documents for ingestion', {
      count: documents.length
    });

    // Batch ingest into ChromaDB
    const batchSize = 20;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await this.dependencies.chromaService.addDocuments(
        collectionName,
        batch.map(doc => doc.text),
        batch.map(doc => doc.metadata),
        batch.map(doc => doc.id)
      );

      cost += 0.01; // Estimated cost per batch
    }

    return cost;
  }

  /**
   * Generate common Q&As for each topic using LLM
   */
  async generateCommonQAs(course) {
    let totalCost = 0;
    const commonQuestions = [];

    this.log('info', 'Generating common Q&As');

    // Process each topic
    for (const module of course.modules) {
      for (const topic of module.topics) {
        // Generate Q&As using existing RAGChain
        const prompt = coursePrompts.generateCommonQuestions({
          topicTitle: topic.title,
          learningObjectives: topic.learning_objectives,
          keyConcepts: topic.key_concepts
        });

        try {
          const result = await this.dependencies.ragChain.getLLM().invoke(prompt);
          const qas = this.parseQAs(result.content);

          // Create embeddings for each question
          for (const qa of qas) {
            const embedding = await this.dependencies.embeddingService.embed(
              qa.question
            );

            commonQuestions.push({
              topic_id: topic._id,
              question: qa.question,
              answer: qa.answer,
              embedding,
              used_count: 0
            });
          }

          totalCost += 0.02; // Estimated cost per topic

        } catch (error) {
          this.log('error', 'Failed to generate Q&As for topic', {
            topic: topic.title,
            error: error.message
          });
        }
      }
    }

    // Update course with generated Q&As
    await Course.updateOne(
      { _id: course._id },
      {
        'ai_preparation.common_questions': commonQuestions
      }
    );

    this.log('info', 'Generated common Q&As', {
      count: commonQuestions.length,
      cost: totalCost
    });

    return totalCost;
  }

  /**
   * Generate concept explanations (advanced feature)
   */
  async generateConceptExplanations(course) {
    let totalCost = 0;
    const explanations = {};

    this.log('info', 'Generating concept explanations');

    // Extract all unique concepts
    const allConcepts = new Set();
    for (const module of course.modules) {
      for (const topic of module.topics) {
        topic.key_concepts.forEach(concept => allConcepts.add(concept));
      }
    }

    // Generate explanation for each concept
    for (const concept of allConcepts) {
      try {
        const prompt = coursePrompts.explainConcept({
          concept,
          courseTitle: course.title,
          courseDescription: course.description
        });

        const result = await this.dependencies.ragChain.getLLM().invoke(prompt);
        explanations[concept] = result.content;

        totalCost += 0.01; // Estimated cost per concept

      } catch (error) {
        this.log('error', 'Failed to generate explanation for concept', {
          concept,
          error: error.message
        });
      }
    }

    // Update course
    await Course.updateOne(
      { _id: course._id },
      {
        'ai_preparation.concept_explanations': explanations
      }
    );

    this.log('info', 'Generated concept explanations', {
      count: Object.keys(explanations).length,
      cost: totalCost
    });

    return totalCost;
  }

  /**
   * Parse Q&As from LLM response
   */
  parseQAs(content) {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(content);
      if (parsed.questions) {
        return parsed.questions;
      }
      return parsed;

    } catch (error) {
      // Fallback: Parse as text
      const qas = [];
      const lines = content.split('\n');
      let currentQ = null;

      for (const line of lines) {
        if (line.match(/^Q\d*:/i)) {
          if (currentQ) qas.push(currentQ);
          currentQ = { question: line.replace(/^Q\d*:/i, '').trim(), answer: '' };
        } else if (line.match(/^A\d*:/i) && currentQ) {
          currentQ.answer = line.replace(/^A\d*:/i, '').trim();
        } else if (currentQ && currentQ.answer) {
          currentQ.answer += ' ' + line.trim();
        }
      }

      if (currentQ) qas.push(currentQ);
      return qas;
    }
  }

  /**
   * Queue course preparation for async processing
   */
  async queuePreparation(course_id, options = {}) {
    const job = await this.queue.add('prepare-course', {
      course_id,
      ...options
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    this.log('info', 'Course preparation queued', {
      course_id,
      job_id: job.id
    });

    return job.id;
  }
}

export default CoursePreparationAgent;
