import { Resend } from 'resend';
import { logger } from './logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'PlaceNxt <noreply@placenxt.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3100';

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not configured — emails will not be sent');
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

const resend = getResendClient();

export async function sendRecruiterInvite(
  to: string,
  orgName: string,
  inviteToken: string,
  tempPassword: string
): Promise<void> {
  const inviteLink = `${FRONTEND_URL}/accept-invite?token=${inviteToken}`;

  if (!resend) {
    logger.warn(`Email not configured. Invite URL for ${to}: ${inviteLink}`);
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
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px;">You're Invited!</h2>
      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
        You have been invited to join <strong>${orgName}</strong> as a team member on the PlaceNxt recruiting platform.
      </p>
      
      <div style="background: rgba(129, 140, 248, 0.1); border: 1px solid rgba(129, 140, 248, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #818cf8; font-weight: 600;">Your Temporary Credentials:</p>
        <p style="margin: 4px 0; color: #e5e5e5;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 4px 0; color: #e5e5e5;"><strong>Temporary Password:</strong> <code style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
      </div>

      <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Click the button below to accept your invitation and set up your account:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
          Accept Invitation
        </a>
      </div>
      
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color:#818cf8;font-size:13px;word-break:break-all;margin:0 0 24px;">${inviteLink}</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;margin:0;">
        This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Invitation to join ${orgName} on PlaceNxt`,
      html,
    });
    logger.info(`Recruiter invitation email sent to ${to}`);
  } catch (error: any) {
    logger.error(`Failed to send recruiter invitation email to ${to}: ${error.message}`);
    // We don't throw here to avoid failing the whole invite process if email fails
  }
}
