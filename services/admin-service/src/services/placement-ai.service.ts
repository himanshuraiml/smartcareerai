import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export class PlacementAIIntelligenceService {
    /**
     * Calculate readiness score for a student
     * Formula:
     * Readiness Score = 
     * 0.30 * (Latest ATS Score) + 
     * 0.25 * (Latest Coding Test Success Rate) + 
     * 0.20 * (Average Interview Score) + 
     * 0.25 * (Profile Core Criteria)
     */
    async calculateReadinessScore(studentProfileId: string) {
        try {
            const profile = await prisma.studentProfile.findUnique({
                where: { id: studentProfileId },
                include: { user: true }
            });

            if (!profile) throw new Error('Student profile not found');

            const userId = profile.userId;

            // 1. Latest ATS Score (0.30)
            const latestAts = await (prisma as any).atsScore.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { overallScore: true }
            });
            const atsScore = latestAts?.overallScore || 0;

            // 2. Coding Test Performance (0.25)
            // Simplified: average score of all attempts
            const testAttempts = await (prisma as any).testAttempt.findMany({
                where: { userId },
                select: { score: true }
            });
            const codingScore = testAttempts.length > 0
                ? testAttempts.reduce((acc: number, t: any) => acc + (t.score || 0), 0) / testAttempts.length
                : 0;

            // 3. Analytical & Behavioral Assessment (0.20)
            const assessmentAttempts = await (prisma as any).assessmentAttempt.findMany({
                where: { studentId: userId, status: 'COMPLETED' },
                select: { overallScore: true }
            });
            const assessmentScore = assessmentAttempts.length > 0
                ? assessmentAttempts.reduce((acc: number, a: any) => acc + (a.overallScore || 0), 0) / assessmentAttempts.length
                : 0;

            // 4. Interview Performance (0.15)
            const interviewSessions = await (prisma as any).interviewSession.findMany({
                where: { userId, status: 'COMPLETED' },
                select: { overallScore: true }
            });
            const interviewScore = interviewSessions.length > 0
                ? interviewSessions.reduce((acc: number, i: any) => acc + (i.overallScore || 0), 0) / interviewSessions.length
                : 0;

            // 5. Profile/Acad Criteria (0.20)
            // Normalized: CGPA (out of 10) -> score out of 100
            const cgpaRating = (profile.cgpa / 10) * 100;
            const backlogPenalty = profile.backlogs * 10;
            const profileScore = Math.max(0, cgpaRating - backlogPenalty);

            // FINAL CALCULATION
            // Weights: ATS: 25%, Coding: 20%, Analytical/Behavioral: 20%, Interview: 15%, Academics: 20%
            const finalScore = (atsScore * 0.25) + (codingScore * 0.20) + (assessmentScore * 0.20) + (interviewScore * 0.15) + (profileScore * 0.20);
            const roundedScore = Math.round(finalScore * 10) / 10;

            // Determine At-Risk Level
            let atRiskLevel = 'LOW';
            if (roundedScore < 40) atRiskLevel = 'HIGH';
            else if (roundedScore < 65) atRiskLevel = 'MEDIUM';

            // Update Profile
            await prisma.studentProfile.update({
                where: { id: studentProfileId },
                data: {
                    readinessScore: roundedScore,
                    atRiskLevel,
                    lastScoreCalculation: new Date()
                }
            });

            // If High Risk, generate an alert
            if (atRiskLevel === 'HIGH') {
                await this.generateAlert(studentProfileId, profile.institutionId, 'AT_RISK', 'CRITICAL',
                    `Student ${profile.user.name || profile.userId} has a critically low readiness score of ${roundedScore}%`);
            }

            return {
                readinessScore: roundedScore,
                atRiskLevel,
                breakdown: { atsScore, codingScore, interviewScore, profileScore }
            };
        } catch (error) {
            logger.error('Error calculating readiness score', error);
            throw error;
        }
    }

    async calculateReadinessByUserId(userId: string) {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId }
        });
        if (!profile) throw new Error('Student profile not found');
        return this.calculateReadinessScore(profile.id);
    }

    private async generateAlert(profileId: string, instId: string, type: string, severity: string, message: string) {
        // Check if an unresolved alert of same type already exists
        const existing = await (prisma as any).placementAlert.findFirst({
            where: { studentProfileId: profileId, type, resolved: false }
        });

        if (!existing) {
            await (prisma as any).placementAlert.create({
                data: {
                    studentProfileId: profileId,
                    institutionId: instId,
                    type,
                    severity,
                    message
                }
            });
        }
    }

    async getRiskAssessments(institutionId: string) {
        return (prisma as any).studentProfile.findMany({
            where: { institutionId, atRiskLevel: { in: ['MEDIUM', 'HIGH'] } },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                alerts: { where: { resolved: false } }
            },
            orderBy: { readinessScore: 'asc' }
        });
    }

    async resolveAlert(alertId: string) {
        return (prisma as any).placementAlert.update({
            where: { id: alertId },
            data: { resolved: true }
        });
    }
}

export const placementAIService = new PlacementAIIntelligenceService();
