import express from 'express';
import { getQuestionsByKey, getAllKeys } from '../controllers/mcq.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/mcq/keys:
 *   get:
 *     summary: Get all available MCQ keys
 *     tags: [MCQ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all MCQ keys
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/keys', getAllKeys);

/**
 * @swagger
 * /api/mcq/{key}:
 *   get:
 *     summary: Get MCQ questions by key
 *     tags: [MCQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The MCQ key
 *     responses:
 *       200:
 *         description: MCQ questions retrieved successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: MCQ not found
 *       500:
 *         description: Internal server error
 */
router.get('/:key', getQuestionsByKey);

export default router;
