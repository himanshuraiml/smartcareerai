import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// In-memory error log storage (for demo - in production use Redis or DB)
interface ErrorLogEntry {
    id: string;
    timestamp: Date;
    service: string;
    severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    code?: string;
    path?: string;
    method?: string;
    stack?: string;
    userId?: string;
    resolved: boolean;
}

// In-memory storage (replace with Redis/DB in production)
const errorLogs: ErrorLogEntry[] = [];
const MAX_LOGS = 1000;

// Circuit breaker status tracking
interface CircuitBreakerStatus {
    name: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime: string | null;
}

const circuitBreakerStatuses: Map<string, CircuitBreakerStatus> = new Map();

/**
 * Get error logs with filtering
 */
export const getErrorLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            service,
            severity,
            resolved,
            limit = '50',
            offset = '0',
            startDate,
            endDate,
        } = req.query;

        let filtered = [...errorLogs];

        // Apply filters
        if (service && service !== 'all') {
            filtered = filtered.filter(log => log.service === service);
        }
        if (severity && severity !== 'all') {
            filtered = filtered.filter(log => log.severity === severity);
        }
        if (resolved !== undefined) {
            const isResolved = resolved === 'true';
            filtered = filtered.filter(log => log.resolved === isResolved);
        }
        if (startDate) {
            const start = new Date(startDate as string);
            filtered = filtered.filter(log => log.timestamp >= start);
        }
        if (endDate) {
            const end = new Date(endDate as string);
            filtered = filtered.filter(log => log.timestamp <= end);
        }

        // Sort by timestamp descending
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Paginate
        const total = filtered.length;
        const limitNum = parseInt(limit as string, 10);
        const offsetNum = parseInt(offset as string, 10);
        const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: {
                logs: paginated,
                pagination: {
                    total,
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get error statistics
 */
export const getErrorStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        // Calculate stats
        const recentLogs = errorLogs.filter(log => log.timestamp >= last24h);
        const lastHourLogs = errorLogs.filter(log => log.timestamp >= lastHour);

        const bySeverity = {
            CRITICAL: recentLogs.filter(l => l.severity === 'CRITICAL').length,
            ERROR: recentLogs.filter(l => l.severity === 'ERROR').length,
            WARNING: recentLogs.filter(l => l.severity === 'WARNING').length,
            INFO: recentLogs.filter(l => l.severity === 'INFO').length,
        };

        const byService: Record<string, number> = {};
        recentLogs.forEach(log => {
            byService[log.service] = (byService[log.service] || 0) + 1;
        });

        // Error rate (errors per minute in last hour)
        const errorRate = lastHourLogs.length / 60;

        // Get unique services
        const services = [...new Set(errorLogs.map(l => l.service))];

        res.json({
            success: true,
            data: {
                total24h: recentLogs.length,
                totalLastHour: lastHourLogs.length,
                unresolved: errorLogs.filter(l => !l.resolved).length,
                bySeverity,
                byService,
                errorRate: Math.round(errorRate * 100) / 100,
                services,
                circuitBreakers: Array.from(circuitBreakerStatuses.values()),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Log a new error (called from other services or middleware)
 */
export const logError = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { service, severity, message, code, path, method, stack, userId } = req.body;

        if (!service || !severity || !message) {
            return res.status(400).json({
                success: false,
                error: { message: 'service, severity, and message are required' },
            });
        }

        const entry: ErrorLogEntry = {
            id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date(),
            service,
            severity,
            message,
            code,
            path,
            method,
            stack,
            userId,
            resolved: false,
        };

        errorLogs.unshift(entry);

        // Limit log size
        if (errorLogs.length > MAX_LOGS) {
            errorLogs.pop();
        }

        logger.info(`Error logged: ${service} - ${severity} - ${message}`);

        res.status(201).json({
            success: true,
            data: { id: entry.id },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark error as resolved
 */
export const resolveError = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const error = errorLogs.find(e => e.id === id);
        if (!error) {
            return res.status(404).json({
                success: false,
                error: { message: 'Error log not found' },
            });
        }

        error.resolved = true;

        res.json({
            success: true,
            data: error,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resolve multiple errors
 */
export const resolveMultiple = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                error: { message: 'ids must be an array' },
            });
        }

        let resolved = 0;
        ids.forEach(id => {
            const error = errorLogs.find(e => e.id === id);
            if (error) {
                error.resolved = true;
                resolved++;
            }
        });

        res.json({
            success: true,
            data: { resolved },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear resolved errors
 */
export const clearResolved = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const before = errorLogs.length;
        const remaining = errorLogs.filter(e => !e.resolved);
        errorLogs.length = 0;
        errorLogs.push(...remaining);

        res.json({
            success: true,
            data: { cleared: before - remaining.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update circuit breaker status (called from services)
 */
export const updateCircuitBreaker = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, state, failureCount, lastFailureTime } = req.body;

        if (!name || !state) {
            return res.status(400).json({
                success: false,
                error: { message: 'name and state are required' },
            });
        }

        circuitBreakerStatuses.set(name, {
            name,
            state,
            failureCount: failureCount || 0,
            lastFailureTime: lastFailureTime || null,
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * Get circuit breaker statuses
 */
export const getCircuitBreakers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({
            success: true,
            data: Array.from(circuitBreakerStatuses.values()),
        });
    } catch (error) {
        next(error);
    }
};

export const errorMonitoringController = {
    getErrorLogs,
    getErrorStats,
    logError,
    resolveError,
    resolveMultiple,
    clearResolved,
    updateCircuitBreaker,
    getCircuitBreakers,
};
