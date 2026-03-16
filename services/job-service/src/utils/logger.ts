import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message ?? '');
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${level.toUpperCase()}] ${timestamp} [job]: ${msg}${metaStr}${stackStr}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), winston.format.errors({ stack: true }), winston.format.splat(), logFormat),
        }),
    ],
});
