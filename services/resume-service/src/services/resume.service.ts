import { Client } from 'minio';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { parseResumeContent } from '../utils/ai';
import { generateEmbedding, upsertVector } from '@placenxt/shared';
import { encrypt, decrypt } from '../utils/crypto';

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
            useSSL: process.env.MINIO_USE_SSL === 'true',
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

        // Phase 8: Secuity - Encrypt the buffer before uploading
        const encryptedBuffer = encrypt(file.buffer);

        // Upload to MinIO (using encrypted buffer)
        await this.minioClient.putObject(
            this.bucketName,
            storageKey,
            encryptedBuffer,
            encryptedBuffer.length,
            { 'Content-Type': 'application/octet-stream', 'X-Amz-Meta-Original-Type': file.mimetype }
        );

        // Save to database
        const resume = await prisma.resume.create({
            data: {
                userId,
                fileName: storageKey, // Store the full storage key to ensure retrievability
                fileUrl: '', // URL will be generated on the fly for encrypted files
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'PENDING',
            },
        });

        // Trigger async parsing (use original unencrypted buffer)
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

    /**
     * Get decrypted file buffer and metadata
     */
    async getDecryptedFile(resumeId: string, userId?: string) {
        const where: any = { id: resumeId, isActive: true };
        if (userId) where.userId = userId;

        const resume = await prisma.resume.findFirst({ where });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        // Download from MinIO
        const objectStream = await this.minioClient.getObject(this.bucketName, resume.fileName);
        const chunks: Buffer[] = [];
        for await (const chunk of objectStream) {
            chunks.push(chunk);
        }
        const encryptedBuffer = Buffer.concat(chunks);

        // Decrypt
        const decryptedBuffer = decrypt(encryptedBuffer);

        return {
            buffer: decryptedBuffer,
            mimeType: resume.mimeType,
            fileName: resume.fileName.split('/').pop() || 'resume.pdf'
        };
    }

    async getDownloadUrl(resumeId: string) {
        // For encrypted files, we need the client to request the decrypted file via an API endpoint.
        // We'll return the relative API path instead of a MinIO presigned URL.
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, isActive: true },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        // This path will be proxied by Gateway to our download route
        const url = `/api/v1/resumes/${resumeId}/download-file`;

        return { url, isEncrypted: true };
    }

    async getDownloadUrlByCandidate(candidateId: string) {
        const resume = await prisma.resume.findFirst({
            where: { userId: candidateId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!resume) {
            throw new AppError('Resume not found', 404);
        }

        const url = `/api/v1/resumes/${resume.id}/download-file`;

        return { url, isEncrypted: true };
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

        // Download and decrypt
        const { buffer } = await this.getDecryptedFile(resumeId, userId);

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

            // buffer is already unencrypted here as it's passed from uploadResume
            const parsedText = await this.extractText(buffer, mimeType);
            const structuredData = await parseResumeContent(parsedText);

            const updatedResume = await prisma.resume.update({
                where: { id: resumeId },
                data: {
                    parsedText,
                    status: 'PARSED',
                },
            });

            // Phase 2: AI Sourcing - Generate embedding and upsert to Pinecone
            try {
                // Determine text to embed
                const embedText = `
                Name: ${structuredData.personalInfo?.name || ''}
                Skills: ${structuredData.skills?.join(', ') || ''}
                Experience: ${structuredData.experience?.map((e: any) => `${e.title} at ${e.company} - ${e.description}`).join('; ') || ''}
                Education: ${structuredData.education?.map((e: any) => `${e.degree} at ${e.institution}`).join('; ') || ''}
                Raw Text: ${parsedText.substring(0, 500)} // First 500 chars as context
                `;

                // Fetch user info for metadata
                const user = await prisma.user.findUnique({ where: { id: updatedResume.userId } });

                const vector = await generateEmbedding(embedText);
                await upsertVector(
                    process.env.PINECONE_INDEX || 'placenxt',
                    'candidates',
                    updatedResume.userId, // Use User ID as vector ID so they get overwritten with the latest resume
                    vector,
                    {
                        candidateId: updatedResume.userId,
                        candidateName: user?.name || structuredData.personalInfo?.name || 'Unknown',
                        email: user?.email || structuredData.personalInfo?.email || '',
                        skills: structuredData.skills || [],
                        latestResumeId: resumeId
                    }
                );
                logger.info(`Candidate embedding upserted for user ${updatedResume.userId}`);
            } catch (embedError) {
                // don't fail parsing if embedding fails
                logger.error(`Failed to generate/upsert embedding for resume ${resumeId}:`, embedError);
            }

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

    // ── Avatar Upload ────────────────────────────────────────────────────────────

    private readonly avatarBucket = 'avatars';

    private async ensureAvatarBucket() {
        try {
            const exists = await this.minioClient.bucketExists(this.avatarBucket);
            if (!exists) {
                await this.minioClient.makeBucket(this.avatarBucket);
                // Set public read policy so <img src="..."> works directly
                const policy = JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.avatarBucket}/*`],
                    }],
                });
                await this.minioClient.setBucketPolicy(this.avatarBucket, policy);
                logger.info(`Created public avatars bucket`);
            }
        } catch (err) {
            logger.error('Failed to init avatars bucket', err);
        }
    }

    async uploadAvatar(userId: string, file: { buffer: Buffer; mimetype: string }) {
        await this.ensureAvatarBucket();

        const ext = file.mimetype === 'image/jpeg' ? 'jpg'
            : file.mimetype === 'image/png' ? 'png'
                : file.mimetype === 'image/webp' ? 'webp'
                    : 'jpg';
        const key = `${userId}/profile.${ext}`;

        await this.minioClient.putObject(
            this.avatarBucket,
            key,
            file.buffer,
            file.buffer.length,
            { 'Content-Type': file.mimetype },
        );

        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT || '9000';
        const useSSL = process.env.MINIO_USE_SSL === 'true';
        const baseUrl = process.env.MINIO_PUBLIC_BASE_URL
            || `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
        const avatarUrl = `${baseUrl}/${this.avatarBucket}/${key}?v=${Date.now()}`;

        await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });

        logger.info(`Avatar uploaded for user ${userId}`);
        return avatarUrl;
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
