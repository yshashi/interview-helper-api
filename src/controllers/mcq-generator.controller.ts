import type { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import {
  listAvailableTopics,
  generateForFile,
  generateForTopic,
  generateAll,
  refreshTopic,
  refreshAll,
} from '../services/mcq-generator.service.js';

export const getTopics = (_req: Request, res: Response): void => {
  try {
    const topics = listAvailableTopics();
    res.status(200).json({ topics });
  } catch (error) {
    log.error('Error listing topics', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, target } = req.body as { mode?: string; target?: string };

    if (!mode || !['file', 'topic', 'all'].includes(mode)) {
      res.status(400).json({ message: 'Invalid mode. Must be one of: file, topic, all' });
      return;
    }

    if ((mode === 'file' || mode === 'topic') && !target) {
      res.status(400).json({ message: `"target" is required for mode "${mode}"` });
      return;
    }

    switch (mode) {
      case 'file': {
        const result = await generateForFile(target!);
        res.status(200).json({ message: 'MCQs generated', ...result });
        return;
      }
      case 'topic': {
        const result = await generateForTopic(target!);
        res.status(200).json({ message: 'Topic MCQs generated', ...result });
        return;
      }
      case 'all': {
        const result = await generateAll();
        res.status(200).json({ message: 'All MCQs generated', ...result });
        return;
      }
    }
  } catch (error) {
    log.error('Error generating MCQs', {
      error: error instanceof Error ? error.message : String(error),
    });
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode, target } = req.body as { mode?: string; target?: string };

    if (!mode || !['topic', 'all'].includes(mode)) {
      res.status(400).json({ message: 'Invalid mode. Must be one of: topic, all' });
      return;
    }

    if (mode === 'topic' && !target) {
      res.status(400).json({ message: '"target" is required for mode "topic"' });
      return;
    }

    switch (mode) {
      case 'topic': {
        const result = await refreshTopic(target!);
        res.status(200).json({ message: 'Topic refreshed', ...result });
        return;
      }
      case 'all': {
        const result = await refreshAll();
        res.status(200).json({ message: 'All topics refreshed', ...result });
        return;
      }
    }
  } catch (error) {
    log.error('Error refreshing MCQs', {
      error: error instanceof Error ? error.message : String(error),
    });
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
