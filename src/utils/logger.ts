import winston from 'winston';
import { env } from '../config/env.js';
import path from 'path';
import fs from 'fs';

const logDir = path.dirname(env.LOG_FILE_PATH);
if (env.LOG_FILE_ENABLED && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

if (env.LOG_FILE_ENABLED) {
  transports.push(
    new winston.transports.File({
      filename: env.LOG_FILE_PATH,
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: winston.config.npm.levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

export const log = {
  error: (message: string, meta: Record<string, unknown> = {}): winston.Logger => 
    logger.error(message, meta),
  warn: (message: string, meta: Record<string, unknown> = {}): winston.Logger => 
    logger.warn(message, meta),
  info: (message: string, meta: Record<string, unknown> = {}): winston.Logger => 
    logger.info(message, meta),
  http: (message: string, meta: Record<string, unknown> = {}): winston.Logger => 
    logger.http(message, meta),
  debug: (message: string, meta: Record<string, unknown> = {}): winston.Logger => 
    logger.debug(message, meta),
};

export const createRequestLogger = () => {
  return (req: any, res: any, next: any): void => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
      
      const meta = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      };
      
      if (res.statusCode >= 400) {
        log.warn(message, meta);
      } else {
        log.http(message, meta);
      }
    });
    
    next();
  };
};
