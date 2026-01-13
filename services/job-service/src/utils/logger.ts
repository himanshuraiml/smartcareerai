import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${level.toUpperCase()}] ${timestamp} [job]: ${message}`;
        })
    ),
    transports: [new winston.transports.Console()],
});
