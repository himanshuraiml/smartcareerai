import { Router } from 'express';
import multer from 'multer';
import { InterviewController } from '../controllers/interview.controller';

const router = Router();
const controller = new InterviewController();

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

// Analysis capabilities status
router.get('/analysis/status', controller.getAnalysisStatus);

export { router as interviewRouter };
