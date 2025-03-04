import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('5500'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:5500'),
  CLIENT_URL: z.string().default('http://localhost:4231'),
  
  DATABASE_URL: z.string().default('mongodb://localhost:27017/interview-helper'),
  
  JWT_SECRET: z.string().default('your_jwt_secret_key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default('your_jwt_refresh_secret_key'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('/api/auth/google/callback'),
  
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().default('/api/auth/github/callback'),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FILE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('15000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const env = parseEnv();

export const isProd = (): boolean => env.NODE_ENV === 'production';

export const isDev = (): boolean => env.NODE_ENV === 'development';

export const isTest = (): boolean => env.NODE_ENV === 'test';
