import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { logger } from './logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'PlaceNxt <noreply@placenxt.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3100';

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not configured — Resend emails will not be sent');
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

const resend = getResendClient();

function getSMTPTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    logger.info(`SMTP configuration found. Creating SMTP transporter for ${host}:${port}`);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
}

const smtpTransporter = getSMTPTransporter();

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
    <div style="padding:32px 32px 0;text-align:center;">
      <h1 style="color:#818cf8;font-size:24px;margin:0 0 8px;">PlaceNxt</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px;">Reset Your Password</h2>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset the password for your PlaceNxt account. Click the button below to create a new password. This link expires in 1 hour.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color:#818cf8;font-size:13px;word-break:break-all;margin:0 0 24px;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Reset Your PlaceNxt Password: ${resetUrl}`;

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject: 'Reset Your PlaceNxt Password',
        text,
        html,
      });
      logger.info(`Password reset email sent to ${to} via SMTP`);
      return;
    } catch (error: any) {
      logger.error(`Failed to send password reset email to ${to} via SMTP: ${error.message}`);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: 'Reset Your PlaceNxt Password',
        html,
      });
      logger.info(`Password reset email sent to ${to} via Resend`);
      return;
    } catch (error: any) {
      logger.error(`Failed to send password reset email to ${to} via Resend: ${error.message}`);
      throw error;
    }
  }

  logger.warn(`Email not configured. Reset URL for ${to}: ${resetUrl}`);
}

export async function sendVerificationEmail(to: string, verifyToken: string): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verifyToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
    <div style="padding:32px 32px 0;text-align:center;">
      <h1 style="color:#818cf8;font-size:24px;margin:0 0 8px;">PlaceNxt</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px;">Verify Your Email</h2>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Welcome to PlaceNxt! Please verify your email address to activate your account and receive your free credits.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
          Verify Email
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color:#818cf8;font-size:13px;word-break:break-all;margin:0 0 24px;">${verifyUrl}</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Verify Your PlaceNxt Email: ${verifyUrl}`;

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject: 'Verify Your Email Address - PlaceNxt',
        text,
        html,
      });
      logger.info(`Verification email sent to ${to} via SMTP`);
      return;
    } catch (error: any) {
      logger.error(`Failed to send verification email to ${to} via SMTP: ${error.message}`);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: 'Verify Your Email Address - PlaceNxt',
        html,
      });
      logger.info(`Verification email sent to ${to} via Resend`);
      return;
    } catch (error: any) {
      logger.error(`Failed to send verification email to ${to} via Resend: ${error.message}`);
      throw error;
    }
  }

  logger.warn(`Email not configured. Verify URL for ${to}: ${verifyUrl}`);
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  company?: string;
  inquiryType: string;
  message: string;
}): Promise<void> {
  const subject = `Contact Inquiry: ${data.inquiryType.toUpperCase()}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
    <div style="padding:32px 32px 0;text-align:center;">
      <h1 style="color:#818cf8;font-size:24px;margin:0 0 8px;">PlaceNxt</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px;">New Contact Inquiry</h2>
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin-bottom:20px;color:#e5e7eb;">
        <p style="margin:4px 0;"><strong>Name:</strong> ${data.name}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:4px 0;"><strong>Company/Institution:</strong> ${data.company || 'N/A'}</p>
        <p style="margin:4px 0;"><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
      </div>
      <h3 style="color:#ffffff;font-size:16px;margin:0 0 8px;">Message:</h3>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;white-space:pre-wrap;">${data.message}</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        This email was sent automatically from the PlaceNxt Contact Form.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
New Contact Form Submission
----------------------------
Name: ${data.name}
Email: ${data.email}
Company: ${data.company || 'N/A'}
Inquiry Type: ${data.inquiryType}

Message:
${data.message}
  `;

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: 'admin@placenxt.com',
        subject,
        text,
        html,
      });
      logger.info('Contact form email sent via SMTP');
      return;
    } catch (error: any) {
      logger.error(`Failed to send contact form email via SMTP: ${error.message}`);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: 'admin@placenxt.com',
        subject,
        html,
      });
      logger.info('Contact form email sent via Resend');
      return;
    } catch (error: any) {
      logger.error(`Failed to send contact form email via Resend: ${error.message}`);
      throw error;
    }
  }

  logger.warn(`No email configuration found (SMTP or Resend). Contact message details:
    Name: ${data.name}
    Email: ${data.email}
    Company: ${data.company}
    Inquiry Type: ${data.inquiryType}
    Message: ${data.message}
  `);
}

