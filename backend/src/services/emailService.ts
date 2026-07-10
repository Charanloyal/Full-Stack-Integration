import nodemailer, { Transporter } from 'nodemailer';
import { User, Task } from '../types/index.js';

let transporter: Transporter | any = null;

const createTransporter = async (): Promise<Transporter | any> => {
  if (transporter) return transporter;

  try {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock_user') {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('Real SMTP Mail Transporter configured.');
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Mock SMTP Transporter (Ethereal) configured for user: ${testAccount.user}`);
    }
  } catch (error: any) {
    console.warn('Failed to configure SMTP Transporter, falling back to Console Log Transporter.', error.message);
    transporter = {
      sendMail: async (mailOptions: any) => {
        console.log('\n--- SIMULATED EMAIL SENT ---');
        console.log(`From: ${mailOptions.from}`);
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body (Text): ${mailOptions.text}`);
        console.log('-----------------------------\n');
        return { messageId: 'simulated-id-12345', previewUrl: 'https://ethereal.email' };
      },
    };
  }

  return transporter;
};

export const sendWelcomeEmail = async (user: Pick<User, 'email' | 'name' | 'role'>) => {
  const mailTransporter = await createTransporter();
  const mailOptions = {
    from: '"Month 2 Workspace" <no-reply@month2workspace.local>',
    to: user.email,
    subject: 'Welcome to your Collaborative Workspace!',
    text: `Hello ${user.name},\n\nWelcome to your Collaborative Workspace! Your account has been registered successfully as a ${user.role}.\n\nYou can log in and start tracking your tasks and chatting with your teammates in real-time.\n\nBest regards,\nThe Workspace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #6366f1;">Welcome to Month 2 Collaborative Workspace, ${user.name}!</h2>
        <p>Your account has been registered successfully as a <strong>${user.role}</strong>.</p>
        <p>You can now manage tasks and participate in real-time chats with your team.</p>
        <div style="margin: 24px 0;">
          <a href="#" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open Workspace</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">This is a simulated email sent for the Month 2 full-stack integration workspace project.</p>
      </div>
    `,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}. Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && info && info.messageId !== 'simulated-id-12345') {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log(`Email preview URL: ${url}`);
    }
  } catch (error) {
    console.error(`Error sending welcome email to ${user.email}:`, error);
  }
};

export const sendTaskNotification = async (user: Pick<User, 'email' | 'name'>, task: Pick<Task, 'title' | 'status' | 'description'>, action: string) => {
  const mailTransporter = await createTransporter();
  const mailOptions = {
    from: '"Month 2 Workspace" <no-reply@month2workspace.local>',
    to: user.email,
    subject: `Task Notification: Task "${task.title}" has been ${action}`,
    text: `Hello ${user.name},\n\nThe task "${task.title}" has been ${action} successfully.\n\nTask Details:\n- Status: ${task.status}\n- Description: ${task.description || 'No description'}\n\nBest regards,\nThe Workspace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h3 style="color: #6366f1;">Task Update Notification</h3>
        <p>Hello ${user.name},</p>
        <p>The task <strong>"${task.title}"</strong> has been <strong>${action}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${task.status}</span></p>
          <p style="margin: 0;"><strong>Description:</strong> ${task.description || 'N/A'}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">This is a simulated email sent for the Month 2 full-stack integration workspace project.</p>
      </div>
    `,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Task notification email sent to ${user.email}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending task notification email:`, error);
  }
};
