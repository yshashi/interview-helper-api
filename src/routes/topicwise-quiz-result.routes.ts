import express from 'express';
import { 
  createTopicwiseUserQuizResult, 
  getUserTopicwiseQuizResultsController, 
  getTopicwiseQuizResultByIdController, 
  getTopicwiseMcqQuizResultsController, 
  getUserTopicwiseMcqQuizResultsController,
  getUserTopicPerformanceAnalyticsController,
  getUserProgressOverTimeController,
  getWeakAreasAnalysisController,
  getDashboardDataController
} from '../controllers/topicwise-quiz-result.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/topicwise-quiz-results:
 *   post:
 *     summary: Create a new topicwise quiz result
 *     tags: [Topicwise Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicwiseMcqId
 *             properties:
 *               topicwiseMcqId:
 *                 type: string
 *                 description: ID of the Topicwise MCQ
 *               totalTimeTaken:
 *                 type: integer
 *                 description: Total time taken in seconds
 *               correctAnswerCount:
 *                 type: integer
 *                 description: Number of correct answers
 *               wrongAnswerCount:
 *                 type: integer
 *                 description: Number of wrong answers
 *               questionDetails:
 *                 type: array
 *                 description: Detailed information about each question attempt
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     question:
 *                       type: string
 *                     selectedOption:
 *                       type: string
 *                     correctOption:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                     timeTaken:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Quiz result created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicwiseQuizResult'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topicwise MCQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, createTopicwiseUserQuizResult);

/**
 * @swagger
 * /api/topicwise-quiz-results:
 *   get:
 *     summary: Get all topicwise quiz results for the authenticated user
 *     tags: [Topicwise Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of topicwise quiz results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopicwiseQuizResult'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, getUserTopicwiseQuizResultsController);

// Analytics endpoints
router.get('/analytics/topic-performance', authenticate, getUserTopicPerformanceAnalyticsController);
router.get('/analytics/progress', authenticate, getUserProgressOverTimeController);
router.get('/analytics/weak-areas', authenticate, getWeakAreasAnalysisController);

// Dashboard endpoint
router.get('/dashboard', authenticate, getDashboardDataController);

// MCQ-specific endpoints
router.get('/mcq/:topicwiseMcqId', authenticate, getTopicwiseMcqQuizResultsController);
router.get('/mcq/:topicwiseMcqId/user', authenticate, getUserTopicwiseMcqQuizResultsController);

/**
 * @swagger
 * /api/topicwise-quiz-results/{id}:
 *   get:
 *     summary: Get a specific topicwise quiz result by ID
 *     tags: [Topicwise Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The topicwise quiz result ID
 *     responses:
 *       200:
 *         description: Topicwise quiz result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicwiseQuizResult'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topicwise quiz result not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticate, getTopicwiseQuizResultByIdController);

/**
 * @swagger
 * /api/topicwise-quiz-results/mcq/{topicwiseMcqId}:
 *   get:
 *     summary: Get all topicwise quiz results for a specific MCQ (admin only)
 *     tags: [Topicwise Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicwiseMcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Topicwise MCQ ID
 *     responses:
 *       200:
 *         description: List of topicwise quiz results for the MCQ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopicwiseQuizResult'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/mcq/:topicwiseMcqId', authenticate, getTopicwiseMcqQuizResultsController);

/**
 * @swagger
 * /api/topicwise-quiz-results/user/mcq/{topicwiseMcqId}:
 *   get:
 *     summary: Get all topicwise quiz results for the authenticated user and a specific MCQ
 *     tags: [Topicwise Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicwiseMcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Topicwise MCQ ID
 *     responses:
 *       200:
 *         description: List of topicwise quiz results for the user and MCQ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopicwiseQuizResult'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user/mcq/:topicwiseMcqId', authenticate, getUserTopicwiseMcqQuizResultsController);

/**
 * @swagger
 * /api/topicwise-quiz-results/analytics/topic-performance:
 *   get:
 *     summary: Get topic performance analytics for the authenticated user
 *     tags: [Topicwise Quiz Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Topic performance analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   topic:
 *                     type: string
 *                   totalAttempts:
 *                     type: integer
 *                   totalCorrect:
 *                     type: integer
 *                   totalWrong:
 *                     type: integer
 *                   totalQuestions:
 *                     type: integer
 *                   averageScore:
 *                     type: number
 *                   averageTimeTaken:
 *                     type: number
 *                   bestScore:
 *                     type: number
 *                   worstScore:
 *                     type: number
 *                   lastAttemptDate:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics/topic-performance', authenticate, getUserTopicPerformanceAnalyticsController);

/**
 * @swagger
 * /api/topicwise-quiz-results/analytics/progress:
 *   get:
 *     summary: Get progress over time for the authenticated user
 *     tags: [Topicwise Quiz Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topicKey
 *         schema:
 *           type: string
 *         description: Optional topic key to filter results
 *     responses:
 *       200:
 *         description: Progress over time data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   topic:
 *                     type: string
 *                   score:
 *                     type: number
 *                   timeTaken:
 *                     type: integer
 *                   correctAnswers:
 *                     type: integer
 *                   wrongAnswers:
 *                     type: integer
 *                   totalQuestions:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics/progress', authenticate, getUserProgressOverTimeController);

/**
 * @swagger
 * /api/topicwise-quiz-results/analytics/weak-areas:
 *   get:
 *     summary: Get weak areas analysis for the authenticated user
 *     tags: [Topicwise Quiz Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weak areas analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   topic:
 *                     type: string
 *                   questionId:
 *                     type: integer
 *                   question:
 *                     type: string
 *                   attempts:
 *                     type: integer
 *                   correctAttempts:
 *                     type: integer
 *                   incorrectAttempts:
 *                     type: integer
 *                   successRate:
 *                     type: number
 *                   averageTimeTaken:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Dashboard endpoint - must be before /:id to prevent route conflicts
router.get('/dashboard', authenticate, getDashboardDataController);

// Weak areas analytics endpoint
router.get('/analytics/weak-areas', authenticate, getWeakAreasAnalysisController);

export default router;
