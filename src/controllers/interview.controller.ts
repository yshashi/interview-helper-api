import type { Request, Response } from 'express';
import type { TokenPayload } from '../services/auth.service.js';
import * as interviewService from '../services/interview.service.js';
import { log } from '../utils/logger.js';

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ message: 'Topic is required' });
      return;
    }

    if (!interviewService.isValidTopic(topic)) {
      res.status(400).json({
        message: `Invalid topic. Available topics: ${interviewService.getAvailableTopics().join(', ')}`,
      });
      return;
    }

    const session = await interviewService.createSession(userId, topic);
    res.status(201).json(session);
  } catch (error) {
    log.error('Error creating interview session', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { sessionId } = req.params;
    const result = await interviewService.startSession(sessionId, userId);
    res.status(200).json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Session not found') {
      res.status(404).json({ message: msg });
    } else if (msg === 'Session already started or completed') {
      res.status(409).json({ message: msg });
    } else {
      log.error('Error starting interview session', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const processResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ message: 'Answer text is required' });
      return;
    }

    // Limit answer length to prevent abuse
    if (answer.length > 5000) {
      res.status(400).json({ message: 'Answer is too long (max 5000 characters)' });
      return;
    }

    const result = await interviewService.processResponse(sessionId, userId, answer);
    res.status(200).json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Session not found') {
      res.status(404).json({ message: msg });
    } else if (msg === 'Session is not in progress' || msg === 'Session time has expired') {
      res.status(409).json({ message: msg });
    } else {
      log.error('Error processing interview response', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { sessionId } = req.params;
    const result = await interviewService.endSession(sessionId, userId);
    res.status(200).json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Session not found') {
      res.status(404).json({ message: msg });
    } else if (msg === 'Session already completed') {
      res.status(409).json({ message: msg });
    } else {
      log.error('Error ending interview session', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const abandonSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { sessionId } = req.params;
    const result = await interviewService.abandonSession(sessionId, userId);
    res.status(200).json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Session not found') {
      res.status(404).json({ message: msg });
    } else if (msg === 'Session already ended') {
      res.status(409).json({ message: msg });
    } else {
      log.error('Error abandoning interview session', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { sessionId } = req.params;
    const session = await interviewService.getSession(sessionId, userId);
    res.status(200).json(session);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Session not found') {
      res.status(404).json({ message: msg });
    } else {
      log.error('Error fetching interview session', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sessions = await interviewService.getUserSessions(userId, limit);
    res.status(200).json({ sessions });
  } catch (error) {
    log.error('Error fetching user interview sessions', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSpeechToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const tokenData = await interviewService.getSpeechToken();
    res.status(200).json(tokenData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('not configured')) {
      res.status(503).json({ message: 'Speech services are not available' });
    } else {
      log.error('Error fetching speech token', { error: msg });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getTopics = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ topics: interviewService.getAvailableTopics() });
};
