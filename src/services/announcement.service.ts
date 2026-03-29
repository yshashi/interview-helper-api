import { prisma, UserStatus } from '../config/database.js';
import { emailService } from './email.service.js';
import { log } from '../utils/logger.js';

export interface AnnouncementInput {
  subject: string;
  message: string;
}

export interface AnnouncementResult {
  totalUsers: number;
  emailsSent: number;
  emailsFailed: number;
  failedEmails: string[];
}

export const sendAnnouncementToAllUsers = async (
  announcementData: AnnouncementInput
): Promise<AnnouncementResult> => {
  try {
    const { subject, message } = announcementData;

    const users = await prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        email: {
          not: '',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    log.info(`Sending announcement to ${users.length} active users`, { subject });

    let emailsSent = 0;
    let emailsFailed = 0;
    const failedEmails: string[] = [];

    for (const user of users) {
      if (!user.email) continue;

      const userName = user.name || user.username || 'User';
      
      try {
        const success = await emailService.sendAnnouncement(
          user.email,
          userName,
          subject,
          message
        );

        if (success) {
          emailsSent++;
        } else {
          emailsFailed++;
          failedEmails.push(user.email);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        emailsFailed++;
        failedEmails.push(user.email);
        log.error(`Failed to send announcement to ${user.email}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log.info('Announcement sending completed', {
      totalUsers: users.length,
      emailsSent,
      emailsFailed,
    });

    return {
      totalUsers: users.length,
      emailsSent,
      emailsFailed,
      failedEmails,
    };
  } catch (error) {
    log.error('Error sending announcement', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const sendAnnouncementToSpecificUsers = async (
  announcementData: AnnouncementInput,
  userIds: string[]
): Promise<AnnouncementResult> => {
  try {
    const { subject, message } = announcementData;

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        status: UserStatus.ACTIVE,
        email: {
          not: '',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    log.info(`Sending announcement to ${users.length} specific users`, { subject });

    let emailsSent = 0;
    let emailsFailed = 0;
    const failedEmails: string[] = [];

    for (const user of users) {
      if (!user.email) continue;

      const userName = user.name || user.username || 'User';
      
      try {
        const success = await emailService.sendAnnouncement(
          user.email,
          userName,
          subject,
          message
        );

        if (success) {
          emailsSent++;
        } else {
          emailsFailed++;
          failedEmails.push(user.email);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        emailsFailed++;
        failedEmails.push(user.email);
        log.error(`Failed to send announcement to ${user.email}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log.info('Announcement sending completed', {
      totalUsers: users.length,
      emailsSent,
      emailsFailed,
    });

    return {
      totalUsers: users.length,
      emailsSent,
      emailsFailed,
      failedEmails,
    };
  } catch (error) {
    log.error('Error sending announcement to specific users', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
