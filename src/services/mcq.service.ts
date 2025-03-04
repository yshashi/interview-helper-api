import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export const getMcqByKey = async (key: string) => {
  try {
    const mcq = await prisma.mCQ.findUnique({
      where: { key }
    });
    
    return mcq;
  } catch (error) {
    log.error('Error fetching MCQ by key', { error: error instanceof Error ? error.message : String(error), key });
    throw error;
  }
};

export const getAllMcqKeys = async () => {
  try {
    const mcqs = await prisma.mCQ.findMany({
      select: {
        key: true
      }
    });
    
    return mcqs.map(mcq => mcq.key);
  } catch (error) {
    log.error('Error fetching all MCQ keys', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};
