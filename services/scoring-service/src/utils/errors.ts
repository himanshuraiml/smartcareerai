export class AppError extends Error {
    public statusCode: number;
    public code: string;

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || this.getCodeFromStatus(statusCode);
        Error.captureStackTrace(this, this.constructor);
    }

    private getCodeFromStatus(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            500: 'INTERNAL_ERROR',
        };
        return codes[status] || 'ERROR';
    }
}
