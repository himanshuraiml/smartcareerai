import { Client } from 'minio';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { parseResumeContent } from '../utils/ai';

interface UploadedFile {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

export class ResumeService {
    private minioClient: Client;
    private bucketName: string;

    constructor() {
        const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = parseInt(process.env.MINIO_PORT || '9000');
        const accessKey = process.env.MINIO_ACCESS_KEY;
        const secretKey = process.env.MINIO_SECRET_KEY;

        if (!accessKey || !secretKey) {
            throw new Error('MINIO_ACCESS_KEY or MINIO_SECRET_KEY is not defined');
        }

        this.minioClient = new Client({
            endPoint,
            port,
            useSSL: process.env.NODE_ENV === 'production',
            accessKey,
            secretKey,
        });
        this.bucketName = process.env.MINIO_BUCKET || 'resumes';
        this.initBucket();
        this.startCleanupTask();
    }

    private async initBucket() {
        try {
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName);
                logger.info(`Created bucket: ${this.bucketName}`);
            }
        } catch (error) {
            logger.error('Failed to initialize MinIO bucket', error);
        }
    }

    private startCleanupTask() {
        // Run every day at midnight
        cron.schedule('0 0 * * *', async () => {
            logger.info('Starting daily resume cleanup task...');
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // 1. Find old PENDING resumes
                const pendingResumes = await prisma.resume.findMany({
                    where: {
                        status: 'PENDING',
                        createdAt: { lt: thirtyDaysAgo },
                    },
                });

                // 2. Find old soft-deleted resumes
                const deletedResumes = await prisma.resume.findMany({
                    where: {
                        isActive: false,
                        updatedAt: { lt: thirtyDaysAgo },
                    },
                });

                const toDelete = [...pendingResumes, ...deletedResumes];

                if (toDelete.length === 0) {
                    logger.info('No resumes to clean up today.');
                    return;
                }

                logger.info(`Cleaning up ${toDelete.length} resumes...`);

                for (const resume of toDelete) {
                    try {
                        // Delete from MinIO
                        await this.minioClient.removeObject(this.bucketName, resume.fileName);

                        // Delete from Database (permanent delete)
                        await prisma.resume.delete({
                            where: { id: resume.id },
                        });

                        logger.info(`Permanently deleted resume ${resume.id} from storage and DB.`);
                    } catch (err) {
                        logger.error(`Failed to delete resume ${resume.id} during cleanup:`, err);
                    }
                }

                logger.info('Daily resume cleanup task completed successfully.');
            } catch (error) {
                logger.error('Error in daily resume cleanup task:', error);
            }
        });
    }

    async uploadResume(userId: string, file: UploadedFile) {
        // Sanitize and generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
        const storageKey = `${userId}/${timestamp}-${sanitizedName}`;

        // Upload to MinIO
        await this.minioClient.putObject(
            this.bucketName,
            storageKey,
            file.buffer,
            file.size,
            { 'Content-Type': file.mimetype }
        );

        // Generate presigned URL (valid for 2 hours for security)
        const fileUrl = await this.minioClient.presignedGetObject(
            this.bucketName,
            storageKey,
            2 * 60 * 60
        );

        // Save to database
        const resume = await prisma.resume.create({
            data: {
                userId,
                fileName: storageKey, // Store the full storage key to ensure retrievability
                fileUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'PENDING',
            },
        });

        // Trigger async parsing
        this.parseResumeAsync(resume.id, file.buffer, file.mimetype);

        return this.formatResume(resume);
    }

    async getResumesByUser(userId: string) {
        const resumes = await prisma.resume.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
                atsScores: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return resumes.map(this.formatResume);
    }

    async getResumeById(resumeId: string, userId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId, isActive: true },
            include: {
                atsScores: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        return this.formatResume(resume);
    }

    async deleteResume(resumeId: string, userId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        // Soft delete the resume
        await prisma.resume.update({
            where: { id: resumeId },
            data: { isActive: false },
        });

        // Check if user has any other active resumes
        const activeResumesCount = await prisma.resume.count({
            where: { userId, isActive: true },
        });

        // If no active resumes remain, clear all resume-sourced skills
        if (activeResumesCount === 0) {
            const deletedSkills = await prisma.userSkill.deleteMany({
                where: {
                    userId,
                    source: 'resume',
                },
            });
            logger.info(`Cleared ${deletedSkills.count} resume-sourced skills for user ${userId} (no active resumes)`);
        }
    }

    async parseResume(resumeId: string, userId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        // Download file from MinIO
        // Use resume.fileName as the object key. 
        // Note: For older uploads where fileName was just the original name, this may fail if the key format was different.
        // However, since we now store the full storage key in fileName, this is the correct approach for new uploads.
        const objectStream = await this.minioClient.getObject(
            this.bucketName,
            resume.fileName
        );

        const chunks: Buffer[] = [];
        for await (const chunk of objectStream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Parse based on type
        const parsedText = await this.extractText(buffer, resume.mimeType);

        // Update resume
        const updatedResume = await prisma.resume.update({
            where: { id: resumeId },
            data: {
                parsedText,
                status: 'PARSED',
            },
        });

        const structuredData = await parseResumeContent(parsedText);
        return { ...this.formatResume(updatedResume), ...structuredData };
    }
    private async parseResumeAsync(resumeId: string, buffer: Buffer, mimeType: string) {
        try {
            await prisma.resume.update({
                where: { id: resumeId },
                data: { status: 'PARSING' },
            });

            const parsedText = await this.extractText(buffer, mimeType);

            await prisma.resume.update({
                where: { id: resumeId },
                data: {
                    parsedText,
                    status: 'PARSED',
                },
            });

            logger.info(`Resume parsed successfully: ${resumeId}`);
        } catch (error) {
            logger.error(`Failed to parse resume: ${resumeId}`, error);
            await prisma.resume.update({
                where: { id: resumeId },
                data: { status: 'FAILED' },
            });
        }
    }

    private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
        if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            return data.text;
        } else if (
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        throw new AppError('Unsupported file type', 400);
    }

    private formatResume(resume: any) {
        const latestAnalysis = resume.atsScores?.[0];

        return {
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            fileSize: resume.fileSize,
            status: resume.status,
            parsedText: resume.parsedText,
            createdAt: resume.createdAt.toISOString(),
            updatedAt: resume.updatedAt.toISOString(),
            latestAnalysis: latestAnalysis ? {
                id: latestAnalysis.id,
                overallScore: latestAnalysis.overallScore,
                keywordMatchPercent: latestAnalysis.keywordMatchPercent,
                formattingScore: latestAnalysis.formattingScore,
                experienceScore: latestAnalysis.experienceScore,
                educationScore: latestAnalysis.educationScore,
                matchedKeywords: latestAnalysis.matchedKeywords,
                missingKeywords: latestAnalysis.missingKeywords,
                suggestions: latestAnalysis.suggestions,
                createdAt: latestAnalysis.createdAt,
            } : null,
        };
    }
}
