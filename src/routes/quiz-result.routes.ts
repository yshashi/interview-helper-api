import express from 'express';
import { 
  createUserQuizResult, 
  getUserQuizResultsController, 
  getQuizResultByIdController, 
  getMcqQuizResultsController, 
  getUserMcqQuizResultsController 
} from '../controllers/quiz-result.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/quiz-results:
 *   post:
 *     summary: Create a new quiz result
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mcqId
 *             properties:
 *               mcqId:
 *                 type: string
 *                 description: ID of the MCQ
 *               totalTimeTaken:
 *                 type: integer
 *                 description: Total time taken in seconds
 *               correctAnswerCount:
 *                 type: integer
 *                 description: Number of correct answers
 *               wrongAnswerCount:
 *                 type: integer
 *                 description: Number of wrong answers
 *               attemptCount:
 *                 type: integer
 *                 description: Number of attempts
 *     responses:
 *       201:
 *         description: Quiz result created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserQuizResult'
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
 *         description: MCQ not found
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
router.post('/', authenticate, createUserQuizResult);

/**
 * @swagger
 * /api/quiz-results:
 *   get:
 *     summary: Get all quiz results for the authenticated user
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quiz results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserQuizResult'
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
router.get('/', authenticate, getUserQuizResultsController);

/**
 * @swagger
 * /api/quiz-results/{id}:
 *   get:
 *     summary: Get a specific quiz result by ID
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The quiz result ID
 *     responses:
 *       200:
 *         description: Quiz result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserQuizResult'
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
 *       404:
 *         description: Quiz result not found
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
router.get('/:id', authenticate, getQuizResultByIdController);

/**
 * @swagger
 * /api/quiz-results/mcq/{mcqId}:
 *   get:
 *     summary: Get all quiz results for a specific MCQ (admin only)
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MCQ ID
 *     responses:
 *       200:
 *         description: List of quiz results for the MCQ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserQuizResult'
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
router.get('/mcq/:mcqId', authenticate, getMcqQuizResultsController);

/**
 * @swagger
 * /api/quiz-results/user/mcq/{mcqId}:
 *   get:
 *     summary: Get all quiz results for the authenticated user and a specific MCQ
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mcqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MCQ ID
 *     responses:
 *       200:
 *         description: List of quiz results for the user and MCQ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserQuizResult'
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
router.get('/user/mcq/:mcqId', authenticate, getUserMcqQuizResultsController);

export default router;
