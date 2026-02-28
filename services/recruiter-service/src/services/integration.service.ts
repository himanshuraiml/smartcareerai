import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class IntegrationService {
    /**
     * Set up or update an ATS integration for an organization
     */
    async setupIntegration(organizationId: string, platform: string, webhookUrl?: string, webhookSecret?: string) {
        // Generate a new API key
        const apiKey = crypto.randomBytes(32).toString('hex');

        // Simple hash (In MVP, we can hash it. Or standard sha256)
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const integration = await prisma.atsIntegration.upsert({
            where: {
                organizationId_platform: {
                    organizationId,
                    platform
                }
            },
            update: {
                apiKeyHash,
                webhookUrl: webhookUrl || null,
                webhookSecret: webhookSecret || null,
                isActive: true
            },
            create: {
                organizationId,
                platform,
                apiKeyHash,
                webhookUrl: webhookUrl || null,
                webhookSecret: webhookSecret || null,
                isActive: true
            }
        });

        // We only return the raw API key once
        return {
            integrationId: integration.id,
            platform: integration.platform,
            apiKey,
            webhookUrl: integration.webhookUrl
        };
    }

    /**
     * Get integration details for an org
     */
    async getIntegrations(organizationId: string) {
        return prisma.atsIntegration.findMany({
            where: { organizationId, isActive: true },
            select: { id: true, platform: true, webhookUrl: true, createdAt: true }
        });
    }

    /**
     * Delete/disable an integration
     */
    async disableIntegration(integrationId: string, organizationId: string) {
        return prisma.atsIntegration.update({
            where: { id: integrationId, organizationId },
            data: { isActive: false }
        });
    }

    /**
     * Save Calendar Integration Tokens (supports both google and outlook)
     */
    async saveCalendarTokens(organizationId: string, tokens: any) {
        const platform = tokens.platform || 'google';
        return prisma.calendarIntegration.upsert({
            where: { organizationId },
            update: {
                platform,
                accessToken: tokens.access_token,
                ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
                expiryDate: tokens.expiry_date,
                isActive: true,
            },
            create: {
                organizationId,
                platform,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || null,
                expiryDate: tokens.expiry_date || null,
                isActive: true,
            }
        });
    }

    /**
     * Get Calendar Integration for an Org
     */
    async getCalendarIntegration(organizationId: string) {
        return prisma.calendarIntegration.findUnique({
            where: { organizationId }
        });
    }
}

export const integrationService = new IntegrationService();
