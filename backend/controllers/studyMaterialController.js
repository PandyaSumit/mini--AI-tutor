import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Message from '../models/Message.js';
import {
  generateFlashcards,
  generateQuiz,
  generateQuizFromConversation,
  exportToAnkiCSV,
  exportQuizToJSON
} from '../services/quizService.js';

// FLASHCARD CONTROLLERS

// @desc    Generate flashcards from conversation
// @route   POST /api/study/flashcards/generate
// @access  Private
export const generateFlashcardsController = async (req, res) => {
  try {
    const { conversationId, topic, count, difficulty, deck } = req.body;
    const userId = req.user.id;

    let content = '';

    if (conversationId) {
      // Get conversation messages
      const messages = await Message.find({ conversation: conversationId, role: 'assistant' })
        .sort({ createdAt: 1 })
        .select('content');
      content = messages.map(m => m.content).join('\n\n');
    } else if (topic) {
      content = topic;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either conversationId or topic'
      });
    }

    // Generate flashcards using AI
    const flashcards = await generateFlashcards(content, {
      count: count || 10,
      difficulty: difficulty || 'medium',
      deck: deck || 'General'
    });

    // Save flashcards to database
    const savedFlashcards = await Flashcard.insertMany(
      flashcards.map(card => ({
        user: userId,
        conversation: conversationId || null,
        deck: deck || 'General',
        front: card.front,
        back: card.back,
        tags: card.tags || [],
        difficulty: card.difficulty || 'medium'
      }))
    );

    res.status(201).json({
      success: true,
      message: `Generated ${flashcards.length} flashcards`,
      data: { flashcards: savedFlashcards }
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flashcards',
      error: error.message
    });
  }
};

// @desc    Get flashcards due for review
// @route   GET /api/study/flashcards/due
// @access  Private
export const getDueFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deck, limit = 20 } = req.query;

    const query = {
      user: userId,
      isActive: true,
      'spacedRepetition.nextReviewDate': { $lte: new Date() }
    };

    if (deck) query.deck = deck;

    const flashcards = await Flashcard.find(query)
      .sort({ 'spacedRepetition.nextReviewDate': 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length
      }
    });
  } catch (error) {
    console.error('Get due flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flashcards',
      error: error.message
    });
  }
};

// @desc    Review flashcard (update spaced repetition)
// @route   POST /api/study/flashcards/:id/review
// @access  Private
export const reviewFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality, responseTime } = req.body; // quality: 0-5
    const userId = req.user.id;

    const flashcard = await Flashcard.findOne({
      _id: id,
      user: userId
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    // Update spaced repetition
    await flashcard.updateSpacedRepetition(quality);

    // Update response time
    if (responseTime) {
      const currentAvg = flashcard.stats.averageResponseTime || 0;
      const totalReviews = flashcard.stats.totalReviews;
      flashcard.stats.averageResponseTime =
        (currentAvg * (totalReviews - 1) + responseTime) / totalReviews;
      await flashcard.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review recorded',
      data: {
        flashcard,
        nextReview: flashcard.spacedRepetition.nextReviewDate,
        retentionRate: flashcard.getRetentionRate()
      }
    });
  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record review',
      error: error.message
    });
  }
};

// @desc    Get all decks with stats
// @route   GET /api/study/flashcards/decks
// @access  Private
export const getDecks = async (req, res) => {
  try {
    const userId = req.user.id;

    const decks = await Flashcard.aggregate([
      { $match: { user: userId, isActive: true } },
      {
        $group: {
          _id: '$deck',
          totalCards: { $sum: 1 },
          dueCards: {
            $sum: {
              $cond: [
                { $lte: ['$spacedRepetition.nextReviewDate', new Date()] },
                1,
                0
              ]
            }
          },
          averageRetention: { $avg: '$stats.correctReviews' }
        }
      },
      { $sort: { totalCards: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { decks }
    });
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch decks',
      error: error.message
    });
  }
};

