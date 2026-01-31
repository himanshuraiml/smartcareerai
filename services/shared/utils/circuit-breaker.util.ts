/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by temporarily disabling calls to failing services.
 * 
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Service is failing, reject all requests immediately
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 */

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    /** Number of failures before opening circuit (default: 5) */
    failureThreshold?: number;
    /** Time in ms before attempting to close circuit (default: 30000) */
    resetTimeout?: number;
    /** Number of successes in HALF_OPEN before closing circuit (default: 2) */
    halfOpenSuccessThreshold?: number;
    /** Time window in ms for counting failures (default: 60000) */
    failureWindow?: number;
    /** Callback when circuit state changes */
    onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

interface FailureRecord {
    timestamp: number;
    error: Error;
}

const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onStateChange'>> = {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenSuccessThreshold: 2,
    failureWindow: 60000,
};

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures: FailureRecord[] = [];
    private halfOpenSuccesses: number = 0;
    private lastFailureTime: number = 0;
    private options: Required<Omit<CircuitBreakerOptions, 'onStateChange'>>;
    private onStateChange?: (from: CircuitState, to: CircuitState) => void;

    constructor(
        private readonly name: string,
        options?: CircuitBreakerOptions
    ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.onStateChange = options?.onStateChange;
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get circuit breaker name
     */
    getName(): string {
        return this.name;
    }

    /**
     * Check if circuit allows requests
     */
    isAllowed(): boolean {
        this.cleanupOldFailures();

        switch (this.state) {
            case CircuitState.CLOSED:
                return true;

            case CircuitState.OPEN:
                // Check if reset timeout has passed
                if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
                    this.transitionTo(CircuitState.HALF_OPEN);
                    return true;
                }
                return false;

            case CircuitState.HALF_OPEN:
                return true;

            default:
                return false;
        }
    }

    /**
     * Record a successful call
     */
    recordSuccess(): void {
        switch (this.state) {
            case CircuitState.HALF_OPEN:
                this.halfOpenSuccesses++;
                if (this.halfOpenSuccesses >= this.options.halfOpenSuccessThreshold) {
                    this.transitionTo(CircuitState.CLOSED);
                }
                break;

            case CircuitState.CLOSED:
                // Clear failures on success
                this.failures = [];
                break;
        }
    }

    /**
     * Record a failed call
     */
    recordFailure(error: Error): void {
        this.failures.push({ timestamp: Date.now(), error });
        this.lastFailureTime = Date.now();

        switch (this.state) {
            case CircuitState.CLOSED:
                this.cleanupOldFailures();
                if (this.failures.length >= this.options.failureThreshold) {
                    this.transitionTo(CircuitState.OPEN);
                }
                break;

            case CircuitState.HALF_OPEN:
                // Any failure in half-open returns to open
                this.transitionTo(CircuitState.OPEN);
                break;
        }
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.isAllowed()) {
            throw new CircuitBreakerError(
                `Circuit breaker '${this.name}' is OPEN. Request rejected.`,
                this.name,
                this.state
            );
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Force circuit to a specific state (for testing/admin)
     */
    forceState(state: CircuitState): void {
        this.transitionTo(state);
    }

    /**
     * Reset circuit breaker to initial state
     */
    reset(): void {
        this.failures = [];
        this.halfOpenSuccesses = 0;
        this.lastFailureTime = 0;
        this.transitionTo(CircuitState.CLOSED);
    }

    /**
     * Get circuit breaker stats
     */
    getStats(): {
        state: CircuitState;
        failureCount: number;
        halfOpenSuccesses: number;
        lastFailureTime: number | null;
    } {
        this.cleanupOldFailures();
        return {
            state: this.state,
            failureCount: this.failures.length,
            halfOpenSuccesses: this.halfOpenSuccesses,
            lastFailureTime: this.lastFailureTime || null,
        };
    }

    private transitionTo(newState: CircuitState): void {
        if (this.state === newState) return;

        const oldState = this.state;
        this.state = newState;

        // Reset counters on state change
        if (newState === CircuitState.CLOSED) {
            this.failures = [];
            this.halfOpenSuccesses = 0;
        } else if (newState === CircuitState.HALF_OPEN) {
            this.halfOpenSuccesses = 0;
        }

        // Notify callback
        if (this.onStateChange) {
            this.onStateChange(oldState, newState);
        }
    }

    private cleanupOldFailures(): void {
        const cutoff = Date.now() - this.options.failureWindow;
        this.failures = this.failures.filter(f => f.timestamp > cutoff);
    }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerError extends Error {
    constructor(
        message: string,
        public readonly circuitName: string,
        public readonly circuitState: CircuitState
    ) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
class CircuitBreakerRegistry {
    private breakers: Map<string, CircuitBreaker> = new Map();

    get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
        let breaker = this.breakers.get(name);
        if (!breaker) {
            breaker = new CircuitBreaker(name, options);
            this.breakers.set(name, breaker);
        }
        return breaker;
    }

    getAll(): CircuitBreaker[] {
        return Array.from(this.breakers.values());
    }

    getAllStats(): Record<string, ReturnType<CircuitBreaker['getStats']>> {
        const stats: Record<string, ReturnType<CircuitBreaker['getStats']>> = {};
        for (const [name, breaker] of this.breakers) {
            stats[name] = breaker.getStats();
        }
        return stats;
    }

    reset(name?: string): void {
        if (name) {
            this.breakers.get(name)?.reset();
        } else {
            for (const breaker of this.breakers.values()) {
                breaker.reset();
            }
        }
    }
}

// Singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Create or get a circuit breaker by name
 */
export function getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    return circuitBreakerRegistry.get(name, options);
}
