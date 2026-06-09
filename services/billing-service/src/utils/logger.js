"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message ?? '');
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${msg}${metaStr}${stackStr}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    defaultMeta: { service: 'billing-service' },
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), logFormat),
        }),
    ],
});
//# sourceMappingURL=logger.js.map