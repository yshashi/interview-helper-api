import express from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *       503:
 *         description: API is unhealthy
 */
router.get('/', checkHealth);

export default router;
