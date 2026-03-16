import { Request, Response, NextFunction } from 'express';
import { marketIntelService } from '../services/market-intel.service';

export class MarketIntelController {

    // GET /recruiter/analytics/market-intelligence
    async getMarketIntelligence(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.recruiter!.organizationId || req.recruiter!.id;
            const data = await marketIntelService.getMarketIntelligence(organizationId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // POST /recruiter/analytics/market-intelligence/refresh
    async refreshCache(req: Request, res: Response, next: NextFunction) {
        try {
            const organizationId = req.recruiter!.organizationId || req.recruiter!.id;
            await marketIntelService.refreshCache(organizationId);
            res.json({ success: true, message: 'Cache cleared. Next request will regenerate market intelligence.' });
        } catch (error) {
            next(error);
        }
    }
}

export const marketIntelController = new MarketIntelController();
