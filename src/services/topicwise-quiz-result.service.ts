import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export interface QuestionDetail {
  questionId: number;
  question: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface TopicPerformance {
  topic: string;
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  totalQuestions: number;
  averageScore: number;
  averageTimeTaken: number;
  bestScore: number;
  worstScore: number;
  lastAttemptDate: Date | null;
}

interface QuestionPerformance {
  topic: string;
  questionId: number;
  question: string;
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  averageTimeTaken: number;
  successRate?: number;
}

export const createTopicwiseQuizResult = async (data: {
  userId: string;
  topicwiseMcqId: string;
  totalTimeTaken: number;
  correctAnswerCount: number;
  wrongAnswerCount: number;
  attemptCount: number;
  questionDetails?: QuestionDetail[];
}) => {
  try {
    const formattedData = {
      ...data,
      questionDetails: data.questionDetails ? JSON.stringify(data.questionDetails) : undefined
    };

    const quizResult = await prisma.topicwiseQuizResult.create({
      data: formattedData
    });
    
    return quizResult;
  } catch (error) {
    log.error('Error creating topicwise quiz result', { 
      error: error instanceof Error ? error.message : String(error), 
      userId: data.userId 
    });
    throw error;
  }
};

export const getUserTopicwiseQuizResults = async (userId: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: { userId },
      include: {
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return results.map((result) => ({
      ...result,
      questionDetails: result.questionDetails ? JSON.parse(String(result.questionDetails)) : null
    }));
  } catch (error) {
    log.error('Error fetching user topicwise quiz results', { 
      error: error instanceof Error ? error.message : String(error), 
      userId 
    });
    throw error;
  }
};

export const getTopicwiseQuizResultById = async (id: string) => {
  try {
    const result = await prisma.topicwiseQuizResult.findUnique({
      where: { id },
      include: {
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      }
    });
    
    if (!result) return null;
    
    return {
      ...result,
      questionDetails: result.questionDetails ? JSON.parse(String(result.questionDetails)) : null
    };
  } catch (error) {
    log.error('Error fetching topicwise quiz result by ID', { 
      error: error instanceof Error ? error.message : String(error), 
      id 
    });
    throw error;
  }
};

export const getTopicwiseMcqQuizResults = async (topicwiseMcqId: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: { topicwiseMcqId },
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
    
    return results.map((result) => ({
      ...result,
      questionDetails: result.questionDetails ? JSON.parse(String(result.questionDetails)) : null
    }));
  } catch (error) {
    log.error('Error fetching topicwise MCQ quiz results', { 
      error: error instanceof Error ? error.message : String(error), 
      topicwiseMcqId 
    });
    throw error;
  }
};

export const getUserTopicwiseMcqQuizResults = async (userId: string, topicwiseMcqId: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: { 
        userId,
        topicwiseMcqId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return results.map((result) => ({
      ...result,
      questionDetails: result.questionDetails ? JSON.parse(String(result.questionDetails)) : null
    }));
  } catch (error) {
    log.error('Error fetching user topicwise MCQ quiz results', { 
      error: error instanceof Error ? error.message : String(error), 
      userId,
      topicwiseMcqId
    });
    throw error;
  }
};

// Analytics functions

