import { Router } from 'express';
import { createAITransport, closeAITransport } from '../controllers/ai-transport.controller';

export const aiTransportRouter = Router({ mergeParams: true });

/** Validate internal service-to-service secret */
aiTransportRouter.use((req, res, next) => {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    const provided = req.headers['x-internal-secret'];
    if (!expected || !provided || provided !== expected) {
        res.status(401).json({ error: 'Unauthorized — missing or invalid internal secret' });
        return;
    }
    next();
});

/** POST /meetings/:id/ai-transport/create */
aiTransportRouter.post('/create', createAITransport);

/** POST /meetings/:id/ai-transport/close */
aiTransportRouter.post('/close', closeAITransport);
