import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as interviewController from '../controllers/interview.controller.js';

const router = express.Router();

// Public: list available topics
router.get('/topics', interviewController.getTopics);

// All routes below require authentication
router.use(authenticate);

// Speech token (short-lived Azure token for browser SDK)
router.get('/speech-token', interviewController.getSpeechToken);

// Session CRUD
router.post('/sessions', interviewController.createSession);
router.get('/sessions', interviewController.getUserSessions);
router.get('/sessions/:sessionId', interviewController.getSession);

// Session lifecycle
router.post('/sessions/:sessionId/start', interviewController.startSession);
router.post('/sessions/:sessionId/respond', interviewController.processResponse);
router.post('/sessions/:sessionId/end', interviewController.endSession);
router.post('/sessions/:sessionId/abandon', interviewController.abandonSession);

export default router;
