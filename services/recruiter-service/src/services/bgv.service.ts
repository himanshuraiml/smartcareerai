import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class BgvService {
    // POST /recruiter/applications/:id/bgv/initiate
    async initiate(applicationId: string, recruiterId: string, initiatedBy: string) {
        // Verify recruiter owns this application
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: { select: { id: true, name: true, email: true } },
                job: { select: { title: true } },
            },
        });
        if (!application) throw new Error('Application not found or access denied');

        if (application.bgvStatus && application.bgvStatus !== 'PENDING') {
            throw new Error(`BGV already in status: ${application.bgvStatus}`);
        }

        // In production this would call SpringVerify/IDfy API.
        // For now we create the log entry and mark as IN_PROGRESS (mock flow).
        const mockExternalId = `BGV-${Date.now()}`;

        const [bgvLog] = await prisma.$transaction([
            prisma.bgvLog.create({
                data: {
                    applicationId,
                    provider: process.env.BGV_PROVIDER || 'MOCK',
                    externalId: mockExternalId,
                    status: 'IN_PROGRESS',
                    initiatedBy,
                },
            }),
            prisma.recruiterJobApplicant.update({
                where: { id: applicationId },
                data: {
                    bgvStatus: 'IN_PROGRESS',
                    bgvInitiatedAt: new Date(),
                },
            }),
        ]);

        logger.info(`BGV initiated for application ${applicationId}, external id: ${mockExternalId}`);
        return bgvLog;
    }

    // GET /recruiter/applications/:id/bgv/status
    async getStatus(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            select: {
                bgvStatus: true,
                bgvInitiatedAt: true,
                bgvReportUrl: true,
            },
        });
        if (!application) throw new Error('Application not found or access denied');

        const logs = await prisma.bgvLog.findMany({
            where: { applicationId },
            orderBy: { initiatedAt: 'desc' },
        });

        return { ...application, logs };
    }

    // POST /recruiter/webhooks/bgv — inbound webhook from provider
    async handleWebhook(payload: {
        externalId: string;
        status: string;
        reportUrl?: string;
        provider?: string;
    }) {
        const log = await prisma.bgvLog.findFirst({
            where: { externalId: payload.externalId },
        });
        if (!log) {
            logger.warn(`BGV webhook: no log found for externalId ${payload.externalId}`);
            return { ignored: true };
        }

        const normalized = payload.status?.toUpperCase();
        const finalStatus = ['CLEAR', 'FLAGGED'].includes(normalized) ? normalized : 'IN_PROGRESS';

        await prisma.$transaction([
            prisma.bgvLog.update({
                where: { id: log.id },
                data: {
                    status: finalStatus,
                    reportUrl: payload.reportUrl,
                    webhookData: payload as any,
                    completedAt: ['CLEAR', 'FLAGGED'].includes(finalStatus) ? new Date() : undefined,
                },
            }),
            prisma.recruiterJobApplicant.update({
                where: { id: log.applicationId },
                data: {
                    bgvStatus: finalStatus,
                    bgvReportUrl: payload.reportUrl,
                },
            }),
        ]);

        logger.info(`BGV webhook processed: ${log.applicationId} → ${finalStatus}`);
        return { processed: true, applicationId: log.applicationId, status: finalStatus };
    }
}

export const bgvService = new BgvService();
