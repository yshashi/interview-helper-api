import express from 'express';
import { getQuestionsByKey, getAllKeys } from '../controllers/mcq.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/mcq/keys:
 *   get:
 *     summary: Get all available MCQ keys
 *     tags: [MCQ]
 *     responses:
 *       200:
 *         description: List of all MCQ keys
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCQKeysResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/keys', getAllKeys);

/**
 * @swagger
 * /api/mcq/{key}:
 *   get:
 *     summary: Get MCQ questions by key
 *     tags: [MCQ]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MCQ'
 *       400:
 *         description: Invalid input
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
router.get('/:key', getQuestionsByKey);

export default router;
