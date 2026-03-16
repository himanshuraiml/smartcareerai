import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

const BOOKING_URL_BASE = process.env.FRONTEND_URL || 'http://localhost:3100';

export class SchedulingService {
    /**
     * Generate a booking token for a COPILOT interview session.
     * Stores the token + 7-day expiry on InterviewSession.
     */
    async generateBookingToken(sessionId: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: { bookingToken: token, bookingExpiry: expiry },
        });

        logger.info(`Generated booking token for session ${sessionId}`);
        return token;
    }

    /**
     * Get booking page data from a token (public — no auth).
     * Returns: job info, company info, available time slots.
     */
    async getAvailability(token: string) {
        const session = await prisma.interviewSession.findUnique({
            where: { bookingToken: token },
            include: {
                job: {
                    include: {
                        recruiter: {
                            include: {
                                organization: {
                                    include: { calendarIntegrations: { where: { isActive: true } } },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!session) throw createError('Invalid or expired booking link', 404, 'INVALID_TOKEN');
        if (!session.bookingExpiry || session.bookingExpiry < new Date()) {
            throw createError('This booking link has expired', 410, 'TOKEN_EXPIRED');
        }
        if (session.scheduledAt) {
            // Already booked — return confirmation state
            return {
                status: 'already_booked',
                scheduledAt: session.scheduledAt,
                jobTitle: session.job?.title || 'Interview',
                companyName: session.job?.recruiter?.companyName || 'Company',
                meetLink: session.meetLink,
            };
        }

        const companyName = session.job?.recruiter?.companyName || 'Company';
        const jobTitle = session.job?.title || 'Interview';

        // Generate available slots: next 10 business days, 09:00-17:00 every 30 min
        const slots = this.generateAvailableSlots(14);

        return {
            status: 'pending',
            jobTitle,
            companyName,
            sessionId: session.id,
            slots,
        };
    }

    /**
     * Book a slot for the candidate.
     */
    async bookSlot(token: string, candidateName: string, candidateEmail: string, selectedSlot: string) {
        const session = await prisma.interviewSession.findUnique({
            where: { bookingToken: token },
            include: {
                job: {
                    include: {
                        recruiter: {
                            include: {
                                user: { select: { id: true, email: true } },
                                organization: {
                                    include: { calendarIntegrations: { where: { isActive: true } } },
                                },
                            },
                        },
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!session) throw createError('Invalid or expired booking link', 404, 'INVALID_TOKEN');
        if (!session.bookingExpiry || session.bookingExpiry < new Date()) {
            throw createError('This booking link has expired', 410, 'TOKEN_EXPIRED');
        }
        if (session.scheduledAt) {
            throw createError('This slot has already been booked', 409, 'ALREADY_BOOKED');
        }

        const startTime = new Date(selectedSlot);
        if (isNaN(startTime.getTime())) throw createError('Invalid slot time', 400, 'INVALID_SLOT');
        if (startTime < new Date()) throw createError('Cannot book a slot in the past', 400, 'PAST_SLOT');

        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default

        // Update session with scheduled time and invalidate token
        await prisma.interviewSession.update({
            where: { id: session.id },
            data: {
                scheduledAt: startTime,
                scheduledEndAt: endTime,
                bookingExpiry: new Date(0), // invalidate token
            },
        });

        // Send confirmation message to candidate
        if (session.userId) {
            const recruiterUserId = session.job?.recruiter?.userId;
            if (recruiterUserId) {
                const dateStr = startTime.toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                });
                const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                try {
                    await prisma.message.create({
                        data: {
                            senderId: recruiterUserId,
                            receiverId: session.userId,
                            content: `Your interview for "${session.job?.title}" has been confirmed for ${dateStr} at ${timeStr}. ${session.meetLink ? `Meeting link: ${session.meetLink}` : 'We will send you the meeting link shortly.'}`,
                        },
                    });
                } catch (msgErr) {
                    logger.warn('Failed to send booking confirmation message (non-fatal):', msgErr);
                }
            }
        }

        logger.info(`Candidate ${candidateEmail} booked slot ${selectedSlot} for session ${session.id}`);

        return {
            scheduledAt: startTime.toISOString(),
            scheduledEndAt: endTime.toISOString(),
            jobTitle: session.job?.title || 'Interview',
            companyName: session.job?.recruiter?.companyName || 'Company',
            meetLink: session.meetLink,
        };
    }

    /**
     * Generate business-hour time slots for the next N days.
     * Returns ISO strings grouped by date.
     */
    private generateAvailableSlots(days: number): Array<{ date: string; slots: string[] }> {
        const result: Array<{ date: string; slots: string[] }> = [];
        const now = new Date();

        for (let d = 1; d <= days; d++) {
            const date = new Date(now);
            date.setDate(now.getDate() + d);

            // Skip weekends
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            const dateStr = date.toISOString().split('T')[0];
            const slots: string[] = [];

            // 09:00 to 17:00 in 30-min increments
            for (let hour = 9; hour < 17; hour++) {
                for (const min of [0, 30]) {
                    const slot = new Date(date);
                    slot.setHours(hour, min, 0, 0);
                    slots.push(slot.toISOString());
                }
            }

            if (slots.length > 0) {
                result.push({ date: dateStr, slots });
            }
        }

        return result;
    }
}

export const schedulingService = new SchedulingService();
