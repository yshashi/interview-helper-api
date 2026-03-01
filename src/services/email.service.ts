import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { log } from '../utils/logger.js';
import {
  getSubmissionConfirmationEmail,
  getApprovedEmail,
  getRejectedEmail,
  type EmailTemplate
} from '../utils/email-templates.js';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM || 'InterviewHelper <letsprogram30@gmail.com>';

      if (!host || !port || !user || !pass) {
        log.warn('Email service not configured. SMTP credentials missing in environment variables.');
        return;
      }

      this.config = {
        host,
        port: parseInt(port, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        from
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth
      });

      log.info('Email service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize email service', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.transporter || !this.config) {
      log.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html
      });

      log.info('Email sent successfully', { to, subject: template.subject });
      return true;
    } catch (error) {
      log.error('Failed to send email', {
        error: error instanceof Error ? error.message : String(error),
        to,
        subject: template.subject
      });
      return false;
    }
  }

  async sendSubmissionConfirmation(
    to: string,
    userName: string,
    question: string,
    techStack: string
  ): Promise<boolean> {
    const template = getSubmissionConfirmationEmail(userName, question, techStack);
    return this.sendEmail(to, template);
  }

  async sendApprovalNotification(
    to: string,
    userName: string,
    question: string,
    techStack: string
  ): Promise<boolean> {
    const template = getApprovedEmail(userName, question, techStack);
    return this.sendEmail(to, template);
  }

  async sendRejectionNotification(
    to: string,
    userName: string,
    question: string,
    techStack: string,
    reviewNotes?: string
  ): Promise<boolean> {
    const template = getRejectedEmail(userName, question, techStack, reviewNotes);
    return this.sendEmail(to, template);
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      log.info('Email service connection verified');
      return true;
    } catch (error) {
      log.error('Email service connection verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}

export const emailService = new EmailService();
