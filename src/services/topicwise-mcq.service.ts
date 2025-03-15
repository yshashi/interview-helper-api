import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export const getRandomTopicwiseMcqsByKey = async (key: string, limit: number = 35) => {
  try {
    const mcq = await prisma.topicwiseMcqs.findUnique({
      where: { key }
    });
    
    if (!mcq || !mcq.questions || mcq.questions.length === 0) {
      return null;
    }
    
    const shuffledQuestions = [...mcq.questions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }
    
    return {
      id: mcq.id,
      key: mcq.key,
      questions: shuffledQuestions.slice(0, limit)
    };
  } catch (error) {
    log.error('Error fetching random topicwise MCQs by key', { 
      error: error instanceof Error ? error.message : String(error), 
      key 
    });
    throw error;
  }
};

export const getAllTopicwiseMcqKeys = async () => {
  try {
    const mcqs = await prisma.topicwiseMcqs.findMany({
      select: {
        key: true
      }
    });
    
    return mcqs.map(mcq => mcq.key);
  } catch (error) {
    log.error('Error fetching all topicwise MCQ keys', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
};
