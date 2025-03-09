import type { Request, Response } from 'express';
import { 
  createQuizResult, 
  getUserQuizResults, 
  getQuizResultById, 
  getMcqQuizResults, 
  getUserMcqQuizResults 
} from '../services/quiz-result.service.js';
import { log } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import type { TokenPayload } from '../services/auth.service.js';

export const createUserQuizResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mcqId, totalTimeTaken, correctAnswerCount, wrongAnswerCount } = req.body;
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    if (!mcqId) {
      res.status(400).json({ message: 'MCQ ID is required' });
      return;
    }
    
    // Validate that the MCQ exists
    const mcq = await prisma.mCQ.findUnique({
      where: { id: mcqId }
    });
    
    if (!mcq) {
      res.status(404).json({ message: 'MCQ not found' });
      return;
    }

    const existingResult = await prisma.userQuizResult.findFirst({
      where: {
        userId,
        mcqId
      }
    });
    
    const quizResult = await createQuizResult({
      userId,
      mcqId,
      totalTimeTaken: totalTimeTaken || 0,
      correctAnswerCount: correctAnswerCount || 0,
      wrongAnswerCount: wrongAnswerCount || 0,
      attemptCount: existingResult ? existingResult.attemptCount + 1 : 1
    });
    
    res.status(201).json(quizResult);
  } catch (error) {
    log.error('Error in createUserQuizResult controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    const results = await getUserQuizResults(userId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getUserQuizResultsController', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQuizResultByIdController = async (req: Request, res: Response): Promise<void> => {
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
    
    const result = await getQuizResultById(id);
    
    if (!result) {
      res.status(404).json({ message: 'Quiz result not found' });
      return;
    }
    
    // Check if the user is authorized to view this result
    if (result.userId !== userId && (req.user as TokenPayload)?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    res.status(200).json(result);
  } catch (error) {
    log.error('Error in getQuizResultByIdController', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMcqQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mcqId } = req.params;
    
    // Only admins can access all results for an MCQ
    if ((req.user as TokenPayload)?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    if (!mcqId) {
      res.status(400).json({ message: 'MCQ ID is required' });
      return;
    }
    
    const results = await getMcqQuizResults(mcqId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getMcqQuizResultsController', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserMcqQuizResultsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mcqId } = req.params;
    const userId = (req.user as TokenPayload)?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    if (!mcqId) {
      res.status(400).json({ message: 'MCQ ID is required' });
      return;
    }
    
    const results = await getUserMcqQuizResults(userId, mcqId);
    res.status(200).json(results);
  } catch (error) {
    log.error('Error in getUserMcqQuizResultsController', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};
