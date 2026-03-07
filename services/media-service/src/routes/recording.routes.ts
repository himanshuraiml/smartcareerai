import { Router } from 'express';
import { startRecording, stopRecording, getRecording } from '../controllers/recording.controller';

const router = Router({ mergeParams: true });

// POST /meetings/:id/recording/start  — host only
router.post('/start', startRecording);

// POST /meetings/:id/recording/stop   — host only
router.post('/stop', stopRecording);

// GET  /meetings/:id/recording        — get presigned URL
router.get('/', getRecording);

export { router as recordingRouter };
