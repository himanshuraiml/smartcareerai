import { Request, Response, NextFunction } from 'express';
import {
    securityHeaders,
    sanitizeInput,
    sqlInjectionPrevention,
    ipBlocklistCheck,
    addToBlocklist,
    removeFromBlocklist,
    suspiciousActivityDetection,
    requestSizeLimits,
} from '../middleware/security';

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Helper to create mock request with configurable ip
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
    ip: '127.0.0.1',
    path: '/api/test',
    query: {},
    body: {},
    params: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' } as any,
    ...overrides,
});

describe('Security Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = createMockRequest();
        mockRes = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('securityHeaders', () => {
        it('sets X-Frame-Options header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
        });

        it('sets X-Content-Type-Options header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
        });

        it('sets X-XSS-Protection header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
        });

        it('sets Referrer-Policy header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
        });

        it('sets Permissions-Policy header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Permissions-Policy',
                'camera=(), microphone=(), geolocation=()'
            );
        });

        it('sets Content-Security-Policy header', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                expect.stringContaining("default-src 'self'")
            );
        });

        it('calls next()', () => {
            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('sets HSTS in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            securityHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('sanitizeInput', () => {
        it('removes script tags from query parameters', () => {
            mockReq.query = {
                search: '<script>alert("xss")</script>',
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.query!.search).toBe('');
        });

        it('removes javascript: protocol from query parameters', () => {
            mockReq.query = {
                url: 'javascript:alert("xss")',
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.query!.url).toBe('alert("xss")');
        });

        it('removes event handlers from query parameters', () => {
            mockReq.query = {
                input: 'onclick=alert("xss")',
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.query!.input).toBe('alert("xss")');
        });

        it('sanitizes nested objects in body', () => {
            mockReq.body = {
                user: {
                    name: 'John<script>alert(1)</script>',
                    profile: {
                        bio: 'javascript:void(0)',
                    },
                },
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.body.user.name).toBe('John');
            expect(mockReq.body.user.profile.bio).toBe('void(0)');
        });

        it('sanitizes arrays in body', () => {
            mockReq.body = {
                tags: ['safe', '<script>bad</script>', 'another'],
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.body.tags).toEqual(['safe', '', 'another']);
        });

        it('preserves non-string values', () => {
            mockReq.body = {
                count: 42,
                active: true,
                data: null,
            };

            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.body.count).toBe(42);
            expect(mockReq.body.active).toBe(true);
            expect(mockReq.body.data).toBeNull();
        });

        it('calls next()', () => {
            sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('sqlInjectionPrevention', () => {
        it('blocks SQL injection in query parameters', () => {
            mockReq.query = {
                id: "1' OR '1'='1",
            };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid input detected' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('blocks UNION attacks', () => {
            mockReq.query = {
                search: "' UNION SELECT * FROM users--",
            };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('blocks SQL injection in body', () => {
            mockReq.body = {
                username: "admin'--",
            };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('blocks SQL injection in params', () => {
            mockReq.params = {
                id: '1; DROP TABLE users;--',
            };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('allows safe input through', () => {
            mockReq.query = { search: 'normal search query' };
            mockReq.body = { name: 'John Doe', email: 'john@example.com' };
            mockReq.params = { id: '12345' };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('allows numeric values', () => {
            mockReq.body = { count: 100, price: 29.99 };

            sqlInjectionPrevention(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('ipBlocklistCheck', () => {
        beforeEach(() => {
            // Clear blocklist between tests
            removeFromBlocklist('192.168.1.100');
            removeFromBlocklist('10.0.0.1');
        });

        it('blocks requests from blocked IPs', () => {
            addToBlocklist('192.168.1.100');
            const req = createMockRequest({ ip: '192.168.1.100' });

            ipBlocklistCheck(req as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('allows requests from non-blocked IPs', () => {
            const req = createMockRequest({ ip: '192.168.1.101' });

            ipBlocklistCheck(req as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('uses socket.remoteAddress as fallback', () => {
            addToBlocklist('10.0.0.1');
            const req = createMockRequest({
                ip: undefined,
                socket: { remoteAddress: '10.0.0.1' } as any,
            });

            ipBlocklistCheck(req as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('allows IP after removal from blocklist', () => {
            addToBlocklist('192.168.1.100');
            removeFromBlocklist('192.168.1.100');
            const req = createMockRequest({ ip: '192.168.1.100' });

            ipBlocklistCheck(req as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('suspiciousActivityDetection', () => {
        it('calls next() for normal traffic', () => {
            const req = createMockRequest({ ip: '192.168.1.1' });

            suspiciousActivityDetection(req as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('tracks request counts per IP', () => {
            const req = createMockRequest({ ip: '192.168.1.2' });

            // Multiple requests should be tracked
            for (let i = 0; i < 10; i++) {
                suspiciousActivityDetection(req as Request, mockRes as Response, mockNext);
            }

            // Should have called next each time
            expect(mockNext).toHaveBeenCalledTimes(10);
        });
    });

    describe('requestSizeLimits', () => {
        it('has correct JSON limit', () => {
            expect(requestSizeLimits.json).toBe('10mb');
        });

        it('has correct urlencoded limit', () => {
            expect(requestSizeLimits.urlencoded).toBe('10mb');
        });

        it('has correct raw limit for file uploads', () => {
            expect(requestSizeLimits.raw).toBe('50mb');
        });
    });
});
