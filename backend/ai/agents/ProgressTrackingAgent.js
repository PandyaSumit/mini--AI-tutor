/**
 * ProgressTrackingAgent - Tracks student learning progress and outcomes
 */

import BaseAgent from './BaseAgent.js';
import Enrollment from '../../models/Enrollment.js';
import Course from '../../models/Course.js';

class ProgressTrackingAgent extends BaseAgent {
  constructor() {
    super('ProgressTrackingAgent');
  }

  async execute(task) {
    const { action, enrollment_id, ...params } = task;

    switch (action) {
      case 'update_progress':
        return await this.updateProgress(enrollment_id, params);

      case 'complete_topic':
        return await this.completeTopic(enrollment_id, params.topic_id);

      case 'complete_exercise':
        return await this.completeExercise(enrollment_id, params.exercise_id);

      case 'submit_project':
        return await this.submitProject(enrollment_id, params);

      case 'get_progress':
        return await this.getProgress(enrollment_id);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async updateProgress(enrollment_id, data) {
    const enrollment = await Enrollment.findById(enrollment_id);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await Enrollment.updateOne(
      { _id: enrollment_id },
      {
        $set: {
          'progress.current_module_id': data.module_id,
          'progress.current_topic_id': data.topic_id,
          'progress.last_accessed_at': new Date()
        }
      }
    );

    return { success: true, cost: 0 };
  }

  async completeTopic(enrollment_id, topic_id) {
    await Enrollment.updateOne(
      { _id: enrollment_id },
      {
        $addToSet: { 'progress.completed_topics': topic_id },
        $set: { 'progress.last_accessed_at': new Date() }
      }
    );

    // Recalculate percentage
    await this.recalculateProgress(enrollment_id);

    return { success: true, cost: 0 };
  }

  async completeExercise(enrollment_id, exercise_id) {
    await Enrollment.updateOne(
      { _id: enrollment_id },
      {
        $addToSet: { 'progress.completed_exercises': exercise_id }
      }
    );

    return { success: true, cost: 0 };
  }

  async submitProject(enrollment_id, projectData) {
    await Enrollment.updateOne(
      { _id: enrollment_id },
      {
        'outcomes.final_project_submitted': true,
        'outcomes.final_project_score': projectData.score
      }
    );

    // Check if course is complete
    await this.checkCourseCompletion(enrollment_id);

    return { success: true, cost: 0 };
  }

  async recalculateProgress(enrollment_id) {
    const enrollment = await Enrollment.findById(enrollment_id).populate('course_id');
    const course = await Course.findById(enrollment.course_id);

    if (!course) return;

    // Count total topics
    let totalTopics = 0;
    for (const module of course.modules) {
      totalTopics += module.topics.length;
    }

    const completedTopics = enrollment.progress.completed_topics.length;
    const percentage = Math.floor((completedTopics / totalTopics) * 100);

    await Enrollment.updateOne(
      { _id: enrollment_id },
      { 'progress.percentage_complete': percentage }
    );
  }

  async checkCourseCompletion(enrollment_id) {
    const enrollment = await Enrollment.findById(enrollment_id);

    if (enrollment.progress.percentage_complete >= 100) {
      await Enrollment.updateOne(
        { _id: enrollment_id },
        {
          'outcomes.completed': true,
          'outcomes.completion_date': new Date(),
          completed_at: new Date()
        }
      );

      // Update course analytics
      await Course.updateOne(
        { _id: enrollment.course_id },
        {
          $inc: { 'analytics.completions': 1 }
        }
      );

      this.log('info', 'Course completed', { enrollment_id });
    }
  }

  async getProgress(enrollment_id) {
    const enrollment = await Enrollment.findById(enrollment_id).lean();
    return { progress: enrollment.progress, cost: 0 };
  }
}

export default ProgressTrackingAgent;
