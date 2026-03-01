import { Router } from 'express';
import multer from 'multer';
import { InterviewController } from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new InterviewController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configure multer for memory storage (files stored in buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept audio and video files
        const allowedMimes = [
            'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
            'video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: audio/video files.`));
        }
    },
});

// Session management
router.post('/sessions', controller.createSession);
router.get('/sessions', controller.getUserSessions);
router.get('/sessions/invitations', controller.getInvitations); // must be before /sessions/:id
router.get('/sessions/:id', controller.getSession);
router.post('/sessions/:id/start', controller.startSession);

// Text answer submission
router.post('/sessions/:id/answer', controller.submitAnswer);

// Audio answer submission (with transcription and analysis)
router.post('/sessions/:id/answer/audio', upload.single('audio'), controller.submitAudioAnswer);

// Video answer submission (coming soon - visual analysis)
router.post('/sessions/:id/answer/video', upload.single('video'), controller.submitVideoAnswer);

// Complete session
router.post('/sessions/:id/complete', controller.completeSession);

// AI hints for questions
router.get('/sessions/:id/hint/:questionId', controller.getQuestionHint);

// Live analytics for interview sessions
router.get('/sessions/:id/analytics', controller.getLiveAnalytics);

// Analysis capabilities status
router.get('/analysis/status', controller.getAnalysisStatus);

// Interview Replay Logs
router.get('/sessions/:id/replay', controller.getReplayDetails);
router.put('/sessions/:id/replay', controller.updateReplayLogs);

// Copilot session data (POST is internal — called by gateway/meeting-bot without user context)
router.post('/sessions/:id/copilot', controller.saveCopilotData);
router.get('/sessions/:id/copilot', controller.getCopilotData);
router.post('/sessions/:id/copilot/suggest', controller.generateCopilotSuggestions);

export { router as interviewRouter };
