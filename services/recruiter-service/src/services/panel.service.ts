import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PanelService {
    // POST /recruiter/applications/:id/panel
    async createPanel(
        applicationId: string,
        interviewerIds: string[],
        scheduledAt: string | undefined,
        durationMins: number = 60,
        meetLink: string | undefined,
        notes: string | undefined,
        createdBy: string,
        recruiterId: string,
    ) {
        // Verify recruiter owns this application
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: {
                id: applicationId,
                job: { recruiterId },
            },
            include: { job: true },
        });
        if (!application) throw new Error('Application not found or access denied');

        // Create panel + assignments in a transaction
        const panel = await prisma.$transaction(async (tx) => {
            const newPanel = await tx.panelInterview.create({
                data: {
                    applicationId,
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
                    durationMins,
                    meetLink,
                    notes,
                    status: scheduledAt ? 'SCHEDULED' : 'PENDING',
                    createdBy,
                },
            });

            // Upsert interviewer assignments linked to this panel
            for (const interviewerId of interviewerIds) {
                await tx.interviewerAssignment.upsert({
                    where: { applicationId_interviewerId: { applicationId, interviewerId } },
                    create: {
                        applicationId,
                        interviewerId,
                        stageName: 'PANEL',
                        panelId: newPanel.id,
                    },
                    update: { panelId: newPanel.id },
                });
            }

            return tx.panelInterview.findUnique({
                where: { id: newPanel.id },
                include: {
                    assignments: {
                        include: {
                            interviewer: { select: { id: true, name: true, email: true } },
                            scorecards: true,
                        },
                    },
                },
            });
        });

        return panel;
    }

    // GET /recruiter/applications/:id/panel
    async getPanel(applicationId: string, recruiterId: string) {
        // Verify access
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
        });
        if (!application) throw new Error('Application not found or access denied');

        const panels = await prisma.panelInterview.findMany({
            where: { applicationId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignments: {
                    include: {
                        interviewer: { select: { id: true, name: true, email: true } },
                        scorecards: {
                            select: {
                                id: true,
                                overallRating: true,
                                recommendation: true,
                                submittedAt: true,
                            },
                        },
                    },
                },
            },
        });

        return panels;
    }

    // PATCH /recruiter/panels/:panelId — update schedule/status
    async updatePanel(
        panelId: string,
        recruiterId: string,
        updates: {
            scheduledAt?: string;
            durationMins?: number;
            meetLink?: string;
            notes?: string;
            status?: string;
        },
    ) {
        const panel = await prisma.panelInterview.findFirst({
            where: { id: panelId },
        });
        if (!panel) throw new Error('Panel not found');

        return prisma.panelInterview.update({
            where: { id: panelId },
            data: {
                ...(updates.scheduledAt && { scheduledAt: new Date(updates.scheduledAt) }),
                ...(updates.durationMins && { durationMins: updates.durationMins }),
                ...(updates.meetLink !== undefined && { meetLink: updates.meetLink }),
                ...(updates.notes !== undefined && { notes: updates.notes }),
                ...(updates.status && { status: updates.status }),
            },
            include: {
                assignments: {
                    include: {
                        interviewer: { select: { id: true, name: true, email: true } },
                        scorecards: true,
                    },
                },
            },
        });
    }

    // DELETE /recruiter/panels/:panelId
    async deletePanel(panelId: string, recruiterId: string) {
        const panel = await prisma.panelInterview.findUnique({ where: { id: panelId } });
        if (!panel) throw new Error('Panel not found');
        await prisma.panelInterview.delete({ where: { id: panelId } });
        return { deleted: true };
    }
}

export const panelService = new PanelService();
