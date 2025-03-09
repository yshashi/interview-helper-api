import express from 'express';
import passport from 'passport';
import { z } from 'zod';
import {
  register,
  login,
  refresh,
  logout,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { log } from '../utils/logger.js';
import { getUserById } from '../services/user.service.js';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).optional(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    req.body = validatedData;
    await register(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Registration error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    req.body = validatedData;
    await login(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Login error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    req.body = validatedData;
    await refresh(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Token refresh error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    req.body = validatedData;
    await logout(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      return;
    }
    
    log.error('Logout error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await getUserById((req.user as any).userId);
    res.status(200).json({ user: {...req.user, name: user?.name, username: user?.username, profilePicture: user?.profilePicture} });
  } catch (error) {
    log.error('Get user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', passport.authenticate('google', { 
  session: false,
  failureRedirect: '/login',
}), async (req, res) => {
  try {
    if (!req.user) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication failed`);
      return;
    }
    
    const { accessToken, refreshToken } = req.user as any;
    
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    log.error('Google callback error', { error: error instanceof Error ? error.message : String(error) });
    res.redirect(`${process.env.CLIENT_URL}/login?error=Server error`);
  }
});

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  session: false,
}));

router.get('/github/callback', passport.authenticate('github', { 
  session: false,
  failureRedirect: '/login',
}), async (req, res) => {
  try {
    if (!req.user) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication failed`);
      return;
    }
    
    const { accessToken, refreshToken } = req.user as any;
    
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    log.error('GitHub callback error', { error: error instanceof Error ? error.message : String(error) });
    res.redirect(`${process.env.CLIENT_URL}/login?error=Server error`);
  }
});

export default router;
