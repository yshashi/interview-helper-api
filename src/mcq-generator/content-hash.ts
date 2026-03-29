import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';

export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export interface FileDiff {
  newFiles: string[];
  changedFiles: string[];
  unchangedFiles: string[];
  removedFiles: string[];
}

/**
 * Compare current MDX files against stored content hashes.
 * Returns which files are new, changed, unchanged, or removed.
 */
export async function diffTopicFiles(
  topic: string,
  currentFiles: Array<{ sourceFile: string; content: string }>,
): Promise<FileDiff> {
  const stored = await prisma.mcqContentHash.findMany({ where: { topic } });
  const storedMap = new Map(stored.map((h) => [h.sourceFile, h.contentHash]));
  const currentFileSet = new Set(currentFiles.map((f) => f.sourceFile));

  const newFiles: string[] = [];
  const changedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  for (const { sourceFile, content } of currentFiles) {
    const hash = computeHash(content);
    const storedHash = storedMap.get(sourceFile);

    if (!storedHash) {
      newFiles.push(sourceFile);
    } else if (storedHash !== hash) {
      changedFiles.push(sourceFile);
    } else {
      unchangedFiles.push(sourceFile);
    }
  }

  const removedFiles = stored
    .filter((h) => !currentFileSet.has(h.sourceFile))
    .map((h) => h.sourceFile);

  return { newFiles, changedFiles, unchangedFiles, removedFiles };
}

/**
 * Update stored hashes after successful generation.
 */
export async function updateHashes(
  topic: string,
  files: Array<{ sourceFile: string; content: string }>,
): Promise<void> {
  for (const { sourceFile, content } of files) {
    const contentHash = computeHash(content);
    await prisma.mcqContentHash.upsert({
      where: { sourceFile },
      update: { contentHash, topic },
      create: { topic, sourceFile, contentHash },
    });
  }
}

/**
 * Remove hashes for files that no longer exist.
 */
export async function removeStaleHashes(removedFiles: string[]): Promise<void> {
  if (removedFiles.length === 0) return;

  for (const sourceFile of removedFiles) {
    await prisma.mcqContentHash.delete({ where: { sourceFile } }).catch(() => {
      log.warn(`Hash not found when trying to remove: ${sourceFile}`);
    });
  }
  log.info(`Removed ${removedFiles.length} stale content hashes`);
}
