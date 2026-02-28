import { logger } from './logger';

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3009';

export type CreditType = 'RESUME_REVIEW' | 'AI_INTERVIEW' | 'SKILL_TEST';

interface ConsumeResult {
    success: boolean;
    remainingBalance: number;
}

interface CreditError extends Error {
    statusCode: number;
    code: string;
}

export class BillingClient {
    /**
     * Consume a credit from the user's balance
     * Must be called BEFORE processing the request
     * @throws Error with statusCode 402 if insufficient credits
     */
    static async consumeCredit(
        authHeader: string,
        creditType: CreditType,
        featureId?: string
    ): Promise<ConsumeResult> {
        try {
            const response = await fetch(`${BILLING_SERVICE_URL}/credits/consume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify({
                    creditType,
                    featureId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Failed to consume credit') as CreditError;
                error.statusCode = response.status;
                error.code = data.code || 'CREDIT_ERROR';
                throw error;
            }

            logger.info(`Credit consumed: ${creditType}, remaining: ${data.data?.remainingBalance}`);

            return {
                success: true,
                remainingBalance: data.data?.remainingBalance || 0,
            };
        } catch (error: any) {
            // If it's already a structured error, rethrow
            if (error.statusCode) {
                throw error;
            }

            // Network or other errors
            logger.error(`Billing service error: ${error.message}`);

            const serviceError = new Error('Billing service unavailable') as CreditError;
            serviceError.statusCode = 503;
            serviceError.code = 'BILLING_SERVICE_UNAVAILABLE';
            throw serviceError;
        }
    }

    /**
     * Check if user has credits without consuming
     */
    static async hasCredits(
        authHeader: string,
        creditType: CreditType
    ): Promise<boolean> {
        try {
            const response = await fetch(
                `${BILLING_SERVICE_URL}/credits/check?creditType=${creditType}`,
                {
                    headers: {
                        'Authorization': authHeader,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return false;
            }

            return data.data?.hasCredits || false;
        } catch (error: any) {
            logger.error(`Billing service check error: ${error.message}`);
            return false;
        }
    }
}
