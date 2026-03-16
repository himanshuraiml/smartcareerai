import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import crypto from 'crypto';

export class PlacementOpsController {
    // ==========================================
    // 6.1 WAR ROOM DASHBOARD
    // ==========================================
    async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { institutionId } = req.params;

            // Optional: Filter by specific active drive if needed, for now all ONGOING
            const activeDrives = await prisma.placementDrive.findMany({
                where: { institutionId, status: 'ONGOING' },
                include: {
                    jobs: true,
                    attendances: true,
                }
            });

            const activeDriveIds = activeDrives.map(d => d.id);

            // 1. Companies Active (Unique companies in ongoing drives)
            // 2. Students Interviewing (Status = INTERVIEWING in active drives)
            // 3. Offers Released (Status = OFFER in active drives)

            let studentsInterviewing = 0;
            let offersReleased = 0;

            if (activeDriveIds.length > 0) {
                studentsInterviewing = await prisma.jobApplication.count({
                    where: { driveId: { in: activeDriveIds }, status: 'INTERVIEWING' }
                });

                offersReleased = await prisma.jobApplication.count({
                    where: { driveId: { in: activeDriveIds }, status: 'OFFER' }
                });
            }

            const metrics = {
                activeDrivesCount: activeDrives.length,
                companiesActive: activeDrives.reduce((acc, d) => acc + d.jobs.length, 0),
                studentsInterviewing,
                offersReleased,
                totalAttendance: activeDrives.reduce((acc, d) => acc + d.attendances.length, 0),
                activeDrives: activeDrives.map(d => ({ id: d.id, name: d.name }))
            };

            res.json({ success: true, data: metrics });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // 6.2 INTERVIEW LOGISTICS
    // ==========================================

    // Create Panel
    async createPanel(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;
            const { name, members } = req.body; // members: Array of user IDs

            const panel = await prisma.interviewPanel.create({
                data: {
                    driveId,
                    name,
                    members: {
                        create: members.map((userId: string) => ({ userId, role: 'MEMBER' }))
                    }
                },
                include: { members: true }
            });

            res.json({ success: true, data: panel });
        } catch (error) {
            next(error);
        }
    }

    // Schedule Interview Room/Slot
    async createSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;
            const { jobId, roundName, roomName, panelId, startTime, endTime, studentIds } = req.body;

            const schedule = await prisma.interviewSchedule.create({
                data: {
                    driveId,
                    jobId,
                    roundName,
                    roomName,
                    panelId,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    students: {
                        create: studentIds.map((studentId: string) => ({ studentId }))
                    }
                },
                include: { students: true, panel: true }
            });

            res.json({ success: true, data: schedule });
        } catch (error) {
            next(error);
        }
    }

    // Get Timeline
    async getTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;

            const schedules = await prisma.interviewSchedule.findMany({
                where: { driveId },
                include: {
                    panel: true,
                    students: {
                        include: { student: { select: { id: true, name: true, email: true } } }
                    },
                    job: { select: { title: true } }
                },
                orderBy: { startTime: 'asc' }
            });

            res.json({ success: true, data: schedules });
        } catch (error) {
            next(error);
        }
    }

    // ==========================================
    // 6.3 ATTENDANCE TRACKING
    // ==========================================

    // Generate QR (actually just generates a unique code for the student for the drive)
    async generateAttendanceCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;
            const { studentId } = req.body;

            // Check if already generated
            let attendance = await prisma.driveAttendance.findUnique({
                where: { driveId_studentId: { driveId, studentId } }
            });

            if (!attendance) {
                const qrCode = crypto.randomBytes(16).toString('hex');
                attendance = await prisma.driveAttendance.create({
                    data: {
                        driveId,
                        studentId,
                        qrCode,
                        status: 'NOT_SCANNED'
                    }
                });
            }

            res.json({ success: true, data: attendance });
        } catch (error) {
            next(error);
        }
    }

    // Scan ID to mark attendance
    async scanAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;
            const { qrCode } = req.body;

            const attendanceByCode = await prisma.driveAttendance.findUnique({
                where: { qrCode }
            });

            let attendance = attendanceByCode;

            // Auto-enroll if the QR code is actually their studentId
            if (!attendance) {
                const student = await prisma.user.findUnique({ where: { id: qrCode } });
                if (student) {
                    attendance = await prisma.driveAttendance.findFirst({
                        where: { driveId, studentId: qrCode }
                    });
                    if (!attendance) {
                        attendance = await prisma.driveAttendance.create({
                            data: {
                                driveId,
                                studentId: qrCode,
                                qrCode: `${driveId}-${qrCode}`,
                                status: 'NOT_SCANNED'
                            }
                        });
                    }
                }
            }

            if (!attendance || attendance.driveId !== driveId) {
                return next(createError('Invalid QR Code for this drive', 400, 'INVALID_QR'));
            }

            if (attendance.status === 'SCANNED') {
                return res.json({ success: true, message: 'Already scanned', data: attendance });
            }

            const updatedAttendance = await prisma.driveAttendance.update({
                where: { id: attendance.id },
                data: {
                    status: 'SCANNED',
                    scannedAt: new Date()
                },
                include: { student: { select: { name: true, email: true } } }
            });

            res.json({ success: true, data: updatedAttendance });
        } catch (error) {
            next(error);
        }
    }

    // Get attendance list
    async getAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const { driveId } = req.params;

            const attendances = await prisma.driveAttendance.findMany({
                where: { driveId },
                include: { student: { select: { name: true, email: true } } },
                orderBy: { scannedAt: 'desc' },
            });

            res.json({ success: true, data: attendances });
        } catch (error) {
            next(error);
        }
    }
}

export const placementOpsController = new PlacementOpsController();
