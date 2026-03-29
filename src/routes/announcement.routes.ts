import express from 'express';
import { z } from 'zod';
import {
  sendAnnouncementToAll,
  sendAnnouncementToUsers,
} from '../controllers/announcement.controller.js';
import { log } from '../utils/logger.js';

const router = express.Router();

const announcementSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters'),
});

const announcementToUsersSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters'),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

/**
 * @swagger
 * /api/announcements/send-all:
 *   post:
 *     summary: Send announcement to all active users
 *     description: Sends an email announcement to all active registered users. Only accessible by admins.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "🎉 InterviewHelper Platform Revamped!"
 *                 minLength: 1
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 description: Email message content (supports line breaks with \n)
 *                 example: "We're excited to announce that InterviewHelper has been completely revamped!\n\nNew features include:\n- Enhanced quiz experience\n- Improved UI/UX\n- Better performance\n\nPlease explore the new platform and let us know if you encounter any issues."
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Announcement sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Announcement sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       description: Total number of active users
 *                       example: 150
 *                     emailsSent:
 *                       type: number
 *                       description: Number of emails successfully sent
 *                       example: 148
 *                     emailsFailed:
 *                       type: number
 *                       description: Number of emails that failed to send
 *                       example: 2
 *                     failedEmails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of email addresses that failed
 *                       example: ["user1@example.com", "user2@example.com"]
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/send-all', async (req, res) => {
  try {
    const validatedData = announcementSchema.parse(req.body);
    req.body = validatedData;
    await sendAnnouncementToAll(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('Validation error in send announcement to all', { errors: error.errors });
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    } else {
      throw error;
    }
  }
});

/**
 * @swagger
 * /api/announcements/send-to-users:
 *   post:
 *     summary: Send announcement to specific users
 *     description: Sends an email announcement to a specific list of users by their IDs. Only accessible by admins.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - userIds
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Important Update for Selected Users"
 *                 minLength: 1
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 description: Email message content (supports line breaks with \n)
 *                 example: "This is a targeted announcement for specific users."
 *                 minLength: 1
 *                 maxLength: 5000
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to send the announcement to
 *                 example: ["user-id-1", "user-id-2", "user-id-3"]
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Announcement sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Announcement sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       description: Total number of users found
 *                       example: 3
 *                     emailsSent:
 *                       type: number
 *                       description: Number of emails successfully sent
 *                       example: 3
 *                     emailsFailed:
 *                       type: number
 *                       description: Number of emails that failed to send
 *                       example: 0
 *                     failedEmails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of email addresses that failed
 *                       example: []
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/send-to-users', async (req, res) => {
  try {
    const validatedData = announcementToUsersSchema.parse(req.body);
    req.body = validatedData;
    await sendAnnouncementToUsers(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('Validation error in send announcement to users', { errors: error.errors });
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    } else {
      throw error;
    }
  }
});

export default router;
