import type { Request, Response } from 'express';
import { getMcqByKey, getAllMcqKeys } from '../services/mcq.service.js';
import { log } from '../utils/logger.js';

export const getQuestionsByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ message: 'Key is required' });
      return;
    }
    
    const mcq = await getMcqByKey(key);
    
    if (!mcq) {
      res.status(404).json({ message: 'MCQ not found' });
      return;
    }
    
    res.status(200).json(mcq);
  } catch (error) {
    log.error('Error in getQuestionsByKey controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllKeys = async (_: Request, res: Response): Promise<void> => {
  try {
    const keys = await getAllMcqKeys();
    res.status(200).json({ keys });
  } catch (error) {
    log.error('Error in getAllKeys controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};
