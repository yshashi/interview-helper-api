import { AppError, formatErrorResponse } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';
import type { NextFunction } from 'express';
import type { Request, Response } from 'express';

const normalizeError = (err: Error): AppError => {
  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return new ValidationError(message);
  }
  
  if (err instanceof SyntaxError && 'body' in err) {
    return new ValidationError('Invalid JSON');
  }
  
  if (err instanceof AppError) {
    return err;
  }
  
  return new AppError(
    process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    500,
    false
  );
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const normalizedError = normalizeError(err);
  
  if (normalizedError.isOperational) {
    log.warn(`Operational error: ${normalizedError.message}`, {
      statusCode: normalizedError.statusCode,
      path: req.path,
      method: req.method,
    });
  } else {
    log.error(`Unhandled error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }
  
  res.status(normalizedError.statusCode).json(formatErrorResponse(normalizedError));
};

export const notFoundHandler = (req: Request, _: Response, next: NextFunction): void => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
};
