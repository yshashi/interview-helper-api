import { prisma } from '../config/database.js';
import { log } from '../utils/logger.js';
import type { QuestionContribution, Prisma } from '@prisma/client';
import type { CreateContributionDto, UpdateContributionDto, ReviewContributionDto } from '../dtos/contribution.dto.js';
import { emailService } from './email.service.js';

export const createContribution = async (
  data: CreateContributionDto,
  userId: string
): Promise<QuestionContribution> => {
  try {
    const createInput: Prisma.QuestionContributionCreateInput = {
      techStack: data.techStack,
      question: data.question,
      company: data.company || null,
      difficulty: data.difficulty || null,
      category: data.category || null,
      status: 'PENDING',
      user: {
        connect: { id: userId }
      }
    };

    const contribution = await prisma.questionContribution.create({
      data: createInput,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    log.info('Contribution created successfully', {
      contributionId: contribution.id,
      userId,
      techStack: data.techStack
    });

    // Send confirmation email asynchronously (don't wait for it)
    if (contribution.user.email) {
      emailService.sendSubmissionConfirmation(
        contribution.user.email,
        contribution.user.name || contribution.user.username || 'User',
        contribution.question,
        contribution.techStack
      ).catch(err => {
        log.error('Failed to send submission confirmation email', {
          error: err instanceof Error ? err.message : String(err),
          contributionId: contribution.id
        });
      });
    }

    return contribution;
  } catch (error) {
    log.error('Error creating contribution', {
      error: error instanceof Error ? error.message : String(error),
      data,
      userId
    });
    throw error;
  }
};

export const getUserContributions = async (
  userId: string,
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<QuestionContribution[]> => {
  try {
    const where: Prisma.QuestionContributionWhereInput = {
      userId
    };

    if (status) {
      where.status = status;
    }

    const contributions = await prisma.questionContribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    log.info('Retrieved user contributions', {
      userId,
      count: contributions.length,
      status
    });

    return contributions;
  } catch (error) {
    log.error('Error retrieving user contributions', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    throw error;
  }
};

export const getContributionById = async (
  id: string,
  userId?: string
): Promise<QuestionContribution | null> => {
  try {
    const contribution = await prisma.questionContribution.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!contribution) {
      return null;
    }

    // If userId is provided, verify ownership
    if (userId && contribution.userId !== userId) {
      log.warn('Unauthorized access attempt to contribution', {
        contributionId: id,
        requestUserId: userId,
        ownerUserId: contribution.userId
      });
      return null;
    }

    return contribution;
  } catch (error) {
    log.error('Error retrieving contribution by ID', {
      error: error instanceof Error ? error.message : String(error),
      id
    });
    throw error;
  }
};

export const updateContribution = async (
  id: string,
  userId: string,
  data: UpdateContributionDto
): Promise<QuestionContribution | null> => {
  try {
    // First check if contribution exists and belongs to user
    const existing = await prisma.questionContribution.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!existing) {
      log.warn('Contribution not found for update', { id });
      return null;
    }

    if (existing.userId !== userId) {
      log.warn('Unauthorized update attempt', {
        contributionId: id,
        requestUserId: userId,
        ownerUserId: existing.userId
      });
      return null;
    }

    // Only allow updates if status is PENDING
    if (existing.status !== 'PENDING') {
      log.warn('Cannot update non-pending contribution', {
        contributionId: id,
        status: existing.status
      });
      throw new Error('Only pending contributions can be edited');
    }

    const updateInput: Prisma.QuestionContributionUpdateInput = {
      techStack: data.techStack,
      question: data.question,
      company: data.company || null,
      difficulty: data.difficulty || null,
      category: data.category || null
    };

    const contribution = await prisma.questionContribution.update({
      where: { id },
      data: updateInput,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    log.info('Contribution updated successfully', {
      contributionId: id,
      userId
    });

    return contribution;
  } catch (error) {
    log.error('Error updating contribution', {
      error: error instanceof Error ? error.message : String(error),
      id,
      userId
    });
    throw error;
  }
};

export const deleteContribution = async (
  id: string,
  userId: string
): Promise<boolean> => {
  try {
    // First check if contribution exists and belongs to user
    const existing = await prisma.questionContribution.findUnique({
      where: { id }
    });

    if (!existing) {
      log.warn('Contribution not found for deletion', { id });
      return false;
    }

    if (existing.userId !== userId) {
      log.warn('Unauthorized delete attempt', {
        contributionId: id,
        requestUserId: userId,
        ownerUserId: existing.userId
      });
      return false;
    }

    // Only allow deletion if status is PENDING
    if (existing.status !== 'PENDING') {
      log.warn('Cannot delete non-pending contribution', {
        contributionId: id,
        status: existing.status
      });
      throw new Error('Only pending contributions can be deleted');
    }

    await prisma.questionContribution.delete({
      where: { id }
    });

    log.info('Contribution deleted successfully', {
      contributionId: id,
      userId
    });

    return true;
  } catch (error) {
    log.error('Error deleting contribution', {
      error: error instanceof Error ? error.message : String(error),
      id,
      userId
    });
    throw error;
  }
};

// Admin functions (for future use)
export const getAllContributions = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  techStack?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ contributions: QuestionContribution[]; total: number }> => {
  try {
    const where: Prisma.QuestionContributionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (techStack) {
      where.techStack = techStack;
    }

    const [contributions, total] = await Promise.all([
      prisma.questionContribution.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          }
        }
      }),
      prisma.questionContribution.count({ where })
    ]);

    log.info('Retrieved all contributions', {
      count: contributions.length,
      total,
      status,
      techStack,
      page
    });

    return { contributions, total };
  } catch (error) {
    log.error('Error retrieving all contributions', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

export const reviewContribution = async (
  id: string,
  reviewerId: string,
  data: ReviewContributionDto
): Promise<QuestionContribution | null> => {
  try {
    const existing = await prisma.questionContribution.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!existing) {
      log.warn('Contribution not found for review', { id });
      return null;
    }

    const updateInput: Prisma.QuestionContributionUpdateInput = {
      status: data.status,
      reviewedBy: reviewerId,
      reviewNotes: data.reviewNotes || null
    };

    const contribution = await prisma.questionContribution.update({
      where: { id },
      data: updateInput,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    });

    log.info('Contribution reviewed successfully', {
      contributionId: id,
      reviewerId,
      status: data.status
    });

    // Send notification email asynchronously
    if (contribution.user.email) {
      const userName = contribution.user.name || contribution.user.username || 'User';
      
      if (data.status === 'APPROVED') {
        emailService.sendApprovalNotification(
          contribution.user.email,
          userName,
          contribution.question,
          contribution.techStack
        ).catch(err => {
          log.error('Failed to send approval notification email', {
            error: err instanceof Error ? err.message : String(err),
            contributionId: contribution.id
          });
        });
      } else if (data.status === 'REJECTED') {
        emailService.sendRejectionNotification(
          contribution.user.email,
          userName,
          contribution.question,
          contribution.techStack,
          data.reviewNotes || undefined
        ).catch(err => {
          log.error('Failed to send rejection notification email', {
            error: err instanceof Error ? err.message : String(err),
            contributionId: contribution.id
          });
        });
      }
    }

    return contribution;
  } catch (error) {
    log.error('Error reviewing contribution', {
      error: error instanceof Error ? error.message : String(error),
      id,
      reviewerId
    });
    throw error;
  }
};
