import type { Request, Response } from 'express';
import { getRandomTopicwiseMcqsByKey, getAllTopicwiseMcqKeys } from '../services/topicwise-mcq.service.js';
import { log } from '../utils/logger.js';

export const getRandomQuestionsByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 35;
    
    if (!key) {
      res.status(400).json({ message: 'Key is required' });
      return;
    }
    
    if (isNaN(limit) || limit < 1) {
      res.status(400).json({ message: 'Limit must be a positive number' });
      return;
    }
    
    const mcq = await getRandomTopicwiseMcqsByKey(key, limit);
    
    if (!mcq) {
      res.status(404).json({ message: 'Topicwise MCQ not found' });
      return;
    }
    
    res.status(200).json(mcq);
  } catch (error) {
    log.error('Error in getRandomQuestionsByKey controller', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTopicKeys = async (_: Request, res: Response): Promise<void> => {
  try {
    const keys = await getAllTopicwiseMcqKeys();
    res.status(200).json({ keys });
  } catch (error) {
    log.error('Error in getAllTopicKeys controller', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};
