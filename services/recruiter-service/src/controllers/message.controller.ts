import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service';

export class MessageController {
    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const senderId = (req as any).user.id;
            const { receiverId, content } = req.body;

            const message = await messageService.sendMessage(senderId, receiverId, content);

            res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error);
        }
    }

    async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { contactId } = req.query;

            const messages = await messageService.getMessages(userId, contactId as string);

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            next(error);
        }
    }

    async getConversations(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const conversations = await messageService.getConversations(userId);

            res.json({
                success: true,
                data: conversations
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await messageService.markAsRead(id, userId);

            res.json({
                success: true,
                message: 'Message marked as read'
            });
        } catch (error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();
