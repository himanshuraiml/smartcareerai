import { PrismaClient } from '@prisma/client';
import { inferGenderFromName } from '../utils/llm';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

const prisma = new PrismaClient();

let redis: Redis | null = null;
function getRedis(): Redis | null {
    if (!redis) {
        try {
            redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true, enableOfflineQueue: false });
            redis.on('error', () => { /* ignore */ });
        } catch { redis = null; }
    }
    return redis;
}

const PIPELINE_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'PLACED', 'REJECTED'];

export interface DiversityStats {
    genderBreakdown: { M: number; F: number; UNKNOWN: number };
    stageByGender: Record<string, { M: number; F: number; UNKNOWN: number }>;
    institutionTierBreakdown: { tier1: number; tier2: number; other: number };
    blindModeJobs: number;
    totalApplicants: number;
    eeoData: Array<{ name: string; gender: string; stage: string; institution: string }>;
}

// Rough tier-1 institution keywords
const TIER1_KEYWORDS = ['iit ', 'nit ', 'iiit ', 'iim ', 'bits ', 'srm university', 'vit ', 'anna university', 'delhi university', 'mumbai university'];

function inferInstitutionTier(institutionName?: string | null): 'tier1' | 'tier2' | 'other' {
    if (!institutionName) return 'other';
    const lower = institutionName.toLowerCase();
    if (TIER1_KEYWORDS.some(k => lower.includes(k))) return 'tier1';
    if (lower.includes('university') || lower.includes('college') || lower.includes('institute')) return 'tier2';
    return 'other';
}

export class DiversityService {

    async getDiversityStats(recruiterId: string): Promise<DiversityStats> {
        const cacheKey = `diversity:${recruiterId}`;
        const r = getRedis();

        if (r) {
            try {
                const cached = await r.get(cacheKey);
                if (cached) return JSON.parse(cached);
            } catch { /* ignore */ }
        }

        // Fetch all applicants across recruiter's jobs
        const applicants = await prisma.recruiterJobApplicant.findMany({
            where: { job: { recruiterId } },
            include: {
                candidate: { include: { institution: true } },
                job: { select: { id: true, blindReviewMode: true } },
            },
        });

        const blindModeJobs = await prisma.recruiterJob.count({
            where: { recruiterId, blindReviewMode: true },
        });

        // Infer gender for each unique first name (batch processing)
        const nameGenderCache: Record<string, 'M' | 'F' | 'UNKNOWN'> = {};
        const genderBreakdown = { M: 0, F: 0, UNKNOWN: 0 };
        const stageByGender: Record<string, { M: number; F: number; UNKNOWN: number }> = {};
        const institutionTierBreakdown = { tier1: 0, tier2: 0, other: 0 };
        const eeoData: DiversityStats['eeoData'] = [];

        for (const stage of PIPELINE_STAGES) {
            stageByGender[stage] = { M: 0, F: 0, UNKNOWN: 0 };
        }

        for (const applicant of applicants) {
            const firstName = (applicant.candidate.name || '').split(' ')[0];
            let gender: 'M' | 'F' | 'UNKNOWN' = 'UNKNOWN';

            if (firstName) {
                if (nameGenderCache[firstName] !== undefined) {
                    gender = nameGenderCache[firstName];
                } else {
                    try {
                        const result = await inferGenderFromName(firstName);
                        gender = result.confidence > 0.6 ? result.gender : 'UNKNOWN';
                    } catch { gender = 'UNKNOWN'; }
                    nameGenderCache[firstName] = gender;
                }
            }

            genderBreakdown[gender]++;
            const stage = applicant.status as string;
            if (stageByGender[stage]) stageByGender[stage][gender]++;

            const tier = inferInstitutionTier(applicant.candidate.institution?.name);
            institutionTierBreakdown[tier]++;

            eeoData.push({
                name: applicant.job.blindReviewMode ? 'Candidate (blind mode)' : (applicant.candidate.name || 'Unknown'),
                gender,
                stage,
                institution: applicant.candidate.institution?.name || 'Unknown',
            });
        }

        const result: DiversityStats = {
            genderBreakdown,
            stageByGender,
            institutionTierBreakdown,
            blindModeJobs,
            totalApplicants: applicants.length,
            eeoData,
        };

        if (r) {
            try { await r.setex(cacheKey, 3600, JSON.stringify(result)); } catch { /* ignore */ }
        }

        return result;
    }

    async toggleBlindMode(jobId: string, recruiterId: string, blindReviewMode: boolean) {
        const job = await prisma.recruiterJob.findFirst({ where: { id: jobId, recruiterId } });
        if (!job) throw new Error('Job not found');

        return prisma.recruiterJob.update({
            where: { id: jobId },
            data: { blindReviewMode },
            select: { id: true, title: true, blindReviewMode: true },
        });
    }

    generateEeoCSV(eeoData: DiversityStats['eeoData']): string {
        const header = 'Name,Gender,Pipeline Stage,Institution\n';
        const rows = eeoData.map(r =>
            `"${r.name}","${r.gender}","${r.stage}","${r.institution}"`
        ).join('\n');
        return header + rows;
    }
}

export const diversityService = new DiversityService();
