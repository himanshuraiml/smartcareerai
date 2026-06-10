import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';
import { logger } from '../utils/logger';

// Validate file by inspecting magic bytes, not just client-supplied MIME type
function isAllowedFileType(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    // PDF: %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
    // DOCX / any ZIP-based Office format: PK\x03\x04
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) return true;
    // DOC (OLE2 Compound): D0 CF 11 E0 A1 B1 1A E1
    if (
        buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0 &&
        buffer[4] === 0xA1 && buffer[5] === 0xB1 && buffer[6] === 0x1A && buffer[7] === 0xE1
    ) return true;
    return false;
}

const resumeService = new ResumeService();

export class ResumeController {
    async upload(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({
                    success: false,
                    error: { message: 'No file uploaded' },
                });
                return;
            }

            // Verify actual file contents match an allowed type (not just client MIME)
            if (!isAllowedFileType(file.buffer)) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid file type. Only PDF and DOC/DOCX are allowed.' },
                });
                return;
            }

            const resume = await resumeService.uploadResume(userId, file);

            logger.info(`Resume uploaded: ${resume.id} by user ${userId}`);
            res.status(201).json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const resumes = await resumeService.getResumesByUser(userId);

            res.json({
                success: true,
                data: resumes,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const resume = await resumeService.getResumeById(id, userId);

            res.json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await resumeService.deleteResume(id, userId);

            logger.info(`Resume deleted: ${id} by user ${userId}`);
            res.json({
                success: true,
                message: 'Resume deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async download(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;
            const result = await resumeService.getDownloadUrl(id, userId);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async downloadByCandidate(req: Request, res: Response, next: NextFunction) {
        try {
            const { candidateId } = req.params;
            const requesterId = (req as any).user?.id;
            const requesterRole = (req as any).user?.role;

            // Allow: candidate downloading their own resume, or a RECRUITER/ADMIN
            const isSelf = requesterId === candidateId;
            const isPrivileged = requesterRole === 'RECRUITER' || requesterRole === 'ADMIN';

            if (!isSelf && !isPrivileged) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            const result = await resumeService.getDownloadUrlByCandidate(candidateId);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Serves the actual decrypted file binary
     */
    async downloadFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;
            const { buffer, mimeType, fileName } = await resumeService.getDecryptedFile(id, userId);

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length.toString());

            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async uploadAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({ success: false, error: { message: 'No image uploaded' } });
                return;
            }

            const avatarUrl = await resumeService.uploadAvatar(userId, file);

            res.json({ success: true, data: { avatarUrl } });
        } catch (error) {
            next(error);
        }
    }

    async parse(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const resume = await resumeService.parseResume(id, userId);

            logger.info(`Resume parsed: ${id}`);
            res.json({
                success: true,
                data: resume,
            });
        } catch (error) {
            next(error);
        }
    }
}
