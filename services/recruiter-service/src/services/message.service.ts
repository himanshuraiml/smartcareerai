import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { classifyMessage, MessageClassification } from '../utils/llm';

const prisma = new PrismaClient();

export class MessageService {
    async sendMessage(senderId: string, receiverId: string, content: string) {
        // 1. Get sender role to decide if classification is needed
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { role: true, name: true }
        });

        const isCandidate = sender?.role === 'USER';

        // 2. If sender is a candidate (USER), perform AI triage
        let triageResult: MessageClassification | null = null;
        if (isCandidate) {
            triageResult = await classifyMessage(content);
            if (triageResult) {
                logger.info(`Message triage: Category=${triageResult.category}, HighValue=${triageResult.isHighValue}`);
            }
        }

        // 3. Create the actual message
        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content,
                isRead: triageResult ? !triageResult.isHighValue : false // Low value messages marked read for recruiter
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } }
            }
        });

        // 4. Handle auto-response if AI triage generated one
        if (triageResult?.autoResponse) {
            await prisma.message.create({
                data: {
                    senderId: receiverId, // Bot replies on behalf of the recruiter
                    receiverId: senderId,
                    content: `[AI Assistant]: ${triageResult.autoResponse}`
                }
            });
        }

        logger.info(`Message sent: ${senderId} -> ${receiverId}`);
        return message;
    }

    async getMessages(userId: string, contactId?: string) {
        const where: any = {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        };

        if (contactId) {
            where.AND = [
                {
                    OR: [
                        { senderId: userId, receiverId: contactId },
                        { senderId: contactId, receiverId: userId }
                    ]
                }
            ];
        }

        const messages = await prisma.message.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'asc' } // Chat order
        });

        return messages;
    }

    async markAsRead(messageId: string, userId: string) {
        // Only receiver can mark as read
        await prisma.message.updateMany({
            where: {
                id: messageId,
                receiverId: userId
            },
            data: { isRead: true }
        });
    }

    async getConversations(userId: string) {
        // Get all unique contacts the user has messaged with
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
                receiver: { select: { id: true, name: true, email: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for performance
        });

        const contacts = new Map();

        messages.forEach(msg => {
            const isSender = msg.senderId === userId;
            const contact = isSender ? msg.receiver : msg.sender;

            if (!contacts.has(contact.id)) {
                contacts.set(contact.id, {
                    ...contact,
                    lastMessage: msg.content,
                    lastMessageTime: msg.createdAt,
                    unreadCount: (!isSender && !msg.isRead) ? 1 : 0
                });
            } else {
                const existing = contacts.get(contact.id);
                if (!isSender && !msg.isRead) {
                    existing.unreadCount += 1;
                }
            }
        });

        return Array.from(contacts.values());
    }
}

export const messageService = new MessageService();
