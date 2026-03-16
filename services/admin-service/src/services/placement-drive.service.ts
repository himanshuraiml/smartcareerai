import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PlacementDriveService {
    async createDrive(institutionId: string, data: any) {
        return prisma.placementDrive.create({
            data: {
                institutionId,
                name: data.name,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: data.status || 'UPCOMING',
            }
        });
    }

    async listDrives(institutionId: string) {
        return prisma.placementDrive.findMany({
            where: { institutionId },
            include: {
                _count: {
                    select: { jobs: true, applications: true }
                }
            },
            orderBy: { startDate: 'desc' }
        });
    }

    async getDriveDetails(institutionId: string, driveId: string) {
        return prisma.placementDrive.findFirst({
            where: { id: driveId, institutionId },
            include: {
                jobs: {
                    include: {
                        organization: { select: { name: true, logoUrl: true } }
                    }
                },
                applications: {
                    take: 10,
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            }
        });
    }

    async updateDrive(institutionId: string, driveId: string, data: any) {
        return prisma.placementDrive.update({
            where: { id: driveId },
            data: {
                name: data.name,
                description: data.description,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                status: data.status,
            }
        });
    }

    // F14: Get registrations (DriveAttendance) for a drive
    async getDriveRegistrations(institutionId: string, driveId: string) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        return prisma.driveAttendance.findMany({
            where: { driveId },
            include: {
                student: {
                    select: { id: true, name: true, email: true, institution: { select: { name: true } } }
                }
            },
            orderBy: { status: 'asc' }
        });
    }

    // F14: Student registers for drive
    async registerForDrive(driveId: string, studentId: string) {
        const user = await prisma.user.findUnique({ where: { id: studentId }, select: { institutionId: true } });
        if (!user?.institutionId) throw new Error('You must be associated with an institution to register for drives');

        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId: user.institutionId } });
        if (!drive) throw new Error('Drive not found or not available for your institution');
        
        if (drive.status === 'COMPLETED' || drive.status === 'CANCELLED') {
            throw new Error('Drive is no longer accepting registrations');
        }

        const qrCode = `DRIVE-${driveId}-${studentId}-${Date.now()}`;
        return prisma.driveAttendance.upsert({
            where: { driveId_studentId: { driveId, studentId } },
            create: { driveId, studentId, qrCode, status: 'NOT_SCANNED' },
            update: {},
        });
    }


    // F14: List drives available to a student (by their institution)
    async listDrivesForStudent(studentId: string) {
        const user = await prisma.user.findUnique({ where: { id: studentId }, select: { institutionId: true } });
        if (!user?.institutionId) return [];

        const drives = await prisma.placementDrive.findMany({
            where: { institutionId: user.institutionId, status: { in: ['UPCOMING', 'ONGOING'] } },
            include: {
                _count: { select: { attendances: true, jobs: true } },
                attendances: { where: { studentId }, select: { id: true, status: true, qrCode: true } },
            },
            orderBy: { startDate: 'asc' }
        });

        return drives.map((d: any) => ({
            ...d,
            isRegistered: d.attendances.length > 0,
            registration: d.attendances[0] || null,
        }));
    }

    // F14: Update drive stages configuration
    async updateDriveStages(institutionId: string, driveId: string, stages: any[]) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        return prisma.placementDrive.update({
            where: { id: driveId },
            data: { stages },
        });
    }

    // F14: Advance batch of students to next stage
    async advanceStudentsToStage(institutionId: string, driveId: string, studentIds: string[], targetStage: string) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        const result = await prisma.driveAttendance.updateMany({
            where: { driveId, studentId: { in: studentIds } },
            data: { currentStage: targetStage },
        });

        return { advanced: result.count, targetStage };
    }

    // F14: Drive analytics
    async getDriveAnalytics(institutionId: string, driveId: string) {
        const drive = await prisma.placementDrive.findFirst({
            where: { id: driveId, institutionId },
            include: {
                attendances: true,
                applications: { select: { status: true } },
                jobs: { select: { id: true, title: true } },
            }
        });
        if (!drive) throw new Error('Drive not found');

        const totalRegistered = drive.attendances.length;
        const totalAttended = drive.attendances.filter((a: any) => a.status === 'SCANNED').length;
        const totalApplications = drive.applications.length;
        const offers = drive.applications.filter((a: any) => a.status === 'OFFER').length;
        const placed = drive.applications.filter((a: any) => a.status === 'PLACED').length;

        const stageBreakdown: Record<string, number> = {};
        for (const app of drive.applications) {
            stageBreakdown[app.status] = (stageBreakdown[app.status] || 0) + 1;
        }

        return {
            driveId,
            driveName: drive.name,
            status: drive.status,
            totalRegistered,
            totalAttended,
            attendanceRate: totalRegistered > 0 ? Math.round(totalAttended / totalRegistered * 100) : 0,
            totalApplications,
            offers,
            placed,
            offerAcceptanceRate: offers > 0 ? Math.round(placed / offers * 100) : 0,
            stageBreakdown,
            companyCount: drive.jobs.length,
        };
    }

    // DriveInvite: get all invited recruiters for a drive
    async getDriveInvites(driveId: string, institutionId: string) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        return prisma.driveInvite.findMany({
            where: { driveId },
            include: {
                recruiter: {
                    select: {
                        id: true,
                        companyName: true,
                        companyLogo: true,
                        user: { select: { name: true, email: true } }
                    }
                }
            },
            orderBy: { invitedAt: 'desc' }
        });
    }

    // DriveInvite: invite a recruiter to a drive
    async inviteRecruiter(driveId: string, institutionId: string, recruiterId: string) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        const recruiter = await prisma.recruiter.findUnique({ where: { id: recruiterId } });
        if (!recruiter) throw new Error('Recruiter not found');

        return prisma.driveInvite.upsert({
            where: { driveId_recruiterId: { driveId, recruiterId } },
            create: { driveId, recruiterId },
            update: {},
        });
    }

    // DriveInvite: remove an invite
    async removeInvite(driveId: string, inviteId: string, institutionId: string) {
        const drive = await prisma.placementDrive.findFirst({ where: { id: driveId, institutionId } });
        if (!drive) throw new Error('Drive not found');

        return prisma.driveInvite.delete({ where: { id: inviteId } });
    }

    // Search recruiters by email or company name for invite UI
    async searchRecruiters(query: string) {
        return prisma.recruiter.findMany({
            where: {
                OR: [
                    { companyName: { contains: query, mode: 'insensitive' } },
                    { user: { email: { contains: query, mode: 'insensitive' } } },
                    { user: { name: { contains: query, mode: 'insensitive' } } },
                ]
            },
            select: {
                id: true,
                companyName: true,
                companyLogo: true,
                user: { select: { name: true, email: true } }
            },
            take: 10,
        });
    }
}

export const placementDriveService = new PlacementDriveService();
