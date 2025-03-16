import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';
import type { Feedback, Prisma } from '@prisma/client';
import type { CreateFeedbackDto } from '../dtos/feedback.dto.js';

interface FeedbackStats {
  helpful: number;
  needsImprovement: number;
  total: number;
}

export const createFeedback = async (data: CreateFeedbackDto, userId?: string): Promise<Feedback> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to create feedback');
    }

    const createInput: Prisma.FeedbackCreateInput = {
      topic: data.topic,
      type: data.type,
      comment: data.comment,
      user: {
        connect: { id: userId }
      }
    };

    // check if same user has already submitted feedback for this topic
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        topic: data.topic,
        userId
      }
    });

    if (existingFeedback) {
      log.info('Feedback already exists for this topic', { topic: data.topic });
      return existingFeedback;
    }

    const feedback = await prisma.feedback.create({
      data: createInput,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    log.info('Feedback created successfully', { feedbackId: feedback.id });
    return feedback;
  } catch (error) {
    log.error('Error creating feedback', { 
      error: error instanceof Error ? error.message : String(error),
      data 
    });
    throw error;
  }
};

export const getFeedbackByTopic = async (topic: string): Promise<Feedback[]> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { topic },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    log.info('Retrieved feedback by topic', { topic, count: feedbacks.length });
    return feedbacks;
  } catch (error) {
    log.error('Error retrieving feedback by topic', {
      error: error instanceof Error ? error.message : String(error),
      topic
    });
    throw error;
  }
};

export const getFeedbackStats = async (topic: string): Promise<FeedbackStats> => {
  try {
    const [helpful, needsImprovement] = await Promise.all([
      prisma.feedback.count({
        where: {
          topic,
          type: 'HELPFUL'
        }
      }),
      prisma.feedback.count({
        where: {
          topic,
          type: 'NEEDS_IMPROVEMENT'
        }
      })
    ]);

    const stats: FeedbackStats = {
      helpful,
      needsImprovement,
      total: helpful + needsImprovement
    };

    log.info('Retrieved feedback stats', { topic, stats });
    return stats;
  } catch (error) {
    log.error('Error retrieving feedback stats', {
      error: error instanceof Error ? error.message : String(error),
      topic
    });
    throw error;
  }
};

export const getUserFeedback = async (userId: string): Promise<Feedback[]> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    log.info('Retrieved user feedback', { userId, count: feedbacks.length });
    return feedbacks;
  } catch (error) {
    log.error('Error retrieving user feedback', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    throw error;
  }
};
