import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const resumeController = new ResumeController();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed.'));
        }
    },
});

// Routes
router.post('/upload', authMiddleware, upload.single('resume'), resumeController.upload);
router.get('/', authMiddleware, resumeController.getAll);
router.get('/:id', authMiddleware, resumeController.getById);
router.delete('/:id', authMiddleware, resumeController.delete);
router.post('/:id/parse', authMiddleware, resumeController.parse);

export { router as resumeRouter };
