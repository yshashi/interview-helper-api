import { Router } from 'express';
import {
  createContributionController,
  getUserContributionsController,
  getContributionByIdController,
  updateContributionController,
  deleteContributionController,
  getAllContributionsController,
  reviewContributionController
} from '../controllers/contribution.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/contributions:
 *   post:
 *     summary: Submit a new question contribution
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - techStack
 *               - question
 *             properties:
 *               techStack:
 *                 type: string
 *                 enum: [React Fundamentals, Angular Deep Dive, JavaScript Essentials, .NET Development, Node.js Development, RESTful API Design, SQL & Database Design, NoSQL Databases, EF Core Mastery, System Design Fundamentals, Microservices Architecture, CI/CD Pipeline]
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               company:
 *                 type: string
 *                 maxLength: 100
 *               difficulty:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *               category:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Contribution submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createContributionController);

/**
 * @swagger
 * /api/contributions/user:
 *   get:
 *     summary: Get all contributions by the authenticated user
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: User contributions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', authenticate, getUserContributionsController);

/**
 * @swagger
 * /api/contributions/{id}:
 *   get:
 *     summary: Get a specific contribution by ID
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution retrieved successfully
 *       404:
 *         description: Contribution not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, getContributionByIdController);

/**
 * @swagger
 * /api/contributions/{id}:
 *   put:
 *     summary: Update a contribution (only if status is PENDING)
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - techStack
 *               - question
 *             properties:
 *               techStack:
 *                 type: string
 *               question:
 *                 type: string
 *               company:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contribution updated successfully
 *       403:
 *         description: Cannot update non-pending contribution
 *       404:
 *         description: Contribution not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticate, updateContributionController);

/**
 * @swagger
 * /api/contributions/{id}:
 *   delete:
 *     summary: Delete a contribution (only if status is PENDING)
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution deleted successfully
 *       403:
 *         description: Cannot delete non-pending contribution
 *       404:
 *         description: Contribution not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, deleteContributionController);

// Admin routes (future use)
/**
 * @swagger
 * /api/contributions:
 *   get:
 *     summary: Get all contributions (Admin only)
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: techStack
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Contributions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', authenticate, authorize(['ADMIN']), getAllContributionsController);

/**
 * @swagger
 * /api/contributions/{id}/review:
 *   patch:
 *     summary: Review a contribution (Admin only)
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Contribution reviewed successfully
 *       404:
 *         description: Contribution not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/review', authenticate, authorize(['ADMIN']), reviewContributionController);

export default router;
