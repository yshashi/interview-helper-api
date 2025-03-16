import { FeedbackType } from '@prisma/client';

export interface CreateFeedbackDto {
  topic: string;
  type: FeedbackType;
  comment?: string;
}
