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

const router = Router();

router.get('/:id/rtp-capabilities', getRtpCapabilities);
router.post('/:id/transport/create', createTransport);
router.post('/:id/transport/connect', connectTransport);
router.post('/:id/produce', produce);
router.post('/:id/consume', consume);
router.post('/:id/consumer/resume', resumeConsumer);
router.post('/:id/producer/pause', pauseProducer);
router.post('/:id/producer/resume', resumeProducer);

export { router as mediaRouter };
