import type { Request, Response } from 'express';
import {
  sendAnnouncementToAllUsers,
  sendAnnouncementToSpecificUsers,
  type AnnouncementInput,
} from '../services/announcement.service.js';
import { log } from '../utils/logger.js';

export const sendAnnouncementToAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Subject and message are required',
      });
      return;
    }

    const announcementData: AnnouncementInput = {
      subject,
      message,
    };

    log.info('Sending announcement to all users', {
      subject,
      // @ts-ignore
      adminId: req.user?.sub,
    });

    const result = await sendAnnouncementToAllUsers(announcementData);

    res.status(200).json({
      success: true,
      message: 'Announcement sent successfully',
      data: result,
    });
  } catch (error) {
    log.error('Error sending announcement to all users', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const sendAnnouncementToUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, message, userIds } = req.body;

    if (!subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Subject and message are required',
      });
      return;
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array',
      });
      return;
    }

    const announcementData: AnnouncementInput = {
      subject,
      message,
    };

    log.info('Sending announcement to specific users', {
      subject,
      userCount: userIds.length,
      // @ts-ignore
      adminId: req.user?.sub,
    });

    const result = await sendAnnouncementToSpecificUsers(announcementData, userIds);

    res.status(200).json({
      success: true,
      message: 'Announcement sent successfully',
      data: result,
    });
  } catch (error) {
    log.error('Error sending announcement to specific users', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
