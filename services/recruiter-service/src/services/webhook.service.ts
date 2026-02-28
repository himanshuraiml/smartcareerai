import { PrismaClient, WebhookDeliveryStatus } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class WebhookService {
    /**
     * Dispatch an event to all ATS integrations that have a webhook URL for this organization
     */
    async dispatchEvent(organizationId: string, eventType: string, payload: any) {
        // Find active integrations for this org
        const integrations = await prisma.atsIntegration.findMany({
            where: {
                organizationId,
                isActive: true,
                webhookUrl: {
                    not: null
                }
            }
        });

        if (integrations.length === 0) return;

        for (const integration of integrations) {
            if (!integration.webhookUrl) continue;

            const webhookEvent = await prisma.webhookEvent.create({
                data: {
                    integrationId: integration.id,
                    eventType,
                    payload
                }
            });

            // Fire async request
            this.sendWebhook(integration, webhookEvent.id, eventType, payload)
                .catch(err => logger.error(`Webhook send failed: ${err.message}`));
        }
    }

    private async sendWebhook(integration: any, eventId: string, eventType: string, payload: any) {
        try {
            const body = JSON.stringify({
                eventId,
                eventType,
                timestamp: new Date().toISOString(),
                data: payload
            });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'SmartCareerAI-Webhook'
            };

            if (integration.webhookSecret) {
                const signature = crypto.createHmac('sha256', integration.webhookSecret)
                    .update(body)
                    .digest('hex');
                headers['X-SmartCareer-Signature'] = signature;
            }

            const response = await fetch(integration.webhookUrl, {
                method: 'POST',
                headers,
                body
            });

            const responseText = await response.text();

            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    responseStatus: response.status,
                    responseBody: responseText.substring(0, 1000), // store up to 1000 chars of response
                    status: response.ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED
                }
            });
        } catch (error: any) {
            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    status: WebhookDeliveryStatus.FAILED,
                    responseBody: `Error: ${error.message}`
                }
            });
        }
    }
}

export const webhookService = new WebhookService();
