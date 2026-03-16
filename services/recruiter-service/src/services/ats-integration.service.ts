import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

export class AtsIntegrationService {

    async createOrUpdate(organizationId: string, data: {
        provider: string;
        outboundUrl?: string;
        apiKey?: string;
        fieldMappings?: Record<string, string>;
    }) {
        const existing = await prisma.externalAtsConfig.findFirst({
            where: { organizationId, provider: data.provider },
        });

        if (existing) {
            return prisma.externalAtsConfig.update({
                where: { id: existing.id },
                data: {
                    outboundUrl: data.outboundUrl,
                    apiKey: data.apiKey,
                    fieldMappings: data.fieldMappings || {},
                    isActive: true,
                },
            });
        }

        return prisma.externalAtsConfig.create({
            data: {
                organizationId,
                provider: data.provider,
                outboundUrl: data.outboundUrl,
                apiKey: data.apiKey,
                fieldMappings: data.fieldMappings || {},
            },
        });
    }

    async getConfigs(organizationId: string) {
        return prisma.externalAtsConfig.findMany({
            where: { organizationId },
            include: { webhookLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
        });
    }

    async deleteConfig(id: string, organizationId: string) {
        const config = await prisma.externalAtsConfig.findFirst({ where: { id, organizationId } });
        if (!config) throw new Error('ATS config not found');
        return prisma.externalAtsConfig.delete({ where: { id } });
    }

    async testWebhook(configId: string, organizationId: string) {
        const config = await prisma.externalAtsConfig.findFirst({ where: { id: configId, organizationId } });
        if (!config || !config.outboundUrl) throw new Error('ATS config or outbound URL not found');

        const testPayload = {
            event: 'test',
            source: 'PlaceNxt',
            timestamp: new Date().toISOString(),
            data: { message: 'Test webhook from PlaceNxt' },
        };

        try {
            const response = await axios.post(config.outboundUrl, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                },
                timeout: 10000,
            });

            await prisma.externalAtsLog.create({
                data: { configId, direction: 'OUTBOUND', payload: testPayload, status: 'SUCCESS' },
            });

            return { success: true, statusCode: response.status };
        } catch (error: any) {
            await prisma.externalAtsLog.create({
                data: {
                    configId,
                    direction: 'OUTBOUND',
                    payload: testPayload,
                    status: 'FAILED',
                    error: error.message,
                },
            });
            throw new Error(`Webhook test failed: ${error.message}`);
        }
    }

    async sendOutboundWebhook(organizationId: string, event: string, data: Record<string, unknown>) {
        const configs = await prisma.externalAtsConfig.findMany({
            where: { organizationId, isActive: true, outboundUrl: { not: null } },
        });

        for (const config of configs) {
            if (!config.outboundUrl) continue;

            const fieldMappings = config.fieldMappings as Record<string, string>;
            const mappedData = this.applyFieldMappings(data, fieldMappings);

            const payload = { event, source: 'PlaceNxt', timestamp: new Date().toISOString(), data: mappedData as Record<string, string | number | boolean | null> };

            try {
                await axios.post(config.outboundUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
                    },
                    timeout: 8000,
                });

                await prisma.externalAtsLog.create({
                    data: { configId: config.id, direction: 'OUTBOUND', payload, status: 'SUCCESS' },
                });

                // Update lastSyncAt
                await prisma.externalAtsConfig.update({
                    where: { id: config.id },
                    data: { lastSyncAt: new Date() },
                });
            } catch (error: any) {
                logger.error(`ATS outbound webhook failed for config ${config.id}:`, error);
                await prisma.externalAtsLog.create({
                    data: {
                        configId: config.id,
                        direction: 'OUTBOUND',
                        payload,
                        status: 'FAILED',
                        error: error.message,
                    },
                });
            }
        }
    }

    async processInboundWebhook(provider: string, payload: Record<string, unknown>) {
        // Find any active config for this provider
        const config = await prisma.externalAtsConfig.findFirst({
            where: { provider, isActive: true },
        });

        if (config) {
            await prisma.externalAtsLog.create({
                data: { configId: config.id, direction: 'INBOUND', payload: payload as any, status: 'SUCCESS' },
            });
        }

        // Process inbound candidate data (if present)
        const candidateEmail = (payload.email || payload.candidate_email) as string | undefined;
        if (candidateEmail) {
            logger.info(`Inbound ATS webhook from ${provider}: candidate ${candidateEmail}`);
        }

        return { processed: true, provider };
    }

    private applyFieldMappings(data: Record<string, unknown>, mappings: Record<string, string>): Record<string, unknown> {
        const mapped: Record<string, unknown> = { ...data };
        for (const [placenxtField, atsField] of Object.entries(mappings)) {
            if (data[placenxtField] !== undefined) {
                mapped[atsField] = data[placenxtField];
            }
        }
        return mapped;
    }
}

export const atsIntegrationService = new AtsIntegrationService();
