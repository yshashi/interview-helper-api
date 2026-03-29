import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { getTopics, generate, refresh } from '../controllers/mcq-generator.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/mcq-generator/topics:
 *   get:
 *     summary: List available topics for MCQ generation
 *     tags: [MCQ Generator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/topics', authenticate, authorize(['ADMIN']), getTopics);

/**
 * @swagger
 * /api/mcq-generator/generate:
 *   post:
 *     summary: Generate MCQs from MDX content (full regeneration)
 *     tags: [MCQ Generator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [file, topic, all]
 *                 description: "file = single file → MCQs, topic = aggregate → TopicwiseMcqs, all = all topics"
 *               target:
 *                 type: string
 *                 description: "File path or topic name (required for file and topic modes)"
 *     responses:
 *       200:
 *         description: MCQs generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.post('/generate', authenticate, authorize(['ADMIN']), generate);

/**
 * @swagger
 * /api/mcq-generator/refresh:
 *   post:
 *     summary: Incrementally refresh MCQs (only processes new/changed files)
 *     tags: [MCQ Generator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [topic, all]
 *                 description: "topic = refresh single topic, all = refresh all topics"
 *               target:
 *                 type: string
 *                 description: "Topic name (required for topic mode)"
 *     responses:
 *       200:
 *         description: MCQs refreshed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', authenticate, authorize(['ADMIN']), refresh);

export default router;
