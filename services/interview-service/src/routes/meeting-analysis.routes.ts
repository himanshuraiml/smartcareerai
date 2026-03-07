import { Router } from 'express';
import {
    receiveTranscriptChunk,
    getMeetingTranscript,
    triggerMeetingAnalysis,
    getAnalysisResult,
} from '../controllers/meeting-analysis.controller';

const router = Router();

// ── Internal (media-service → interview-service, verified by x-internal-secret) ──
router.post('/:meetingId/transcript-chunk', receiveTranscriptChunk);
router.post('/:meetingId/analyze', triggerMeetingAnalysis);

// ── Frontend (authenticated via x-user-id from gateway) ──────────────────────
router.get('/:meetingId/transcript', getMeetingTranscript);
router.get('/:meetingId/result', getAnalysisResult);

export { router as meetingAnalysisRouter };
