import { Router } from 'express';
import { createAITransport, closeAITransport } from '../controllers/ai-transport.controller';

export const aiTransportRouter = Router({ mergeParams: true });

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-secret';

/** Validate internal service-to-service secret */
aiTransportRouter.use((req, res, next) => {
    if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) {
        res.status(401).json({ error: 'Unauthorized — missing or invalid internal secret' });
        return;
    }
    next();
});

/** POST /meetings/:id/ai-transport/create */
aiTransportRouter.post('/create', createAITransport);

/** POST /meetings/:id/ai-transport/close */
aiTransportRouter.post('/close', closeAITransport);