export const getUserTopicPerformanceAnalytics = async (userId: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: { userId },
      include: {
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      }
    });
    
    const topicPerformance: Record<string, TopicPerformance> = {};
    
    results.forEach((result) => {
      const topicKey = result.topicwiseMcq.key;
      
      if (!topicPerformance[topicKey]) {
        topicPerformance[topicKey] = {
          topic: topicKey,
          totalAttempts: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalQuestions: 0,
          averageScore: 0,
          averageTimeTaken: 0,
          bestScore: 0,
          worstScore: 100,
          lastAttemptDate: null
        };
      }
      
      const performance = topicPerformance[topicKey];
      performance.totalAttempts += 1;
      performance.totalCorrect += result.correctAnswerCount;
      performance.totalWrong += result.wrongAnswerCount;
      performance.totalQuestions += (result.correctAnswerCount + result.wrongAnswerCount);
      
      const score = (result.correctAnswerCount / (result.correctAnswerCount + result.wrongAnswerCount)) * 100;
      performance.bestScore = Math.max(performance.bestScore, score);
      performance.worstScore = Math.min(performance.worstScore, score);
      
      performance.averageTimeTaken = 
        ((performance.averageTimeTaken * (performance.totalAttempts - 1)) + result.totalTimeTaken) / 
        performance.totalAttempts;
      
      if (!performance.lastAttemptDate || new Date(result.createdAt) > new Date(performance.lastAttemptDate)) {
        performance.lastAttemptDate = result.createdAt;
      }
    });
    
    // Calculate final averages
    Object.values(topicPerformance).forEach((performance) => {
      performance.averageScore = (performance.totalCorrect / performance.totalQuestions) * 100;
      performance.averageScore = Math.round(performance.averageScore * 100) / 100;
      performance.averageTimeTaken = Math.round(performance.averageTimeTaken * 100) / 100;
      performance.bestScore = Math.round(performance.bestScore * 100) / 100;
      performance.worstScore = Math.round(performance.worstScore * 100) / 100;
    });
    
    return Object.values(topicPerformance);
  } catch (error) {
    log.error('Error generating user topic performance analytics', { 
      error: error instanceof Error ? error.message : String(error), 
      userId 
    });
    throw error;
  }
};

export const getUserProgressOverTime = async (userId: string, topicKey?: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: topicKey 
        ? { 
            userId,
            topicwiseMcq: {
              key: topicKey
            }
          } 
        : { userId },
      include: {
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Format results for time-series analysis
    return results.map((result) => {
      const totalQuestions = result.correctAnswerCount + result.wrongAnswerCount;
      const scorePercentage = totalQuestions > 0 
        ? (result.correctAnswerCount / totalQuestions) * 100 
        : 0;
      
      return {
        date: result.createdAt,
        topic: result.topicwiseMcq.key,
        score: Math.round(scorePercentage * 100) / 100,
        timeTaken: result.totalTimeTaken,
        correctAnswers: result.correctAnswerCount,
        wrongAnswers: result.wrongAnswerCount,
        totalQuestions: totalQuestions
      };
    });
  } catch (error) {
    log.error('Error generating user progress over time', { 
      error: error instanceof Error ? error.message : String(error), 
      userId,
      topicKey
    });
    throw error;
  }
};

export const getWeakAreasAnalysis = async (userId: string) => {
  try {
    const results = await prisma.topicwiseQuizResult.findMany({
      where: { userId },
      include: {
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      }
    });
    
    // Track performance by question
    const questionPerformance: Record<string, QuestionPerformance> = {};
    
    results.forEach((result) => {
      if (!result.questionDetails) return;
      
      const details = JSON.parse(String(result.questionDetails)) as QuestionDetail[];
      const topicKey = result.topicwiseMcq.key;
      
      details.forEach(detail => {
        const questionId = `${topicKey}-${detail.questionId}`;
        
        if (!questionPerformance[questionId]) {
          questionPerformance[questionId] = {
            topic: topicKey,
            questionId: detail.questionId,
            question: detail.question,
            attempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
            averageTimeTaken: 0
          };
        }
        
        const performance = questionPerformance[questionId];
        performance.attempts += 1;
        
        if (detail.isCorrect) {
          performance.correctAttempts += 1;
        } else {
          performance.incorrectAttempts += 1;
        }
        
        if (detail.timeTaken) {
          performance.averageTimeTaken = 
            ((performance.averageTimeTaken * (performance.attempts - 1)) + detail.timeTaken) / 
            performance.attempts;
        }
      });
    });
    
    // Calculate success rates and identify weak areas
    const weakAreas = Object.values(questionPerformance)
      .map((performance) => {
        const successRate = performance.attempts > 0 
          ? (performance.correctAttempts / performance.attempts) * 100 
          : 0;
        
        return {
          ...performance,
          successRate: Math.round(successRate * 100) / 100,
          averageTimeTaken: Math.round(performance.averageTimeTaken * 100) / 100
        };
      })
      .filter((performance: any) => performance.successRate < 50)
      .sort((a: any, b: any) => a.successRate - b.successRate);
    
    return weakAreas;
  } catch (error) {
    log.error('Error generating weak areas analysis', { 
      error: error instanceof Error ? error.message : String(error), 
      userId 
    });
    throw error;
  }
};

