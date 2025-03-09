import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export const createQuizResult = async (data: {
  userId: string;
  mcqId: string;
  totalTimeTaken: number;
  correctAnswerCount: number;
  wrongAnswerCount: number;
  attemptCount: number;
}) => {
  try {
    const quizResult = await prisma.userQuizResult.create({
      data
    });
    
    return quizResult;
  } catch (error) {
    log.error('Error creating quiz result', { error: error instanceof Error ? error.message : String(error), userId: data.userId });
    throw error;
  }
};

export const getUserQuizResults = async (userId: string) => {
  try {
    const results = await prisma.userQuizResult.findMany({
      where: { userId },
      include: {
        mcq: {
          select: {
            key: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return results;
  } catch (error) {
    log.error('Error fetching user quiz results', { error: error instanceof Error ? error.message : String(error), userId });
    throw error;
  }
};

export const getQuizResultById = async (id: string) => {
  try {
    const result = await prisma.userQuizResult.findUnique({
      where: { id },
      include: {
        mcq: {
          select: {
            key: true
          }
        }
      }
    });
    
    return result;
  } catch (error) {
    log.error('Error fetching quiz result by ID', { error: error instanceof Error ? error.message : String(error), id });
    throw error;
  }
};

export const getMcqQuizResults = async (mcqId: string) => {
  try {
    const results = await prisma.userQuizResult.findMany({
      where: { mcqId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return results;
  } catch (error) {
    log.error('Error fetching MCQ quiz results', { error: error instanceof Error ? error.message : String(error), mcqId });
    throw error;
  }
};

export const getUserMcqQuizResults = async (userId: string, mcqId: string) => {
  try {
    const results = await prisma.userQuizResult.findMany({
      where: { 
        userId,
        mcqId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return results;
  } catch (error) {
    log.error('Error fetching user MCQ quiz results', { 
      error: error instanceof Error ? error.message : String(error), 
      userId,
      mcqId
    });
    throw error;
  }
};
