#!/usr/bin/env node
/**
 * MCQ Generator CLI
 *
 * Usage:
 *   npm run generate-mcqs -- --all                          Generate MCQs for all files → MCQs collection
 *   npm run generate-mcqs -- --topic react                  Generate per-file MCQs for a topic → MCQs
 *   npm run generate-mcqs -- --file efcore/basic/create-database  Generate MCQs for a single file → MCQs
 *   npm run generate-mcqs -- --topic-aggregate react        Aggregate topic MCQs → TopicwiseMcqs (full regen)
 *   npm run generate-mcqs -- --topic-aggregate-all          Aggregate all topics → TopicwiseMcqs (full regen)
 *   npm run generate-mcqs -- --refresh react                Incremental refresh for a topic → TopicwiseMcqs
 *   npm run generate-mcqs -- --refresh-all                  Incremental refresh for all topics → TopicwiseMcqs
 */
import path from 'path';
import { config } from 'dotenv';

config();

import { env } from '../config/env.js';
import { log } from '../utils/logger.js';
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';
import { discoverMdxFiles, parseMdxFile, listTopicDirectories } from './mdx-reader.js';
import { McqGenerator } from './mcq-generator.js';
import {
  upsertMcq,
  upsertTopicwiseMcq,
  loadTopicQuestions,
  mergeQuestions,
} from './mcq-uploader.js';
import { diffTopicFiles, updateHashes, removeStaleHashes } from './content-hash.js';

function resolveContentDir(): string {
  return path.resolve(process.cwd(), env.MCQ_CONTENT_DIR);
}

function parseArgs(): {
  mode:
    | 'all'
    | 'topic'
    | 'file'
    | 'topic-aggregate'
    | 'topic-aggregate-all'
    | 'refresh'
    | 'refresh-all'
    | 'list';
  target?: string;
} {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    return { mode: 'list' };
  }
  if (args.includes('--all')) {
    return { mode: 'all' };
  }
  if (args.includes('--refresh-all')) {
    return { mode: 'refresh-all' };
  }
  if (args.includes('--topic-aggregate-all')) {
    return { mode: 'topic-aggregate-all' };
  }

  const refreshIdx = args.indexOf('--refresh');
  if (refreshIdx !== -1) {
    const target = args[refreshIdx + 1];
    if (!target) {
      console.error('Error: --refresh requires a topic name');
      process.exit(1);
    }
    return { mode: 'refresh', target };
  }

  const topicAggIdx = args.indexOf('--topic-aggregate');
  if (topicAggIdx !== -1) {
    const target = args[topicAggIdx + 1];
    if (!target) {
      console.error('Error: --topic-aggregate requires a topic name');
      process.exit(1);
    }
    return { mode: 'topic-aggregate', target };
  }

  const topicIdx = args.indexOf('--topic');
  if (topicIdx !== -1) {
    const target = args[topicIdx + 1];
    if (!target) {
      console.error('Error: --topic requires a topic name');
      process.exit(1);
    }
    return { mode: 'topic', target };
  }

  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1) {
    const target = args[fileIdx + 1];
    if (!target) {
      console.error('Error: --file requires a file path (relative to content dir)');
      process.exit(1);
    }
    return { mode: 'file', target };
  }

  console.error(`
Usage:
  --list                         List available topics
  --all                          Generate per-file MCQs for all files → MCQs
  --topic <name>                 Generate per-file MCQs for a topic → MCQs
  --file <relative-path>         Generate MCQs for a single file → MCQs
  --topic-aggregate <name>       Full regen: all files in a topic → TopicwiseMcqs
  --topic-aggregate-all          Full regen: all topics → TopicwiseMcqs
  --refresh <name>               Incremental: only new/changed files → TopicwiseMcqs
  --refresh-all                  Incremental: refresh all topics → TopicwiseMcqs
`);
  process.exit(1);
}

