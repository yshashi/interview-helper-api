import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    // @ts-ignore - Prisma raw query
    await prisma.$executeRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected'
      }
    });
  } catch (error) {
    log.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected'
      },
      message: error instanceof Error ? error.message : 'Health check failed'
    });
  }
};
