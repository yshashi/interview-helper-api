import { z } from 'zod';

// Allowed tech stacks based on question-bank topics
const ALLOWED_TECH_STACKS = [
  'React Fundamentals',
  'Angular Deep Dive',
  'JavaScript Essentials',
  '.NET Development',
  'Node.js Development',
  'RESTful API Design',
  'SQL & Database Design',
  'NoSQL Databases',
  'EF Core Mastery',
  'System Design Fundamentals',
  'Microservices Architecture',
  'CI/CD Pipeline'
] as const;

const ALLOWED_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const CreateContributionSchema = z.object({
  techStack: z.enum(ALLOWED_TECH_STACKS, {
    errorMap: () => ({ message: 'Invalid tech stack. Please select from the available options.' })
  }),
  question: z.string()
    .min(10, 'Question must be at least 10 characters long')
    .max(2000, 'Question must not exceed 2000 characters'),
  company: z.string()
    .max(100, 'Company name must not exceed 100 characters')
    .optional()
    .nullable(),
  difficulty: z.enum(ALLOWED_DIFFICULTIES, {
    errorMap: () => ({ message: 'Difficulty must be Beginner, Intermediate, or Advanced' })
  }).optional().nullable(),
  category: z.string()
    .max(100, 'Category must not exceed 100 characters')
    .optional()
    .nullable()
});

export const UpdateContributionSchema = CreateContributionSchema;

export const ReviewContributionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be either APPROVED or REJECTED' })
  }),
  reviewNotes: z.string()
    .max(500, 'Review notes must not exceed 500 characters')
    .optional()
    .nullable()
});

export type CreateContributionDto = z.infer<typeof CreateContributionSchema>;
export type UpdateContributionDto = z.infer<typeof UpdateContributionSchema>;
export type ReviewContributionDto = z.infer<typeof ReviewContributionSchema>;
