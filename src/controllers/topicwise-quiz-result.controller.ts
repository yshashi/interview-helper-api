import type { Request, Response } from 'express';
import { 
  createTopicwiseQuizResult, 
  getUserTopicwiseQuizResults, 
  getTopicwiseQuizResultById, 
  getTopicwiseMcqQuizResults, 
  getUserTopicwiseMcqQuizResults,
  getUserTopicPerformanceAnalytics,
  getUserProgressOverTime,
  getWeakAreasAnalysis,
  getDashboardData
} from '../services/topicwise-quiz-result.service.js';
import { log } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import type { TokenPayload } from '../services/auth.service.js';

export const createTopicwiseUserQuizResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      topicwiseMcqId, 
      totalTimeTaken, 
      correctAnswerCount, 
      wrongAnswerCount,
      questionDetails 
    } = req.body;
    
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    if (!topicwiseMcqId) {
      res.status(400).json({ message: 'Topicwise MCQ ID is required' });
      return;
    }

    const mcq = await prisma.topicwiseMcqs.findUnique({
      where: { id: topicwiseMcqId }
    });
    
    if (!mcq) {
      res.status(404).json({ message: 'Topicwise MCQ not found' });
      return;
    }

    const existingResult = await prisma.topicwiseQuizResult.findFirst({
      where: {
        userId,
        topicwiseMcqId
      }
    });
    
    const quizResult = await createTopicwiseQuizResult({
      userId,
      topicwiseMcqId,
      totalTimeTaken: totalTimeTaken || 0,
      correctAnswerCount: correctAnswerCount || 0,
      wrongAnswerCount: wrongAnswerCount || 0,
      attemptCount: existingResult ? existingResult.attemptCount + 1 : 1,
      questionDetails: questionDetails
    });
    
    res.status(201).json(quizResult);
  } catch (error) {
    log.error('Error in createTopicwiseUserQuizResult controller', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserTopicwiseQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    const results = await getUserTopicwiseQuizResults(userId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getUserTopicwiseQuizResultsController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTopicwiseQuizResultByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    if (!id) {
      res.status(400).json({ message: 'Quiz result ID is required' });
      return;
    }
    
    const result = await getTopicwiseQuizResultById(id);
    
    if (!result) {
      res.status(404).json({ message: 'Quiz result not found' });
      return;
    }
    
    if (result.userId !== userId && (req.user as TokenPayload)?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    res.status(200).json(result);
  } catch (error) {
    log.error('Error in getTopicwiseQuizResultByIdController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTopicwiseMcqQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topicwiseMcqId } = req.params;
    
    if ((req.user as TokenPayload)?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    if (!topicwiseMcqId) {
      res.status(400).json({ message: 'Topicwise MCQ ID is required' });
      return;
    }
    
    const results = await getTopicwiseMcqQuizResults(topicwiseMcqId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getTopicwiseMcqQuizResultsController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserTopicwiseMcqQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topicwiseMcqId } = req.params;
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    if (!topicwiseMcqId) {
      res.status(400).json({ message: 'Topicwise MCQ ID is required' });
      return;
    }
    
    const results = await getUserTopicwiseMcqQuizResults(userId, topicwiseMcqId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getUserTopicwiseMcqQuizResultsController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Analytics controllers

export const getUserTopicPerformanceAnalyticsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    const analytics = await getUserTopicPerformanceAnalytics(userId);
    res.status(200).json(analytics);
  } catch (error) {
    log.error('Error in getUserTopicPerformanceAnalyticsController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserProgressOverTimeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    const { topicKey } = req.query;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    const progress = await getUserProgressOverTime(userId, topicKey as string | undefined);
    res.status(200).json(progress);
  } catch (error) {
    log.error('Error in getUserProgressOverTimeController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getWeakAreasAnalysisController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    const weakAreas = await getWeakAreasAnalysis(userId);
    res.status(200).json(weakAreas);
  } catch (error) {
    log.error('Error in getWeakAreasAnalysisController', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboardDataController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      log.warn('Unauthorized access attempt to dashboard');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    log.info('Attempting to fetch dashboard data', { userId });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      log.warn('User not found', { userId });
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const dashboardData = await getDashboardData(userId);
    res.status(200).json(dashboardData);
  } catch (error) {
    log.error('Error in getDashboardDataController', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
