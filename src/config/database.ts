import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger.js';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - Prisma event handling
  prisma.$on('query', (e: any) => {
    log.debug(`Query: ${e.query}`);
    log.debug(`Duration: ${e.duration}ms`);
  });

  // @ts-ignore - Prisma event handling
  prisma.$on('error', (e: any) => {
    log.error('Prisma Error', { error: e.message });
  });
}

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const connectToDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    log.info('Connected to MongoDB database');
  } catch (error) {
    log.error('Failed to connect to MongoDB database', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    log.info('Disconnected from MongoDB database');
  } catch (error) {
    log.error('Failed to disconnect from MongoDB database', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export types from Prisma
export * from '@prisma/client';
