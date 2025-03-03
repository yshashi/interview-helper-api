import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
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
