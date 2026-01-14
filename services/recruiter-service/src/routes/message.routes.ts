import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.put('/:id/read', messageController.markAsRead);

export { router as messageRouter };
