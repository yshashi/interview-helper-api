import path from 'path';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';
import {
  discoverMdxFiles,
  parseMdxFile,
  listTopicDirectories,
} from '../mcq-generator/mdx-reader.js';
import { McqGenerator } from '../mcq-generator/mcq-generator.js';
import {
  upsertMcq,
  upsertTopicwiseMcq,
  loadTopicQuestions,
  mergeQuestions,
} from '../mcq-generator/mcq-uploader.js';
import { diffTopicFiles, updateHashes, removeStaleHashes } from '../mcq-generator/content-hash.js';
import { ValidationError } from '../utils/errors.js';

function getContentDir(): string {
  return path.resolve(process.cwd(), env.MCQ_CONTENT_DIR);
}

function getGenerator(): McqGenerator {
  if (!env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_ENDPOINT) {
    throw new ValidationError('AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT must be configured');
  }
  return new McqGenerator(
    env.AZURE_OPENAI_API_KEY,
    env.AZURE_OPENAI_ENDPOINT,
    env.AZURE_OPENAI_API_VERSION,
    env.AZURE_OPENAI_DEPLOYMENT,
  );
}

export const listAvailableTopics = (): string[] => {
  return listTopicDirectories(getContentDir());
};

export const generateForFile = async (
  relativePath: string,
): Promise<{ key: string; questionsCount: number }> => {
  const contentDir = getContentDir();
  const generator = getGenerator();
  const fullPath = relativePath.endsWith('.mdx') ? relativePath : `${relativePath}.mdx`;
  const absolutePath = path.join(contentDir, fullPath);

  const fileData = parseMdxFile(absolutePath, contentDir);

  if (!fileData.content || fileData.content.length < 50) {
    return { key: fileData.filename, questionsCount: 0 };
  }

  const questions = await generator.generateMcqs(
    fileData.content,
    env.MCQ_QUESTIONS_PER_FILE,
    fileData.filename,
  );

  if (questions.length > 0) {
    await upsertMcq(fileData.filename, questions);
  }

  return { key: fileData.filename, questionsCount: questions.length };
};

/**
 * Full generation: process ALL files for a topic, 4 questions per file.
 */
export const generateForTopic = async (
  topicName: string,
): Promise<{ key: string; questionsCount: number }> => {
  const contentDir = getContentDir();
  const generator = getGenerator();
  const topicDir = path.join(contentDir, topicName);
  const files = discoverMdxFiles(topicDir);

  if (files.length === 0) {
    return { key: topicName, questionsCount: 0 };
  }

  log.info(
    `Aggregating topic "${topicName}": ${files.length} files, ${env.MCQ_QUESTIONS_PER_FILE} questions/file`,
  );

  const contents = files.map((filePath) => {
    const fileData = parseMdxFile(filePath, contentDir);
    return { text: fileData.content, sourceFile: fileData.filename };
  });

  const questions = await generator.generateTopicMcqs(contents, env.MCQ_QUESTIONS_PER_FILE);

  if (questions.length > 0) {
    await upsertTopicwiseMcq(topicName, questions);
  }

  // Store hashes for future refresh
  await updateHashes(
    topicName,
    contents.map((c) => ({ sourceFile: c.sourceFile, content: c.text })),
  );

  return { key: topicName, questionsCount: questions.length };
};

/**
 * Incremental refresh: only regenerate for new/changed files, merge with existing.
 */
export const refreshTopic = async (
  topicName: string,
): Promise<{
  key: string;
  questionsCount: number;
  newFiles: number;
  changedFiles: number;
  removedFiles: number;
}> => {
  const contentDir = getContentDir();
  const generator = getGenerator();
  const topicDir = path.join(contentDir, topicName);
  const files = discoverMdxFiles(topicDir);

  if (files.length === 0) {
    return { key: topicName, questionsCount: 0, newFiles: 0, changedFiles: 0, removedFiles: 0 };
  }

  const allContents = files.map((filePath) => {
    const fileData = parseMdxFile(filePath, contentDir);
    return { sourceFile: fileData.filename, content: fileData.content };
  });

  const diff = await diffTopicFiles(topicName, allContents);

  log.info(
    `Refresh "${topicName}": ${diff.newFiles.length} new, ${diff.changedFiles.length} changed, ${diff.unchangedFiles.length} unchanged, ${diff.removedFiles.length} removed`,
  );

  const filesToProcess = new Set([...diff.newFiles, ...diff.changedFiles]);

  if (filesToProcess.size === 0 && diff.removedFiles.length === 0) {
    const existing = await loadTopicQuestions(topicName);
    return {
      key: topicName,
      questionsCount: existing.length,
      newFiles: 0,
      changedFiles: 0,
      removedFiles: 0,
    };
  }

  let newQuestions: import('../mcq-generator/mcq-generator.js').Question[] = [];
  if (filesToProcess.size > 0) {
    const contentsToProcess = allContents
      .filter((c) => filesToProcess.has(c.sourceFile))
      .map((c) => ({ text: c.content, sourceFile: c.sourceFile }));

    newQuestions = await generator.generateTopicMcqs(contentsToProcess, env.MCQ_QUESTIONS_PER_FILE);
  }

  const existing = await loadTopicQuestions(topicName);
  const merged = mergeQuestions(existing, newQuestions, diff.changedFiles, diff.removedFiles);

  if (merged.length > 0) {
    await upsertTopicwiseMcq(topicName, merged);
  }

  const processedContents = allContents.filter((c) => filesToProcess.has(c.sourceFile));
  if (processedContents.length > 0) {
    await updateHashes(topicName, processedContents);
  }
  if (diff.removedFiles.length > 0) {
    await removeStaleHashes(diff.removedFiles);
  }

  return {
    key: topicName,
    questionsCount: merged.length,
    newFiles: diff.newFiles.length,
    changedFiles: diff.changedFiles.length,
    removedFiles: diff.removedFiles.length,
  };
};

export const generateAll = async (): Promise<{
  results: Array<{ key: string; questionsCount: number }>;
}> => {
  const topics = listAvailableTopics();
  const results: Array<{ key: string; questionsCount: number }> = [];

  for (const topic of topics) {
    try {
      const result = await generateForTopic(topic);
      results.push(result);
      log.info(`Topic "${topic}": ${result.questionsCount} questions generated`);
    } catch (error) {
      log.error(`Failed to generate for topic: ${topic}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({ key: topic, questionsCount: 0 });
    }
  }

  return { results };
};

export const refreshAll = async (): Promise<{
  results: Array<{
    key: string;
    questionsCount: number;
    newFiles: number;
    changedFiles: number;
    removedFiles: number;
  }>;
}> => {
  const topics = listAvailableTopics();
  const results: Array<{
    key: string;
    questionsCount: number;
    newFiles: number;
    changedFiles: number;
    removedFiles: number;
  }> = [];

  for (const topic of topics) {
    try {
      const result = await refreshTopic(topic);
      results.push(result);
      log.info(
        `Refresh "${topic}": ${result.questionsCount} total (${result.newFiles} new, ${result.changedFiles} changed, ${result.removedFiles} removed)`,
      );
    } catch (error) {
      log.error(`Failed to refresh topic: ${topic}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({
        key: topic,
        questionsCount: 0,
        newFiles: 0,
        changedFiles: 0,
        removedFiles: 0,
      });
    }
  }

  return { results };
};
