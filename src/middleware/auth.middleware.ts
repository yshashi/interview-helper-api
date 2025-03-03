import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    log.error('Authentication error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        return;
      }
      
      // @ts-ignore - Role property access
      if (!roles.includes(req.user.role as string)) {
        res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        return;
      }
      
      next();
    } catch (error) {
      log.error('Authorization error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const validateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }
    
    const session = await prisma.session.findFirst({
      where: {
        // @ts-ignore - Sub property access
        userId: req.user.sub as string,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (!session) {
      res.status(401).json({ message: 'Unauthorized: Session expired or invalid' });
      return;
    }
    
    next();
  } catch (error) {
    log.error('Session validation error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Internal server error' });
  }
};
