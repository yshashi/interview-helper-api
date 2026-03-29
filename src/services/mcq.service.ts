import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

type OptionKey = 'A' | 'B' | 'C' | 'D';

function shuffleQuestionOptions<
  T extends { options: Record<OptionKey, string>; correct_answer: string },
>(q: T): T {
  const keys: OptionKey[] = ['A', 'B', 'C', 'D'];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  const labels: OptionKey[] = ['A', 'B', 'C', 'D'];
  const newOptions = {} as Record<OptionKey, string>;
  let newCorrect: OptionKey = 'A';
  for (let i = 0; i < 4; i++) {
    newOptions[labels[i]] = q.options[keys[i]];
    if (keys[i] === q.correct_answer) newCorrect = labels[i];
  }
  return { ...q, options: newOptions, correct_answer: newCorrect };
}

export const getMcqByKey = async (key: string) => {
  try {
    const mcq = await prisma.mCQ.findUnique({
      where: { key },
    });

    if (mcq && mcq.questions) {
      return { ...mcq, questions: mcq.questions.map(shuffleQuestionOptions) };
    }
    return mcq;
  } catch (error) {
    log.error('Error fetching MCQ by key', {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    throw error;
  }
};

export const getAllMcqKeys = async () => {
  try {
    const mcqs = await prisma.mCQ.findMany({
      select: {
        key: true,
      },
    });

    return mcqs.map((mcq) => mcq.key);
  } catch (error) {
    log.error('Error fetching all MCQ keys', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