async function handleFile(
  generator: McqGenerator,
  filePath: string,
  contentDir: string,
): Promise<{ key: string; count: number }> {
  const fullPath = filePath.endsWith('.mdx') ? filePath : `${filePath}.mdx`;
  const absolutePath = path.isAbsolute(fullPath) ? fullPath : path.join(contentDir, fullPath);

  const fileData = parseMdxFile(absolutePath, contentDir);

  if (!fileData.content || fileData.content.length < 50) {
    log.warn(`Skipping ${fileData.filename} — content too short`);
    return { key: fileData.filename, count: 0 };
  }

  const questions = await generator.generateMcqs(
    fileData.content,
    env.MCQ_QUESTIONS_PER_FILE,
    fileData.filename,
  );

  if (questions.length > 0) {
    await upsertMcq(fileData.filename, questions);
  }

  return { key: fileData.filename, count: questions.length };
}

async function handleTopic(
  generator: McqGenerator,
  topicName: string,
  contentDir: string,
): Promise<Array<{ key: string; count: number }>> {
  const topicDir = path.join(contentDir, topicName);
  const files = discoverMdxFiles(topicDir);

  if (files.length === 0) {
    log.warn(`No MDX files found for topic: ${topicName}`);
    return [];
  }

  log.info(`Processing topic "${topicName}": ${files.length} files`);
  const results: Array<{ key: string; count: number }> = [];

  for (const filePath of files) {
    try {
      const result = await handleFile(generator, filePath, contentDir);
      results.push(result);
    } catch (error) {
      log.error(`Failed to process file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({ key: path.basename(filePath, '.mdx'), count: 0 });
    }
  }

  return results;
}

async function handleTopicAggregate(
  generator: McqGenerator,
  topicName: string,
  contentDir: string,
): Promise<{ key: string; count: number }> {
  const topicDir = path.join(contentDir, topicName);
  const files = discoverMdxFiles(topicDir);

  if (files.length === 0) {
    log.warn(`No MDX files found for topic: ${topicName}`);
    return { key: topicName, count: 0 };
  }

  log.info(
    `Aggregating topic "${topicName}": ${files.length} files → ${env.MCQ_QUESTIONS_PER_FILE} questions/file → TopicwiseMcqs`,
  );

  const contents = files.map((filePath) => {
    const fileData = parseMdxFile(filePath, contentDir);
    return { text: fileData.content, sourceFile: fileData.filename };
  });

  const questions = await generator.generateTopicMcqs(contents, env.MCQ_QUESTIONS_PER_FILE);

  if (questions.length > 0) {
    await upsertTopicwiseMcq(topicName, questions);
  }

  // Store content hashes for future refresh runs
  await updateHashes(
    topicName,
    contents.map((c) => ({ sourceFile: c.sourceFile, content: c.text })),
  );

  return { key: topicName, count: questions.length };
}

/**
 * Incremental refresh: only regenerate MCQs for new/changed files,
 * merge with existing questions, and remove stale ones from deleted files.
 */
async function handleRefresh(
  generator: McqGenerator,
  topicName: string,
  contentDir: string,
): Promise<{
  key: string;
  count: number;
  newFiles: number;
  changedFiles: number;
  removedFiles: number;
}> {
  const topicDir = path.join(contentDir, topicName);
  const files = discoverMdxFiles(topicDir);

  if (files.length === 0) {
    log.warn(`No MDX files found for topic: ${topicName}`);
    return { key: topicName, count: 0, newFiles: 0, changedFiles: 0, removedFiles: 0 };
  }

  const allContents = files.map((filePath) => {
    const fileData = parseMdxFile(filePath, contentDir);
    return { sourceFile: fileData.filename, content: fileData.content };
  });

  // Diff against stored hashes
  const diff = await diffTopicFiles(topicName, allContents);

  log.info(
    `Refresh "${topicName}": ${diff.newFiles.length} new, ${diff.changedFiles.length} changed, ${diff.unchangedFiles.length} unchanged, ${diff.removedFiles.length} removed`,
  );

  const filesToProcess = new Set([...diff.newFiles, ...diff.changedFiles]);

  if (filesToProcess.size === 0 && diff.removedFiles.length === 0) {
    log.info(`Topic "${topicName}" is up to date — nothing to do`);
    const existing = await loadTopicQuestions(topicName);
    return {
      key: topicName,
      count: existing.length,
      newFiles: 0,
      changedFiles: 0,
      removedFiles: 0,
    };
  }

  // Generate MCQs only for new + changed files
  let newQuestions: import('./mcq-generator.js').Question[] = [];
  if (filesToProcess.size > 0) {
    const contentsToProcess = allContents
      .filter((c) => filesToProcess.has(c.sourceFile))
      .map((c) => ({ text: c.content, sourceFile: c.sourceFile }));

    newQuestions = await generator.generateTopicMcqs(contentsToProcess, env.MCQ_QUESTIONS_PER_FILE);
  }

  // Merge: keep unchanged, replace changed, add new, remove deleted
  const existing = await loadTopicQuestions(topicName);
  const merged = mergeQuestions(existing, newQuestions, diff.changedFiles, diff.removedFiles);

  if (merged.length > 0) {
    await upsertTopicwiseMcq(topicName, merged);
  }

  // Update hashes for processed files, remove stale ones
  const processedContents = allContents.filter((c) => filesToProcess.has(c.sourceFile));
  if (processedContents.length > 0) {
    await updateHashes(topicName, processedContents);
  }
  if (diff.removedFiles.length > 0) {
    await removeStaleHashes(diff.removedFiles);
  }

  return {
    key: topicName,
    count: merged.length,
    newFiles: diff.newFiles.length,
    changedFiles: diff.changedFiles.length,
    removedFiles: diff.removedFiles.length,
  };
}

async function main(): Promise<void> {
  const { mode, target } = parseArgs();
  const contentDir = resolveContentDir();

  if (mode === 'list') {
    const topics = listTopicDirectories(contentDir);
    console.log('Available topics:');
    topics.forEach((t) => console.log(`  - ${t}`));
    return;
  }

  if (!env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_ENDPOINT) {
    console.error(
      'Error: AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT must be set in environment variables',
    );
    process.exit(1);
  }

  await connectToDatabase();

  const generator = new McqGenerator(
    env.AZURE_OPENAI_API_KEY,
    env.AZURE_OPENAI_ENDPOINT,
    env.AZURE_OPENAI_API_VERSION,
    env.AZURE_OPENAI_DEPLOYMENT,
  );

  try {
    switch (mode) {
      case 'file': {
        const result = await handleFile(generator, target!, contentDir);
        log.info(`Done: ${result.key} → ${result.count} questions`);
        break;
      }
      case 'topic': {
        const results = await handleTopic(generator, target!, contentDir);
        const total = results.reduce((sum, r) => sum + r.count, 0);
        log.info(`Done: topic "${target}" → ${total} questions across ${results.length} files`);
        break;
      }
      case 'all': {
        const topics = listTopicDirectories(contentDir);
        let grandTotal = 0;
        for (const topic of topics) {
          const results = await handleTopic(generator, topic, contentDir);
          const total = results.reduce((sum, r) => sum + r.count, 0);
          grandTotal += total;
          log.info(`Topic "${topic}": ${total} questions across ${results.length} files`);
        }
        log.info(`All done: ${grandTotal} total questions generated`);
        break;
      }
      case 'topic-aggregate': {
        const result = await handleTopicAggregate(generator, target!, contentDir);
        log.info(`Done: topic "${target}" → ${result.count} TopicwiseMcq questions`);
        break;
      }
      case 'topic-aggregate-all': {
        const topics = listTopicDirectories(contentDir);
        for (const topic of topics) {
          const result = await handleTopicAggregate(generator, topic, contentDir);
          log.info(`Topic "${topic}": ${result.count} TopicwiseMcq questions`);
        }
        log.info('All topic aggregations complete');
        break;
      }
      case 'refresh': {
        const result = await handleRefresh(generator, target!, contentDir);
        log.info(
          `Refresh "${target}": ${result.count} total questions (${result.newFiles} new files, ${result.changedFiles} changed, ${result.removedFiles} removed)`,
        );
        break;
      }
      case 'refresh-all': {
        const topics = listTopicDirectories(contentDir);
        for (const topic of topics) {
          const result = await handleRefresh(generator, topic, contentDir);
          log.info(
            `Refresh "${topic}": ${result.count} total questions (${result.newFiles} new, ${result.changedFiles} changed, ${result.removedFiles} removed)`,
          );
        }
        log.info('All topic refreshes complete');
        break;
      }
    }
  } finally {
    await disconnectFromDatabase();
  }
}

main().catch((error) => {
  log.error('MCQ Generator failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
