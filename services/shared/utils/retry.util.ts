/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides automatic retry logic for transient failures with:
 * - Configurable max retries
 * - Exponential backoff with jitter
 * - Retryable error detection
 */

export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryableStatusCodes?: number[];
    onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
    // Network errors are always retryable
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('econnreset') ||
            message.includes('econnrefused') ||
            message.includes('etimedout') ||
            message.includes('socket hang up')
        ) {
            return true;
        }
    }

    // Check HTTP status codes
    const statusCode = (error as { statusCode?: number; status?: number; response?: { status?: number } })
        ?.statusCode || (error as { status?: number })?.status ||
        (error as { response?: { status?: number } })?.response?.status;

    if (statusCode && retryableStatusCodes.includes(statusCode)) {
        return true;
    }

    return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);

    // Add jitter (0-25% of the delay) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * Math.random();

    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on transient failures
 * 
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 3 }
 * );
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on the last attempt
            if (attempt === config.maxAttempts - 1) {
                break;
            }

            // Check if error is retryable
            if (!isRetryableError(error, config.retryableStatusCodes)) {
                throw lastError;
            }

            // Calculate delay with exponential backoff
            const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);

            // Notify retry callback if provided
            if (options?.onRetry) {
                options.onRetry(lastError, attempt + 1);
            }

            // Wait before retrying
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Create a retryable wrapper for a function
 * 
 * @example
 * const fetchWithRetry = createRetryableFunction(
 *   (url: string) => fetch(url),
 *   { maxAttempts: 3 }
 * );
 * const result = await fetchWithRetry('https://api.example.com');
 */
export function createRetryableFunction<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs) => withRetry(() => fn(...args), options);
}
