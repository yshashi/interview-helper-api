import type { Request, Response } from 'express';
import {
  createContribution,
  getUserContributions,
  getContributionById,
  updateContribution,
  deleteContribution,
  getAllContributions,
  reviewContribution
} from '../services/contribution.service.js';
import {
  CreateContributionSchema,
  UpdateContributionSchema,
  ReviewContributionSchema
} from '../dtos/contribution.dto.js';
import { log } from '../utils/logger.js';
import type { TokenPayload } from '../services/auth.service.js';

export const createContributionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // Validate request body
    const validationResult = CreateContributionSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const contribution = await createContribution(validationResult.data, userId);

    res.status(201).json({
      message: 'Contribution submitted successfully',
      data: contribution
    });
  } catch (error) {
    log.error('Error in createContributionController:', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    });
    res.status(500).json({
      message: 'Failed to submit contribution. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserContributionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
    
    // Validate status if provided
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        message: 'Invalid status. Must be PENDING, APPROVED, or REJECTED'
      });
      return;
    }

    const contributions = await getUserContributions(userId, status);

    res.status(200).json({
      message: `Retrieved ${contributions.length} contributions`,
      data: contributions
    });
  } catch (error) {
    log.error('Error in getUserContributionsController:', {
      error: error instanceof Error ? error.message : String(error),
      userId: (req.user as TokenPayload)?.userId
    });
    res.status(500).json({
      message: 'Failed to retrieve contributions. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getContributionByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        message: 'Contribution ID is required'
      });
      return;
    }

    const contribution = await getContributionById(id, userId);

    if (!contribution) {
      res.status(404).json({
        message: 'Contribution not found or you do not have access to it'
      });
      return;
    }

    res.status(200).json({
      message: 'Contribution retrieved successfully',
      data: contribution
    });
  } catch (error) {
    log.error('Error in getContributionByIdController:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id
    });
    res.status(500).json({
      message: 'Failed to retrieve contribution. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateContributionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        message: 'Contribution ID is required'
      });
      return;
    }

    // Validate request body
    const validationResult = UpdateContributionSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const contribution = await updateContribution(id, userId, validationResult.data);

    if (!contribution) {
      res.status(404).json({
        message: 'Contribution not found or you do not have permission to update it'
      });
      return;
    }

    res.status(200).json({
      message: 'Contribution updated successfully',
      data: contribution
    });
  } catch (error) {
    log.error('Error in updateContributionController:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
      userId: (req.user as TokenPayload)?.userId
    });
    
    // Check if it's the "only pending" error
    if (error instanceof Error && error.message.includes('Only pending')) {
      res.status(403).json({
        message: error.message,
        code: 'FORBIDDEN'
      });
      return;
    }

    res.status(500).json({
      message: 'Failed to update contribution. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteContributionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as TokenPayload)?.userId;
    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        message: 'Contribution ID is required'
      });
      return;
    }

    const deleted = await deleteContribution(id, userId);

    if (!deleted) {
      res.status(404).json({
        message: 'Contribution not found or you do not have permission to delete it'
      });
      return;
    }

    res.status(200).json({
      message: 'Contribution deleted successfully'
    });
  } catch (error) {
    log.error('Error in deleteContributionController:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
      userId: (req.user as TokenPayload)?.userId
    });

    // Check if it's the "only pending" error
    if (error instanceof Error && error.message.includes('Only pending')) {
      res.status(403).json({
        message: error.message,
        code: 'FORBIDDEN'
      });
      return;
    }

    res.status(500).json({
      message: 'Failed to delete contribution. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Admin controllers (for future use)
export const getAllContributionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
    const techStack = req.query.techStack as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate status if provided
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        message: 'Invalid status. Must be PENDING, APPROVED, or REJECTED'
      });
      return;
    }

    const { contributions, total } = await getAllContributions(status, techStack, page, limit);

    res.status(200).json({
      message: `Retrieved ${contributions.length} of ${total} contributions`,
      data: {
        contributions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    log.error('Error in getAllContributionsController:', {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      message: 'Failed to retrieve contributions. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const reviewContributionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewerId = (req.user as TokenPayload)?.userId;
    if (!reviewerId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        message: 'Contribution ID is required'
      });
      return;
    }

    // Validate request body
    const validationResult = ReviewContributionSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const contribution = await reviewContribution(id, reviewerId, validationResult.data);

    if (!contribution) {
      res.status(404).json({
        message: 'Contribution not found'
      });
      return;
    }

    res.status(200).json({
      message: `Contribution ${validationResult.data.status.toLowerCase()} successfully`,
      data: contribution
    });
  } catch (error) {
    log.error('Error in reviewContributionController:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id
    });
    res.status(500).json({
      message: 'Failed to review contribution. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
