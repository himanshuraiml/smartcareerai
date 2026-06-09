import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { MasteryLevel } from '@prisma/client';

const XP_FOR_LEVEL_UP: Record<MasteryLevel, number> = {
    BEGINNER: 100,
    INTERMEDIATE: 200,
    ADVANCED: 300,
    EXPERT: 500,
    MASTER: 1000,
};

const COOLDOWN_HOURS = 24;

export class MasteryService {
    /**
     * Get or initialize mastery stats for a user's skill
     */
    async getOrCreateMastery(userId: string, skillId: string) {
        let mastery = await prisma.skillMastery.findUnique({
            where: { userId_skillId: { userId, skillId } },
            include: { skill: true }
        });

        if (!mastery) {
            mastery = await prisma.skillMastery.create({
                data: {
                    userId,
                    skillId,
                    level: 'BEGINNER',
                    currentLevelXp: 0,
                    requiredLevelXp: XP_FOR_LEVEL_UP.BEGINNER,
                    quizzesCompleted: 0,
                    canLevelUp: false,
                },
                include: { skill: true }
            });
        }

        return mastery;
    }

    /**
     * Get all skill masteries for a user
     */
    async getUserMasteries(userId: string) {
        // Find all skills associated with the user via userSkill relation
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            select: { skillId: true }
        });

        const skillIds = userSkills.map(us => us.skillId);

        // Ensure mastery records exist for all user skills
        const masteries: any[] = [];
        for (const skillId of skillIds) {
            const m = await this.getOrCreateMastery(userId, skillId);
            masteries.push(m);
        }

        return masteries;
    }

    /**
     * Record a quiz score, awarding mastery XP and updating eligibility
     */
    async recordQuizAttempt(userId: string, skillId: string, score: number) {
        const mastery = await this.getOrCreateMastery(userId, skillId);

        // Award mastery XP proportional to accuracy score (e.g. 80% score = +80 mastery XP)
        const xpEarned = Math.max(10, Math.round(score));
        const newXp = Math.min(mastery.requiredLevelXp, mastery.currentLevelXp + xpEarned);

        const newQuizzesCompleted = mastery.quizzesCompleted + 1;
        const currentAvg = mastery.quizAvgScore || 0;
        const newAvg = ((currentAvg * mastery.quizzesCompleted) + score) / newQuizzesCompleted;

        // Check if user is now eligible to level up
        let eligible = false;
        const meetsXp = newXp >= mastery.requiredLevelXp;

        if (meetsXp) {
            if (mastery.level === 'BEGINNER') {
                // Beginner -> Intermediate requires >= 60% average score
                eligible = newAvg >= 60;
            } else if (mastery.level === 'INTERMEDIATE') {
                // Intermediate -> Advanced requires >= 3 quizzes + >= 70% average score
                eligible = newQuizzesCompleted >= 3 && newAvg >= 70;
            } else if (mastery.level === 'ADVANCED') {
                // Advanced -> Expert requires >= 7 quizzes + >= 75% average score
                eligible = newQuizzesCompleted >= 7 && newAvg >= 75;
            } else if (mastery.level === 'EXPERT') {
                // Expert -> Master requires >= 10 quizzes + >= 80% average score
                eligible = newQuizzesCompleted >= 10 && newAvg >= 80;
            }
        }

        const updatedMastery = await prisma.skillMastery.update({
            where: { id: mastery.id },
            data: {
                currentLevelXp: newXp,
                quizzesCompleted: newQuizzesCompleted,
                quizAvgScore: Number(newAvg.toFixed(1)),
                lastQuizAt: new Date(),
                canLevelUp: eligible,
            },
            include: { skill: true }
        });

        logger.info(`Recorded quiz for user ${userId} on skill ${skillId}: ` +
            `xp=${newXp}/${mastery.requiredLevelXp}, average=${newAvg.toFixed(1)}%, eligible=${eligible}`);

        return updatedMastery;
    }

    /**
     * Level up a skill if eligible and cooldown has passed
     */
    async levelUpSkill(userId: string, skillId: string) {
        const mastery = await prisma.skillMastery.findUnique({
            where: { userId_skillId: { userId, skillId } },
            include: { skill: true }
        });

        if (!mastery) {
            throw new AppError('Mastery record not found', 404);
        }

        if (!mastery.canLevelUp) {
            throw new AppError('You do not meet the requirements to level up this skill yet', 400);
        }

        // Check cooldown
        const now = new Date();
        if (mastery.levelUpCooldown && now < new Date(mastery.levelUpCooldown)) {
            const timeDiff = new Date(mastery.levelUpCooldown).getTime() - now.getTime();
            const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));
            throw new AppError(`Level-up cooldown active. Please wait ${hoursLeft} more hour(s).`, 400);
        }

        // Determine next level
        let nextLevel: MasteryLevel;
        let requiredXpForNextLevel = 100;

        switch (mastery.level) {
            case 'BEGINNER':
                nextLevel = 'INTERMEDIATE';
                requiredXpForNextLevel = XP_FOR_LEVEL_UP.INTERMEDIATE;
                break;
            case 'INTERMEDIATE':
                nextLevel = 'ADVANCED';
                requiredXpForNextLevel = XP_FOR_LEVEL_UP.ADVANCED;
                break;
            case 'ADVANCED':
                nextLevel = 'EXPERT';
                requiredXpForNextLevel = XP_FOR_LEVEL_UP.EXPERT;
                break;
            case 'EXPERT':
                nextLevel = 'MASTER';
                requiredXpForNextLevel = XP_FOR_LEVEL_UP.MASTER;
                break;
            case 'MASTER':
            default:
                throw new AppError('Already at maximum mastery level', 400);
        }

        const cooldownExpires = new Date();
        cooldownExpires.setHours(cooldownExpires.getHours() + COOLDOWN_HOURS);

        // Update Skill Mastery in database
        const updated = await prisma.skillMastery.update({
            where: { id: mastery.id },
            data: {
                level: nextLevel,
                currentLevelXp: 0,
                requiredLevelXp: requiredXpForNextLevel,
                quizzesCompleted: 0,
                quizAvgScore: null,
                canLevelUp: false,
                levelUpCooldown: cooldownExpires,
                levelReachedAt: now,
            },
            include: { skill: true }
        });

        // Award +250 global XP to the user for level-up milestone!
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: 250 },
            },
        });

        // Sync with UserSkill table badge type as well
        let userSkillBadgeType = 'BEGINNER';
        if (nextLevel === 'INTERMEDIATE') userSkillBadgeType = 'INTERMEDIATE';
        else if (nextLevel === 'ADVANCED') userSkillBadgeType = 'ADVANCED';
        else if (nextLevel === 'EXPERT') userSkillBadgeType = 'EXPERT';
        else if (nextLevel === 'MASTER') userSkillBadgeType = 'MASTER';

        // Upsert/Update the user badge status in UserSkill/UserBadge if they exist
        await prisma.userSkill.updateMany({
            where: { userId, skillId },
            data: {
                proficiencyLevel: userSkillBadgeType.toLowerCase(),
                isVerified: nextLevel !== 'INTERMEDIATE'
            }
        });

        logger.info(`Promoted user ${userId} on skill "${mastery.skill.name}" to level ${nextLevel}. Cooldown set to ${cooldownExpires.toISOString()}`);

        return updated;
    }
}

export const masteryService = new MasteryService();
