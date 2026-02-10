import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../controllers/resume.controller';
import { BuilderController } from '../controllers/builder.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const resumeController = new ResumeController();
const builderController = new BuilderController();

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

// Builder Routes (must be before :id routes)
router.get('/templates', authMiddleware, builderController.getTemplates);
router.post('/builder/optimize', authMiddleware, builderController.optimize);
router.post('/builder/bullets', authMiddleware, builderController.generateBullets);
router.post('/builder/tailor', authMiddleware, builderController.tailor);

// Resume Routes
router.post('/upload', authMiddleware, upload.single('resume'), resumeController.upload);
router.get('/', authMiddleware, resumeController.getAll);
router.get('/:id', authMiddleware, resumeController.getById);
router.delete('/:id', authMiddleware, resumeController.delete);
router.post('/:id/parse', authMiddleware, resumeController.parse);

export { router as resumeRouter };
