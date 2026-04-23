import { config } from '../config/env.js';
import nodemailer from 'nodemailer';
import { resetPasswordEmailTemplate, verificationEmailTemplate } from './emailTemplates.js';

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const baseUrl = () => config.backendUrl || `http://localhost:${config.port}`;

const getTransporter = () => {
  const user = config.smtpUser;
  const pass = config.smtpPass;

  if (!user || !pass) {
    throw new Error('SMTP credentials missing (SMTP_USER/SMTP_PASS or SMTP_EMAIL/SMTP_PASSWORD)');
  }

  if (config.smtpService) {
    return nodemailer.createTransport({
      service: config.smtpService,
      auth: { user, pass },
    });
  }

  throw new Error('SMTP is not configured (set SMTP_SERVICE)');
};

let cachedTransporter: nodemailer.Transporter | null = null;
const transporter = () => {
  if (!cachedTransporter) cachedTransporter = getTransporter();
  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, text, html }: SendEmailParams) => {
  const from = config.smtpUser;
  await transporter().sendMail({
    to,
    from,
    subject,
    text,
    html,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyUrl = `${baseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your email';
  const { html, text } = verificationEmailTemplate(verifyUrl);
  await sendEmail({ to: email, subject, text, html });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your password';
  const { html, text } = resetPasswordEmailTemplate(resetUrl);
  await sendEmail({ to: email, subject, text, html });
};
