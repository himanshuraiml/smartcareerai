import { Request, Response, NextFunction } from 'express';
import { SourcingController } from '../controllers/sourcing.controller';

// ── Mock dependencies ────────────────────────────────────────────────
jest.mock('../utils/prisma', () => ({
    prisma: {
        recruiterJob: { findFirst: jest.fn() },
        recruiterJobApplicant: { findMany: jest.fn() },
        user: { findMany: jest.fn() },
    },
}));

jest.mock('@smartcareer/shared', () => ({
    generateEmbedding: jest.fn(),
    querySimilarVectors: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// ── Import mocks after jest.mock declarations ────────────────────────
import { prisma } from '../utils/prisma';
import { generateEmbedding, querySimilarVectors } from '@smartcareer/shared';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGenerateEmbedding = generateEmbedding as jest.MockedFunction<typeof generateEmbedding>;
const mockQuerySimilarVectors = querySimilarVectors as jest.MockedFunction<typeof querySimilarVectors>;

// ── Helpers ──────────────────────────────────────────────────────────
function makeReq(overrides: Partial<Request> = {}): Request {
    return {
        params: { id: 'job-1' },
        user: { id: 'recruiter-1' },
        ...overrides,
    } as unknown as Request;
}

function makeRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { json, status } as unknown as Response;
    return { res, json, status };
}

const next: NextFunction = jest.fn();

// ── Fixtures ─────────────────────────────────────────────────────────
const MOCK_JOB = {
    id: 'job-1',
    recruiterId: 'recruiter-1',
    title: 'Senior React Developer',
    description: 'Build awesome UIs',
    requiredSkills: ['React', 'TypeScript'],
    requirements: ['3+ years experience'],
};

const MOCK_VECTOR = new Array(384).fill(0.1);

const MOCK_PINECONE_MATCHES = [
    { id: 'user-1', score: 0.92, metadata: {} },
    { id: 'user-2', score: 0.75, metadata: {} },
    { id: 'user-3', score: 0.60, metadata: {} },
];

const MOCK_USERS = [
    { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null, userSkills: [{ skill: { name: 'React' } }, { skill: { name: 'TypeScript' } }] },
    { id: 'user-2', name: 'Bob', email: 'bob@example.com', avatarUrl: null, userSkills: [{ skill: { name: 'Vue' } }] },
    { id: 'user-3', name: 'Carol', email: 'carol@example.com', avatarUrl: 'https://example.com/carol.png', userSkills: [] },
];

// ── Tests ─────────────────────────────────────────────────────────────
describe('SourcingController.rediscoverCandidates', () => {
    let controller: SourcingController;

    beforeEach(() => {
        controller = new SourcingController();
        jest.clearAllMocks();
    });

    // ── 404 when job not found ────────────────────────────────────────
    it('returns 404 when job does not belong to recruiter', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(null);

        const req = makeReq();
        const { res, status, json } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({
            success: false,
            error: { message: 'Job not found' },
        });
        expect(mockGenerateEmbedding).not.toHaveBeenCalled();
    });

    // ── Empty result when Pinecone returns no matches ─────────────────
    it('returns empty array when Pinecone finds no matches', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockResolvedValue([]);

        const req = makeReq();
        const { res, json } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        expect(json).toHaveBeenCalledWith({ success: true, data: [] });
        expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    // ── Happy path: returns ranked candidates ─────────────────────────
    it('returns candidates sorted by match score descending', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockResolvedValue(MOCK_PINECONE_MATCHES);
        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_USERS);

        const req = makeReq();
        const { res, json } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        const result = json.mock.calls[0][0];
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);

        // Sorted by score: Alice (92), Bob (75), Carol (60)
        expect(result.data[0].id).toBe('user-1');
        expect(result.data[0].matchScore).toBe(92);
        expect(result.data[0].skills).toEqual(['React', 'TypeScript']);

        expect(result.data[1].id).toBe('user-2');
        expect(result.data[1].matchScore).toBe(75);

        expect(result.data[2].id).toBe('user-3');
        expect(result.data[2].matchScore).toBe(60);
        expect(result.data[2].avatarUrl).toBe('https://example.com/carol.png');
    });

    // ── Excludes already-applied candidates via Pinecone filter ───────
    it('passes $nin filter to Pinecone excluding already-applied candidates', async () => {
        const existingApplicants = [
            { candidateId: 'user-99' },
            { candidateId: 'user-100' },
        ];

        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue(existingApplicants);
        mockQuerySimilarVectors.mockResolvedValue(MOCK_PINECONE_MATCHES);
        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_USERS);

        const req = makeReq();
        const { res } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        expect(mockQuerySimilarVectors).toHaveBeenCalledWith(
            expect.any(String),   // index name
            'candidates',
            MOCK_VECTOR,
            15,
            { candidateId: { $nin: ['user-99', 'user-100'] } }
        );
    });

    // ── No filter when no existing applicants ─────────────────────────
    it('passes no filter to Pinecone when pipeline is empty', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockResolvedValue(MOCK_PINECONE_MATCHES);
        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_USERS);

        const req = makeReq();
        const { res } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        expect(mockQuerySimilarVectors).toHaveBeenCalledWith(
            expect.any(String),
            'candidates',
            MOCK_VECTOR,
            15,
            undefined   // no filter
        );
    });

    // ── 503 when embedding generation fails ───────────────────────────
    it('calls next with AppError 503 when embedding generation fails', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockRejectedValue(new Error('GPU unavailable'));

        const req = makeReq();
        const { res } = makeRes();
        const mockNext = jest.fn() as NextFunction;

        await controller.rediscoverCandidates(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const err = (mockNext as jest.Mock).mock.calls[0][0];
        expect(err.statusCode).toBe(503);
        expect(err.message).toMatch(/embedding generation failed/i);
    });

    // ── 503 when Pinecone query fails ─────────────────────────────────
    it('calls next with AppError 503 when Pinecone query fails', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockRejectedValue(new Error('Pinecone timeout'));

        const req = makeReq();
        const { res } = makeRes();
        const mockNext = jest.fn() as NextFunction;

        await controller.rediscoverCandidates(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const err = (mockNext as jest.Mock).mock.calls[0][0];
        expect(err.statusCode).toBe(503);
        expect(err.message).toMatch(/memory search failed/i);
    });

    // ── Correct match score when Pinecone score is undefined ──────────
    it('uses 0 as matchScore when Pinecone match score is undefined', async () => {
        const matchesWithUndefinedScore = [{ id: 'user-1', score: undefined, metadata: {} }];

        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockResolvedValue(matchesWithUndefinedScore as any);
        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([MOCK_USERS[0]]);

        const req = makeReq();
        const { res, json } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        const result = json.mock.calls[0][0];
        expect(result.data[0].matchScore).toBe(0);
    });

    // ── Uses correct job ID when querying applicants ──────────────────
    it('queries existing applicants using the correct jobId', async () => {
        (mockPrisma.recruiterJob.findFirst as jest.Mock).mockResolvedValue(MOCK_JOB);
        mockGenerateEmbedding.mockResolvedValue(MOCK_VECTOR);
        (mockPrisma.recruiterJobApplicant.findMany as jest.Mock).mockResolvedValue([]);
        mockQuerySimilarVectors.mockResolvedValue([]);

        const req = makeReq({ params: { id: 'specific-job-42' } } as any);
        const { res } = makeRes();

        await controller.rediscoverCandidates(req, res, next);

        expect(mockPrisma.recruiterJobApplicant.findMany).toHaveBeenCalledWith({
            where: { jobId: 'specific-job-42' },
            select: { candidateId: true },
        });
    });
});