export interface DashboardData {
  totalQuizzes: number;
  totalCorrect: number;
  totalWrong: number;
  averageScore: number;
  topPerformingTopics: Array<{
    topic: string;
    averageScore: number;
  }>;
  recentActivity: Array<{
    date: Date;
    topic: string;
    score: number;
  }>;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    log.info('Fetching dashboard data for user', { userId });
    const results = await prisma.topicwiseQuizResult.findMany({
      where: {
        userId
      },
      select: {
        id: true,
        correctAnswerCount: true,
        wrongAnswerCount: true,
        createdAt: true,
        topicwiseMcq: {
          select: {
            key: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    log.info('Retrieved quiz results', { 
      resultCount: results.length,
      firstResult: results[0] 
    });
    
    if (results.length === 0) {
      return {
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0,
        averageScore: 0,
        topPerformingTopics: [],
        recentActivity: []
      };
    }
    
    // Calculate total metrics
    const totalQuizzes = results.length;
    const totalCorrect = results.reduce((sum, result) => sum + result.correctAnswerCount, 0);
    const totalWrong = results.reduce((sum, result) => sum + result.wrongAnswerCount, 0);
    const totalQuestions = totalCorrect + totalWrong;
    const averageScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    // Group by topic for top performing topics
    const topicPerformance: Record<string, { totalCorrect: number; totalQuestions: number; }> = {};
    
    results.forEach((result) => {
      if (!result.topicwiseMcq?.key) {
        log.warn('Missing topicwiseMcq or key for result', { resultId: result.id });
        return;
      }
      
      const topicKey = result.topicwiseMcq.key;
      
      if (!topicPerformance[topicKey]) {
        topicPerformance[topicKey] = {
          totalCorrect: 0,
          totalQuestions: 0
        };
      }
      
      topicPerformance[topicKey].totalCorrect += result.correctAnswerCount;
      topicPerformance[topicKey].totalQuestions += result.correctAnswerCount + result.wrongAnswerCount;
    });
    
    log.info('Calculated topic performance', { topicPerformance });
    
    const topPerformingTopics = Object.entries(topicPerformance)
      .map(([topic, data]) => ({
        topic,
        averageScore: data.totalQuestions > 0 ? (data.totalCorrect / data.totalQuestions) * 100 : 0
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
    
    // Recent activity (last 10 quizzes)
    const recentActivity = results.slice(0, 10).map(result => {
      const totalQuestions = result.correctAnswerCount + result.wrongAnswerCount;
      const score = totalQuestions > 0 ? (result.correctAnswerCount / totalQuestions) * 100 : 0;
      
      return {
        date: result.createdAt,
        topic: result.topicwiseMcq.key,
        score
      };
    });
    
    return {
      totalQuizzes,
      totalCorrect,
      totalWrong,
      averageScore: Math.round(averageScore * 100) / 100,
      topPerformingTopics: topPerformingTopics.map(topic => ({
        ...topic,
        averageScore: Math.round(topic.averageScore * 100) / 100
      })),
      recentActivity
    };
  } catch (error) {
    log.error('Error getting dashboard data', { 
      error: error instanceof Error ? error.message : String(error), 
      userId 
    });
    throw error;
  }
}
