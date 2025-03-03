import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';

export const createRateLimiter = () => {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
    },
    handler: (req, res, _, options) => {
      log.warn(`Rate limit exceeded: ${req.ip}`, {
        path: req.path,
        method: req.method,
        headers: req.headers,
      });
      res.status(429).json(options.message);
    },
  });
};
