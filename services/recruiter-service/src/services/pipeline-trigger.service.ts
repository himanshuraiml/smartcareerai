import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { jobService } from './job.service';
import axios from 'axios';

const ASSESSMENT_SERVICE_URL = process.env.ASSESSMENT_SERVICE_URL || 'http://localhost:3015';

const prisma = new PrismaClient();

export interface PipelineStep {
    type: 'ANALYTICAL' | 'BEHAVIOURAL' | 'CODING' | 'TECHNICAL' | 'HR';
    configId?: string;
    order: number;
    challengeIds?: string[];
    interviewType?: string;
    difficulty?: string;
}

export class PipelineTriggerService {
    /**
     * Called whenever a candidate's status is updated.
     * If the status is moved to a stage that has an automated component (like a test),
     * this service triggers it.
     */
    async handleStatusChange(applicationId: string, _recruiterId: string, newStatus: string) {
        const application = await prisma.recruiterJobApplicant.findUnique({
            where: { id: applicationId },
            include: {
                job: { select: { id: true, title: true, pipelineSteps: true, recruiterId: true, requiredSkills: true } },
                candidate: { select: { id: true, email: true, name: true } }
            }
        });

        if (!application || !application.job.pipelineSteps) return;

        const steps = application.job.pipelineSteps as any as PipelineStep[];
        if (!Array.isArray(steps)) return;

        logger.info(`PipelineTrigger: Handling status change to ${newStatus} for app ${applicationId}`);

        if (newStatus === 'INTERVIEWING') {
            await this.triggerNextInterviewStage(application, steps);
        } else if (newStatus === 'SCREENING') {
            // Might trigger an Analytical or Behavioural test
            await this.triggerAssessmentStage(application, steps);
        }
    }

    private async triggerNextInterviewStage(application: any, steps: PipelineStep[]) {
        // Find the first interview step (TECHNICAL or HR) that hasn't been completed
        const interviewStep = steps.find(s => s.type === 'TECHNICAL' || s.type === 'HR');
        if (!interviewStep) return;

        logger.info(`PipelineTrigger: Triggering ${interviewStep.type} interview for candidate ${application.candidate.id}`);

        // This would call jobService.inviteApplicantToInterview with the correct configs
        await jobService.inviteApplicantToInterview(
            application.job.recruiterId,
            application.job.id,
            application.id,
            'AI', // Default to AI for automation, can be configured
            `Hi ${application.candidate.name}, you have been moved to the next stage: ${interviewStep.type} interview.`,
        );
    }

    private async triggerAssessmentStage(application: any, steps: PipelineStep[]) {
        const assessmentStep = steps.find(s => s.type === 'ANALYTICAL' || s.type === 'CODING' || s.type === 'BEHAVIOURAL');
        if (!assessmentStep) return;

        logger.info(`PipelineTrigger: Triggering ${assessmentStep.type} assessment for candidate ${application.candidate.id}`);

        if (assessmentStep.type === 'CODING') {
            const challengeIds = assessmentStep.challengeIds || [];
            if (challengeIds.length === 0) {
                logger.warn(`PipelineTrigger: No challengeIds configured for CODING stage in job ${application.job.id}`);
                return;
            }
            await prisma.notification.create({
                data: {
                    userId: application.candidate.id,
                    type: 'assessment_assigned',
                    title: 'Coding Assessment Assigned',
                    message: `You have been invited to complete a coding assessment for ${application.job.title}.`,
                    metadata: { jobId: application.job.id, applicationId: application.id, challengeIds, stageType: 'CODING' }
                }
            });
            return;
        }

        // For ANALYTICAL / BEHAVIOURAL: find (or auto-create) the AssessmentTemplate for this job.
        const requiredSkills = (application.job as any).requiredSkills ?? [];
        const template = await prisma.assessmentTemplate.upsert({
            where: { jobId: application.job.id },
            update: {},
            create: {
                jobId: application.job.id,
                durationMinutes: 30,
                totalQuestions: 20,
                difficultyDistribution: { EASY: 5, MEDIUM: 10, HARD: 5 },
                requiredSkills,
            },
        });
        logger.info(`PipelineTrigger: Using template ${template.id} for job ${application.job.id}`);

        // Create attempt via assessment-service so scoring/proctoring logic is centralised
        let attemptId: string | null = null;
        try {
            const resp = await axios.post(
                `${ASSESSMENT_SERVICE_URL}/api/v1/assessments/attempts/start`,
                { templateId: template.id },
                { headers: { 'x-user-id': application.candidate.id } }
            );
            attemptId = resp.data?.data?.id ?? null;
        } catch (err: any) {
            logger.error(`PipelineTrigger: Failed to create assessment attempt: ${err.message}`);
            return;
        }

        if (!attemptId) return;

        await prisma.notification.create({
            data: {
                userId: application.candidate.id,
                type: 'assessment_assigned',
                title: `${assessmentStep.type === 'ANALYTICAL' ? 'Analytical' : 'Behavioural'} Assessment Ready`,
                message: `You have a new assessment for ${application.job.title}. Click to begin.`,
                metadata: { jobId: application.job.id, applicationId: application.id, attemptId, stageType: assessmentStep.type }
            }
        });

        logger.info(`PipelineTrigger: Created attempt ${attemptId} and notified candidate ${application.candidate.id}`);
    }

    /**
     * Phase 5: Automated Progression
     * Called by external webhooks (e.g., scoring-service, interview-service) when a candidate passes a stage.
     */
    async advanceCandidateStage(applicationId: string, passed: boolean = true) {
        const application = await prisma.recruiterJobApplicant.findUnique({
            where: { id: applicationId },
            include: {
                job: { select: { id: true, title: true, pipelineSteps: true, recruiterId: true } },
                candidate: { select: { id: true, email: true, name: true } }
            }
        });

        if (!application || !application.job.pipelineSteps) return;

        if (!passed) {
            logger.info(`PipelineTrigger: Candidate ${application.candidate.id} failed a stage. Marking as REJECTED.`);
            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { status: 'REJECTED' }
            });
            return;
        }

        const steps = application.job.pipelineSteps as any as PipelineStep[];
        if (!Array.isArray(steps) || steps.length === 0) return;

        const currentStepIndex = application.currentPipelineStep;
        const nextStepIndex = currentStepIndex + 1;

        // Update the application's current progress marker
        await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: { currentPipelineStep: nextStepIndex }
        });

        if (nextStepIndex >= steps.length) {
            logger.info(`PipelineTrigger: Candidate ${application.candidate.id} has completed all steps. Updating status...`);
            // Typically this might mean they've passed all stages, moving to OFFER or final review
            await prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: { status: 'OFFER' }
            });
            return;
        }

        const nextStep = steps[nextStepIndex];
        logger.info(`PipelineTrigger: Advancing candidate ${application.candidate.id} to step ${nextStepIndex} (${nextStep.type})`);

        // Change global status depending on step type to keep UI in sync
        const newStatus = ['TECHNICAL', 'HR'].includes(nextStep.type) ? 'INTERVIEWING' : 'SCREENING';

        await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: { status: newStatus as ApplicationStatus }
        });

        if (['ANALYTICAL', 'CODING', 'BEHAVIOURAL'].includes(nextStep.type)) {
            await this.triggerAssessmentStage(application, [nextStep]); // Pass as array for existing logic
        } else if (['TECHNICAL', 'HR'].includes(nextStep.type)) {
            await this.triggerNextInterviewStage(application, [nextStep]);
        }
    }
}

export const pipelineTriggerService = new PipelineTriggerService();
