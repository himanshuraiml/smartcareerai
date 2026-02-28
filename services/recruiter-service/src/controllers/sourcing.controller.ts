import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateEmbedding, querySimilarVectors } from '@smartcareer/shared';

export class SourcingController {
    async rediscoverCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const recruiterId = (req as any).user.id;
            const { id: jobId } = req.params;

            // 1. Verify job belongs to recruiter
            const job = await prisma.recruiterJob.findFirst({
                where: { id: jobId, recruiterId }
            });

            if (!job) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Job not found' }
                });
                return;
            }

            // 2. Generate target text for the job embedding
            const jobTextToEmbed = `
            Title: ${job.title}
            Description: ${job.description}
            Required Skills: ${job.requiredSkills.join(', ')}
            Requirements: ${job.requirements.join('; ')}
            `;

            // 3. Generate embedding for the job
            let queryVector;
            try {
                queryVector = await generateEmbedding(jobTextToEmbed);
            } catch (embedError) {
                logger.error('Failed to generate embedding for job description', embedError);
                throw new AppError('AI Sourcing is currently unavailable (embedding generation failed)', 503);
            }

            // 4. Query Pinecone for matches
            // Exclude candidates who have already applied to this specific job
            const existingApplicants = await prisma.recruiterJobApplicant.findMany({
                where: { jobId },
                select: { candidateId: true }
            });
            const appliedCandidateIds = existingApplicants.map(a => a.candidateId);

            let pineconeMatches;
            try {
                // Determine filter. If no applied candidates, filter might be empty {}
                const filter = appliedCandidateIds.length > 0
                    ? { candidateId: { $nin: appliedCandidateIds } }
                    : undefined;

                pineconeMatches = await querySimilarVectors(
                    process.env.PINECONE_INDEX || 'smartcareer',
                    'candidates',
                    queryVector,
                    15, // Top K to return
                    filter
                );
            } catch (searchError) {
                logger.error('Failed to query Pinecone', searchError);
                throw new AppError('AI Sourcing memory search failed', 503);
            }

            if (!pineconeMatches || pineconeMatches.length === 0) {
                res.json({ success: true, data: [] });
                return;
            }

            // 5. Fetch full database profiles for the matches
            const matchUserIds = pineconeMatches.map(m => m.id);
            const candidates = await prisma.user.findMany({
                where: {
                    id: { in: matchUserIds }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    userSkills: {
                        include: { skill: true }
                    }
                }
            });

            // Map Pinecone scores back to candidate data
            const recommendedCandidates = candidates.map(candidate => {
                const match = pineconeMatches.find(m => m.id === candidate.id);
                return {
                    id: candidate.id,
                    name: candidate.name,
                    email: candidate.email,
                    avatarUrl: candidate.avatarUrl,
                    skills: candidate.userSkills.map(us => us.skill.name),
                    matchScore: match && match.score !== undefined ? Math.round(match.score * 100) : 0
                };
            }).sort((a, b) => b.matchScore - a.matchScore);

            res.json({
                success: true,
                data: recommendedCandidates
            });

        } catch (error) {
            next(error);
        }
    }
}
