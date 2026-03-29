import { AzureOpenAI } from 'openai';
import { z } from 'zod';
import { log } from '../utils/logger.js';

// Matches the Prisma Question type
const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
});

const McqResponseSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type Question = z.infer<typeof QuestionSchema> & {
  question_id: number;
  source_file: string;
};

const SYSTEM_PROMPT = `You are an expert technical interview question generator. Generate high-quality multiple-choice questions (MCQs) that are commonly asked in technical interviews.

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- Exactly one option must be correct
- Questions should test real understanding, not trivial recall
- Include a mix of conceptual, practical, and scenario-based questions
- Distractors (wrong options) should be plausible but clearly incorrect to someone with good knowledge
- Avoid "All of the above" or "None of the above" options
- Keep questions concise but precise`;

function buildUserPrompt(text: string, numQuestions: number): string {
  return `Generate ${numQuestions} multiple-choice interview questions based on the following technical content.

Return ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "The question text",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correct_answer": "A"
    }
  ]
}

Content:
${text}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class McqGenerator {
  private client: AzureOpenAI;
  private model: string;

  constructor(apiKey: string, endpoint: string, apiVersion: string, deployment: string) {
    this.client = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion,
      deployment,
    });
    this.model = deployment;
  }

  /**
   * Generate MCQs from text content with retry + exponential backoff.
   */
  async generateMcqs(text: string, numQuestions: number, sourceFile: string): Promise<Question[]> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(text, numQuestions) },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        const parsed = JSON.parse(content);
        const validated = McqResponseSchema.parse(parsed);

        return validated.questions.map((q, i) => ({
          ...q,
          question_id: i + 1,
          source_file: sourceFile,
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.warn(`MCQ generation attempt ${attempt}/${maxRetries} failed for ${sourceFile}`, {
          error: errorMsg,
        });

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          log.info(`Retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          log.error(`All ${maxRetries} attempts failed for ${sourceFile}`, { error: errorMsg });
          return [];
        }
      }
    }

    return [];
  }

  /**
   * Generate MCQs for ALL content files in a topic.
   * Each file gets exactly `questionsPerFile` questions. Total = questionsPerFile × fileCount.
   * Deduplicates by question text and re-numbers sequentially.
   */
  async generateTopicMcqs(
    contents: Array<{ text: string; sourceFile: string }>,
    questionsPerFile: number,
  ): Promise<Question[]> {
    const allQuestions: Question[] = [];
    const seenQuestions = new Set<string>();

    const validContents = contents.filter(({ text }) => text && text.trim().length >= 50);

    if (validContents.length === 0) {
      log.warn('No valid content files to process');
      return [];
    }

    log.info(
      `Generating ${questionsPerFile} questions per file across ${validContents.length} files (expected total: ~${questionsPerFile * validContents.length})`,
    );

    for (let i = 0; i < validContents.length; i++) {
      const { text, sourceFile } = validContents[i];

      log.info(`Generating MCQs for ${sourceFile} (${i + 1}/${validContents.length})`);

      const questions = await this.generateMcqs(text, questionsPerFile, sourceFile);

      for (const q of questions) {
        const normalized = q.question.toLowerCase().trim();
        if (!seenQuestions.has(normalized)) {
          seenQuestions.add(normalized);
          allQuestions.push({ ...q, question_id: allQuestions.length + 1 });
        }
      }

      // Rate limit between files: 1 second
      if (i < validContents.length - 1) {
        await sleep(1000);
      }
    }

    return allQuestions;
  }
}
