import express from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  getUser,
  updateUserProfile,
  removeUser,
  changeUserRole,
  changeUserStatus,
  getAllUsers
} from '../controllers/user.controller.js';
import { UserRole, UserStatus } from '../config/database.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  name: z.string().optional(),
  profilePicture: z.string().url().optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
});

const updateUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BANNED]),
});

const listUsersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  role: z.enum([UserRole.ADMIN, UserRole.USER]).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BANNED]).optional(),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED]
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize([UserRole.ADMIN]), async (req, res) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    req.query = query as any;
    await getAllUsers(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
      return;
    }
    
    log.error('List users error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check if the user is requesting their own data or is an admin
    // @ts-ignore - TokenPayload property access
    if (req.user?.userId !== req.params.id && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    
    await getUser(req, res);
  } catch (error) {
    log.error('Get user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
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
 *             properties:
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Check if the user is updating their own data or is an admin
    // @ts-ignore - TokenPayload property access
    if ((req.user as any)?.userId !== req.params.id && (req.user as any)?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    
    const validatedData = updateUserSchema.parse(req.body);
    req.body = validatedData;
    
    await updateUserProfile(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Update user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch('/:id/role', authenticate, authorize([UserRole.ADMIN]), async (req, res) => {
  try {
    const validatedData = updateUserRoleSchema.parse(req.body);
    req.body = validatedData;
    
    await changeUserRole(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Update user role error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Users]
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
 *                 enum: [ACTIVE, INACTIVE, BANNED]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch('/:id/status', authenticate, authorize([UserRole.ADMIN]), async (req, res) => {
  try {
    const validatedData = updateUserStatusSchema.parse(req.body);
    req.body = validatedData;
    
    await changeUserStatus(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Update user status error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if the user is deleting their own account or is an admin
    // @ts-ignore - TokenPayload property access
    if (req.user?.userId !== req.params.id && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    
    await removeUser(req, res);
  } catch (error) {
    log.error('Delete user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
