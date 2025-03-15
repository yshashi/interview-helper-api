import express from 'express';
import { getRandomQuestionsByKey, getAllTopicKeys } from '../controllers/topicwise-mcq.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicwiseMCQKeysResponse:
 *       type: object
 *       properties:
 *         keys:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available topicwise MCQ keys
 *       example:
 *         keys: ["angular", "react", "nodejs", "typescript"]
 *     
 *     TopicwiseMCQ:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the topicwise MCQ
 *         key:
 *           type: string
 *           description: The key identifying the topic
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *           description: List of questions for the topic
 *     
 *     Question:
 *       type: object
 *       properties:
 *         question:
 *           type: string
 *           description: The question text
 *         options:
 *           $ref: '#/components/schemas/Options'
 *         correct_answer:
 *           type: string
 *           description: The correct answer (A, B, C, or D)
 *         question_id:
 *           type: integer
 *           description: The question identifier
 *         source_file:
 *           type: string
 *           description: Source of the question
 *     
 *     Options:
 *       type: object
 *       properties:
 *         A:
 *           type: string
 *           description: Option A
 *         B:
 *           type: string
 *           description: Option B
 *         C:
 *           type: string
 *           description: Option C
 *         D:
 *           type: string
 *           description: Option D
 *     
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 */

/**
 * @swagger
 * tags:
 *   name: TopicwiseMCQ
 *   description: Topicwise MCQ management API
 */

/**
 * @swagger
 * /api/topicwise-mcq/keys:
 *   get:
 *     summary: Get all available topicwise MCQ keys
 *     tags: [TopicwiseMCQ]
 *     responses:
 *       200:
 *         description: List of all topicwise MCQ keys
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicwiseMCQKeysResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/keys', getAllTopicKeys);

/**
 * @swagger
 * /api/topicwise-mcq/{key}:
 *   get:
 *     summary: Get random topicwise MCQ questions by key
 *     tags: [TopicwiseMCQ]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The topicwise MCQ key
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 35
 *         description: Maximum number of questions to return (default 35)
 *     responses:
 *       200:
 *         description: Random topicwise MCQ questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicwiseMCQ'
 *       400:
 *         description: Invalid input
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
router.get('/:key', getRandomQuestionsByKey);

export default router;
