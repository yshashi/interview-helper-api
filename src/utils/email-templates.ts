export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const getSubmissionConfirmationEmail = (
  userName: string,
  question: string,
  techStack: string
): EmailTemplate => {
  return {
    subject: 'Thank you for your contribution! - InterviewHelper',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .question-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Contribution Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for contributing to InterviewHelper! We've received your question and our team will review it soon.</p>
              
              <div class="question-box">
                <strong>Tech Stack:</strong> ${techStack}<br>
                <strong>Your Question:</strong><br>
                <p style="margin-top: 10px;">${question}</p>
              </div>
              
              <p>We typically review contributions within 2-3 business days. You'll receive an email notification once your contribution has been reviewed.</p>
              
              <p>You can view the status of all your contributions anytime by visiting your contribution dashboard.</p>
              
              <a href="https://interviewhelper.in/contribution" class="button">View My Contributions</a>
              
              <div class="footer">
                <p>Keep contributing and help the community grow! 🚀</p>
                <p>InterviewHelper Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${userName},

Thank you for contributing to InterviewHelper! We've received your question and our team will review it soon.

Tech Stack: ${techStack}
Your Question: ${question}

We typically review contributions within 2-3 business days. You'll receive an email notification once your contribution has been reviewed.

You can view the status of all your contributions anytime by visiting: https://interviewhelper.in/contribution

Keep contributing and help the community grow!

InterviewHelper Team
    `
  };
};

export const getApprovedEmail = (
  userName: string,
  question: string,
  techStack: string
): EmailTemplate => {
  return {
    subject: '✅ Your contribution has been approved! - InterviewHelper',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .question-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎊 Great News!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Congratulations! Your question contribution has been approved and is now live on InterviewHelper!</p>
              
              <div class="question-box">
                <strong>Tech Stack:</strong> ${techStack}<br>
                <strong>Approved Question:</strong><br>
                <p style="margin-top: 10px;">${question}</p>
              </div>
              
              <p>Your contribution is now helping thousands of developers prepare for their interviews. Thank you for making our community better! 🙌</p>
              
              <p>Keep contributing more questions and help us build the most comprehensive interview preparation platform.</p>
              
              <a href="https://interviewhelper.in/contribution" class="button">Contribute More Questions</a>
              
              <div class="footer">
                <p>You're making a difference! 💪</p>
                <p>InterviewHelper Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${userName},

Congratulations! Your question contribution has been approved and is now live on InterviewHelper!

Tech Stack: ${techStack}
Approved Question: ${question}

Your contribution is now helping thousands of developers prepare for their interviews. Thank you for making our community better!

Keep contributing more questions and help us build the most comprehensive interview preparation platform.

Visit: https://interviewhelper.in/contribution

You're making a difference!

InterviewHelper Team
    `
  };
};

export const getRejectedEmail = (
  userName: string,
  question: string,
  techStack: string,
  reviewNotes?: string
): EmailTemplate => {
  return {
    subject: 'Update on your contribution - InterviewHelper',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .question-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .notes-box { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Contribution Update</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for your contribution to InterviewHelper. After careful review, we've decided not to include this particular question at this time.</p>
              
              <div class="question-box">
                <strong>Tech Stack:</strong> ${techStack}<br>
                <strong>Your Question:</strong><br>
                <p style="margin-top: 10px;">${question}</p>
              </div>
              
              ${reviewNotes ? `
              <div class="notes-box">
                <strong>Review Notes:</strong><br>
                <p style="margin-top: 10px;">${reviewNotes}</p>
              </div>
              ` : ''}
              
              <p>We appreciate your effort and encourage you to submit more questions! Here are some tips for future contributions:</p>
              <ul>
                <li>Ensure questions are clear and specific</li>
                <li>Avoid duplicate questions already in our database</li>
                <li>Focus on practical, real-world interview scenarios</li>
                <li>Include proper context when needed</li>
              </ul>
              
              <p>Don't let this discourage you - every contribution helps us improve! We'd love to see more submissions from you.</p>
              
              <a href="https://interviewhelper.in/contribution" class="button">Submit Another Question</a>
              
              <div class="footer">
                <p>Keep learning, keep contributing! 📚</p>
                <p>InterviewHelper Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${userName},

Thank you for your contribution to InterviewHelper. After careful review, we've decided not to include this particular question at this time.

Tech Stack: ${techStack}
Your Question: ${question}

${reviewNotes ? `Review Notes: ${reviewNotes}\n` : ''}

We appreciate your effort and encourage you to submit more questions! Here are some tips for future contributions:

- Ensure questions are clear and specific
- Avoid duplicate questions already in our database
- Focus on practical, real-world interview scenarios
- Include proper context when needed

Don't let this discourage you - every contribution helps us improve! We'd love to see more submissions from you.

Visit: https://interviewhelper.in/contribution

Keep learning, keep contributing!

InterviewHelper Team
    `
  };
};
