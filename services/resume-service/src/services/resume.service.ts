import { Client } from 'minio';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

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
        this.minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
        });
        this.bucketName = process.env.MINIO_BUCKET || 'resumes';
        this.initBucket();
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

    async uploadResume(userId: string, file: UploadedFile) {
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}-${file.originalname}`;

        // Upload to MinIO
        await this.minioClient.putObject(
            this.bucketName,
            fileName,
            file.buffer,
            file.size,
            { 'Content-Type': file.mimetype }
        );

        // Generate presigned URL (valid for 7 days)
        const fileUrl = await this.minioClient.presignedGetObject(
            this.bucketName,
            fileName,
            7 * 24 * 60 * 60
        );

        // Save to database
        const resume = await prisma.resume.create({
            data: {
                userId,
                fileName: file.originalname,
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
        });
        return resumes.map(this.formatResume);
    }

    async getResumeById(resumeId: string, userId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId, isActive: true },
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

        // Soft delete
        await prisma.resume.update({
            where: { id: resumeId },
            data: { isActive: false },
        });
    }

    async parseResume(resumeId: string, userId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        // Download file from MinIO
        const objectStream = await this.minioClient.getObject(
            this.bucketName,
            `${userId}/${resume.fileName}`
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

        return this.formatResume(updatedResume);
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
        return {
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            fileSize: resume.fileSize,
            status: resume.status,
            parsedText: resume.parsedText,
            createdAt: resume.createdAt.toISOString(),
            updatedAt: resume.updatedAt.toISOString(),
        };
    }
}
