import { Router } from 'express';
import {
    getRtpCapabilities,
    createTransport,
    connectTransport,
    produce,
    consume,
    resumeConsumer,
    pauseProducer,
    resumeProducer,
} from '../controllers/media.controller';
import { getTwilioIceServers } from '../services/turn-credentials.service';

const router = Router();

/**
 * GET /meetings/ice-servers
 * Returns fresh TURN/STUN credentials from Twilio NTS.
 * Call this from the frontend right before creating a WebRTC peer connection.
 */
router.get('/ice-servers', async (_req, res) => {
    const iceServers = await getTwilioIceServers();
    res.json({ iceServers });
});

router.get('/:id/rtp-capabilities', getRtpCapabilities);
router.post('/:id/transport/create', createTransport);
router.post('/:id/transport/connect', connectTransport);
router.post('/:id/produce', produce);
router.post('/:id/consume', consume);
router.post('/:id/consumer/resume', resumeConsumer);
router.post('/:id/producer/pause', pauseProducer);
router.post('/:id/producer/resume', resumeProducer);

export { router as mediaRouter };

