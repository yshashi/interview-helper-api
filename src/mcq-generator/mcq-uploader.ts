import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';
import type { Question } from './mcq-generator.js';

/**
 * Upsert questions into the MCQ collection (per-file granularity).
 * If a document with the given key exists, its questions are replaced.
 */
export async function upsertMcq(key: string, questions: Question[]): Promise<void> {
  try {
    await prisma.mCQ.upsert({
      where: { key },
      update: { questions },
      create: { key, questions },
    });
    log.info(`Upserted MCQ: ${key} (${questions.length} questions)`);
  } catch (error) {
    log.error(`Failed to upsert MCQ: ${key}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Upsert questions into the TopicwiseMcqs collection (per-topic aggregation).
 * If a document with the given key exists, its questions are replaced.
 */
export async function upsertTopicwiseMcq(key: string, questions: Question[]): Promise<void> {
  try {
    await prisma.topicwiseMcqs.upsert({
      where: { key },
      update: { questions },
      create: { key, questions },
    });
    log.info(`Upserted TopicwiseMcq: ${key} (${questions.length} questions)`);
  } catch (error) {
    log.error(`Failed to upsert TopicwiseMcq: ${key}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Load existing TopicwiseMcqs questions for a topic.
 */
export async function loadTopicQuestions(topic: string): Promise<Question[]> {
  const record = await prisma.topicwiseMcqs.findUnique({ where: { key: topic } });
  if (!record) return [];
  return record.questions as unknown as Question[];
}

/**
 * Merge new questions into existing ones for incremental refresh.
 * - Removes all questions from changedFiles and removedFiles
 * - Adds newQuestions (from new + changed files)
 * - Keeps questions from unchanged files intact
 * - Re-numbers question_ids sequentially
 */
export function mergeQuestions(
  existing: Question[],
  newQuestions: Question[],
  changedFiles: string[],
  removedFiles: string[],
): Question[] {
  const staleFiles = new Set([...changedFiles, ...removedFiles]);

  // Keep questions from files that haven't changed/been removed
  const kept = existing.filter((q) => !staleFiles.has(q.source_file));

  // Deduplicate new questions against kept ones
  const seenQuestions = new Set(kept.map((q) => q.question.toLowerCase().trim()));
  const deduped: Question[] = [];
  for (const q of newQuestions) {
    const normalized = q.question.toLowerCase().trim();
    if (!seenQuestions.has(normalized)) {
      seenQuestions.add(normalized);
      deduped.push(q);
    }
  }

  // Combine and re-number
  const merged = [...kept, ...deduped];
  return merged.map((q, i) => ({ ...q, question_id: i + 1 }));
}
