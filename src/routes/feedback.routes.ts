import { Router } from 'express';
import { 
  createFeedbackController,
  getFeedbackByTopicController,
  getFeedbackStatsController,
  getUserFeedbackController
} from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback for a topic
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - type
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic/page the feedback is for
 *               type:
 *                 type: string
 *                 enum: [HELPFUL, NEEDS_IMPROVEMENT]
 *                 description: Whether the content was helpful or needs improvement
 *               comment:
 *                 type: string
 *                 description: Optional feedback text
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// User-specific routes
router.get('/user', authenticate, getUserFeedbackController);

// Topic-specific routes
router.get('/stats/:topic', getFeedbackStatsController);
router.get('/:topic', getFeedbackByTopicController);

// Create feedback route with optional authentication
router.post('/', authenticate, createFeedbackController);

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       required:
 *         - topic
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated feedback ID
 *         topic:
 *           type: string
 *           description: The topic/page the feedback is for
 *         type:
 *           type: string
 *           enum: [HELPFUL, NEEDS_IMPROVEMENT]
 *           description: Whether the content was helpful or needs improvement
 *         comment:
 *           type: string
 *           description: Optional feedback text
 *         userId:
 *           type: string
 *           description: ID of the user who submitted the feedback (if authenticated)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the feedback was created
 */

/**
 * @swagger
 * /api/feedback/user:
 *   get:
 *     summary: Get feedback submitted by the authenticated user
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/feedback/stats/{topic}:
 *   get:
 *     summary: Get feedback statistics for a topic
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 helpful:
 *                   type: number
 *                   description: Count of helpful feedback
 *                 needsImprovement:
 *                   type: number
 *                   description: Count of needs improvement feedback
 *                 total:
 *                   type: number
 *                   description: Total feedback count
 *       400:
 *         description: Invalid topic
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/feedback/{topic}:
 *   get:
 *     summary: Get feedback for a specific topic
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     helpful:
 *                       type: number
 *                     needsImprovement:
 *                       type: number
 *                     total:
 *                       type: number
 *       400:
 *         description: Invalid topic
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback for a topic
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - type
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic/page the feedback is for
 *               type:
 *                 type: string
 *                 enum: [HELPFUL, NEEDS_IMPROVEMENT]
 *                 description: Whether the content was helpful or needs improvement
 *               comment:
 *                 type: string
 *                 description: Optional feedback text
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

export default router;
