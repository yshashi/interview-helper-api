import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ code: 'NO_TOKEN', message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      // Distinguish expired tokens from invalid tokens so the client knows to try refresh
      if (
        error instanceof jwt.TokenExpiredError ||
        (error instanceof Error && error.message === 'Invalid token')
      ) {
        try {
          // Decode without verifying to check if it's an expired but otherwise valid token
          const payload = jwt.decode(token);
          if (payload && typeof payload === 'object' && payload.userId) {
            res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Unauthorized: Token expired' });
            return;
          }
        } catch {
          // fall through
        }
      }
      res.status(401).json({ code: 'INVALID_TOKEN', message: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    log.error('Authentication error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Internal server error' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res
          .status(401)
          .json({ code: 'NOT_AUTHENTICATED', message: 'Unauthorized: User not authenticated' });
        return;
      }

      // @ts-ignore - Role property access
      if (!roles.includes(req.user.role as string)) {
        res
          .status(403)
          .json({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Forbidden: Insufficient permissions',
          });
        return;
      }

      next();
    } catch (error) {
      log.error('Authorization error', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ code: 'SERVER_ERROR', message: 'Internal server error' });
    }
  };
};

export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ code: 'NOT_AUTHENTICATED', message: 'Unauthorized: User not authenticated' });
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
      res
        .status(401)
        .json({ code: 'SESSION_EXPIRED', message: 'Unauthorized: Session expired or invalid' });
      return;
    }

    next();
  } catch (error) {
    log.error('Session validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Internal server error' });
  }
};
