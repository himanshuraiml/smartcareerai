import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface EligibilityResult {
    isEligible: boolean;
    reasons: string[];
}

export class EligibilityService {
    async checkStudentEligibility(studentId: string, jobId: string): Promise<EligibilityResult> {
        try {
            const [student, job] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: studentId },
                    include: { studentProfile: true }
                }),
                (prisma as any).recruiterJob.findUnique({
                    where: { id: jobId }
                })
            ]);

            if (!student || !job) {
                return { isEligible: false, reasons: ['Student or Job not found'] };
            }

            if (!student.studentProfile) {
                return { isEligible: false, reasons: ['Student profile is incomplete'] };
            }

            const profile = student.studentProfile;
            const reasons: string[] = [];

            // 1. CGPA Check
            if (job.minCgpa && profile.cgpa < job.minCgpa) {
                reasons.push(`Minimum CGPA required is ${job.minCgpa}`);
            }

            // 2. Backlogs Check
            if (job.maxBacklogs !== null && profile.backlogs > job.maxBacklogs) {
                reasons.push(`Maximum ${job.maxBacklogs} backlogs allowed`);
            }

            // 3. Branch Check
            if (job.allowedBranches && job.allowedBranches.length > 0) {
                if (!job.allowedBranches.includes(profile.branch)) {
                    reasons.push(`Branch ${profile.branch} is not allowed for this role`);
                }
            }

            // 4. Batch/Graduation Year Check
            if (job.allowedBatches && job.allowedBatches.length > 0) {
                if (!job.allowedBatches.includes(profile.graduationYear)) {
                    reasons.push(`Graduation year ${profile.graduationYear} is not allowed`);
                }
            }

            return {
                isEligible: reasons.length === 0,
                reasons
            };
        } catch (error) {
            logger.error('Error checking eligibility', error);
            throw error;
        }
    }

    async preScreenStudents(jobId: string, institutionId: string) {
        try {
            const job = await (prisma as any).recruiterJob.findUnique({
                where: { id: jobId }
            });

            if (!job) throw new Error('Job not found');

            const filters: any = {
                institutionId,
                studentProfile: { isNot: null }
            };

            const students = await prisma.user.findMany({
                where: filters,
                include: { studentProfile: true }
            });

            const results = students.map(student => {
                const profile = student.studentProfile!;
                const reasons: string[] = [];

                if (job.minCgpa && profile.cgpa < job.minCgpa) reasons.push('CGPA');
                if (job.maxBacklogs !== null && profile.backlogs > job.maxBacklogs) reasons.push('Backlogs');
                if (job.allowedBranches?.length > 0 && !job.allowedBranches.includes(profile.branch)) reasons.push('Branch');
                if (job.allowedBatches?.length > 0 && !job.allowedBatches.includes(profile.graduationYear)) reasons.push('Batch');

                return {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    isEligible: reasons.length === 0,
                    failedCriteria: reasons
                };
            });

            return results;
        } catch (error) {
            logger.error('Error pre-screening students', error);
            throw error;
        }
    }
}

export const eligibilityService = new EligibilityService();
