import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export class SettingsController {
    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await prisma.systemSettings.findMany();
            const settingsMap: Record<string, any> = {};
            settings.forEach(s => settingsMap[s.settingKey] = s.settingValue);

            res.json({ success: true, data: settingsMap });
        } catch (error) {
            next(error);
        }
    }

    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = req.body;
            const userId = (req as any).user.id;

            const updates = Object.keys(settings).map(key =>
                prisma.systemSettings.upsert({
                    where: { settingKey: key },
                    update: {
                        settingValue: settings[key],
                        updatedBy: userId
                    },
                    create: {
                        settingKey: key,
                        settingValue: settings[key],
                        updatedBy: userId
                    }
                })
            );

            await prisma.$transaction(updates);

            res.json({ success: true, message: 'Settings updated' });
        } catch (error) {
            next(error);
        }
    }
}

export const settingsController = new SettingsController();
