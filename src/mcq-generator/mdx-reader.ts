import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface MdxFileData {
  path: string;
  filename: string;
  topic: string;
  subtopic: string;
  metadata: Record<string, string>;
  content: string;
}

/**
 * Recursively discover all .mdx files in a directory.
 */
export function discoverMdxFiles(directory: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(directory)) {
    return results;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...discoverMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Parse a single MDX file, extracting frontmatter and content.
 */
export function parseMdxFile(filePath: string, contentDir: string): MdxFileData {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const relativePath = path.relative(contentDir, filePath);
  const parts = relativePath.split(path.sep);

  // topic = first directory, subtopic = second directory (or 'general')
  const topic = parts.length > 1 ? parts[0] : 'general';
  const subtopic = parts.length > 2 ? parts[1] : 'general';

  // Key format: topic_subtopic_filename (e.g. react_intermediate_prop-drilling)
  const basename = path.basename(filePath, '.mdx');
  const keyParts = [topic, ...(subtopic !== 'general' ? [subtopic] : []), basename];
  const key = keyParts.join('_');

  return {
    path: filePath,
    filename: key,
    topic,
    subtopic,
    metadata: data as Record<string, string>,
    content: content.trim(),
  };
}

/**
 * Group MDX files by their parent topic directory.
 * Returns a map of topic name → array of parsed file data.
 */
export function discoverTopics(contentDir: string): Map<string, MdxFileData[]> {
  const files = discoverMdxFiles(contentDir);
  const topicMap = new Map<string, MdxFileData[]>();

  for (const filePath of files) {
    const fileData = parseMdxFile(filePath, contentDir);

    const existing = topicMap.get(fileData.topic) ?? [];
    existing.push(fileData);
    topicMap.set(fileData.topic, existing);
  }

  return topicMap;
}

/**
 * List available topic directory names.
 */
export function listTopicDirectories(contentDir: string): string[] {
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
