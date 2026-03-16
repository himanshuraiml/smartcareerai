import { Request, Response, NextFunction } from 'express';
import { atsIntegrationService } from '../services/ats-integration.service';

const VALID_PROVIDERS = ['WORKDAY', 'SAP', 'ZOHO', 'KEKA', 'GENERIC'];

export class AtsIntegrationController {

    // POST /organization/:orgId/integrations/ats
    async createOrUpdate(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            const { provider, outboundUrl, apiKey, fieldMappings } = req.body;

            if (!provider || !VALID_PROVIDERS.includes(provider)) {
                return res.status(400).json({ success: false, message: `provider must be one of: ${VALID_PROVIDERS.join(', ')}` });
            }

            const config = await atsIntegrationService.createOrUpdate(orgId, { provider, outboundUrl, apiKey, fieldMappings });
            res.json({ success: true, data: config });
        } catch (error) {
            next(error);
        }
    }

    // GET /organization/:orgId/integrations/ats
    async getConfigs(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId } = req.params;
            const configs = await atsIntegrationService.getConfigs(orgId);
            res.json({ success: true, data: configs });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /organization/:orgId/integrations/ats/:configId
    async deleteConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId, configId } = req.params;
            await atsIntegrationService.deleteConfig(configId, orgId);
            res.json({ success: true, message: 'ATS integration removed' });
        } catch (error) {
            next(error);
        }
    }

    // POST /organization/:orgId/integrations/ats/:configId/test
    async testWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            const { orgId, configId } = req.params;
            const result = await atsIntegrationService.testWebhook(configId, orgId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/webhooks/ats/:provider  (public inbound webhook)
    async inboundWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            const { provider } = req.params;
            const result = await atsIntegrationService.processInboundWebhook(provider.toUpperCase(), req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

export const atsIntegrationController = new AtsIntegrationController();
