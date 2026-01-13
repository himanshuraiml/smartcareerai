export class AppError extends Error {
    public statusCode: number;
    public code: string;

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || 'INTERNAL_ERROR';
        Error.captureStackTrace(this, this.constructor);
    }
}
