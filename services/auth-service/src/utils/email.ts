import nodemailer from 'nodemailer';
import { logger } from './logger';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'PlaceNxt <noreply@placenxt.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3100';

function createTransporter() {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        logger.warn('SMTP not configured — emails will not be sent');
        return null;
    }
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
}

const transporter = createTransporter();

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    if (!transporter) {
        logger.warn(`SMTP not configured. Reset URL for ${to}: ${resetUrl}`);
        return;
    }

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

    try {
        await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject: 'Reset Your PlaceNxt Password',
            html,
        });
        logger.info(`Password reset email sent to ${to}`);
    } catch (error: any) {
        logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
        throw error;
    }
}