// @desc    Export flashcards to Anki format
// @route   GET /api/study/flashcards/export
// @access  Private
export const exportFlashcards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deck, format = 'csv' } = req.query;

    const query = { user: userId, isActive: true };
    if (deck) query.deck = deck;

    const flashcards = await Flashcard.find(query);

    if (format === 'csv') {
      const csv = exportToAnkiCSV(flashcards);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${deck || 'flashcards'}.csv"`);
      res.send(csv);
    } else {
      res.status(200).json({
        success: true,
        data: { flashcards }
      });
    }
  } catch (error) {
    console.error('Export flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export flashcards',
      error: error.message
    });
  }
};

// QUIZ CONTROLLERS

// @desc    Generate quiz from conversation or topic
// @route   POST /api/study/quizzes/generate
// @access  Private
export const generateQuizController = async (req, res) => {
  try {
    const { conversationId, topic, questionCount, difficulty, types } = req.body;
    const userId = req.user.id;

    let content = '';
    let quizTopic = topic || 'General';

    if (conversationId) {
      const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .select('role content');
      content = messages.map(m => m.content).join('\n\n');
    } else if (topic) {
      content = topic;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either conversationId or topic'
      });
    }

    // Generate quiz using AI
    const quizData = await generateQuiz(content, {
      questionCount: questionCount || 5,
      difficulty: difficulty || 'medium',
      types: types || ['mcq', 'true_false'],
      topic: quizTopic
    });

    // Save quiz to database
    const quiz = await Quiz.create({
      user: userId,
      conversation: conversationId || null,
      title: quizData.title || `${quizTopic} Quiz`,
      description: quizData.description,
      topic: quizTopic,
      difficulty: difficulty || 'medium',
      questions: quizData.questions,
      generatedFrom: {
        source: conversationId ? 'conversation' : 'topic',
        sourceId: conversationId || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      data: { quiz }
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz',
      error: error.message
    });
  }
};

// @desc    Get user quizzes
// @route   GET /api/study/quizzes
// @access  Private
export const getQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic } = req.query;

    const query = { user: userId, isActive: true };
    if (topic) query.topic = topic;

    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 })
      .select('title topic difficulty questions.length createdAt');

    res.status(200).json({
      success: true,
      data: { quizzes }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message
    });
  }
};

// @desc    Get quiz details
// @route   GET /api/study/quizzes/:id
// @access  Private
export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findOne({ _id: id, user: userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get attempt history
    const attempts = await QuizAttempt.find({ quiz: id, user: userId })
      .sort({ attemptNumber: 1 })
      .select('attemptNumber score passed timeCompleted');

    res.status(200).json({
      success: true,
      data: {
        quiz,
        attempts,
        attemptCount: attempts.length
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message
    });
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/study/quizzes/:id/submit
// @access  Private
export const submitQuizAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findOne({ _id: id, user: userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get attempt number
    const previousAttempts = await QuizAttempt.countDocuments({
      quiz: id,
      user: userId
    });

    // Check if max attempts reached
    if (quiz.settings.maxAttempts && previousAttempts >= quiz.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts reached'
      });
    }

    // Grade answers
    const gradedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (!question) return null;

      const isCorrect = answer.userAnswer === question.correctAnswer;
      const pointsEarned = isCorrect ? (question.points || 1) : 0;

      // Update question stats
      question.stats.totalAttempts += 1;
      if (isCorrect) question.stats.correctAttempts += 1;

      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        pointsEarned,
        timeSpent: answer.timeSpent || 0
      };
    }).filter(Boolean);

    await quiz.save();

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      user: userId,
      quiz: id,
      attemptNumber: previousAttempts + 1,
      answers: gradedAnswers
    });

    // Calculate results
    await attempt.calculateResults();

    res.status(200).json({
      success: true,
      message: attempt.passed ? 'Quiz passed! 🎉' : 'Keep practicing!',
      data: {
        attempt,
        passed: attempt.passed,
        score: attempt.score,
        weakTopics: attempt.weakTopics,
        recommendations: attempt.recommendedActions
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

// @desc    Export quiz with attempts
// @route   GET /api/study/quizzes/:id/export
// @access  Private
export const exportQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findOne({ _id: id, user: userId });
    const attempts = await QuizAttempt.find({ quiz: id, user: userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const jsonData = exportQuizToJSON(quiz, attempts);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="quiz-${quiz.title.replace(/\s+/g, '-')}.json"`);
    res.send(jsonData);
  } catch (error) {
    console.error('Export quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export quiz',
      error: error.message
    });
  }
};
