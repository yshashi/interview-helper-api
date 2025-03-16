import type { Request, Response } from 'express';
import { createFeedback, getFeedbackByTopic, getFeedbackStats, getUserFeedback } from '../services/feedback.service.js';
import { log } from '../utils/logger.js';
import type { TokenPayload } from '../services/auth.service.js';

export const createFeedbackController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, type, comment } = req.body;
    
    if (!topic?.trim()) {
      res.status(400).json({
        message: 'Topic is required',
        field: 'topic'
      });
      return;
    }

    if (!type) {
      res.status(400).json({
        message: 'Feedback type is required',
        field: 'type'
      });
      return;
    }

    if (!['HELPFUL', 'NEEDS_IMPROVEMENT'].includes(type)) {
      res.status(400).json({
        message: 'Invalid feedback type. Must be either HELPFUL or NEEDS_IMPROVEMENT',
        field: 'type',
        allowedValues: ['HELPFUL', 'NEEDS_IMPROVEMENT']
      });
      return;
    }

    const userId = (req.user as TokenPayload)?.userId;
    const feedback = await createFeedback({ topic: topic.trim(), type, comment }, userId);
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    log.error('Error in createFeedbackController:', { 
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    });
    res.status(500).json({
      message: 'Failed to submit feedback. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFeedbackByTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.params;
    if (!topic?.trim()) {
      res.status(400).json({
        message: 'Topic is required',
        field: 'topic'
      });
      return;
    }

    const [feedback, stats] = await Promise.all([
      getFeedbackByTopic(topic.trim()),
      getFeedbackStats(topic.trim())
    ]);

    res.status(200).json({
      message: `Retrieved ${feedback.length} feedback items for topic: ${topic}`,
      data: {
        feedback,
        stats
      }
    });
  } catch (error) {
    log.error('Error in getFeedbackByTopicController:', { 
      error: error instanceof Error ? error.message : String(error),
      topic: req.params.topic
    });
    res.status(500).json({
      message: 'Failed to retrieve feedback. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFeedbackStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.params;
    if (!topic?.trim()) {
      res.status(400).json({
        message: 'Topic is required',
        field: 'topic'
      });
      return;
    }

    const stats = await getFeedbackStats(topic.trim());
    res.status(200).json({
      message: `Retrieved feedback statistics for topic: ${topic}`,
      data: stats
    });
  } catch (error) {
    log.error('Error in getFeedbackStatsController:', { 
      error: error instanceof Error ? error.message : String(error),
      topic: req.params.topic
    });
    res.status(500).json({
      message: 'Failed to retrieve feedback statistics. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserFeedbackController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required to view your feedback',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const feedback = await getUserFeedback(userId);
    res.status(200).json({
      message: `Retrieved ${feedback.length} feedback items`,
      data: feedback
    });
  } catch (error) {
    log.error('Error in getUserFeedbackController:', { 
      error: error instanceof Error ? error.message : String(error),
      userId: (req.user as TokenPayload)?.userId
    });
    res.status(500).json({
      message: 'Failed to retrieve your feedback. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
