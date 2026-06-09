import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { getWeekRange } from '../utils/date';

const EMAIL_FROM = process.env.EMAIL_FROM || 'PlaceNxt <noreply@placenxt.com>';

function getSMTPTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465 || process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        });
    }
    return null;
}

const smtpTransporter = getSMTPTransporter();

export class EmailDigestService {
    /**
     * Compile weekly summary data and send email
     */
    async sendWeeklyDigest(userId: string, email: string): Promise<boolean> {
        if (!smtpTransporter) {
            logger.warn(`SMTP not configured. Skipping weekly digest for user ${userId}`);
            return false;
        }

        try {
            // Get last week range
            const { weekStart } = getWeekRange();
            const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastWeekEnd = new Date(weekStart.getTime() - 1000);

            // Fetch user and details
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    skillMasteries: {
                        include: { skill: true }
                    }
                }
            });

            if (!user) return false;

            // Fetch last week's league history
            const lastWeekHistory = await prisma.userLeagueHistory.findFirst({
                where: {
                    userId,
                    weekStart: lastWeekStart
                }
            });

            // Fetch challenge completions last week
            const challengesCompleted = await prisma.dailyChallengeCompletion.count({
                where: {
                    userId,
                    completedAt: {
                        gte: lastWeekStart,
                        lte: lastWeekEnd
                    }
                }
            });

            const xpEarned = lastWeekHistory?.weeklyXp || 0;
            const leagueTier = lastWeekHistory?.tier || 'Bronze';
            const leagueRank = lastWeekHistory?.finalRank || 'N/A';
            const outcome = lastWeekHistory?.outcome || 'STAYED';

            const name = user.name || 'Student';
            const streak = user.streakCount;

            const skillsHtml = user.skillMasteries.length > 0 
                ? user.skillMasteries.map(m => `<li><strong>${m.skill.name}</strong>: ${m.level} (${m.currentLevelXp}/${m.requiredLevelXp} XP)</li>`).join('')
                : '<li>No active skills this week. Start a sprint!</li>';

            const subject = `📊 Your Week on SmartCareerAI — ${streak}🔥 Streak, ${xpEarned} XP, ${leagueTier} League`;

            const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
              <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);padding:32px;">
                <h1 style="color:#818cf8;font-size:24px;margin-top:0;">SmartCareerAI Weekly Report</h1>
                <p>Hi ${name},</p>
                <p>Here is your weekly progress report summarizing your placement preparation activities!</p>
                
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
                  <h3 style="margin-top:0;color:#6366f1;">⚡ THIS WEEK IN NUMBERS</h3>
                  <ul style="padding-left:20px;margin:0;">
                    <li>🔥 <strong>Streak</strong>: ${streak} days</li>
                    <li>⚡ <strong>XP Earned</strong>: ${xpEarned} XP</li>
                    <li>🎯 <strong>Challenges Completed</strong>: ${challengesCompleted}</li>
                  </ul>
                </div>

                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
                  <h3 style="margin-top:0;color:#10b981;">🏆 LEAGUE PERFORMANCE</h3>
                  <p style="margin:0;">
                    You finished last week in the <strong>${leagueTier} League</strong> at rank <strong>#${leagueRank}</strong>.<br/>
                    Outcome: <span style="text-transform:uppercase;font-weight:bold;color:${outcome === 'PROMOTED' ? '#10b981' : outcome === 'DEMOTED' ? '#f43f5e' : '#f59e0b'};">${outcome}</span>
                  </p>
                </div>

                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:24px 0;">
                  <h3 style="margin-top:0;color:#a855f7;">⭐ SKILL PROGRESSION</h3>
                  <ul style="padding-left:20px;margin:0;">
                    ${skillsHtml}
                  </ul>
                </div>

                <div style="text-align:center;margin:32px 0;">
                  <a href="http://localhost:3100/dashboard/daily" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                    Start Your Week Strong
                  </a>
                </div>

                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
                <p style="color:#6b7280;font-size:12px;margin:0;text-align:center;">
                  You are receiving this because you opted in to weekly digests. <a href="http://localhost:3100/dashboard/settings" style="color:#818cf8;">Manage settings</a>
                </p>
              </div>
            </body>
            </html>`;

            await smtpTransporter.sendMail({
                from: EMAIL_FROM,
                to: email,
                subject,
                text: `SmartCareerAI Weekly Digest: Earned ${xpEarned} XP. Streak: ${streak} days. League: ${leagueTier}.`,
                html
            });

            logger.info(`Weekly digest email successfully sent to ${email}`);
            return true;
        } catch (error: any) {
            logger.error(`Failed to send weekly digest email to ${email}: ${error.message}`);
            return false;
        }
    }

    /**
     * Send re-engagement email to inactive users (3-7 days inactive)
     */
    async sendReEngagementEmail(userId: string, email: string, inactiveDays: number): Promise<boolean> {
        if (!smtpTransporter) return false;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) return false;

            const name = user.name || 'Student';
            const streak = user.streakCount;
            const subject = `We miss you, ${name}! Your ${streak}🔥 streak is waiting`;

            const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="margin:0;padding:0;background:#0f0f23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
              <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);padding:32px;text-align:center;">
                <span style="font-size:48px;">🔥</span>
                <h1 style="color:#818cf8;font-size:24px;margin:16px 0 8px;">Keep Your prep habit alive!</h1>
                <p>Hi ${name},</p>
                <p style="font-size:16px;line-height:1.6;color:#9ca3af;">
                  It has been <strong>${inactiveDays} days</strong> since your last career practice.
                  Don't lose your <strong>${streak}🔥 day streak</strong>! Keep practicing and grinding questions to stay placement-ready.
                </p>

                <div style="margin:32px 0;">
                  <a href="http://localhost:3100/dashboard/daily" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                    Keep Streak Alive
                  </a>
                </div>

                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
                <p style="color:#6b7280;font-size:12px;margin:0;">
                  You can unsubscribe or change notification preferences in your dashboard settings.
                </p>
              </div>
            </body>
            </html>`;

            await smtpTransporter.sendMail({
                from: EMAIL_FROM,
                to: email,
                subject,
                text: `We miss you, ${name}! Your ${streak}-day prep streak is at risk. Log back in to practice!`,
                html
            });

            logger.info(`Re-engagement email sent to ${email} (${inactiveDays} days inactive)`);
            return true;
        } catch (error: any) {
            logger.error(`Failed to send re-engagement email to ${email}: ${error.message}`);
            return false;
        }
    }
}

export const emailDigestService = new EmailDigestService();
